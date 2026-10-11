import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(ROOT, "package.json"));
const ts = require("typescript");
const CONSENT_SOURCE_PATH = resolve(ROOT, "src/lib/consent.ts");
const ANALYTICS_SOURCE_PATH = resolve(ROOT, "src/lib/public-analytics.ts");
const CONSENT_SOURCE = readFileSync(CONSENT_SOURCE_PATH, "utf8");
const ANALYTICS_SOURCE = readFileSync(ANALYTICS_SOURCE_PATH, "utf8");
const CONSENT_STORAGE_KEY = "eclessgo:consent:v1";
const SESSION_STORAGE_KEY = "eclessgo:web:analytics-session";

const EVENTS = [
  {
    churchId: "church-123",
    eventType: "PUBLIC_MAP_VIEW",
    source: "WEB_DIRECTORY",
    path: "/igrejas",
  },
  {
    churchId: "church-123",
    eventType: "PUBLIC_CHURCH_VIEW",
    source: "WEB_DETAIL",
    path: "/igrejas/comunidade-central",
  },
  {
    churchId: "church-123",
    eventType: "PUBLIC_CHURCH_CONTACT_CLICK",
    source: "WEB_DETAIL",
    path: "/igrejas/comunidade-central/contato",
  },
  {
    churchId: "church-123",
    eventType: "PUBLIC_CHURCH_APP_CLICK",
    source: "WEB_DETAIL",
    path: "/igrejas/comunidade-central/app",
  },
  {
    churchId: "church-123",
    eventType: "PUBLIC_CHURCH_SHARE",
    source: "WEB_DETAIL",
    path: "/igrejas/comunidade-central/compartilhar",
  },
];

function compileTypeScript(source, fileName) {
  const result = ts.transpileModule(source, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const errors = (result.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  assert.equal(
    errors.length,
    0,
    `${fileName} deve transpilar: ${errors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("; ")}`,
  );
  return result.outputText;
}

const CONSENT_CODE = compileTypeScript(CONSENT_SOURCE, CONSENT_SOURCE_PATH);
const ANALYTICS_CODE = compileTypeScript(ANALYTICS_SOURCE, ANALYTICS_SOURCE_PATH);

class InstrumentedStorage {
  constructor(initialEntries = {}, failures = {}) {
    this.values = new Map(Object.entries(initialEntries));
    this.failures = failures;
    this.calls = { getItem: [], setItem: [], removeItem: [] };
  }

  shouldFail(operation, key) {
    return this.failures[operation]?.(key) === true;
  }

  getItem(key) {
    this.calls.getItem.push(key);
    if (this.shouldFail("getItem", key)) throw new Error("storage read unavailable");
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.calls.setItem.push(key);
    if (this.shouldFail("setItem", key)) throw new Error("storage write unavailable");
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.calls.removeItem.push(key);
    if (this.shouldFail("removeItem", key)) throw new Error("storage removal unavailable");
    this.values.delete(key);
  }
}

function executeCommonJs(code, fileName, context, moduleRequire) {
  const factory = vm.runInContext(
    `(function (exports, require, module, __filename, __dirname) {\n${code}\n})`,
    context,
    { filename: fileName },
  );
  const module = { exports: {} };
  factory(module.exports, moduleRequire, module, fileName, dirname(fileName));
  return module.exports;
}

function createHarness({ initialEntries = {}, failures = {} } = {}) {
  const storage = new InstrumentedStorage(initialEntries, failures);
  const posts = [];
  const errors = [];
  let generatedSessionIds = 0;
  const window = {
    localStorage: storage,
    location: { pathname: "/caminho-atual" },
    dispatchEvent() {
      return true;
    },
    addEventListener() {},
    removeEventListener() {},
  };
  const context = vm.createContext({
    window,
    crypto: {
      randomUUID() {
        generatedSessionIds += 1;
        return `session-test-${generatedSessionIds}`;
      },
    },
    CustomEvent: class CustomEvent {
      constructor(type, options = {}) {
        this.type = type;
        this.detail = options.detail;
      }
    },
    console: {
      error(...values) {
        errors.push(values);
      },
    },
  });
  const consent = executeCommonJs(CONSENT_CODE, CONSENT_SOURCE_PATH, context, () => {
    throw new Error("consent.ts não deve importar módulos neste teste");
  });
  assert.equal(consent.ANALYTICS_SESSION_STORAGE_KEY, SESSION_STORAGE_KEY);

  const moduleRequire = (specifier) => {
    if (specifier === "@/lib/consent") return consent;
    if (specifier === "@/lib/client-fetch") {
      return {
        async fetchWithClientTrace(...args) {
          posts.push(args);
          return { ok: true, status: 200 };
        },
      };
    }
    throw new Error(`Import inesperado em public-analytics.ts: ${specifier}`);
  };
  const analytics = executeCommonJs(
    ANALYTICS_CODE,
    ANALYTICS_SOURCE_PATH,
    context,
    moduleRequire,
  );

  return {
    analytics,
    consent,
    storage,
    posts,
    errors,
    get generatedSessionIds() {
      return generatedSessionIds;
    },
  };
}

function consentEntry(analytics) {
  return JSON.stringify({ analytics, decidedAt: "2026-10-11T12:00:00.000Z" });
}

async function trackEveryPublicEvent(harness) {
  for (const event of EVENTS) {
    await harness.analytics.trackPublicEvent(event);
  }
}

const blockedConsentCases = [
  { name: "ausente (unknown)", initialEntries: {} },
  { name: "recusado (denied)", initialEntries: { [CONSENT_STORAGE_KEY]: consentEntry("denied") } },
  { name: "null JSON", initialEntries: { [CONSENT_STORAGE_KEY]: "null" } },
  { name: "valor vazio", initialEntries: { [CONSENT_STORAGE_KEY]: "" } },
  { name: "JSON inválido", initialEntries: { [CONSENT_STORAGE_KEY]: '{"analytics":' } },
  {
    name: "valor quase igual a granted",
    initialEntries: { [CONSENT_STORAGE_KEY]: consentEntry("granted ") },
  },
];

describe("analytics público web: limite de opt-in", () => {
  for (const { name, initialEntries } of blockedConsentCases) {
    test(`não envia nem cria sessão com consentimento ${name}`, async () => {
      const harness = createHarness({ initialEntries });

      await trackEveryPublicEvent(harness);

      assert.equal(harness.posts.length, 0, "nenhum tipo público deve gerar POST sem consentimento válido");
      assert.equal(harness.generatedSessionIds, 0, "não deve gerar ID antes de consentimento válido");
      assert.equal(harness.storage.values.has(SESSION_STORAGE_KEY), false);
      assert.equal(
        harness.storage.calls.setItem.filter((key) => key === SESSION_STORAGE_KEY).length,
        0,
      );
    });
  }

  test("grant persistido envia um payload literal e revogação remove a sessão e bloqueia o evento seguinte", async () => {
    const harness = createHarness();
    const grant = harness.consent.setConsent("granted");
    assert.equal(grant.analytics, "granted");
    assert.equal(harness.storage.values.has(CONSENT_STORAGE_KEY), true, "grant deve estar persistido");

    await harness.analytics.trackPublicEvent({
      churchId: "church-123",
      eventType: "PUBLIC_CHURCH_VIEW",
      source: "WEB_DETAIL",
      path: "/igrejas/comunidade-central",
      metadata: { surface: "detail", rank: 2 },
    });

    assert.equal(harness.posts.length, 1);
    const [url, request] = harness.posts[0];
    assert.equal(url, "/api/public/analytics");
    assert.equal(request.method, "POST");
    assert.equal(request.keepalive, true);
    assert.deepEqual(JSON.parse(JSON.stringify(request.headers)), {
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    assert.deepEqual(JSON.parse(request.body), {
      churchId: "church-123",
      eventType: "PUBLIC_CHURCH_VIEW",
      source: "WEB_DETAIL",
      sessionId: "session-test-1",
      path: "/igrejas/comunidade-central",
      metadata: { surface: "detail", rank: 2 },
    });
    assert.equal(harness.generatedSessionIds, 1);
    assert.equal(harness.storage.values.get(SESSION_STORAGE_KEY), "session-test-1");

    const denial = harness.consent.setConsent("denied");
    assert.equal(denial.analytics, "denied");
    assert.equal(harness.storage.values.has(SESSION_STORAGE_KEY), false, "revogação deve remover a sessão");

    await harness.analytics.trackPublicEvent(EVENTS[0]);

    assert.equal(harness.posts.length, 1, "evento depois da revogação não deve gerar outro POST");
    assert.equal(harness.generatedSessionIds, 1, "evento depois da revogação não deve gerar outro ID");
    assert.equal(harness.storage.values.has(SESSION_STORAGE_KEY), false);
  });

  test("falha fechada quando a leitura do consentimento lança", async () => {
    const harness = createHarness({
      failures: {
        getItem: (key) => key === CONSENT_STORAGE_KEY,
      },
    });

    await trackEveryPublicEvent(harness);

    assert.equal(harness.posts.length, 0);
    assert.equal(harness.generatedSessionIds, 0);
    assert.equal(harness.storage.values.has(SESSION_STORAGE_KEY), false);
    assert.deepEqual(harness.storage.calls.getItem, [CONSENT_STORAGE_KEY]);
  });

  test("grant que não persiste não autoriza POST nem cria sessão", async () => {
    const harness = createHarness({
      failures: {
        setItem: (key) => key === CONSENT_STORAGE_KEY,
      },
    });
    const grant = harness.consent.setConsent("granted");
    assert.equal(grant.analytics, "granted", "setConsent devolve a decisão solicitada");
    assert.equal(harness.storage.values.has(CONSENT_STORAGE_KEY), false, "grant falho não fica persistido");
    assert.equal(harness.consent.getConsent(), null, "sem persistência não há consentimento observável");

    await trackEveryPublicEvent(harness);

    assert.equal(harness.posts.length, 0);
    assert.equal(harness.generatedSessionIds, 0);
    assert.equal(harness.storage.values.has(SESSION_STORAGE_KEY), false);
  });

  test("falha ao gravar a sessão bloqueia o POST e não deixa ID persistido", async () => {
    const harness = createHarness({
      initialEntries: { [CONSENT_STORAGE_KEY]: consentEntry("granted") },
      failures: {
        setItem: (key) => key === SESSION_STORAGE_KEY,
      },
    });

    await harness.analytics.trackPublicEvent(EVENTS[1]);

    assert.equal(harness.posts.length, 0);
    assert.equal(harness.generatedSessionIds, 1, "o módulo tenta gerar o ID após ler grant persistido");
    assert.equal(harness.storage.values.has(SESSION_STORAGE_KEY), false);
    assert.deepEqual(harness.storage.calls.setItem, [SESSION_STORAGE_KEY]);
    assert.ok(harness.storage.calls.removeItem.includes(SESSION_STORAGE_KEY));
  });

  test("churchId vazio bloqueia antes de ler consentimento ou criar sessão", async () => {
    const harness = createHarness({
      initialEntries: { [CONSENT_STORAGE_KEY]: consentEntry("granted") },
    });

    await harness.analytics.trackPublicEvent({
      ...EVENTS[0],
      churchId: "",
    });

    assert.equal(harness.posts.length, 0);
    assert.equal(harness.generatedSessionIds, 0);
    assert.deepEqual(harness.storage.calls.getItem, []);
    assert.deepEqual(harness.storage.calls.setItem, []);
    assert.equal(harness.storage.values.has(SESSION_STORAGE_KEY), false);
  });
});
