'use strict';
const test = require('node:test');
const { assert, moduleAt, request, deferred, timer, church } = require('./isolation.cjs');
const { createPublicInformationAssistantHandler, projectPublicInformationFacts } = moduleAt('src/lib/public-information-assistant.ts');

async function result(response) {
  return { status: response.status, body: await response.json(), cache: response.headers.get('cache-control') };
}
function ready(adapter) { return { kind: 'ready', adapter }; }

test('invalid slug/body/size are rejected before resolver even when OFF', async () => {
  let resolutions = 0, reads = 0;
  const handle = createPublicInformationAssistantHandler({
    resolveAdapter: async () => { resolutions++; return { kind: 'not-configured' }; },
    readPublicChurch: async () => { reads++; return church(); },
  });
  const cases = [
    [request(), 'Invalid!', 400, 'INVALID_REQUEST'],
    [request('{', true), 'test-church', 400, 'INVALID_REQUEST'],
    [request({ question: '', locale: 'en' }), 'test-church', 400, 'INVALID_REQUEST'],
    [request({ question: 'x'.repeat(501), locale: 'en' }), 'test-church', 400, 'INVALID_REQUEST'],
    [request({ question: 'x', locale: 'fr' }), 'test-church', 400, 'INVALID_REQUEST'],
    [request({ question: 'x', locale: 'en', extra: true }), 'test-church', 400, 'INVALID_REQUEST'],
    [request('x'.repeat(4097), true), 'test-church', 413, 'REQUEST_TOO_LARGE'],
  ];
  for (const [req, slug, status, code] of cases) {
    assert.deepEqual(await result(await handle(req, slug)), { status, body: { code }, cache: 'no-store' });
  }
  assert.equal(resolutions, 0);
  assert.equal(reads, 0);
  assert.deepEqual(await result(await handle(request({ question: 'x'.repeat(500), locale: 'en' }), 'test-church')),
    { status: 503, body: { code: 'ASSISTANT_NOT_CONFIGURED' }, cache: 'no-store' });
  assert.equal(resolutions, 1);
  assert.equal(reads, 0);
  const valid = JSON.stringify({ question: 'x', locale: 'en' });
  const exactLimit = valid + ' '.repeat(4096 - Buffer.byteLength(valid));
  assert.deepEqual(await result(await handle(request(exactLimit, true), 'a'.repeat(120))),
    { status: 503, body: { code: 'ASSISTANT_NOT_CONFIGURED' }, cache: 'no-store' });
  assert.deepEqual(await result(await handle(request(), 'a'.repeat(121))),
    { status: 400, body: { code: 'INVALID_REQUEST' }, cache: 'no-store' });
  assert.equal(resolutions, 2);
  assert.equal(reads, 0);
});

test('OFF, absence and resolver failure stop before public reader', async () => {
  for (const [kind, code] of [['not-configured', 'ASSISTANT_NOT_CONFIGURED'], ['unavailable', 'ASSISTANT_UNAVAILABLE']]) {
    let reads = 0;
    const handle = createPublicInformationAssistantHandler({
      resolveAdapter: async () => ({ kind }), readPublicChurch: async () => { reads++; return church(); },
    });
    assert.deepEqual(await result(await handle(request(), 'test-church')),
      { status: 503, body: { code }, cache: 'no-store' });
    assert.equal(reads, 0);
  }
  let reads = 0;
  const handle = createPublicInformationAssistantHandler({
    resolveAdapter: async () => { throw new Error('private resolver'); },
    readPublicChurch: async () => { reads++; return church(); },
  });
  assert.deepEqual(await result(await handle(request(), 'test-church')),
    { status: 503, body: { code: 'ASSISTANT_UNAVAILABLE' }, cache: 'no-store' });
  assert.equal(reads, 0);
});

test('valid IDs produce local facts and sources; empty IDs produce no_information', async () => {
  let input;
  const adapter = { select: async (value) => { input = value; return { factIds: ['church-name', 'schedule-1'] }; } };
  const handle = createPublicInformationAssistantHandler({
    resolveAdapter: async () => ready(adapter), readPublicChurch: async () => church(),
  });
  assert.deepEqual(await result(await handle(request(), 'test-church')), {
    status: 200, cache: 'no-store', body: {
      slug: 'test-church', status: 'answered',
      answer: ['Community name: Community', 'Public activity: Sunday'],
      sources: [{ factId: 'church-name', href: '/comunidades/test-church' },
                { factId: 'schedule-1', href: '/comunidades/test-church' }],
    },
  });
  assert.equal(input.slug, 'test-church');
  assert.equal(input.locale, 'en');
  assert.equal(Object.isFrozen(input.facts), true);
  assert.deepEqual(input.facts.map((fact) => fact.id), ['church-name', 'description', 'city', 'schedule-1']);
  assert.equal(JSON.stringify(input.facts).includes('private-'), false);
  assert.equal(JSON.stringify(input.facts).includes('private-contact'), false);
  assert.equal(JSON.stringify(input.facts).includes('private-member'), false);
  const empty = createPublicInformationAssistantHandler({
    adapter: { select: () => ({ factIds: [] }) }, readPublicChurch: () => church(),
  });
  assert.deepEqual(await result(await empty(request(), 'test-church')), {
    status: 200, cache: 'no-store', body: { slug: 'test-church', status: 'no_information', answer: [], sources: [] },
  });
});

test('invalid selection, refusals or extra fields return 502 without echo', async () => {
  const invalid = [
    null, 'free prose', { factIds: ['unknown'] }, { factIds: ['church-name', 'church-name'] },
    { factIds: Array.from({ length: 9 }, () => 'church-name') },
    { factIds: [], extra: 'do-not-echo' },
  ];
  for (const value of invalid) {
    const handle = createPublicInformationAssistantHandler({
      resolveAdapter: async () => ready({ select: () => value }), readPublicChurch: () => church(),
    });
    assert.deepEqual(await result(await handle(request(), 'test-church')),
      { status: 502, body: { code: 'INVALID_PROVIDER_RESPONSE' }, cache: 'no-store' });
  }
});

test('reader 404/failure and provider failure use their specified sanitized statuses', async () => {
  let calls = 0;
  for (const [error, status, code] of [[{ status: 404 }, 404, 'COMMUNITY_NOT_FOUND'],
                                      [new Error('private reader'), 503, 'PUBLIC_INFORMATION_UNAVAILABLE']]) {
    const handle = createPublicInformationAssistantHandler({
      resolveAdapter: async () => ready({ select: () => { calls++; return { factIds: [] }; } }),
      readPublicChurch: () => { throw error; },
    });
    assert.deepEqual(await result(await handle(request(), 'test-church')),
      { status, body: { code }, cache: 'no-store' });
  }
  assert.equal(calls, 0);
  const handle = createPublicInformationAssistantHandler({
    resolveAdapter: async () => ready({ select: () => { throw new Error('private provider'); } }),
    readPublicChurch: () => church(),
  });
  assert.deepEqual(await result(await handle(request(), 'test-church')),
    { status: 503, body: { code: 'ASSISTANT_UNAVAILABLE' }, cache: 'no-store' });
});

test('adapter timeout returns 504 and aborts the selected provider signal', async () => {
  const clock = timer();
  const pending = deferred();
  let signal;
  const handle = createPublicInformationAssistantHandler({
    timer: clock, resolveAdapter: async () => ready({ select: ({ signal: value }) => { signal = value; return pending.promise; } }),
    readPublicChurch: () => church(),
  });
  const operation = handle(request(), 'test-church');
  for (let i = 0; i < 10 && !signal; i++) await Promise.resolve();
  assert.equal(clock.delay, 5000);
  clock.fire();
  assert.deepEqual(await result(await operation),
    { status: 504, body: { code: 'ASSISTANT_TIMEOUT' }, cache: 'no-store' });
  assert.equal(signal.aborted, true);
  assert.equal(clock.cleared, true);
});

test('each request resolves freshly and the in-flight snapshot remains unchanged', async () => {
  const first = deferred();
  let resolutions = 0, firstCalls = 0, secondCalls = 0;
  const handle = createPublicInformationAssistantHandler({
    resolveAdapter: async () => {
      resolutions++;
      return resolutions === 1
        ? ready({ select: () => { firstCalls++; return first.promise; } })
        : ready({ select: () => { secondCalls++; return { factIds: ['description'] }; } });
    },
    readPublicChurch: () => church(),
  });
  const old = handle(request(), 'test-church');
  for (let i = 0; i < 10 && !firstCalls; i++) await Promise.resolve();
  const current = await result(await handle(request(), 'test-church'));
  first.resolve({ factIds: ['church-name'] });
  const previous = await result(await old);
  assert.deepEqual(current.body.answer, ['Public description: Open to visitors']);
  assert.deepEqual(previous.body.answer, ['Community name: Community']);
  assert.equal(resolutions, 2);
  assert.equal(firstCalls, 1);
  assert.equal(secondCalls, 1);
});

test('projection omits malformed and oversized facts and limits public schedule to thirty', () => {
  const schedule = Array.from({ length: 31 }, (_, i) => 'Activity ' + (i + 1));
  schedule[1] = 42;
  schedule[2] = { description: 'no title' };
  const facts = projectPublicInformationFacts({
    slug: 'test-church', name: 'x'.repeat(2001), description: 'd'.repeat(2000), schedule,
    contact: 'private-contact',
  }, 'test-church', 'en');
  assert.equal(facts.length, 29);
  assert.equal(facts[0].id, 'description');
  assert.equal(facts[0].text.length, 'Public description: '.length + 2000);
  assert.equal(facts.some((fact) => fact.id === 'church-name'), false);
  assert.equal(facts.some((fact) => fact.id === 'schedule-30'), true);
  assert.equal(facts.some((fact) => fact.id === 'schedule-31'), false);
  assert.equal(JSON.stringify(facts).includes('private-contact'), false);
  assert.deepEqual(projectPublicInformationFacts({ slug: 'test-church', description: '', schedule: [null] },
    'test-church', 'en'), []);
});

test('resolver timeout is 503 before reader and aborts the selection request', async () => {
  const { resolvePublicInformationAssistant } = moduleAt('src/lib/public-information-assistant-resolver.ts');
  const { env } = require('./isolation.cjs');
  const clock = timer();
  const pending = deferred();
  let signal, reads = 0;
  const handle = createPublicInformationAssistantHandler({
    resolveAdapter: () => resolvePublicInformationAssistant({ env: env('openai'), timer: clock,
      fetchSelection: async (_url, init) => { signal = init.signal; return pending.promise; } }),
    readPublicChurch: () => { reads++; return church(); },
  });
  const operation = handle(request(), 'test-church');
  for (let i = 0; i < 20 && !signal; i++) await Promise.resolve();
  assert.equal(clock.delay, 8000);
  clock.fire();
  assert.deepEqual(await result(await operation),
    { status: 503, body: { code: 'ASSISTANT_UNAVAILABLE' }, cache: 'no-store' });
  assert.equal(signal.aborted, true);
  assert.equal(reads, 0);
});

test('provider errors are not logged or reflected', async () => {
  const originals = { log: console.log, warn: console.warn, error: console.error };
  let logged = 0;
  console.log = console.warn = console.error = () => { logged++; };
  try {
    const handle = createPublicInformationAssistantHandler({
      resolveAdapter: async () => ready({ select: () => { throw new Error('private provider detail'); } }),
      readPublicChurch: () => church(),
    });
    assert.deepEqual(await result(await handle(request(), 'test-church')),
      { status: 503, body: { code: 'ASSISTANT_UNAVAILABLE' }, cache: 'no-store' });
    assert.equal(logged, 0);
  } finally {
    Object.assign(console, originals);
  }
});

test('invalid resolver getters fail closed before reading public information', async () => {
  for (const broken of [
    Object.defineProperty({}, 'kind', { get() { throw new Error('private kind'); } }),
    Object.defineProperty({ kind: 'ready' }, 'adapter', { get() { throw new Error('private adapter'); } }),
    { kind: 'ready', adapter: Object.defineProperty({}, 'select', { get() { throw new Error('private select'); } }) },
  ]) {
    let reads = 0;
    const handle = createPublicInformationAssistantHandler({
      resolveAdapter: async () => broken,
      readPublicChurch: () => { reads++; return church(); },
    });
    assert.deepEqual(await result(await handle(request(), 'test-church')),
      { status: 503, body: { code: 'ASSISTANT_UNAVAILABLE' }, cache: 'no-store' });
    assert.equal(reads, 0);
  }
});

test('eight unique public facts are rendered in Portuguese with local sources', async () => {
  const ids = ['church-name', 'denomination', 'description', 'address', 'neighborhood', 'city', 'state', 'schedule-1'];
  const handle = createPublicInformationAssistantHandler({
    adapter: { select: () => ({ factIds: ids }) },
    readPublicChurch: () => ({
      slug: 'test-church', name: 'Comunidade', denomination: 'Exemplo', description: 'Aberta',
      addressLine: 'Rua Um', neighborhood: 'Centro', city: 'Cidade', state: 'GO', schedule: ['Domingo'],
    }),
  });
  const actual = await result(await handle(request({ question: 'Quando?', locale: 'pt-BR' }), 'test-church'));
  assert.equal(actual.status, 200);
  assert.equal(actual.cache, 'no-store');
  assert.deepEqual(actual.body.answer, [
    'Nome da comunidade: Comunidade', 'Denominação: Exemplo', 'Descrição pública: Aberta',
    'Endereço: Rua Um', 'Bairro: Centro', 'Cidade: Cidade', 'Estado: GO', 'Atividade pública: Domingo',
  ]);
  assert.deepEqual(actual.body.sources, ids.map((factId) => ({ factId, href: '/comunidades/test-church' })));
});
