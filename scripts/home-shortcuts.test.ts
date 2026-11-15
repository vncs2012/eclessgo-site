import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import { formatTradition } from "../src/lib/public-church-utils.ts";
import { buildTraditionShortcuts, traditionHref } from "../src/components/site/home-shortcuts.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/*
 * Home do Modelo 8 (Etapa 1c): atalhos por tradição com contagem real dos dados carregados.
 */

const labels: Record<string, string> = JSON.parse(
  readFileSync(resolve(ROOT, "src/messages/pt-BR.json"), "utf8"),
).finder.traditions;
const labelOf = (value: string) => formatTradition(value, labels);
const make = (denomination: string, times: number) =>
  Array.from({ length: times }, () => ({ denomination }));

describe("atalhos por tradição da Home", () => {
  test("sem dados, não há atalhos", () => {
    assert.deepEqual(buildTraditionShortcuts([], labelOf), { items: [], others: null });
  });

  test("conta os dados reais, ordena por contagem e nunca lista tradição sem comunidade", () => {
    const { items, others } = buildTraditionShortcuts(
      [...make("EVANGELICA", 3), ...make("CATOLICA", 2), ...make("ESPIRITA", 1)],
      labelOf,
    );
    assert.deepEqual(
      items.map(({ label, count }) => [label, count]),
      [
        ["Evangélica", 3],
        ["Católica", 2],
        ["Espírita", 1],
      ],
    );
    assert.equal(others, null);
  });

  test("valores do banco com o mesmo rótulo somam num atalho e vão todos no filtro", () => {
    const { items } = buildTraditionShortcuts(
      [...make("CATOLICA", 2), ...make("IGREJA_CATOLICA", 1)],
      labelOf,
    );
    assert.equal(items.length, 1);
    assert.equal(items[0].count, 3);
    assert.deepEqual(items[0].values, ["CATOLICA", "IGREJA_CATOLICA"]);
  });

  test("o excedente vira Outras, somando contagem e valores", () => {
    const churches = [
      ...make("EVANGELICA", 6),
      ...make("CATOLICA", 5),
      ...make("ESPIRITA", 4),
      ...make("BATISTA", 3),
      ...make("BUDISTA", 2),
      ...make("UMBANDA", 2),
      ...make("JUDAICA", 1),
    ];
    const { items, others } = buildTraditionShortcuts(churches, labelOf, 5);
    assert.equal(items.length, 5);
    assert.deepEqual(others, { count: 3, values: ["UMBANDA", "JUDAICA"] });
  });

  test("sobrando uma só tradição, ela entra como atalho próprio (sem Outras de um item)", () => {
    const churches = [
      ...make("EVANGELICA", 6),
      ...make("CATOLICA", 5),
      ...make("ESPIRITA", 4),
      ...make("BATISTA", 3),
      ...make("BUDISTA", 2),
      ...make("UMBANDA", 1),
    ];
    const { items, others } = buildTraditionShortcuts(churches, labelOf, 5);
    assert.equal(items.length, 6);
    assert.equal(others, null);
  });

  test("o link filtra /comunidades repetindo ?tradicao", () => {
    assert.equal(traditionHref(["CATOLICA"]), "/comunidades?tradicao=CATOLICA");
    assert.equal(
      traditionHref(["CATOLICA", "IGREJA_CATOLICA"]),
      "/comunidades?tradicao=CATOLICA&tradicao=IGREJA_CATOLICA",
    );
  });
});

describe("mensagens da Home", () => {
  test("pt-BR e en têm as mesmas chaves e o título da capa não anuncia 'acontecendo agora'", () => {
    const keys = (value: unknown, prefix = ""): string[] =>
      value && typeof value === "object"
        ? Object.entries(value).flatMap(([key, child]) => keys(child, `${prefix}${key}.`))
        : [prefix];
    const read = (locale: string) =>
      JSON.parse(readFileSync(resolve(ROOT, `src/messages/${locale}.json`), "utf8")).home;
    assert.deepEqual(keys(read("en")).sort(), keys(read("pt-BR")).sort());
    assert.doesNotMatch(JSON.stringify(read("pt-BR")), /acontecendo agora|contagem regressiva/i);
  });
});
