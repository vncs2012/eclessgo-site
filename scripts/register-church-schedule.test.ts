import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  SCHEDULE_MAX_ITEMS,
  apiFeaturesSchema,
  apiScheduleSchema,
  buildDenomination,
  buildFeaturesPayload,
  buildSchedulePayload,
  previewScheduleEntries,
  registerFeaturesSchema,
  registerScheduleEntrySchema,
  registerScheduleSchema,
} from "../src/lib/church-register.ts";

/*
 * Cadastro (Modelo 8): horarios habituais e instalacoes. Regras iguais as da API
 * (`ChurchScheduleEntryRequest`: title 1-120, day MONDAY..SUNDAY, time HH:MM, description <= 500,
 * ate 30 itens), mensagens como chaves `register.validation.*`, payload sem campos vazios e
 * fiacao textual do BFF/formulario (os modulos com alias `@/` nao carregam em node).
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

const row = { day: "SUNDAY", time: "09:00", title: "Celebração" } as const;

function messages(result: { success: boolean; error?: { issues: Array<{ message: string }> } }) {
  return result.success ? [] : (result.error?.issues.map((issue) => issue.message) ?? []);
}

describe("schema de horarios do formulario", () => {
  test("aceita uma linha valida e os limites exatos", () => {
    assert.equal(registerScheduleEntrySchema.safeParse(row).success, true);
    assert.equal(
      registerScheduleEntrySchema.safeParse({ ...row, title: "a".repeat(120), time: "23:59", description: "d".repeat(500) })
        .success,
      true,
    );
    assert.equal(registerScheduleEntrySchema.safeParse({ ...row, time: "00:00" }).success, true);
  });

  test("rejeita titulo vazio, so espacos e acima de 120", () => {
    assert.deepEqual(messages(registerScheduleEntrySchema.safeParse({ ...row, title: "" })), [
      "validation.scheduleTitleRequired",
    ]);
    assert.deepEqual(messages(registerScheduleEntrySchema.safeParse({ ...row, title: "   " })), [
      "validation.scheduleTitleRequired",
    ]);
    assert.deepEqual(messages(registerScheduleEntrySchema.safeParse({ ...row, title: "a".repeat(121) })), [
      "validation.scheduleTitleMax",
    ]);
  });

  test("rejeita horario fora de HH:MM e dia fora do enum", () => {
    for (const time of ["", "9:00", "24:00", "12:60", "09:00:00", "ab:cd"]) {
      assert.deepEqual(messages(registerScheduleEntrySchema.safeParse({ ...row, time })), ["validation.scheduleTime"], time);
    }
    for (const day of ["", "SUNDAYS", "domingo"]) {
      assert.deepEqual(messages(registerScheduleEntrySchema.safeParse({ ...row, day })), ["validation.scheduleDay"], day);
    }
  });

  test("rejeita descricao acima de 500 e mais de 30 itens", () => {
    assert.deepEqual(messages(registerScheduleEntrySchema.safeParse({ ...row, description: "d".repeat(501) })), [
      "validation.scheduleDescriptionMax",
    ]);
    const ok = Array.from({ length: SCHEDULE_MAX_ITEMS }, () => row);
    assert.equal(registerScheduleSchema.safeParse(ok).success, true);
    assert.deepEqual(messages(registerScheduleSchema.safeParse([...ok, row])), ["validation.scheduleMax"]);
    assert.equal(registerScheduleSchema.safeParse(undefined).success, true);
  });

  test("instalacoes: so codigos do vocabulario", () => {
    assert.equal(registerFeaturesSchema.safeParse(["LIBRAS", "PARKING"]).success, true);
    assert.deepEqual(messages(registerFeaturesSchema.safeParse(["LIBRAS", "PISCINA"])), ["validation.featureUnknown"]);
  });
});

describe("schema do BFF (API)", () => {
  test("espelha as regras da API e e estrito", () => {
    assert.equal(apiScheduleSchema.safeParse([row, { ...row, description: null }]).success, true);
    assert.equal(apiScheduleSchema.safeParse([{ ...row, title: "" }]).success, false);
    assert.equal(apiScheduleSchema.safeParse([{ ...row, time: "9:00" }]).success, false);
    assert.equal(apiScheduleSchema.safeParse([{ ...row, day: "FRIDAYS" }]).success, false);
    assert.equal(apiScheduleSchema.safeParse([{ ...row, extra: 1 }]).success, false);
    assert.equal(apiScheduleSchema.safeParse(Array.from({ length: 31 }, () => row)).success, false);
  });

  test("features aceita codigos e texto livre, sem itens vazios", () => {
    assert.equal(apiFeaturesSchema.safeParse(["LIBRAS", "Salão climatizado"]).success, true);
    assert.equal(apiFeaturesSchema.safeParse(["LIBRAS", "  "]).success, false);
  });
});

describe("payload", () => {
  test("sem horarios nao ha schedule; sem instalacoes nao ha features", () => {
    assert.equal(buildSchedulePayload(undefined), undefined);
    assert.equal(buildSchedulePayload([]), undefined);
    assert.equal(buildFeaturesPayload(undefined), undefined);
    assert.equal(buildFeaturesPayload([]), undefined);
    assert.equal(buildFeaturesPayload(["  "]), undefined);
  });

  test("schedule leva title/day/time aparados e description so se houver", () => {
    assert.deepEqual(
      buildSchedulePayload([
        { day: "SUNDAY", time: "09:00", title: "  Celebração  ", description: "   " },
        { day: "WEDNESDAY", time: "19:30", title: "Oração", description: " Nos lares " },
      ]),
      [
        { title: "Celebração", day: "SUNDAY", time: "09:00" },
        { title: "Oração", day: "WEDNESDAY", time: "19:30", description: "Nos lares" },
      ],
    );
    const payload = buildSchedulePayload([row]);
    assert.equal(apiScheduleSchema.safeParse(payload).success, true);
  });

  test("features sem repeticao, na ordem do vocabulario", () => {
    assert.deepEqual(buildFeaturesPayload(["PARKING", "LIBRAS", "PARKING", "ACCESSIBLE_ENTRANCE"]), [
      "ACCESSIBLE_ENTRANCE",
      "LIBRAS",
      "PARKING",
    ]);
  });

  test("denomination: codigo da tradicao, ou rotulo + linha", () => {
    const labels = { EVANGELICA: "Evangélica", EVANGELICA_INDEPENDENTE: "Evangélica independente" };
    assert.equal(buildDenomination("BATISTA", undefined, labels), "BATISTA");
    assert.equal(buildDenomination("BATISTA", "   ", labels), "BATISTA");
    assert.equal(buildDenomination("EVANGELICA", "Independente", labels), "Evangélica Independente");
    assert.equal(buildDenomination("EVANGELICA", "x".repeat(200), labels).length, 120);
  });

  test("a previa ignora linhas ainda incompletas", () => {
    assert.deepEqual(
      previewScheduleEntries([
        { day: "SUNDAY", time: "09:00", title: " Culto " },
        { day: "SUNDAY", time: "", title: "Sem hora" },
        { day: "MONDAY", time: "9", title: "Hora ruim" },
      ]),
      [{ day: "SUNDAY", time: "09:00", title: "Culto" }],
    );
    assert.deepEqual(previewScheduleEntries(undefined), []);
  });
});

describe("fiacao", () => {
  test("o BFF aceita schedule e features em church", () => {
    const bff = read("src/lib/public-bff-schemas.ts");
    assert.match(bff, /schedule:\s*apiScheduleSchema\.optional\(\)/);
    assert.match(bff, /features:\s*apiFeaturesSchema\.optional\(\)/);
  });

  test("o payload do formulario so inclui os campos quando ha valor", () => {
    const utils = read("src/components/site/register-church-form-utils.ts");
    assert.match(utils, /\.\.\.\(schedule \? \{ schedule \} : \{\}\)/);
    assert.match(utils, /\.\.\.\(features \? \{ features \} : \{\}\)/);
  });

  test("sem horario 'acontecendo agora' nem contagem regressiva na previa", () => {
    const preview = read("src/components/site/register-church-preview.tsx");
    assert.doesNotMatch(preview, /isLive: true|countdown|acontecendo agora|setInterval/i);
  });
});
