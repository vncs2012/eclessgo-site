const assert = require("node:assert/strict");
const { test } = require("node:test");

const { loadT1Modules } = require("./harness.cjs");

const { assistant, provider } = loadT1Modules({
  root: process.env.R24_SOURCE_ROOT,
});
const { createPublicInformationAssistantHandler, projectPublicInformationFacts } = assistant;

const SLUG = "comunidade-do-norte";
const PUBLIC_CHURCH = {
  id: "internal-reference-42",
  slug: SLUG,
  name: "Comunidade do Norte",
  denomination: "Batista",
  description: "Uma comunidade acolhedora.",
  addressLine: "Rua das Flores, 12",
  neighborhood: "Centro",
  city: "Campinas",
  state: "SP",
  address: { street: "Rua interna", buildingCode: "block-private" },
  contact: { phone: "(19) 99999-1234", email: "private@example.invalid" },
  schedule: [{
    id: "internal-schedule-9",
    title: "Culto",
    day: "SUNDAY",
    time: "10:00",
    description: "Celebração semanal",
    contact: "(19) 98888-4321",
  }],
  memberCount: 712,
  plan: "INTERNAL-PLAN",
  pixKey: "private-payment-marker",
  donationsEnabled: true,
  photos: ["private-photo-marker"],
  internalExtra: "private-extra-marker",
};

function makeRequest(value, options = {}) {
  const body = options.rawBody === undefined ? JSON.stringify(value) : options.rawBody;
  return new Request("http://local.test", {
    method: "POST",
    headers: options.headers,
    body,
  });
}

function makeFixture(options = {}) {
  const calls = { reads: 0, selections: 0, selectionInput: null };
  const church = Object.prototype.hasOwnProperty.call(options, "church")
    ? options.church
    : PUBLIC_CHURCH;
  const adapter = Object.prototype.hasOwnProperty.call(options, "adapter")
    ? options.adapter
    : {
      async select(input) {
        calls.selections += 1;
        calls.selectionInput = input;
        if (options.select) return options.select(input);
        if (options.selectionError) throw options.selectionError;
        if (Object.prototype.hasOwnProperty.call(options, "selection")) return options.selection;
        return { factIds: ["church-name"] };
      },
    };

  const handler = createPublicInformationAssistantHandler({
    async readPublicChurch(slug) {
      calls.reads += 1;
      if (options.readError) throw options.readError;
      if (typeof options.read === "function") return options.read(slug);
      return church;
    },
    adapter,
    timer: options.timer,
  });

  return { calls, handler };
}

async function responsePayload(response) {
  return response.json();
}

function assertNoStore(response) {
  assert.equal(response.headers.get("cache-control"), "no-store");
}

test("projection contains only bounded public profile, locality, and agenda facts", () => {
  const facts = projectPublicInformationFacts(PUBLIC_CHURCH, SLUG, "pt-BR");
  const normalized = JSON.parse(JSON.stringify(facts));

  assert.deepEqual(normalized, [
    { id: "church-name", text: "Nome da comunidade: Comunidade do Norte" },
    { id: "denomination", text: "Denominação: Batista" },
    { id: "description", text: "Descrição pública: Uma comunidade acolhedora." },
    { id: "address", text: "Endereço: Rua das Flores, 12" },
    { id: "neighborhood", text: "Bairro: Centro" },
    { id: "city", text: "Cidade: Campinas" },
    { id: "state", text: "Estado: SP" },
    { id: "schedule-1", text: "Atividade pública: Culto; SUNDAY; 10:00; Celebração semanal" },
  ]);
  assert.equal(JSON.stringify(normalized).includes("internal-reference-42"), false);
  assert.equal(JSON.stringify(normalized).includes("private-payment-marker"), false);
  assert.equal(JSON.stringify(normalized).includes("private-extra-marker"), false);
  for (const fact of facts) assert.deepEqual(Object.keys(fact).sort(), ["id", "text"]);
});

test("projection omits malformed or overlong text without truncating it", () => {
  const facts = projectPublicInformationFacts({
    slug: SLUG,
    name: " ",
    denomination: "D".repeat(2001),
    description: "Descrição",
    addressLine: "Endereço não informado",
    neighborhood: 12,
    city: "  Campinas  ",
    state: "SP",
    schedule: [
      "   ",
      42,
      { title: "A".repeat(2001) },
      { title: "Culto", notes: "N".repeat(2001) },
      { name: "Encontro", hour: "19h" },
    ],
  }, SLUG, "pt-BR");

  assert.deepEqual(JSON.parse(JSON.stringify(facts)), [
    { id: "description", text: "Descrição pública: Descrição" },
    { id: "city", text: "Cidade: Campinas" },
    { id: "state", text: "Estado: SP" },
    { id: "schedule-4", text: "Atividade pública: Culto" },
    { id: "schedule-5", text: "Atividade pública: Encontro; 19h" },
  ]);
});

test("projection caps the public agenda at thirty entries", () => {
  const schedule = Array.from({ length: 31 }, (_value, index) => `Atividade ${index + 1}`);
  const facts = projectPublicInformationFacts({ slug: SLUG, schedule }, SLUG, "en");
  const agendaFacts = facts.filter((fact) => fact.id.startsWith("schedule-"));

  assert.equal(agendaFacts.length, 30);
  assert.equal(agendaFacts[0].text, "Public activity: Atividade 1");
  assert.equal(agendaFacts[29].text, "Public activity: Atividade 30");
  assert.equal(agendaFacts.some((fact) => fact.text.includes("Atividade 31")), false);
});

test("projection rejects a public record for a different slug", () => {
  const facts = projectPublicInformationFacts({ slug: "outra-comunidade", name: "Outro nome" }, SLUG, "en");

  assert.equal(facts, null);
});

test("handler gives the adapter only the minimal projection and returns exact anchored facts", async () => {
  const fixture = makeFixture({ selection: { factIds: ["church-name", "schedule-1"] } });
  const response = await fixture.handler(makeRequest({ question: "  Quando acontece?  ", locale: "pt-BR" }), SLUG);
  const payload = await responsePayload(response);
  const adapterInput = fixture.calls.selectionInput;

  assert.equal(response.status, 200);
  assertNoStore(response);
  assert.deepEqual(payload, {
    slug: SLUG,
    status: "answered",
    answer: [
      "Nome da comunidade: Comunidade do Norte",
      "Atividade pública: Culto; SUNDAY; 10:00; Celebração semanal",
    ],
    sources: [
      { factId: "church-name", href: `/comunidades/${SLUG}` },
      { factId: "schedule-1", href: `/comunidades/${SLUG}` },
    ],
  });
  assert.deepEqual(Object.keys(adapterInput).sort(), ["facts", "locale", "question", "signal", "slug"]);
  assert.equal(adapterInput.question, "Quando acontece?");
  assert.equal(adapterInput.locale, "pt-BR");
  assert.equal(adapterInput.slug, SLUG);
  assert.equal(typeof adapterInput.signal.aborted, "boolean");
  assert.deepEqual(JSON.parse(JSON.stringify(adapterInput.facts)), JSON.parse(JSON.stringify(
    projectPublicInformationFacts(PUBLIC_CHURCH, SLUG, "pt-BR"),
  )));
  assert.equal(Object.prototype.hasOwnProperty.call(adapterInput, "contact"), false);
});

test("adapter cannot alter projected facts or replace the answer with injected text", async () => {
  const fixture = makeFixture({
    select(input) {
      assert.equal(Reflect.set(input.facts[0], "text", "Injected answer"), false);
      assert.throws(
        () => input.facts.push({ id: "injected", text: "Injected answer" }),
        (error) => error && error.name === "TypeError",
      );
      return { factIds: ["church-name"] };
    },
  });
  const response = await fixture.handler(makeRequest({ question: "Qual é o nome?", locale: "en" }), SLUG);
  const payload = await responsePayload(response);

  assert.equal(response.status, 200);
  assert.deepEqual(payload.answer, ["Community name: Comunidade do Norte"]);
  assert.deepEqual(payload.sources, [{ factId: "church-name", href: `/comunidades/${SLUG}` }]);
});

test("handler returns no_information when the adapter selects no facts", async () => {
  const fixture = makeFixture({ selection: { factIds: [] } });
  const response = await fixture.handler(makeRequest({ question: "Há estacionamento?", locale: "en" }), SLUG);

  assert.equal(response.status, 200);
  assertNoStore(response);
  assert.deepEqual(await responsePayload(response), {
    slug: SLUG,
    status: "no_information",
    answer: [],
    sources: [],
  });
});

test("handler accepts eight unique known fact IDs and builds one source per selected fact", async () => {
  const factIds = ["church-name", "denomination", "description", "address", "neighborhood", "city", "state", "schedule-1"];
  const fixture = makeFixture({ selection: { factIds } });
  const response = await fixture.handler(makeRequest({ question: "O que há?", locale: "pt-BR" }), SLUG);
  const payload = await responsePayload(response);

  assert.equal(response.status, 200);
  assert.equal(payload.answer.length, 8);
  assert.equal(payload.sources.length, 8);
  assert.deepEqual(payload.sources.map((source) => source.factId), factIds);
  assert.equal(payload.sources.every((source) => source.href === `/comunidades/${SLUG}`), true);
});

test("handler rejects malformed selection shapes and extra prose or sources", async () => {
  for (const selection of [
    null,
    "church-name",
    { factIds: "church-name" },
    { factIds: ["church-name"], answer: "Invented text", sources: [{ href: "/outside" }] },
  ]) {
    const fixture = makeFixture({ selection });
    const response = await fixture.handler(makeRequest({ question: "O que existe?", locale: "pt-BR" }), SLUG);

    assert.equal(response.status, 502);
    assert.deepEqual(await responsePayload(response), { code: "INVALID_PROVIDER_RESPONSE" });
  }
});

test("handler rejects unknown, duplicate, and more than eight selected fact IDs", async () => {
  const nineKnownIds = [
    "church-name", "denomination", "description", "address", "neighborhood", "city", "state",
    "schedule-1", "schedule-2",
  ];
  const selections = [
    { factIds: ["unknown-fact"] },
    { factIds: ["church-name", "church-name"] },
    { factIds: nineKnownIds },
  ];

  for (const selection of selections) {
    const fixture = makeFixture({
      church: { ...PUBLIC_CHURCH, schedule: [...PUBLIC_CHURCH.schedule, { title: "Reunião" }] },
      selection,
    });
    const response = await fixture.handler(makeRequest({ question: "O que existe?", locale: "pt-BR" }), SLUG);

    assert.equal(response.status, 502);
    assert.deepEqual(await responsePayload(response), { code: "INVALID_PROVIDER_RESPONSE" });
  }
});

test("absent adapter returns ASSISTANT_NOT_CONFIGURED without reading the community", async () => {
  const fixture = makeFixture({ adapter: null });
  const response = await fixture.handler(makeRequest({ question: "Onde fica?", locale: "pt-BR" }), SLUG);

  assert.equal(response.status, 503);
  assertNoStore(response);
  assert.deepEqual(await responsePayload(response), { code: "ASSISTANT_NOT_CONFIGURED" });
  assert.equal(fixture.calls.reads, 0);
  assert.equal(fixture.calls.selections, 0);
});

test("invalid input is rejected before checking whether an adapter is configured", async () => {
  const fixture = makeFixture({ adapter: null });
  const response = await fixture.handler(makeRequest({ question: " ", locale: "pt-BR" }), SLUG);

  assert.equal(response.status, 400);
  assert.deepEqual(await responsePayload(response), { code: "INVALID_REQUEST" });
  assert.equal(fixture.calls.reads, 0);
});

test("adapter failure returns a generic unavailable code without exposing details", async () => {
  const fixture = makeFixture({ selectionError: new Error("private adapter detail") });
  const response = await fixture.handler(makeRequest({ question: "Onde fica?", locale: "pt-BR" }), SLUG);
  const text = await response.text();

  assert.equal(response.status, 503);
  assertNoStore(response);
  assert.deepEqual(JSON.parse(text), { code: "ASSISTANT_UNAVAILABLE" });
  assert.equal(text.includes("private adapter detail"), false);
});

test("adapter timeout is 5000 ms and aborts its signal before returning 504", async () => {
  let timeoutHandler;
  let timeoutDuration;
  let adapterSignal;
  const timer = {
    setTimeout(handler, delayMs) {
      timeoutHandler = handler;
      timeoutDuration = delayMs;
      return 17;
    },
    clearTimeout(handle) {
      assert.equal(handle, 17);
    },
  };
  const fixture = makeFixture({
    timer,
    select(input) {
      adapterSignal = input.signal;
      timeoutHandler();
      return new Promise(() => {});
    },
  });
  const response = await fixture.handler(makeRequest({ question: "Quando?", locale: "en" }), SLUG);

  assert.equal(timeoutDuration, 5000);
  assert.equal(adapterSignal.aborted, true);
  assert.equal(response.status, 504);
  assertNoStore(response);
  assert.deepEqual(await responsePayload(response), { code: "ASSISTANT_TIMEOUT" });
});

test("invalid slugs return INVALID_REQUEST before reader or adapter calls", async () => {
  for (const slug of ["Uppercase", "duplo--hifen", "-inicio", "fim-", "a".repeat(121)]) {
    const fixture = makeFixture();
    const response = await fixture.handler(makeRequest({ question: "Pergunta?", locale: "pt-BR" }), slug);

    assert.equal(response.status, 400);
    assert.deepEqual(await responsePayload(response), { code: "INVALID_REQUEST" });
    assert.equal(fixture.calls.reads, 0);
    assert.equal(fixture.calls.selections, 0);
  }
});

test("request body must contain exactly question and locale", async () => {
  const fixture = makeFixture();
  const response = await fixture.handler(makeRequest({ question: "Pergunta?", locale: "pt-BR", extra: true }), SLUG);

  assert.equal(response.status, 400);
  assert.deepEqual(await responsePayload(response), { code: "INVALID_REQUEST" });
  assert.equal(fixture.calls.reads, 0);
  assert.equal(fixture.calls.selections, 0);
});

test("malformed JSON returns INVALID_REQUEST before dependencies", async () => {
  const fixture = makeFixture();
  const response = await fixture.handler(makeRequest(null, { rawBody: "{" }), SLUG);

  assert.equal(response.status, 400);
  assert.deepEqual(await responsePayload(response), { code: "INVALID_REQUEST" });
  assert.equal(fixture.calls.reads, 0);
  assert.equal(fixture.calls.selections, 0);
});

test("only pt-BR and en locales are accepted", async () => {
  const fixture = makeFixture();
  const response = await fixture.handler(makeRequest({ question: "Pergunta?", locale: "pt" }), SLUG);

  assert.equal(response.status, 400);
  assert.deepEqual(await responsePayload(response), { code: "INVALID_REQUEST" });
  assert.equal(fixture.calls.reads, 0);
});

test("blank questions are rejected before dependencies", async () => {
  const fixture = makeFixture();
  const response = await fixture.handler(makeRequest({ question: " \n\t ", locale: "en" }), SLUG);

  assert.equal(response.status, 400);
  assert.deepEqual(await responsePayload(response), { code: "INVALID_REQUEST" });
  assert.equal(fixture.calls.reads, 0);
});

test("question length is measured in code points and accepts exactly 500", async () => {
  const fixture = makeFixture();
  const question = "😀".repeat(500);
  const response = await fixture.handler(makeRequest({ question, locale: "en" }), SLUG);

  assert.equal(response.status, 200);
  assert.equal(fixture.calls.selectionInput.question, question);
});

test("questions over 500 code points are rejected before dependencies", async () => {
  const fixture = makeFixture();
  const response = await fixture.handler(
    makeRequest({ question: "x".repeat(501), locale: "pt-BR" }),
    SLUG,
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await responsePayload(response), { code: "INVALID_REQUEST" });
  assert.equal(fixture.calls.reads, 0);
  assert.equal(fixture.calls.selections, 0);
});

test("request body accepts exactly 4096 bytes and rejects 4097 actual bytes", async () => {
  const body = JSON.stringify({ question: "q", locale: "en" });
  const exactBody = body.padEnd(4096, " ");
  assert.equal(new TextEncoder().encode(exactBody).byteLength, 4096);

  const exactFixture = makeFixture();
  const exactResponse = await exactFixture.handler(makeRequest(null, { rawBody: exactBody }), SLUG);
  assert.equal(exactResponse.status, 200);

  const tooLargeFixture = makeFixture();
  const tooLargeResponse = await tooLargeFixture.handler(
    makeRequest(null, { rawBody: body.padEnd(4097, " ") }),
    SLUG,
  );
  assert.equal(tooLargeResponse.status, 413);
  assertNoStore(tooLargeResponse);
  assert.deepEqual(await responsePayload(tooLargeResponse), { code: "REQUEST_TOO_LARGE" });
  assert.equal(tooLargeFixture.calls.reads, 0);
  assert.equal(tooLargeFixture.calls.selections, 0);
});

test("missing public community returns 404 without calling the adapter", async () => {
  const fixture = makeFixture({ church: null });
  const response = await fixture.handler(makeRequest({ question: "Onde fica?", locale: "pt-BR" }), SLUG);

  assert.equal(response.status, 404);
  assert.deepEqual(await responsePayload(response), { code: "COMMUNITY_NOT_FOUND" });
  assert.equal(fixture.calls.selections, 0);
});

test("reader 404 maps to COMMUNITY_NOT_FOUND and other reader errors stay generic", async () => {
  for (const [readError, status, code] of [
    [{ status: 404, message: "private reader detail" }, 404, "COMMUNITY_NOT_FOUND"],
    [new Error("private reader detail"), 503, "PUBLIC_INFORMATION_UNAVAILABLE"],
  ]) {
    const fixture = makeFixture({ readError });
    const response = await fixture.handler(makeRequest({ question: "Onde fica?", locale: "pt-BR" }), SLUG);

    assert.equal(response.status, status);
    assert.deepEqual(await responsePayload(response), { code });
    assert.equal(fixture.calls.selections, 0);
  }
});

test("reader data for a different slug is rejected before the adapter", async () => {
  const fixture = makeFixture({ church: { ...PUBLIC_CHURCH, slug: "outra-comunidade" } });
  const response = await fixture.handler(makeRequest({ question: "Onde fica?", locale: "pt-BR" }), SLUG);

  assert.equal(response.status, 503);
  assert.deepEqual(await responsePayload(response), { code: "PUBLIC_INFORMATION_UNAVAILABLE" });
  assert.equal(fixture.calls.selections, 0);
});

test("default provider is absent", () => {
  assert.equal(provider.publicInformationAssistantProvider, null);
});
