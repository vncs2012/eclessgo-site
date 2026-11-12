'use strict';
const test = require('node:test');
const { assert, moduleAt, state, request, json, env, church } = require('./isolation.cjs');
const { createPublicInformationAssistantHandler } = moduleAt('src/lib/public-information-assistant.ts');
const {
  createAssistantProtection, createMemoryProtectionStore, createUpstashProtectionStore,
  readAssistantProtectionLimits, DEFAULT_ASSISTANT_PROTECTION_LIMITS,
} = moduleAt('src/lib/public-assistant-protection.ts');

const LIMITS = { ipPerMinute: 2, ipPerHour: 100, slugPerHour: 100, globalPerDay: 100, cacheTtlMs: 0 };

function harness({ limits = {}, store, now, trustProxy = true } = {}) {
  const clock = { t: Date.UTC(2026, 10, 12, 12, 0, 0) };
  const tick = now ?? (() => clock.t);
  const counters = { resolutions: 0, reads: 0, selects: 0 };
  const protection = createAssistantProtection({
    store: store ?? createMemoryProtectionStore({ now: tick }),
    limits: { ...LIMITS, ...limits },
    env: trustProxy ? { VERCEL: '1' } : {},
    now: tick,
  });
  const handle = createPublicInformationAssistantHandler({
    protection,
    resolveAdapter: async () => {
      counters.resolutions++;
      return { kind: 'ready', adapter: { select: async () => { counters.selects++; return { factIds: ['church-name'] }; } } };
    },
    readPublicChurch: async () => { counters.reads++; return church(); },
  });
  return { handle, counters, clock };
}
const from = (ip, body) => request(body, false, { 'x-real-ip': ip });
async function result(response) {
  return { status: response.status, body: await response.json(), retryAfter: response.headers.get('retry-after') };
}

test('per-IP limit returns 429 RATE_LIMITED before resolver and resets with the window', async () => {
  const { handle, counters, clock } = harness();
  assert.equal((await handle(from('198.51.100.1'), 'test-church')).status, 200);
  assert.equal((await handle(from('198.51.100.1'), 'test-church')).status, 200);
  const limited = await result(await handle(from('198.51.100.1'), 'test-church'));
  assert.equal(limited.status, 429);
  assert.deepEqual(limited.body, { code: 'RATE_LIMITED' });
  assert.ok(Number(limited.retryAfter) >= 1 && Number(limited.retryAfter) <= 60);
  assert.equal(counters.resolutions, 2);
  assert.equal(counters.selects, 2);

  assert.equal((await handle(from('198.51.100.2'), 'test-church')).status, 200, 'other IP unaffected');
  clock.t += 60_000;
  assert.equal((await handle(from('198.51.100.1'), 'test-church')).status, 200, 'new window');
});

test('x-forwarded-for first hop is the client key when x-real-ip is absent', async () => {
  const { handle } = harness();
  const viaProxy = (hops) => request(undefined, false, { 'x-forwarded-for': hops });
  assert.equal((await handle(viaProxy('203.0.113.9, 10.0.0.1'), 'test-church')).status, 200);
  assert.equal((await handle(viaProxy('203.0.113.9, 10.0.0.2'), 'test-church')).status, 200);
  assert.equal((await handle(viaProxy('203.0.113.9'), 'test-church')).status, 429);
});

test('per-slug limit applies across IPs', async () => {
  const { handle, counters } = harness({ limits: { ipPerMinute: 100, slugPerHour: 3 } });
  for (let i = 1; i <= 3; i++) assert.equal((await handle(from(`192.0.2.${i}`), 'test-church')).status, 200);
  const limited = await result(await handle(from('192.0.2.50'), 'test-church'));
  assert.equal(limited.status, 429);
  assert.deepEqual(limited.body, { code: 'RATE_LIMITED' });
  assert.equal(counters.resolutions, 3);
});

test('global daily ceiling answers 503 ASSISTANT_UNAVAILABLE without resolver, reader or provider', async () => {
  const { handle, counters, clock } = harness({ limits: { ipPerMinute: 100, globalPerDay: 2 } });
  assert.equal((await handle(from('192.0.2.1'), 'test-church')).status, 200);
  assert.equal((await handle(from('192.0.2.2'), 'test-church')).status, 200);
  for (const ip of ['192.0.2.3', '192.0.2.4']) {
    const over = await result(await handle(from(ip), 'test-church'));
    assert.equal(over.status, 503);
    assert.deepEqual(over.body, { code: 'ASSISTANT_UNAVAILABLE' });
  }
  assert.deepEqual(counters, { resolutions: 2, reads: 2, selects: 2 });
  clock.t += 24 * 60 * 60_000;
  assert.equal((await handle(from('192.0.2.5'), 'test-church')).status, 200, 'next day resets');
});

test('counter store failure fails closed with ASSISTANT_UNAVAILABLE', async () => {
  const broken = {
    increment: async () => { throw new Error('store down'); },
    get: async () => { throw new Error('store down'); },
    set: async () => { throw new Error('store down'); },
  };
  const { handle, counters } = harness({ store: broken });
  const out = await result(await handle(from('192.0.2.1'), 'test-church'));
  assert.equal(out.status, 503);
  assert.deepEqual(out.body, { code: 'ASSISTANT_UNAVAILABLE' });
  assert.equal(counters.resolutions, 0);
});

test('foreign Origin, missing Origin or cross-site Sec-Fetch-Site get 403 before body, resolver and limits', async () => {
  const { handle, counters } = harness({ limits: { ipPerMinute: 1 } });
  const cases = [
    { origin: 'https://evil.example' },
    { origin: 'null' },
    { 'sec-fetch-site': 'cross-site' },
    { 'sec-fetch-site': 'same-site' },
  ];
  for (const headers of cases) {
    const res = await handle(request(undefined, false, { 'x-real-ip': '192.0.2.9', ...headers }), 'test-church');
    assert.deepEqual({ status: res.status, body: await res.json() }, { status: 403, body: { code: 'FORBIDDEN_ORIGIN' } });
  }
  const noOrigin = new Request('https://local.invalid/assistant', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"question":"x","locale":"en"}',
  });
  assert.equal((await handle(noOrigin, 'test-church')).status, 403);
  assert.equal(counters.resolutions, 0);
  // Rejected calls did not spend the IP budget.
  assert.equal((await handle(request(undefined, false, { 'x-real-ip': '192.0.2.9', 'sec-fetch-site': 'same-origin' }), 'test-church')).status, 200);
});

test('Origin matching Host / X-Forwarded-Host is accepted', async () => {
  const { handle } = harness({ limits: { ipPerMinute: 100 } });
  const forwarded = new Request('http://internal:3000/assistant', {
    method: 'POST', body: '{"question":"x","locale":"en"}',
    headers: { origin: 'https://site.example', 'x-forwarded-host': 'site.example', 'x-real-ip': '192.0.2.7' },
  });
  assert.equal((await handle(forwarded, 'test-church')).status, 200);
});

test('identical questions are served from the short cache without new provider calls or quota', async () => {
  const { handle, counters, clock } = harness({ limits: { ipPerMinute: 1, cacheTtlMs: 60_000 } });
  const first = await (await handle(from('192.0.2.1', { question: 'When  is service?', locale: 'en' }), 'test-church')).json();
  const again = await handle(from('192.0.2.1', { question: ' when is SERVICE? ', locale: 'en' }), 'test-church');
  assert.equal(again.status, 200);
  assert.deepEqual(await again.json(), first);
  assert.equal(again.headers.get('cache-control'), 'no-store');
  assert.equal(counters.selects, 1);

  // Different locale is a different entry and does go through the (exhausted) limiter.
  assert.equal((await handle(from('192.0.2.1', { question: 'When is service?', locale: 'pt-BR' }), 'test-church')).status, 429);
  clock.t += 61_000;
  assert.equal((await handle(from('192.0.2.1', { question: 'When is service?', locale: 'en' }), 'test-church')).status, 200);
  assert.equal(counters.selects, 2, 'expired entry calls the provider again');
});

test('limits come from env with safe fallbacks', () => {
  assert.deepEqual(readAssistantProtectionLimits({}), DEFAULT_ASSISTANT_PROTECTION_LIMITS);
  assert.deepEqual(readAssistantProtectionLimits({
    ASSISTANT_RATE_LIMIT_IP_PER_MINUTE: '3', ASSISTANT_RATE_LIMIT_IP_PER_HOUR: 'x',
    ASSISTANT_RATE_LIMIT_SLUG_PER_HOUR: '-1', ASSISTANT_GLOBAL_DAILY_LIMIT: '0',
    ASSISTANT_RESPONSE_CACHE_TTL_SECONDS: '30',
  }), { ...DEFAULT_ASSISTANT_PROTECTION_LIMITS, ipPerMinute: 3, globalPerDay: 0, cacheTtlMs: 30_000 });
});

test('Upstash REST store uses pipelined INCR+PEXPIRE NX, GET and SET PX', async () => {
  const sent = [];
  const store = createUpstashProtectionStore({
    url: 'https://redis.example.invalid/', token: 'synthetic-token',
    fetchImpl: async (url, init) => {
      const commands = JSON.parse(init.body);
      sent.push({ url, auth: new Headers(init.headers).get('authorization'), commands });
      if (commands[0][0] === 'INCR') return json([{ result: 4 }, { result: 1 }]);
      if (commands[0][0] === 'GET') return json([{ result: null }]);
      return json([{ result: 'OK' }]);
    },
  });
  assert.equal(await store.increment('k', 60000), 4);
  assert.equal(await store.get('k'), null);
  await store.set('k', 'v', 1000);
  assert.deepEqual(sent.map((s) => s.commands), [
    [['INCR', 'k'], ['PEXPIRE', 'k', 60000, 'NX']], [['GET', 'k']], [['SET', 'k', 'v', 'PX', 1000]],
  ]);
  assert.ok(sent.every((s) => s.url === 'https://redis.example.invalid/pipeline' && s.auth === 'Bearer synthetic-token'));

  const failing = createUpstashProtectionStore({
    url: 'https://redis.example.invalid', token: 't', fetchImpl: async () => json([{ error: 'ERR' }, { result: 1 }]),
  });
  await assert.rejects(failing.increment('k', 1000));
});

test('untrusted proxy headers cannot mint fresh IP buckets', async () => {
  const { handle } = harness({ trustProxy: false });
  assert.equal((await handle(from('198.51.100.10'), 'test-church')).status, 200);
  assert.equal((await handle(from('198.51.100.11'), 'test-church')).status, 200);
  assert.equal((await handle(from('198.51.100.12'), 'test-church')).status, 429, 'spoofed IPs share one bucket');
});

test('memory store keeps live counters and fails closed when full', async () => {
  const store = createMemoryProtectionStore({ now: () => 0, maxEntries: 3 });
  for (const key of ['a', 'b', 'c']) await store.increment(key, 1000);
  await assert.rejects(store.increment('d', 1000));
  assert.equal(await store.get('a'), '1', 'live counter never evicted');
  assert.equal(await store.increment('a', 1000), 2);
  assert.equal(await store.increment('assistant:rl:global:1:0', 1000), 1, 'global counter always admitted');

  for (const key of ['x', 'y', 'z', 'w']) await store.set(key, key, 1000);
  assert.equal(await store.get('x'), null, 'cache evicts oldest');
  assert.equal(await store.get('w'), 'w');
  assert.equal(await store.get('b'), '1', 'cache writes do not touch counters');
});

test('full counter store makes the endpoint unavailable, not unlimited', async () => {
  const store = createMemoryProtectionStore({ maxEntries: 1 });
  const { handle, counters } = harness({ store });
  assert.equal((await handle(from('198.51.100.20'), 'test-church')).status, 503);
  assert.equal(counters.resolutions, 0);
});

test('real route enforces origin and IP limit before calling the provider', async () => {
  const { POST } = moduleAt('src/app/api/public/churches/slug/[slug]/assistant/route.ts');
  for (const name of Object.keys(process.env)) if (name !== 'PATH') delete process.env[name];
  Object.assign(process.env, env('openai'), {
    VERCEL: '1',
    ASSISTANT_RATE_LIMIT_IP_PER_MINUTE: '1', ASSISTANT_RATE_LIMIT_IP_PER_HOUR: '100',
    ASSISTANT_RATE_LIMIT_SLUG_PER_HOUR: '100000', ASSISTANT_GLOBAL_DAILY_LIMIT: '100000',
    ASSISTANT_RESPONSE_CACHE_TTL_SECONDS: '0',
  });
  state.readChurch = async () => church();
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    if (String(url).includes('/public/assistant-provider')) return json({ provider: 'openai' });
    return json({ status: 'completed', output: [{ type: 'message', role: 'assistant', status: 'completed',
      content: [{ type: 'output_text', text: '{"factIds":["church-name"]}', annotations: [] }] }] });
  };
  const context = () => ({ params: Promise.resolve({ slug: 'test-church' }) });

  const foreign = await POST(request(undefined, false, { origin: 'https://evil.example', 'x-real-ip': '192.0.2.200' }), context());
  assert.equal(foreign.status, 403);
  assert.equal(calls, 0);

  const ip = { 'x-real-ip': '192.0.2.201' };
  assert.equal((await POST(request(undefined, false, ip), context())).status, 200);
  assert.equal(calls, 2);
  const limited = await POST(request(undefined, false, ip), context());
  assert.equal(limited.status, 429);
  assert.deepEqual(await limited.json(), { code: 'RATE_LIMITED' });
  assert.equal(calls, 2, 'no resolver or provider call after the limit');

  process.env.ASSISTANT_GLOBAL_DAILY_LIMIT = '1';
  const capped = await POST(request(undefined, false, { 'x-real-ip': '192.0.2.202' }), context());
  assert.equal(capped.status, 503);
  assert.deepEqual(await capped.json(), { code: 'ASSISTANT_UNAVAILABLE' });
  assert.equal(calls, 2);
});
