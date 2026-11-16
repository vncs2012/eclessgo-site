import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  CORRECTION_CATEGORIES,
  churchCorrectionSchema,
  correctionFieldErrors,
} from "../src/lib/church-correction.ts";

/*
 * "Sugerir correção" (Modelo 8, Etapa 3): corpo de POST /churches/{slug}/corrections
 * (category SCHEDULE|ADDRESS|CONTACT|FACILITIES|OTHER, message 10-1000, contact <= 254, homepage = isca)
 * e a fiação textual da rota BFF e do diálogo (módulos com alias `@/` não carregam em node).
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

const ok = { category: "SCHEDULE", message: "O culto de domingo começa às 9h30." } as const;

describe("schema da sugestao", () => {
  test("aceita as cinco categorias e os limites exatos da mensagem", () => {
    assert.deepEqual([...CORRECTION_CATEGORIES], ["SCHEDULE", "ADDRESS", "CONTACT", "FACILITIES", "OTHER"]);
    for (const category of CORRECTION_CATEGORIES) {
      assert.equal(churchCorrectionSchema.safeParse({ ...ok, category }).success, true, category);
    }
    assert.equal(churchCorrectionSchema.safeParse({ ...ok, message: "a".repeat(10) }).success, true);
    assert.equal(churchCorrectionSchema.safeParse({ ...ok, message: "a".repeat(1000) }).success, true);
  });

  test("rejeita categoria fora do vocabulario ou ausente", () => {
    for (const category of ["", "OUTRA", "schedule", undefined]) {
      const result = churchCorrectionSchema.safeParse({ ...ok, category });
      assert.equal(result.success, false, String(category));
      if (!result.success) assert.deepEqual(correctionFieldErrors(result.error), { category: "categoryRequired" });
    }
  });

  test("mensagem: 10 a 1000 caracteres depois de aparada", () => {
    for (const [message, key] of [
      ["", "messageMin"],
      ["curta", "messageMin"],
      ["   123456789   ", "messageMin"],
      ["a".repeat(1001), "messageMax"],
    ] as const) {
      const result = churchCorrectionSchema.safeParse({ ...ok, message });
      assert.equal(result.success, false);
      if (!result.success) assert.deepEqual(correctionFieldErrors(result.error), { message: key });
    }
  });

  test("contato e opcional: vazio some do corpo, ate 254, aparado", () => {
    const empty = churchCorrectionSchema.safeParse({ ...ok, contact: "   " });
    assert.equal(empty.success, true);
    if (empty.success) assert.equal("contact" in empty.data && empty.data.contact !== undefined, false);
    const kept = churchCorrectionSchema.safeParse({ ...ok, contact: "  ana@example.org " });
    assert.equal(kept.success && kept.data.contact, "ana@example.org");
    assert.equal(churchCorrectionSchema.safeParse({ ...ok, contact: "a".repeat(254) }).success, true);
    const long = churchCorrectionSchema.safeParse({ ...ok, contact: "a".repeat(255) });
    assert.equal(long.success, false);
    if (!long.success) assert.deepEqual(correctionFieldErrors(long.error), { contact: "contactMax" });
  });

  test("a isca homepage passa como veio (a API descarta em silencio); campo desconhecido e recusado", () => {
    const filled = churchCorrectionSchema.safeParse({ ...ok, homepage: "http://spam.example" });
    assert.equal(filled.success && filled.data.homepage, "http://spam.example");
    assert.equal(churchCorrectionSchema.safeParse({ ...ok, homepage: "" }).success, true);
    assert.equal(churchCorrectionSchema.safeParse({ ...ok, extra: 1 }).success, false);
  });
});

describe("fiacao da sugestao", () => {
  const route = read("src/app/api/public/churches/slug/[slug]/corrections/route.ts");

  test("a rota valida com zod, limita o corpo e repassa origem e IP so com proxy confiavel", () => {
    assert.match(route, /churchCorrectionSchema\.safeParse/);
    assert.match(route, /readJsonBodyWithLimit/);
    assert.match(route, /publicSlugSchema/);
    assert.match(route, /headers\.Origin = origin/);
    assert.match(route, /"X-Forwarded-For"\] = ip/);
    assert.match(route, /ip !== "untrusted"/);
    assert.match(route, /status: 202/);
  });

  test("o cliente chama a rota interna e nao guarda o contato", () => {
    const dialog = read("src/components/site/community-suggest.tsx");
    assert.match(dialog, /\/api\/public\/churches\/slug\/\$\{encodeURIComponent\(slug\)\}\/corrections/);
    assert.doesNotMatch(dialog, /localStorage|sessionStorage|document\.cookie/);
    assert.doesNotMatch(dialog, /outline-none|outline-hidden/);
  });

  test("a CSP continua so com 'self' em connect-src (a rota e interna)", () => {
    assert.match(read("next.config.ts"), /"connect-src 'self'"/);
  });

  test("mensagens da sugestao: mesmas chaves em pt-BR e en", () => {
    type Tree = { [key: string]: string | Tree };
    const load = (locale: string) =>
      (JSON.parse(read(`src/messages/${locale}.json`)) as { communityPage: { suggest: Tree } }).communityPage.suggest;
    const keys = (node: Tree, prefix = ""): string[] =>
      Object.entries(node).flatMap(([key, value]) =>
        typeof value === "string" ? [`${prefix}${key}`] : keys(value, `${prefix}${key}.`),
      );
    assert.deepEqual(keys(load("pt-BR")).sort(), keys(load("en")).sort());
    assert.equal((load("pt-BR").rateLimited as string), "Muitas sugestões; tente mais tarde.");
    for (const category of CORRECTION_CATEGORIES) {
      assert.equal(typeof (load("pt-BR").categories as Tree)[category], "string");
    }
  });
});
