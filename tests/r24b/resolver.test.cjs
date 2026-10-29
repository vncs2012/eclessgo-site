'use strict';
const test = require('node:test');
const { assert, moduleAt, json, env, deferred, timer } = require('./isolation.cjs');
const { resolvePublicInformationAssistant } = moduleAt('src/lib/public-information-assistant-resolver.ts');

test('OFF and invalid flag never call the selection endpoint', async () => {
  for (const enabled of [undefined, 'false', 'TRUE', '1']) {
    let calls = 0;
    const result = await resolvePublicInformationAssistant({
      env: { ASSISTANT_ENABLED: enabled }, fetchSelection: async () => { calls++; return json({ provider: 'openai' }); },
    });
    assert.equal(result.kind, 'not-configured');
    assert.equal(calls, 0);
  }
});

test('only the selected provider requires key, model and positive explicit output limit', async () => {
  for (const provider of ['openai', 'anthropic']) {
    const selected = env(provider);
    const prefix = provider === 'openai' ? 'OPENAI' : 'ANTHROPIC';
    const key = provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY';
    for (const missing of [key, 'ASSISTANT_' + prefix + '_MODEL', 'ASSISTANT_' + prefix + '_MAX_OUTPUT_TOKENS']) {
      const config = { ...selected };
      delete config[missing];
      const result = await resolvePublicInformationAssistant({ env: config, fetchSelection: async () => json({ provider }) });
      assert.equal(result.kind, 'not-configured');
    }
    for (const value of ['0', '-1', 'NaN', '1.5', '9007199254740992']) {
      const config = { ...selected, ['ASSISTANT_' + prefix + '_MAX_OUTPUT_TOKENS']: value };
      const result = await resolvePublicInformationAssistant({ env: config, fetchSelection: async () => json({ provider }) });
      assert.equal(result.kind, 'not-configured');
    }
    const result = await resolvePublicInformationAssistant({ env: selected, fetchSelection: async () => json({ provider }) });
    assert.equal(result.kind, 'ready');
    assert.equal(typeof result.adapter.select, 'function');
  }
  const none = await resolvePublicInformationAssistant({ env: { ASSISTANT_ENABLED: 'true' },
    fetchSelection: async () => json({ provider: null }) });
  assert.equal(none.kind, 'not-configured');
});

test('resolver uses fresh no-store selection without visitor headers and fails closed', async () => {
  let calls = 0;
  const configured = env('openai');
  const responseValues = [
    json({ provider: 'openai' }), json({ provider: 'anthropic' }),
    json({ provider: 'openai', extra: true }), json({ provider: 'other' }),
    json({ provider: 'openai' }, 503), new Response('invalid-json', { status: 200 }),
  ];
  const fetchSelection = async (url, init) => {
    calls++;
    assert.equal(url, 'https://api.example.invalid/api/v1/public/assistant-provider');
    assert.equal(init.method, 'GET');
    assert.equal(init.cache, 'no-store');
    assert.equal(init.redirect, 'error');
    const headers = new Headers(init.headers);
    assert.equal(headers.has('authorization'), false);
    assert.equal(headers.has('cookie'), false);
    assert.equal(headers.has('x-church-id'), false);
    return responseValues.shift();
  };
  assert.equal((await resolvePublicInformationAssistant({ env: configured, fetchSelection })).kind, 'ready');
  assert.equal((await resolvePublicInformationAssistant({ env: configured, fetchSelection })).kind, 'not-configured');
  for (let i = 0; i < 4; i++) {
    assert.equal((await resolvePublicInformationAssistant({ env: configured, fetchSelection })).kind, 'unavailable');
  }
  const failed = await resolvePublicInformationAssistant({ env: configured,
    fetchSelection: async () => { throw new Error('private resolver'); } });
  assert.equal(failed.kind, 'unavailable');
  assert.equal(calls, 6);
});

test('selection timeout aborts and returns unavailable even when the transport ignores the signal', async () => {
  const pending = deferred();
  const clock = timer();
  let signal;
  const operation = resolvePublicInformationAssistant({ env: env('openai'), timer: clock,
    fetchSelection: async (_url, init) => { signal = init.signal; return pending.promise; } });
  await Promise.resolve();
  assert.equal(clock.delay, 8000);
  clock.fire();
  const result = await operation;
  assert.equal(result.kind, 'unavailable');
  assert.equal(signal.aborted, true);
  assert.equal(clock.cleared, true);
});

test('selection timeout covers a stalled response body as well as the initial fetch', async () => {
  const pending = deferred();
  const clock = timer();
  let signal, bodyStarted = false;
  const operation = resolvePublicInformationAssistant({ env: env('openai'), timer: clock,
    fetchSelection: async (_url, init) => {
      signal = init.signal;
      return { ok: true, json: async () => { bodyStarted = true; return pending.promise; } };
    } });
  for (let i = 0; i < 10 && !bodyStarted; i++) await Promise.resolve();
  assert.equal(bodyStarted, true);
  clock.fire();
  assert.equal((await operation).kind, 'unavailable');
  assert.equal(signal.aborted, true);
  assert.equal(clock.cleared, true);
});
