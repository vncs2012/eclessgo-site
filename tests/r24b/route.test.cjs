'use strict';
const test = require('node:test');
const { assert, moduleAt, state, request, json, env, church } = require('./isolation.cjs');
const { POST } = moduleAt('src/app/api/public/churches/slug/[slug]/assistant/route.ts');

function configure(provider) {
  for (const name of [
    'ASSISTANT_ENABLED','OPENAI_API_KEY','ASSISTANT_OPENAI_MODEL','ASSISTANT_OPENAI_MAX_OUTPUT_TOKENS',
    'ANTHROPIC_API_KEY','ASSISTANT_ANTHROPIC_MODEL','ASSISTANT_ANTHROPIC_MAX_OUTPUT_TOKENS',
    'ASSISTANT_ANTHROPIC_WORKSPACE_ID',
  ]) delete process.env[name];
  Object.assign(process.env, env(provider));
}
const context = () => ({ params: Promise.resolve({ slug: 'test-church' }) });
async function output(response) {
  return { status: response.status, body: await response.json(), cache: response.headers.get('cache-control') };
}

test('real route resolves and calls only the selected provider without visitor headers', async () => {
  for (const provider of ['openai', 'anthropic']) {
    configure(provider);
    state.reads = 0;
    state.readChurch = async (slug, options) => {
      assert.equal(slug, 'test-church');
      assert.equal(options.cache, 'no-store');
      return church();
    };
    const calls = [];
    globalThis.fetch = async (url, init) => {
      calls.push(String(url));
      const headers = new Headers(init.headers);
      if (String(url).includes('/public/assistant-provider')) {
        assert.equal(headers.has('authorization'), false);
        assert.equal(headers.has('cookie'), false);
        assert.equal(init.cache, 'no-store');
        return json({ provider });
      }
      assert.equal(headers.has('cookie'), false);
      assert.equal(headers.get('authorization') === 'synthetic-visitor', false);
      if (provider === 'openai') return json({ status: 'completed', output: [
        { type: 'reasoning', id: 'synthetic', summary: [] },
        { type: 'message', role: 'assistant', status: 'completed', content: [
          { type: 'output_text', text: '{"factIds":["church-name"]}', annotations: [] },
        ] },
      ] });
      return json({ type: 'message', role: 'assistant', stop_reason: 'end_turn',
        content: [{ type: 'text', text: '{"factIds":["church-name"]}' }] });
    };
    assert.deepEqual(await output(await POST(request(), context())), {
      status: 200, cache: 'no-store', body: { slug: 'test-church', status: 'answered',
        answer: ['Community name: Community'], sources: [{ factId: 'church-name', href: '/comunidades/test-church' }] },
    });
    assert.equal(state.reads, 1);
    assert.equal(calls.length, 2);
    assert.equal(calls[1], provider === 'openai' ? 'https://api.openai.com/v1/responses' : 'https://api.anthropic.com/v1/messages');
  }
});

test('route keeps OFF and resolver failures ahead of public reader', async () => {
  configure('openai');
  delete process.env.ASSISTANT_ENABLED;
  let calls = 0;
  state.reads = 0;
  globalThis.fetch = async () => { calls++; throw new Error('private network'); };
  assert.deepEqual(await output(await POST(request(), context())),
    { status: 503, body: { code: 'ASSISTANT_NOT_CONFIGURED' }, cache: 'no-store' });
  assert.equal(calls, 0);
  assert.equal(state.reads, 0);
  process.env.ASSISTANT_ENABLED = 'true';
  assert.deepEqual(await output(await POST(request(), context())),
    { status: 503, body: { code: 'ASSISTANT_UNAVAILABLE' }, cache: 'no-store' });
  assert.equal(calls, 1);
  assert.equal(state.reads, 0);
});

test('selected provider failure does not invoke the other provider', async () => {
  configure('openai');
  state.reads = 0;
  state.readChurch = async () => church();
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes('/public/assistant-provider')) return json({ provider: 'openai' });
    if (String(url).includes('api.openai.com')) return json({ private: 'do-not-echo' }, 503);
    throw new Error('other provider was called');
  };
  assert.deepEqual(await output(await POST(request(), context())),
    { status: 503, body: { code: 'ASSISTANT_UNAVAILABLE' }, cache: 'no-store' });
  assert.equal(state.reads, 1);
  assert.equal(calls.length, 2);
  assert.equal(calls.some((url) => url.includes('api.anthropic.com')), false);
});

test('missing selected configuration or invalid selection response stops before reader', async () => {
  configure('openai');
  delete process.env.ASSISTANT_OPENAI_MODEL;
  state.reads = 0;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return json({ provider: 'openai' }); };
  assert.deepEqual(await output(await POST(request(), context())),
    { status: 503, body: { code: 'ASSISTANT_NOT_CONFIGURED' }, cache: 'no-store' });
  assert.equal(calls, 1);
  assert.equal(state.reads, 0);

  configure('openai');
  globalThis.fetch = async () => json({ provider: 'openai', extra: 'invalid' });
  assert.deepEqual(await output(await POST(request(), context())),
    { status: 503, body: { code: 'ASSISTANT_UNAVAILABLE' }, cache: 'no-store' });
  assert.equal(state.reads, 0);
});

test('both providers return 502 for refusal, truncation or duplicate keys instead of false no_information', async () => {
  for (const provider of ['openai', 'anthropic']) {
    for (const mode of ['refusal', 'truncated', 'duplicate', 'escaped-duplicate']) {
      configure(provider);
      state.reads = 0;
      state.readChurch = async () => church();
      let providerCalls = 0;
      globalThis.fetch = async (url) => {
        if (String(url).includes('/public/assistant-provider')) return json({ provider });
        providerCalls++;
        if (provider === 'openai') {
          return json(mode === 'truncated'
            ? { status: 'incomplete', output: [] }
            : { status: 'completed', output: [{ type: 'message', role: 'assistant', status: 'completed',
                content: [mode === 'refusal' ? { type: 'refusal', refusal: 'do-not-echo' }
                  : { type: 'output_text', text: mode === 'duplicate' ? '{"factIds":[],"factIds":[]}'
                    : '{"factIds":[],"fact\\u0049ds":[]}', annotations: [] }] }] });
        }
        return json({ type: 'message', role: 'assistant',
          stop_reason: mode === 'refusal' ? 'refusal' : mode === 'truncated' ? 'max_tokens' : 'end_turn',
          content: [{ type: 'text', text: mode === 'duplicate' ? '{"factIds":[],"factIds":[]}'
            : mode === 'escaped-duplicate' ? '{"factIds":[],"fact\\u0049ds":[]}' : 'do-not-echo' }] });
      };
      assert.deepEqual(await output(await POST(request(), context())),
        { status: 502, body: { code: 'INVALID_PROVIDER_RESPONSE' }, cache: 'no-store' });
      assert.equal(providerCalls, 1);
      assert.equal(state.reads, 1);
    }
  }
});

test('Anthropic transport failure never tries OpenAI', async () => {
  configure('anthropic');
  state.reads = 0;
  state.readChurch = async () => church();
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes('/public/assistant-provider')) return json({ provider: 'anthropic' });
    throw new Error('private transport');
  };
  assert.deepEqual(await output(await POST(request(), context())),
    { status: 503, body: { code: 'ASSISTANT_UNAVAILABLE' }, cache: 'no-store' });
  assert.equal(calls.length, 2);
  assert.equal(calls.some((url) => url.includes('api.openai.com')), false);
});
