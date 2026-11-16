import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  clientIp,
  createMemoryProtectionStore,
  createSubmissionLimiter,
  DEFAULT_CORRECTION_LIMITS,
  forwardableOrigin,
  isSameOriginRequest,
  readCorrectionLimits,
} from "../src/lib/public-assistant-protection.ts";

/*
 * Barreira de abuso da sugestao de correcao no BFF: origem (CSRF), limite por cliente/comunidade,
 * IP do cliente que nao pode ser forjado e slug validado antes de chegar a URL da API. A rota usa
 * alias `@/` (nao carrega em node), entao a fiacao da rota e conferida por texto.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

const SITE = "https://site.example";
const request = (headers: Record<string, string> = {}, url = "https://site.example/api/x") =>
  new Request(url, { method: "POST", headers });

describe("origem da requisicao (403)", () => {
  const env = { NEXT_PUBLIC_SITE_URL: SITE };

  test("aceita so a propria origem; ausente, estranha, null ou cross-site sao recusadas", () => {
    assert.equal(isSameOriginRequest(request({ origin: SITE }), env), true);
    assert.equal(isSameOriginRequest(request({ origin: SITE, "sec-fetch-site": "same-origin" }), env), true);
    const rejected: Record<string, string>[] = [
      {},
      { origin: "https://evil.example" },
      { origin: "null" },
      { origin: "javascript:alert(1)" },
      { origin: SITE, "sec-fetch-site": "cross-site" },
      { origin: SITE, "sec-fetch-site": "same-site" },
    ];
    for (const headers of rejected) {
      assert.equal(isSameOriginRequest(request(headers), env), false, JSON.stringify(headers));
    }
  });

  test("Origin so e repassado quando e a origem configurada do site", () => {
    assert.equal(forwardableOrigin(request({ origin: SITE }), env), SITE);
    assert.equal(forwardableOrigin(request({ origin: `${SITE}/` }), env), SITE);
    assert.equal(forwardableOrigin(request({ origin: "https://evil.example" }), env), null);
    assert.equal(forwardableOrigin(request({ origin: "http://site.example" }), env), null);
    assert.equal(forwardableOrigin(request({ origin: "null" }), env), null);
    assert.equal(forwardableOrigin(request({}), env), null);
    assert.equal(forwardableOrigin(request({ origin: SITE }), {}), null);
    assert.equal(forwardableOrigin(request({ origin: SITE }), { NEXT_PUBLIC_SITE_URL: "nao e url" }), null);
  });
});

describe("clientIp (nao confia no primeiro salto de X-Forwarded-For)", () => {
  const generic = { ASSISTANT_TRUST_PROXY_HEADERS: "true" };

  test("sem proxy confiavel todos caem em 'untrusted', mesmo com cabecalhos", () => {
    const forged = request({ "x-forwarded-for": "203.0.113.9", "x-real-ip": "203.0.113.9" });
    assert.equal(clientIp(forged, {}), "untrusted");
    assert.equal(clientIp(forged, { ASSISTANT_TRUST_PROXY_HEADERS: "false" }), "untrusted");
  });

  test("proxy generico: usa o salto mais a direita, nao o que o cliente escreveu a esquerda", () => {
    // O cliente mandou "1.1.1.1"; o proxy acrescentou o endereco que de fato viu (198.51.100.7).
    assert.equal(clientIp(request({ "x-forwarded-for": "1.1.1.1, 198.51.100.7" }), generic), "198.51.100.7");
    assert.equal(clientIp(request({ "x-forwarded-for": "198.51.100.7" }), generic), "198.51.100.7");
    // Variar o que esta a esquerda nao muda a identidade do cliente.
    assert.equal(clientIp(request({ "x-forwarded-for": "9.9.9.9, 198.51.100.7" }), generic), "198.51.100.7");
  });

  test("x-real-ip forjado nao vence o X-Forwarded-For fora da Vercel; vira fallback sem XFF", () => {
    assert.equal(
      clientIp(request({ "x-real-ip": "1.1.1.1", "x-forwarded-for": "198.51.100.7" }), generic),
      "198.51.100.7",
    );
    assert.equal(clientIp(request({ "x-real-ip": "198.51.100.7" }), generic), "198.51.100.7");
    assert.equal(clientIp(request({}), generic), "unknown");
  });

  test("ASSISTANT_TRUSTED_PROXY_CIDRS pula os proxies conhecidos da direita para a esquerda", () => {
    const env = { ...generic, ASSISTANT_TRUSTED_PROXY_CIDRS: "10.0.0.0/8, 192.0.2.1" };
    assert.equal(
      clientIp(request({ "x-forwarded-for": "1.1.1.1, 198.51.100.7, 10.1.2.3, 192.0.2.1" }), env),
      "198.51.100.7",
    );
    // Tudo confiavel: cai no salto mais a esquerda.
    assert.equal(clientIp(request({ "x-forwarded-for": "10.0.0.5, 10.0.0.6" }), env), "10.0.0.5");
  });

  test("salto invalido vira 'unknown' em vez de virar chave do limite", () => {
    assert.equal(clientIp(request({ "x-forwarded-for": "1.1.1.1, <script>" }), generic), "unknown");
    assert.equal(clientIp(request({ "x-forwarded-for": "1.1.1.1, " + "a".repeat(80) }), generic), "unknown");
  });

  test("Vercel: x-real-ip (definido pela borda) tem prioridade; sem ele, o salto mais a direita", () => {
    const vercel = { VERCEL: "1" };
    assert.equal(clientIp(request({ "x-real-ip": "198.51.100.7", "x-forwarded-for": "198.51.100.7" }), vercel), "198.51.100.7");
    assert.equal(clientIp(request({ "x-vercel-forwarded-for": "198.51.100.8" }), vercel), "198.51.100.8");
    assert.equal(clientIp(request({ "x-forwarded-for": "1.1.1.1, 198.51.100.9" }), vercel), "198.51.100.9");
    assert.equal(clientIp(request({}), vercel), "unknown");
  });
});

describe("limite de envios no BFF", () => {
  const clock = { t: Date.UTC(2026, 10, 12, 12, 0, 0) };
  const make = (env: Record<string, string> = { VERCEL: "1" }, limits = DEFAULT_CORRECTION_LIMITS) =>
    createSubmissionLimiter({
      store: createMemoryProtectionStore({ now: () => clock.t }),
      limits,
      env,
      now: () => clock.t,
    });
  const from = (ip: string) => request({ "x-real-ip": ip });

  test("os padroes acompanham a API: 5 por hora por cliente, 20 por dia por comunidade", () => {
    assert.deepEqual(DEFAULT_CORRECTION_LIMITS, { ipPerHour: 5, slugPerDay: 20 });
    assert.deepEqual(readCorrectionLimits({}), { ipPerHour: 5, slugPerDay: 20 });
    assert.deepEqual(
      readCorrectionLimits({ CORRECTION_RATE_LIMIT_IP_PER_HOUR: "2", CORRECTION_RATE_LIMIT_SLUG_PER_DAY: "x" }),
      { ipPerHour: 2, slugPerDay: 20 },
    );
  });

  test("o sexto envio do mesmo cliente na hora recebe 429 com Retry-After; outro cliente passa", async () => {
    const limiter = make();
    for (let index = 0; index < 5; index += 1) {
      assert.deepEqual(await limiter.admit(from("198.51.100.1"), "comunidade-a"), { kind: "allowed" });
    }
    const blocked = await limiter.admit(from("198.51.100.1"), "comunidade-a");
    assert.equal(blocked.kind, "rate-limited");
    if (blocked.kind === "rate-limited") assert.ok(blocked.retryAfterSeconds >= 1 && blocked.retryAfterSeconds <= 3600);
    assert.deepEqual(await limiter.admit(from("198.51.100.2"), "comunidade-b"), { kind: "allowed" });

    clock.t += 60 * 60_000;
    assert.deepEqual(await limiter.admit(from("198.51.100.1"), "comunidade-a"), { kind: "allowed" });
  });

  test("o vigesimo primeiro envio do dia para a mesma comunidade recebe 429, de qualquer IP", async () => {
    clock.t = Date.UTC(2026, 10, 13, 0, 0, 0);
    const limiter = make();
    for (let index = 1; index <= 20; index += 1) {
      assert.deepEqual(await limiter.admit(from(`192.0.2.${index}`), "comunidade-a"), { kind: "allowed" }, String(index));
    }
    const blocked = await limiter.admit(from("192.0.2.99"), "comunidade-a");
    assert.equal(blocked.kind, "rate-limited");
    assert.deepEqual(await limiter.admit(from("192.0.2.99"), "comunidade-b"), { kind: "allowed" });
  });

  test("IP 'untrusted' ou 'unknown' nao entra no limite por cliente, mas o limite por comunidade vale", async () => {
    clock.t = Date.UTC(2026, 10, 14, 0, 0, 0);
    for (const env of [{} as Record<string, string>, { VERCEL: "1" }]) {
      const limiter = make(env, { ipPerHour: 1, slugPerDay: 3 });
      const anonymous = request({ "x-forwarded-for": "1.1.1.1" });
      // Com limite por cliente de 1, o balde compartilhado bloquearia o 2o envio; aqui so vale o da comunidade.
      for (let index = 0; index < 3; index += 1) {
        const other = request({});
        assert.deepEqual(await limiter.admit(index % 2 ? anonymous : other, "comunidade-u"), { kind: "allowed" });
      }
      assert.equal((await limiter.admit(anonymous, "comunidade-u")).kind, "rate-limited");
    }
  });

  test("falha do armazenamento de contadores fecha (unavailable)", async () => {
    const broken = createSubmissionLimiter({
      store: {
        increment: async () => {
          throw new Error("down");
        },
        get: async () => null,
        set: async () => undefined,
      },
      env: { VERCEL: "1" },
    });
    assert.deepEqual(await broken.admit(from("198.51.100.1"), "comunidade-a"), { kind: "unavailable" });
  });
});

describe("fiacao da rota de correcao e do slug", () => {
  const route = read("src/app/api/public/churches/slug/[slug]/corrections/route.ts");

  test("a rota recusa origem errada com 403 antes de ler o corpo e aplica o limite antes do upstream", () => {
    assert.match(route, /isSameOriginRequest\(request, process\.env\)/);
    assert.match(route, /status: 403/);
    assert.match(route, /submissionLimiter\.admit\(request, parsedSlug\.data\)/);
    assert.match(route, /"Retry-After": String\(admission\.retryAfterSeconds\)/);
    assert.match(route, /status: 429/);
    assert.ok(route.indexOf("isSameOriginRequest(") < route.indexOf("readJsonBodyWithLimit<"));
    assert.ok(route.indexOf("submissionLimiter.admit(") < route.indexOf("await submitChurchCorrection("));
  });

  test("Origin e IP so sao repassados depois de validados", () => {
    assert.match(route, /forwardableOrigin\(request, process\.env\)/);
    assert.doesNotMatch(route, /request\.headers\.get\("origin"\)/);
    assert.match(route, /ip !== "untrusted" && ip !== "unknown"/);
  });

  test("a API recebe o slug com encodeURIComponent", () => {
    const api = read("src/lib/public-api.ts");
    assert.match(api, /`\/churches\/slug\/\$\{encodeURIComponent\(slug\)\}`/);
    assert.match(api, /`\/churches\/\$\{encodeURIComponent\(slug\)\}\/corrections`/);
    assert.doesNotMatch(api, /`\/churches\/slug\/\$\{slug\}`/);
  });

  test("pagina, metadata e imagem OG validam o slug e chamam notFound() antes da API", () => {
    const page = read("src/app/comunidades/[slug]/page.tsx");
    assert.match(page, /publicSlugSchema\.safeParse\(slug\)/);
    assert.match(page, /generateMetadata[\s\S]*?validSlugOrNotFound\(\(await params\)\.slug\)/);
    assert.match(page, /CommunityDetailPage[\s\S]*?validSlugOrNotFound\(\(await params\)\.slug\)/);
    const og = read("src/app/comunidades/[slug]/opengraph-image.tsx");
    assert.match(og, /publicSlugSchema\.safeParse\(\(await params\)\.slug\)/);
    assert.match(og, /if \(!parsedSlug\.success\) notFound\(\)/);
  });
});
