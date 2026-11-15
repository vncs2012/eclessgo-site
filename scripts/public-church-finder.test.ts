import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  TRADITION_GROUPS,
  buildTraditionOptions,
  filterByDistance,
  filterByTradition,
  formatTradition,
  mapPublicChurchListItem,
  numberResults,
  sortChurches,
  summarizeSchedule,
  traditionCode,
  traditionOptionKey,
} from "../src/lib/public-church-utils.ts";
import {
  DAY_FILTER_KEYS,
  FEATURE_CODES,
  FEATURE_ICONS,
  VISIT_FEATURE_CODES,
  countDayFilter,
  countFeature,
  daysForFilters,
  featureHref,
  featurePills,
  orderFeatures,
  readFeatureEntryParams,
} from "../src/lib/church-features.ts";

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

  test("tradição: principais sempre listadas (com 0), contagem sobre o que foi carregado", () => {
    const near = filterByDistance(ITEMS, "near");
    assert.deepEqual(buildTraditionOptions(near), [
      { value: "EVANGELICA_E_PROTESTANTE", count: 2, principal: true },
      { value: "CATOLICA", count: 1, principal: true },
      { value: "ESPIRITA", count: 0, principal: true },
      { value: "MATRIZ_AFRICANA", count: 0, principal: true },
      { value: "BUDISTA", count: 0, principal: true },
    ]);
    assert.deepEqual(
      filterByTradition(ITEMS, ["CATOLICA"]).map((item) => item.id),
      ["s", "x"],
    );
    assert.equal(filterByTradition(ITEMS, []).length, ITEMS.length);
  });

  test("tradição: códigos afins agrupam; o resto é opção própria, depois das principais", () => {
    assert.equal(traditionOptionKey("BATISTA"), "EVANGELICA_E_PROTESTANTE");
    assert.equal(traditionOptionKey("Evangélica Independente"), "EVANGELICA_E_PROTESTANTE");
    assert.equal(traditionOptionKey("Batista Renovada"), "EVANGELICA_E_PROTESTANTE");
    assert.equal(traditionOptionKey("UMBANDA"), "MATRIZ_AFRICANA");
    assert.equal(traditionOptionKey("IGREJA_CATOLICA"), "CATOLICA");
    assert.equal(traditionOptionKey("ORTODOXA"), "ORTODOXA");
    assert.equal(traditionOptionKey("Bola de Neve"), "Bola de Neve");
    const opts = buildTraditionOptions(
      [
        { denomination: "BATISTA" },
        { denomination: "PRESBITERIANA" },
        { denomination: "UMBANDA" },
        { denomination: "ORTODOXA" },
        { denomination: "ORTODOXA" },
        { denomination: "JUDAICA" },
      ],
      ["ISLAMICA"],
    );
    assert.deepEqual(
      opts.map((option) => [option.value, option.count]),
      [
        ["EVANGELICA_E_PROTESTANTE", 2],
        ["CATOLICA", 0],
        ["ESPIRITA", 0],
        ["MATRIZ_AFRICANA", 1],
        ["BUDISTA", 0],
        ["ORTODOXA", 2],
        ["JUDAICA", 1],
        ["ISLAMICA", 0],
      ],
    );
    // Filtrar pelo grupo pega todos os códigos dele; a URL pode trazer a denominação crua.
    assert.deepEqual(
      filterByTradition([{ denomination: "BATISTA" }, { denomination: "CATOLICA" }], ["Presbiteriana"]),
      [{ denomination: "BATISTA" }],
    );
  });

  test("os grupos usam códigos que têm rótulo em finder.traditions (pt-BR e en)", () => {
    for (const locale of ["pt-BR", "en"]) {
      const labels = traditionLabels(locale);
      for (const group of TRADITION_GROUPS) {
        assert.ok(labels[group.key], `${locale}: rótulo de ${group.key}`);
      }
    }
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

function featureMessages(locale: string) {
  return JSON.parse(readFileSync(resolve(ROOT, `src/messages/${locale}.json`), "utf8")) as {
    features: Record<"codes" | "short" | "describe" | "groups" | "hints", Record<string, string>>;
    finder: { filters: { dayOptions: Record<string, string> } };
  };
}

describe("vocabulário de instalações (Modelo 8)", () => {
  const PT_SHORT = featureMessages("pt-BR").features.short;

  test("pt-BR e en traduzem todos os códigos, grupos, opções de visita e de dia", () => {
    for (const locale of ["pt-BR", "en"]) {
      const m = featureMessages(locale);
      assert.deepEqual(Object.keys(m.features.codes).sort(), [...FEATURE_CODES].sort(), locale);
      assert.deepEqual(Object.keys(m.features.groups).sort(), ["accessibility", "children", "structure"]);
      assert.deepEqual(Object.keys(m.features.short).sort(), [...FEATURE_CODES].sort(), locale);
      assert.deepEqual(Object.keys(m.features.describe).sort(), [...FEATURE_CODES].sort(), locale);
      assert.deepEqual(Object.keys(FEATURE_ICONS).sort(), [...FEATURE_CODES].sort());
      assert.deepEqual(Object.keys(m.features.hints).sort(), [...VISIT_FEATURE_CODES].sort());
      assert.deepEqual(Object.keys(m.finder.filters.dayOptions).sort(), [...DAY_FILTER_KEYS].sort());
    }
  });

  test("ordem: códigos primeiro (ordem do vocabulário), texto livre depois, sem repetir", () => {
    assert.deepEqual(
      orderFeatures(["Bebedouro", "PARKING", " LIBRAS ", "Bebedouro", "ACCESSIBLE_ENTRANCE", ""]),
      ["ACCESSIBLE_ENTRANCE", "LIBRAS", "PARKING", "Bebedouro"],
    );
    assert.deepEqual(orderFeatures(undefined), []);
  });

  test("pílulas do card: até 3, rótulo curto + código (para o ícone), texto livre como veio", () => {
    const labels = (pills: ReturnType<typeof featurePills>) => pills.map((pill) => pill.label);
    assert.deepEqual(featurePills(["Salão climatizado", "PARKING", "KIDS_AREA"], PT_SHORT), [
      { code: "KIDS_AREA", label: "Espaço infantil" },
      { code: "PARKING", label: "Estacionamento" },
      { code: null, label: "Salão climatizado" },
    ]);
    assert.deepEqual(
      labels(featurePills(["CAFÉ NO FIM", "Bebedouro", "LIBRAS", "ELEVATOR", "PARKING"], PT_SHORT)),
      ["Elevador", "Libras", "Estacionamento"],
    );
    assert.deepEqual(labels(featurePills(["ACCESSIBLE_ENTRANCE", "NURSERY"], PT_SHORT)), ["Acessível", "Berçário"]);
    assert.deepEqual(featurePills(["CAFÉ NO FIM"], PT_SHORT), [{ code: null, label: "CAFÉ NO FIM" }]);
    assert.deepEqual(featurePills(undefined, PT_SHORT), []);
  });

  test("rótulos: curtos nas pílulas, completos na página da comunidade, descritivos no Cadastro", () => {
    const m = featureMessages("pt-BR").features;
    assert.equal(m.codes.ACCESSIBLE_ENTRANCE, "Entrada acessível");
    assert.equal(m.short.ACCESSIBLE_ENTRANCE, "Acessível");
    assert.equal(m.describe.ACCESSIBLE_ENTRANCE, "Rampa ou acesso sem degraus");
    assert.equal(m.describe.LIBRAS, "Intérprete de Libras");
  });
});

describe("filtros de dia e instalação", () => {
  test("Domingo, Durante a semana e Sábado viram dias da API; marcar vários une os dias", () => {
    assert.deepEqual(daysForFilters(["SUNDAY"]), ["SUNDAY"]);
    assert.deepEqual(daysForFilters(["WEEKDAYS"]), ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);
    assert.deepEqual(daysForFilters(["SUNDAY", "SATURDAY", "SUNDAY"]), ["SATURDAY", "SUNDAY"]);
    assert.deepEqual(daysForFilters(["OUTRO"]), []);
  });

  test("URL de entrada: dia e instalacao repetíveis, em qualquer caixa; desconhecido é ignorado", () => {
    const entry = readFeatureEntryParams(
      new URLSearchParams("dia=sunday&dia=WEEKDAYS&dia=feriado&instalacao=PARKING&instalacao=libras&instalacao=PISCINA&instalacao=PARKING"),
    );
    assert.deepEqual(entry, { days: ["SUNDAY", "WEEKDAYS"], features: ["PARKING", "LIBRAS"] });
    assert.equal(featureHref(["KIDS_AREA"]), "/comunidades?instalacao=KIDS_AREA");
  });

  test("contagens sobre os resultados carregados", () => {
    const loaded = [
      { features: ["PARKING", "LIBRAS"], schedule: [{ day: "SUNDAY" }, { day: "WEDNESDAY" }] },
      { features: ["PARKING"], schedule: [{ day: "SATURDAY" }] },
      { features: ["Bebedouro"], schedule: [] },
      {},
    ];
    assert.equal(countFeature(loaded, "PARKING"), 2);
    assert.equal(countFeature(loaded, "KIDS_AREA"), 0);
    assert.equal(countDayFilter(loaded, "SUNDAY"), 1);
    assert.equal(countDayFilter(loaded, "WEEKDAYS"), 1);
    assert.equal(countDayFilter(loaded, "SATURDAY"), 1);
  });

  test("card: horários do dia filtrado vêm primeiro, ainda agrupados por dia e no máximo dois", () => {
    const schedule = [
      { day: "SUNDAY", time: "09:00", title: null },
      { day: "WEDNESDAY", time: "19:30", title: null },
      { day: "SATURDAY", time: "18:00", title: null },
      { day: "SUNDAY", time: "18:00", title: null },
    ];
    const label = (day: string) =>
      ({ SUNDAY: "Domingo", WEDNESDAY: "Quarta", SATURDAY: "Sábado" })[day] ?? day;
    const join = (times: string[]) => times.join(" e ");
    assert.deepEqual(summarizeSchedule(schedule, label, join), ["Domingo, 09:00 e 18:00", "Quarta, 19:30"]);
    assert.deepEqual(summarizeSchedule(schedule, label, join, 2, ["SATURDAY"]), [
      "Sábado, 18:00",
      "Domingo, 09:00 e 18:00",
    ]);
  });

  test("mapeia a lista da API: schedule na ordem cadastrada, features e updated_at", () => {
    const item = mapPublicChurchListItem({
      id: "1",
      slug: "aurora",
      name: "Aurora",
      location: { lat: -16.7, lng: -49.2 },
      schedule: [
        { title: "Culto", day: "WEDNESDAY", time: "19:30" },
        { title: "Culto", day: "SUNDAY", time: "09:00" },
      ],
      features: ["PARKING", "Bebedouro"],
      updated_at: "2026-11-03T12:00:00Z",
    } as never);
    assert.ok(item);
    assert.deepEqual(
      item.schedule?.map((entry) => entry.day),
      ["WEDNESDAY", "SUNDAY"],
    );
    assert.deepEqual(item.features, ["PARKING", "Bebedouro"]);
    assert.equal(item.updatedAt, "2026-11-03T12:00:00Z");
    assert.equal(mapPublicChurchListItem({ id: "2", slug: "b", name: "B", location: { lat: 1, lng: 1 }, updated_at: "ontem" } as never)?.updatedAt, undefined);
  });
});
