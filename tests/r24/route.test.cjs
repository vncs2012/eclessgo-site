const assert = require("node:assert/strict");
const { test } = require("node:test");

const { loadT2Route } = require("./harness.cjs");

const SLUG = "comunidade-do-norte";
const PUBLIC_CHURCH = {
  slug: SLUG,
  name: "Comunidade do Norte",
  denomination: "Batista",
  addressLine: "Rua das Flores, 12",
  city: "Campinas",
  state: "SP",
  contact: { phone: "private-phone-marker" },
  plan: "private-plan-marker",
};
const PUBLIC_API_IMPORT = "@/lib/public-api";
const PROVIDER_IMPORT = "@/lib/public-information-assistant-provider";

class MockApiRequestError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

function makeFixture(options = {}) {
  const calls = { reads: [], selections: 0, selectionInputs: [], events: [] };
  const publicApi = {
    ApiRequestError: MockApiRequestError,
    async getPublicChurchBySlug(...args) {
      calls.events.push("reader");
      calls.reads.push(args);
      if (Object.prototype.hasOwnProperty.call(options, "readError")) throw options.readError;
      if (Object.prototype.hasOwnProperty.call(options, "church")) return options.church;
      return PUBLIC_CHURCH;
    },
  };
  const mocks = { [PUBLIC_API_IMPORT]: publicApi };

  if (Object.prototype.hasOwnProperty.call(options, "adapter")) {
    mocks[PROVIDER_IMPORT] = { publicInformationAssistantProvider: options.adapter };
  }

  const route = loadT2Route({
    root: process.env.R24_SOURCE_ROOT,
    mocks,
  });

  return { calls, route };
}

function makeRequest(value, headers = {}) {
  return new Request("http://local.test/api/public/churches/slug/comunidade-do-norte/assistant", {
    method: "POST",
    headers,
    body: JSON.stringify(value),
  });
}

async function post(route, request = makeRequest({ question: "Onde fica?", locale: "pt-BR" })) {
  return route.POST(request, { params: Promise.resolve({ slug: SLUG }) });
}

function assertNoStore(response) {
  assert.equal(response.headers.get("cache-control"), "no-store");
}

test("route default provider is disabled and returns the exact unavailable response", async () => {
  const fixture = makeFixture();
  const response = await post(fixture.route);

  assert.equal(response.status, 503);
  assertNoStore(response);
  assert.deepEqual(await response.json(), { code: "ASSISTANT_NOT_CONFIGURED" });
  assert.deepEqual(fixture.calls.reads, []);
  assert.equal(fixture.calls.selections, 0);
});

test("POST composes public reader and adapter with local anchored output only", async () => {
  const adapter = {
    select(input) {
      fixture.calls.events.push("provider");
      fixture.calls.selections += 1;
      fixture.calls.selectionInputs.push(input);
      return { factIds: ["church-name", "address"] };
    },
  };
  const fixture = makeFixture({ adapter });
  const request = makeRequest(
    { question: "Onde fica?", locale: "pt-BR" },
    { authorization: "Bearer visitor-identity", cookie: "session=visitor-session", "x-member-id": "member-42" },
  );

  const response = await post(fixture.route, request);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assertNoStore(response);
  assert.deepEqual(payload, {
    slug: SLUG,
    status: "answered",
    answer: ["Nome da comunidade: Comunidade do Norte", "Endereço: Rua das Flores, 12"],
    sources: [
      { factId: "church-name", href: `/comunidades/${SLUG}` },
      { factId: "address", href: `/comunidades/${SLUG}` },
    ],
  });
  assert.deepEqual(
    JSON.parse(JSON.stringify(fixture.calls.reads)),
    [[SLUG, { cache: "no-store" }]],
  );
  assert.deepEqual(fixture.calls.events, ["reader", "provider"]);
  assert.equal(fixture.calls.selections, 1);
  assert.deepEqual(Object.keys(fixture.calls.selectionInputs[0]).sort(), [
    "facts", "locale", "question", "signal", "slug",
  ]);
  assert.deepEqual(
    JSON.parse(JSON.stringify(fixture.calls.selectionInputs[0].facts)),
    [
      { id: "church-name", text: "Nome da comunidade: Comunidade do Norte" },
      { id: "denomination", text: "Denominação: Batista" },
      { id: "address", text: "Endereço: Rua das Flores, 12" },
      { id: "city", text: "Cidade: Campinas" },
      { id: "state", text: "Estado: SP" },
    ],
  );

  const secondResponse = await post(fixture.route);
  assert.equal(secondResponse.status, 200);
  assert.equal(fixture.calls.reads.length, 2);
  assert.equal(fixture.calls.selections, 2);
});

test("invalid request reaches neither public API nor provider", async () => {
  let providerCalls = 0;
  const fixture = makeFixture({
    adapter: {
      select() {
        providerCalls += 1;
        return { factIds: [] };
      },
    },
  });
  const response = await post(
    fixture.route,
    makeRequest({ question: "Onde fica?", locale: "pt-BR", visitor: "private" }),
  );

  assert.equal(response.status, 400);
  assertNoStore(response);
  assert.deepEqual(await response.json(), { code: "INVALID_REQUEST" });
  assert.deepEqual(fixture.calls.reads, []);
  assert.equal(providerCalls, 0);
});

test("public API 404 becomes a generic community-not-found response", async () => {
  let providerCalls = 0;
  const fixture = makeFixture({
    adapter: {
      select() {
        providerCalls += 1;
        return { factIds: [] };
      },
    },
    readError: new MockApiRequestError("private API detail", 404),
  });
  const response = await post(fixture.route);

  assert.equal(response.status, 404);
  assertNoStore(response);
  assert.deepEqual(await response.json(), { code: "COMMUNITY_NOT_FOUND" });
  assert.deepEqual(
    JSON.parse(JSON.stringify(fixture.calls.reads)),
    [[SLUG, { cache: "no-store" }]],
  );
  assert.equal(providerCalls, 0);
});

test("other public API failures remain generic and do not call the provider", async () => {
  let providerCalls = 0;
  const fixture = makeFixture({
    adapter: {
      select() {
        providerCalls += 1;
        return { factIds: [] };
      },
    },
    readError: new Error("private reader detail"),
  });
  const response = await post(fixture.route);
  const text = await response.text();

  assert.equal(response.status, 503);
  assertNoStore(response);
  assert.deepEqual(JSON.parse(text), { code: "PUBLIC_INFORMATION_UNAVAILABLE" });
  assert.equal(text.includes("private reader detail"), false);
  assert.deepEqual(
    JSON.parse(JSON.stringify(fixture.calls.reads)),
    [[SLUG, { cache: "no-store" }]],
  );
  assert.equal(providerCalls, 0);
});
