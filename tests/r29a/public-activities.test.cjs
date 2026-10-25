// R29A01/02/06: public results, safe authenticated CTA and bounded integration.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");
const root = path.resolve(__dirname, "../..");
const built = path.join(__dirname, ".build/src");
const EVENT = "11111111-1111-4111-8111-111111111111";
const CHURCH = "22222222-2222-4222-8222-222222222222";
const item = { event_id: EVENT, church_id: CHURCH, church_name: "Community",
  title: "Public activity", start_at: "2050-01-01T12:00:00Z", end_at: null };
const envelope = (data = [item], page = 1, limit = 20, total = data.length) => ({
  data, meta: { page, limit, total, total_pages: Math.ceil(total / limit) }
});
const plain = value => JSON.parse(JSON.stringify(value));
let locale = "pt-BR";
let fetcher = async () => { throw new Error("transport not configured"); };
const cache = new Map();
let timerHooks = { set: setTimeout, clear: clearTimeout };
function evaluate(filename, source, mappings = {}) {
  const module = { exports: {} };
  const localRequire = id => {
    if (Object.hasOwn(mappings, id)) return mappings[id];
    if (id === "react" || id === "react/jsx-runtime") return require(id);
    if (id === "next-intl/server") return { getLocale: async () => locale };
    if (id.startsWith(".")) return loadBuilt(path.resolve(path.dirname(filename), id));
    throw new Error("Unlisted import blocked: " + id);
  };
  const fn = vm.runInNewContext("(function(require,module,exports,process,fetch,URL,URLSearchParams,AbortController,setTimeout,clearTimeout){\n" +
    source + "\n})", {}, { filename });
  fn(localRequire, module, module.exports, { env: {
    NEXT_PUBLIC_PANEL_URL: "https://panel.example",
    PANEL_URL: "https://must-not-be-used.example"
  } }, (...args) => fetcher(...args), URL, URLSearchParams, AbortController,
    (...args) => timerHooks.set(...args), (...args) => timerHooks.clear(...args));
  return module.exports;
}
function loadBuilt(filename) {
  const full = filename.endsWith(".js") ? filename : filename + ".js";
  assert.ok(full.startsWith(built + path.sep), "only OWN emitted sources");
  if (!cache.has(full)) cache.set(full, evaluate(full, fs.readFileSync(full, "utf8")));
  return cache.get(full);
}
function transpile(rel, mappings) {
  const filename = path.join(root, rel);
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }
  }).outputText;
  return evaluate(filename, source, mappings);
}
const catalog = loadBuilt(path.join(built, "lib/public-activity-catalog"));
const origin = loadBuilt(path.join(built, "lib/public-panel-activity-origin"));
const view = loadBuilt(path.join(built, "components/site/church-public-activities"));
const pt = loadBuilt(path.join(built, "i18n/messages/activity-interest/pt-BR")).default;
const en = loadBuilt(path.join(built, "i18n/messages/activity-interest/en")).default;
function render(result, lang = "pt-BR", panelOrigin = "https://panel.example") {
  return renderToStaticMarkup(React.createElement(view.PublicActivityCatalogueView,
    { result, locale: lang, panelOrigin }));
}

test("R29A01 defaults and bounded query retain only public filters", () => {
  assert.deepEqual(plain(catalog.parseActivityQuery({})), { page: 1, limit: 20 });
  assert.deepEqual(plain(catalog.parseActivityQuery({ page: "1000", limit: "100", church_id: CHURCH, token: "discard" })),
    { page: 1000, limit: 100, church_id: CHURCH });
});
for (const input of [{ page: "0" }, { page: "1001" }, { page: "1.5" },
  { limit: "0" }, { limit: "101" }, { page: ["1", "2"] }, { church_id: "" },
  { church_id: "../private" }, { church_id: [CHURCH] }, { church_id: CHURCH.toUpperCase().replace("2222", "ABCD") }]) {
  test("R29A01 invalid query never broadens to global GET: " + JSON.stringify(input), async () => {
    let calls = 0;
    const result = await catalog.loadPublicActivityCatalogue("https://api.example/api/v1", input,
      async () => { calls++; return Response.json(envelope()); });
    assert.equal(result.status, "invalid");
    assert.equal(calls, 0);
    assert.ok(render(result).includes(pt.invalid));
    assert.ok(!render(result).includes("/interesses/atividades/"));
  });
}
test("R29A01 GET preserves configured API prefix and sends no session/body", async () => {
  let seen;
  const controller = new AbortController();
  const result = await catalog.loadPublicActivityCatalogue("https://api.example/custom/api/v1/",
    { page: "2", limit: "1", church_id: CHURCH }, async (url, options) => {
      seen = { url: String(url), options };
      return Response.json(envelope([item], 2, 1, 3));
    }, controller.signal);
  assert.equal(seen.url, "https://api.example/custom/api/v1/public/activities?page=2&limit=1&church_id=" + CHURCH);
  assert.equal(seen.options.method, "GET");
  assert.equal(seen.options.cache, "no-store");
  assert.equal(seen.options.credentials, "omit");
  assert.equal(seen.options.redirect, "error");
  assert.deepEqual(plain(seen.options.headers), { Accept: "application/json" });
  assert.equal(seen.options.signal, controller.signal);
  assert.equal(seen.options.body, undefined);
  assert.equal(result.status, "ready");
  assert.deepEqual(plain(result.page), envelope([item], 2, 1, 3));
});
test("R29A01 decoder projects exact public fields, including nullable end", async () => {
  const result = await catalog.loadPublicActivityCatalogue("https://api.example/v1", {},
    async () => Response.json({ ...envelope([{ ...item, email: "private", owner: { secret: "private" } }]), token: "private" }));
  assert.deepEqual(plain(result.page), envelope());
  assert.ok(!JSON.stringify(result).includes("private"));
});
test("R29A01 malformed payloads and mismatched scope become generic error", async () => {
  const payloads = [null, {}, { data: {}, meta: envelope().meta },
    envelope([{ ...item, event_id: "invalid" }]),
    envelope([{ ...item, start_at: "2050-01-01T12:00:00-03:00" }]),
    envelope([{ ...item, start_at: "2050-02-30T12:00:00Z" }]),
    envelope([{ ...item, end_at: "private" }]),
    { ...envelope(), meta: { ...envelope().meta, total: -1 } },
    { ...envelope(), meta: { ...envelope().meta, total_pages: 9 } },
    { ...envelope(), meta: { ...envelope().meta, page: 2 } },
    { ...envelope(), meta: { ...envelope().meta, limit: 1 } }];
  for (const payload of payloads) {
    const result = await catalog.loadPublicActivityCatalogue("https://api.example/v1", {},
      async () => Response.json(payload));
    assert.equal(result.status, "error");
    assert.deepEqual(Object.keys(result).sort(), ["query", "status"]);
  }
  const other = await catalog.loadPublicActivityCatalogue("https://api.example/v1", { church_id: CHURCH },
    async () => Response.json(envelope([{ ...item, church_id: EVENT }])));
  assert.equal(other.status, "error");
});
test("R29A01 empty is translated empty state, never error", async () => {
  const result = await catalog.loadPublicActivityCatalogue("https://api.example/v1", {},
    async () => Response.json(envelope([])));
  assert.equal(result.status, "empty");
  assert.ok(render(result).includes(pt.empty));
  assert.ok(render(result, "en").includes(en.empty));
  assert.ok(!render(result).includes(pt.error));
});
test("R29A01 HTTP/network/JSON/abort errors expose no raw detail", async () => {
  for (const transport of [
    async () => new Response("private-secret", { status: 503 }),
    async () => { throw new Error("private-secret"); },
    async () => new Response("private-secret", { status: 200 }),
    async () => { throw new DOMException("private-secret", "AbortError"); }
  ]) {
    const result = await catalog.loadPublicActivityCatalogue("https://api.example/v1", {}, transport);
    assert.equal(result.status, "error");
    assert.ok(render(result).includes(pt.error));
    assert.ok(!JSON.stringify(result).includes("private-secret"));
    assert.ok(!render(result).includes("private-secret"));
  }
});
test("R29A02 CTA is exact configured origin and canonical public event path", () => {
  for (const base of ["https://panel.example", "https://panel.example/",
    "http://localhost:3000", "http://127.0.0.1:5173", "http://[::1]:3000"]) {
    assert.equal(origin.panelActivityHref(base, EVENT), new URL(base).origin + "/interesses/atividades/" + EVENT);
  }
});
test("R29A02 invalid/missing origin or UUID has no href", () => {
  for (const base of [undefined, "", "/relative", "https://a.example/path", "https://a.example/?returnTo=private",
    "https://a.example/#private", "https://user:pass@a.example", "http://panel.example",
    "http://127.1:3000", "javascript:alert(1)", " https://a.example", "https://a.example/%2e%2e"]) {
    assert.equal(origin.panelActivityHref(base, EVENT), null);
  }
  for (const id of ["invalid", EVENT.toUpperCase().replace("1111", "ABCD"), EVENT + "?token=private"]) {
    assert.equal(origin.panelActivityHref("https://panel.example", id), null);
  }
});
test("R29A01/02 SSR ready PT/EN has UTC dates, exact link and escaped public text", () => {
  const result = { status: "ready", query: { page: 1, limit: 20 }, page: envelope([{ ...item, title: "<script>unsafe</script>" }]) };
  for (const [lang, messages] of [["pt-BR", pt], ["en", en]]) {
    const html = render(result, lang);
    assert.ok(html.includes(messages.title));
    assert.ok(html.includes(messages.signIn));
    assert.ok(html.includes('href="https://panel.example/interesses/atividades/' + EVENT + '"'));
    const time = /<time\s+([a-zA-Z]+)="([^"]+)"/.exec(html);
    assert.equal(time?.[1].toLowerCase(), "datetime");
    assert.equal(time?.[2], "2050-01-01T12:00:00Z");
    assert.ok(html.includes("&lt;script&gt;unsafe&lt;/script&gt;"));
    assert.ok(!html.includes("<script>unsafe"));
    assert.ok(!html.includes("<form") && !html.includes("returnTo="));
    const unavailable = render(result, lang, "");
    assert.ok(unavailable.includes(messages.panelUnavailable));
    assert.ok(!unavailable.includes("/interesses/atividades/"));
  }
});
test("R29A01 pagination preserves Church/limit and never includes unknown inputs", () => {
  const html = render({ status: "ready", query: { page: 2, limit: 1, church_id: CHURCH },
    page: envelope([item], 2, 1, 3) });
  assert.ok(html.includes("/atividades?page=1&amp;limit=1&amp;church_id=" + CHURCH));
  assert.ok(html.includes("/atividades?page=3&amp;limit=1&amp;church_id=" + CHURCH));
  assert.ok(!html.includes("token") && !html.includes("returnTo"));
});
test("R29A01 profile wrapper only links to public stable filtered catalogue", async () => {
  const previous = fetcher;
  let calls = 0; fetcher = async () => { calls++; throw new Error("profile must not fetch"); };
  try {
    for (const [lang, messages] of [["pt-BR", pt], ["en", en]]) {
      locale = lang;
      const html = renderToStaticMarkup(await view.ChurchPublicActivities({ churchId: CHURCH }));
      assert.ok(html.includes('href="/atividades?church_id=' + CHURCH + '"'));
      assert.equal(/<a\b[^>]*>([\s\S]*?)<\/a>/.exec(html)?.[1],
        messages.profileLink.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;").replace(/'/g, "&#x27;"));
      assert.ok(!html.includes("/interesses/"));
    }
    assert.equal(calls, 0);
    const invalid = renderToStaticMarkup(await view.ChurchPublicActivities({ churchId: "invalid" }));
    assert.ok(!invalid.includes("href="));
  } finally { fetcher = previous; }
});
test("R29A01/02 real public-api entry and new route execute OWN GET/decoder/SSR", async () => {
  const api = transpile("src/lib/public-api.ts", {
    "@/lib/site-config": { DEFAULT_API_BASE_URL: "https://api.example/versioned/v1" },
    "@/lib/legal": {}, "@/lib/public-bff": { PUBLIC_UPSTREAM_TIMEOUT_MS: 8000 }, "@/lib/public-church-utils": {},
    "./public-activity-catalog": catalog
  });
  let count = 0;
  const delays = [], active = new Set();
  const previousTimers = timerHooks;
  timerHooks = {
    set(callback, delay) { delays.push(delay); const handle = setTimeout(callback, delay); active.add(handle); return handle; },
    clear(handle) { active.delete(handle); clearTimeout(handle); }
  };
  fetcher = async (url, options) => {
    count++;
    assert.equal(String(url), "https://api.example/versioned/v1/public/activities?page=1&limit=20&church_id=" + CHURCH);
    assert.equal(options.method, "GET");
    return Response.json(envelope());
  };
  const routeFile = path.join(built, "app/atividades/page.js");
  const route = evaluate(routeFile, fs.readFileSync(routeFile, "utf8"), { "@/lib/public-api": api });
  locale = "en";
  const element = await route.default({ searchParams: Promise.resolve({ church_id: CHURCH }) });
  const html = renderToStaticMarkup(element);
  assert.equal(count, 1);
  assert.ok(html.includes(en.title));
  assert.ok(html.includes('href="https://panel.example/interesses/atividades/' + EVENT + '"'));
  assert.equal(route.dynamic, "force-dynamic");
  assert.equal(route.revalidate, 0);
  assert.deepEqual(delays, [8000]);
  assert.equal(active.size, 0);
  timerHooks = previousTimers;
});
test("R29A01 real request i18n composition registers both OWN locales without old JSON", async () => {
  for (const lang of ["pt-BR", "en"]) {
    const legacy = { syntheticLegacy: { retained: "yes" }, activityInterest: { poison: "old" } };
    const configured = transpile("src/i18n/request.ts", {
      "next/headers": { cookies: async () => ({ get: () => ({ value: lang }) }) },
      "next-intl/server": { getRequestConfig: callback => callback },
      "./locales": { LOCALE_COOKIE: "synthetic", defaultLocale: "pt-BR", isLocale: value => ["pt-BR", "en"].includes(value) },
      "./messages/activity-interest/pt-BR": { default: pt, __esModule: true },
      "./messages/activity-interest/en": { default: en, __esModule: true },
      ["../messages/" + lang + ".json"]: { default: legacy, __esModule: true }
    }).default;
    const result = await configured();
    assert.equal(result.locale, lang);
    assert.deepEqual(plain(result.messages.syntheticLegacy), { retained: "yes" });
    assert.deepEqual(plain(result.messages.activityInterest), plain(lang === "en" ? en : pt));
    assert.ok(!JSON.stringify(result.messages.activityInterest).includes("poison"));
  }
});

test("R29A01 non-null UTC end retains exact decoder and SSR value", async () => {
  const end = "2050-01-01T13:00:00.123456Z";
  const result = await catalog.loadPublicActivityCatalogue("https://api.example/v1", {},
    async () => Response.json(envelope([{ ...item, end_at: end }])));
  assert.equal(result.status, "ready");
  assert.deepEqual(plain(result.page), envelope([{ ...item, end_at: end }]));
  const html = render(result, "en");
  const times = [...html.matchAll(/<time\s+([a-zA-Z]+)="([^"]+)"/g)];
  assert.deepEqual(times.map(value => [value[1].toLowerCase(), value[2]]),
    [["datetime", "2050-01-01T12:00:00Z"], ["datetime", end]]);
  assert.ok(html.includes(en.ends));
});

test("R29A01 already-aborted signal never starts GET or returns rows", async () => {
  const controller = new AbortController(); controller.abort();
  let calls = 0;
  const result = await catalog.loadPublicActivityCatalogue("https://api.example/v1", {},
    async () => { calls++; return Response.json(envelope()); }, controller.signal);
  assert.equal(calls, 0);
  assert.equal(result.status, "error");
  assert.equal(Object.hasOwn(result, "page"), false);
});
test("R29A01 cancelled body cannot promote ready even if JSON still resolves", async () => {
  const controller = new AbortController();
  let resolveBody, bodyStarted;
  const body = new Promise(resolve => { resolveBody = resolve; });
  const started = new Promise(resolve => { bodyStarted = resolve; });
  let calls = 0;
  const pending = catalog.loadPublicActivityCatalogue("https://api.example/v1", {},
    async () => { calls++; return { ok: true, json: async () => { bodyStarted(); return body; } }; },
    controller.signal);
  await started;
  controller.abort();
  resolveBody(envelope());
  const result = await pending;
  assert.equal(calls, 1);
  assert.equal(result.status, "error");
  assert.equal(Object.hasOwn(result, "page"), false);
  assert.ok(!JSON.stringify(result).includes(EVENT));
});
test("R29A01 technical deadline cancels pending JSON and cleans timer", async () => {
  const previousTimers = timerHooks, active = new Set(), delays = [];
  timerHooks = {
    set(callback, delay) { delays.push(delay); const handle = setTimeout(callback, delay); active.add(handle); return handle; },
    clear(handle) { active.delete(handle); clearTimeout(handle); }
  };
  let requestSignal;
  try {
    const result = await catalog.loadPublicActivityCatalogue("https://api.example/v1", {},
      async (_url, options) => {
        requestSignal = options.signal;
        return { ok: true, json: () => new Promise(() => {}) };
      }, undefined, 5);
    assert.equal(result.status, "error");
    assert.equal(Object.hasOwn(result, "page"), false);
    assert.equal(requestSignal.aborted, true);
    assert.deepEqual(delays, [5]);
    assert.equal(active.size, 0);
  } finally { timerHooks = previousTimers; }
});
test("R29A01 parent abort listeners are removed on success failure and cancel", async () => {
  for (const outcome of ["success", "http-error", "cancel"]) {
    const controller = new AbortController(), signal = controller.signal;
    const add = signal.addEventListener.bind(signal), remove = signal.removeEventListener.bind(signal);
    let adds = 0, removes = 0;
    signal.addEventListener = (...args) => { adds++; return add(...args); };
    signal.removeEventListener = (...args) => { removes++; return remove(...args); };
    const result = await catalog.loadPublicActivityCatalogue("https://api.example/v1", {},
      async () => {
        if (outcome === "cancel") controller.abort();
        return Response.json(envelope(), { status: outcome === "http-error" ? 503 : 200 });
      }, signal, 8000);
    assert.equal(result.status, outcome === "success" ? "ready" : "error");
    assert.equal(adds, 1);
    assert.equal(removes, 1);
  }
});
test("R29A01 route loading fallback has exact PT EN pending SSR and no CTA", async () => {
  const route = loadBuilt(path.join(built, "app/atividades/loading"));
  for (const [lang, messages] of [["pt-BR", pt], ["en", en]]) {
    locale = lang;
    const html = renderToStaticMarkup(await route.default());
    assert.ok(html.includes(messages.loading));
    assert.ok(html.includes('role="status"'));
    assert.ok(html.includes('aria-busy="true"'));
    assert.ok(!html.includes("/interesses/") && !html.includes("<form"));
  }
});
