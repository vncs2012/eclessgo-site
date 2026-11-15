import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  countByTradition,
  filterByDistance,
  filterByTradition,
  formatTradition,
  mapPublicChurchListItem,
  numberResults,
  sortChurches,
  summarizeSchedule,
  traditionCode,
} from "../src/lib/public-church-utils.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function traditionLabels(locale: string): Record<string, string> {
  const messages = JSON.parse(readFileSync(resolve(ROOT, `src/messages/${locale}.json`), "utf8"));
  return messages.finder.traditions;
}
const PT = traditionLabels("pt-BR");
const EN = traditionLabels("en");

/*
 * Busca do Modelo 8 (Etapa 1b): filtros locais, contagem por tradição, numeração
 * compartilhada lista/mapa e campos opcionais do item da busca.
 */

type Item = { id: string; name: string; denomination: string; distanceKm: number | null };

const ITEMS: Item[] = [
  { id: "c", name: "Casa", denomination: "EVANGELICA", distanceKm: 0.9 },
  { id: "a", name: "Aurora", denomination: "EVANGELICA", distanceKm: 0.35 },
  { id: "s", name: "Santa Clara", denomination: "CATOLICA", distanceKm: 0.6 },
  { id: "l", name: "Longe", denomination: "ESPIRITA", distanceKm: 6.5 },
  { id: "x", name: "Sem distância", denomination: "CATOLICA", distanceKm: null },
];

describe("filtros locais", () => {
  test("distância: até 2 km, até 8 km e cidade toda", () => {
    assert.deepEqual(
      filterByDistance(ITEMS, "near").map((item) => item.id),
      ["c", "a", "s"],
    );
    assert.deepEqual(
      filterByDistance(ITEMS, "drive").map((item) => item.id),
      ["c", "a", "s", "l"],
    );
    assert.equal(filterByDistance(ITEMS, "all").length, ITEMS.length);
  });

  test("tradição conta sobre o que foi carregado e mantém a escolhida com zero", () => {
    const near = filterByDistance(ITEMS, "near");
    assert.deepEqual(countByTradition(near, ["ESPIRITA"]), [
      { value: "EVANGELICA", count: 2 },
      { value: "CATOLICA", count: 1 },
      { value: "ESPIRITA", count: 0 },
    ]);
    assert.deepEqual(
      filterByTradition(ITEMS, ["CATOLICA"]).map((item) => item.id),
      ["s", "x"],
    );
    assert.equal(filterByTradition(ITEMS, []).length, ITEMS.length);
  });
});

describe("numeração lista = mapa", () => {
  test("número é a posição no resultado final, ordenado por distância", () => {
    const numbered = numberResults(sortChurches(filterByDistance(ITEMS, "near"), "distance"));
    assert.deepEqual(
      numbered.map(({ church, number }) => `${number}:${church.id}`),
      ["1:a", "2:s", "3:c"],
    );
  });

  test("renumera depois de filtrar: sem buracos", () => {
    const numbered = numberResults(
      sortChurches(filterByTradition(ITEMS, ["CATOLICA"]), "distance"),
    );
    assert.deepEqual(
      numbered.map(({ number }) => number),
      [1, 2],
    );
    // Sem distância vai para o fim.
    assert.equal(numbered[1].church.id, "x");
  });

  test("ordem por nome", () => {
    assert.deepEqual(
      sortChurches(ITEMS, "name").map((item) => item.id),
      ["a", "c", "l", "s", "x"],
    );
  });
});

describe("textos do card", () => {
  test("código da tradição ignora acento, caixa e separador", () => {
    assert.equal(traditionCode("Católica"), "CATOLICA");
    assert.equal(traditionCode(" assembleia de deus "), "ASSEMBLEIA_DE_DEUS");
    assert.equal(traditionCode("MATRIZ_AFRICANA"), "MATRIZ_AFRICANA");
  });

  test("rótulo vem do mapa por código em messages (pt-BR e en)", () => {
    assert.equal(formatTradition("CATOLICA", PT), "Católica");
    assert.equal(formatTradition("Catolica", PT), "Católica");
    assert.equal(formatTradition("ASSEMBLEIA DE DEUS", PT), "Assembleia de Deus");
    assert.equal(formatTradition("ESPIRITA", PT), "Espírita");
    assert.equal(formatTradition("MATRIZ_AFRICANA", PT), "Matriz africana");
    assert.equal(formatTradition("CATOLICA", EN), "Catholic");
    assert.equal(formatTradition("ASSEMBLEIA DE DEUS", EN), "Assemblies of God");
  });

  test("pt-BR e en cobrem os mesmos códigos", () => {
    assert.deepEqual(Object.keys(PT).sort(), Object.keys(EN).sort());
    for (const code of Object.keys(PT))
      assert.equal(traditionCode(code), code, `${code} não é um código normalizado`);
  });

  test("código desconhecido cai na humanização", () => {
    assert.equal(formatTradition("IGREJA_DO_EVANGELHO", PT), "Igreja do Evangelho");
    assert.equal(formatTradition("BOLA DE NEVE", PT), "Bola de Neve");
    assert.equal(formatTradition("Evangélica independente"), "Evangélica independente");
  });

  test("horários agrupados por dia, no máximo dois", () => {
    const lines = summarizeSchedule(
      [
        { day: "SUNDAY", time: "18:00", title: null },
        { day: "SUNDAY", time: "09:00", title: null },
        { day: "WEDNESDAY", time: "19:30", title: null },
        { day: "FRIDAY", time: "20:00", title: null },
      ],
      (day) => ({ SUNDAY: "Domingo", WEDNESDAY: "Quarta" })[day] ?? day,
      (times) => times.join(" e "),
    );
    assert.deepEqual(lines, ["Domingo, 09:00 e 18:00", "Quarta, 19:30"]);
    assert.deepEqual(summarizeSchedule(undefined, String, String), []);
  });
});

describe("item da busca: campos da Etapa 2 são opcionais", () => {
  const base = { id: "1", slug: "aurora", name: "Aurora", location: { lat: -16.7, lng: -49.2 } };

  test("sem dado, as chaves nem aparecem (o card esconde a linha)", () => {
    const item = mapPublicChurchListItem(base);
    assert.ok(item);
    assert.equal("schedule" in item, false);
    assert.equal("features" in item, false);
    assert.equal("updatedAt" in item, false);
  });

  test("com dado, mapeia horários, instalações e data", () => {
    const item = mapPublicChurchListItem({
      ...base,
      schedule: [{ day: "sunday", time: "09:00", title: "Culto" }, { foo: 1 }],
      features: ["Acessível", "", 3],
      updated_at: "2026-11-03T12:00:00Z",
    } as never);
    assert.ok(item);
    assert.deepEqual(item.schedule, [{ day: "SUNDAY", time: "09:00", title: "Culto" }]);
    assert.deepEqual(item.features, ["Acessível"]);
    assert.equal(item.updatedAt, "2026-11-03T12:00:00Z");
  });
});
