import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildTraditionOptions,
  filterByTradition,
  formatTradition,
  traditionOptionKey,
} from "../src/lib/public-church-utils.ts";
import { buildTraditionShortcuts, traditionHref } from "../src/components/site/home-shortcuts.ts";
import { VISIT_FEATURE_CODES, featureHref, readFeatureEntryParams } from "../src/lib/church-features.ts";

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

  test("conta os dados reais, ordena por contagem e nunca lista opção com 0 (mesmo as principais)", () => {
    const { items, others } = buildTraditionShortcuts(
      [...make("CATOLICA", 3), ...make("ESPIRITA", 2), ...make("EVANGELICA", 1)],
      labelOf,
    );
    assert.deepEqual(
      items.map(({ label, count }) => [label, count]),
      [
        ["Católica", 3],
        ["Espírita", 2],
        ["Evangélica e protestante", 1],
      ],
    );
    assert.equal(others, null);
  });

  test("agrupa como a Busca: códigos afins somam num atalho e o valor do link é a opção do filtro", () => {
    const { items } = buildTraditionShortcuts(
      [...make("BATISTA", 2), ...make("EVANGELICA", 3), ...make("Evangélica Independente", 1), ...make("IGREJA_CATOLICA", 1), ...make("CATOLICA", 1)],
      labelOf,
    );
    assert.deepEqual(items, [
      { label: "Evangélica e protestante", count: 6, values: ["EVANGELICA_E_PROTESTANTE"] },
      { label: "Católica", count: 2, values: ["CATOLICA"] },
    ]);
  });

  test("o número do atalho é o da Busca e o link marca a mesma opção nela", () => {
    const churches = [
      ...make("BATISTA", 2),
      ...make("PRESBITERIANA", 1),
      ...make("CATOLICA", 2),
      ...make("UMBANDA", 1),
      ...make("ORTODOXA", 2),
    ];
    const options = buildTraditionOptions(churches);
    const { items } = buildTraditionShortcuts(churches, labelOf);
    for (const item of items) {
      const [value] = item.values;
      assert.equal(options.find((option) => option.value === value)?.count, item.count);
      // A Busca lê ?tradicao= com traditionOptionKey: o link cai na mesma opção.
      const entry = new URLSearchParams(traditionHref(item.values).split("?")[1]).getAll("tradicao");
      assert.deepEqual(entry.map(traditionOptionKey), item.values);
      assert.equal(filterByTradition(churches, entry).length, item.count);
    }
    // Denominação sem grupo continua opção própria, com o rótulo dela.
    assert.deepEqual(items.find((item) => item.label === "Ortodoxa"), {
      label: "Ortodoxa",
      count: 2,
      values: ["ORTODOXA"],
    });
  });

  test("o excedente vira Outras, somando contagem e valores das opções", () => {
    const churches = [
      ...make("EVANGELICA", 6),
      ...make("CATOLICA", 5),
      ...make("ESPIRITA", 4),
      ...make("BUDISTA", 3),
      ...make("UMBANDA", 2),
      ...make("JUDAICA", 2),
      ...make("ISLAMICA", 1),
    ];
    const { items, others } = buildTraditionShortcuts(churches, labelOf, 5);
    assert.equal(items.length, 5);
    assert.deepEqual(others, { count: 3, values: ["MATRIZ_AFRICANA", "ISLAMICA"] });
  });

  test("sobrando uma só opção, ela entra como atalho próprio (sem Outras de um item)", () => {
    const churches = [
      ...make("EVANGELICA", 6),
      ...make("CATOLICA", 5),
      ...make("ESPIRITA", 4),
      ...make("BUDISTA", 3),
      ...make("UMBANDA", 2),
      ...make("JUDAICA", 1),
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

describe("Home: 'Encontre pelo que importa para você'", () => {
  const PAGE = readFileSync(resolve(ROOT, "src/app/page.tsx"), "utf8");
  const SECTION = readFileSync(resolve(ROOT, "src/components/site/home-features.tsx"), "utf8");

  test("opções reais de 'Para a visita', com link /comunidades?instalacao=CODE", () => {
    assert.match(PAGE, /VISIT_FEATURE_CODES/);
    assert.match(PAGE, /href:\s*featureHref\(\[item\.code\]\)/);
    assert.equal(featureHref(["PARKING"]), "/comunidades?instalacao=PARKING");
    assert.deepEqual([...VISIT_FEATURE_CODES], ["ACCESSIBLE_ENTRANCE", "KIDS_AREA", "LIBRAS", "PARKING"]);
  });

  test("contagem real: local quando tudo foi carregado, senão meta.total por código; sem estimativa", () => {
    assert.match(PAGE, /home\.churches\.length\s*>=\s*home\.total/);
    assert.match(PAGE, /features:\s*\[code\]/);
    assert.match(PAGE, /days:\s*daysForFilters\(\["WEEKDAYS"\]\)/);
    assert.match(PAGE, /limit:\s*1/);
    assert.match(PAGE, /total === null \? null/);
  });

  test("'Durante a semana': contagem real (dias de segunda a sexta) e link /comunidades?dia=WEEKDAYS", () => {
    assert.match(PAGE, /countDayFilter\(home\.churches, "WEEKDAYS"\)/);
    assert.match(PAGE, /href:\s*"\/comunidades\?dia=WEEKDAYS"/);
    assert.deepEqual(readFeatureEntryParams(new URLSearchParams("dia=WEEKDAYS")).days, ["WEEKDAYS"]);
  });

  test("sem opção com contagem > 0 a seção não aparece", () => {
    assert.match(SECTION, /option\.count > 0/);
    assert.match(SECTION, /if \(available\.length === 0\) return null/);
  });
});
