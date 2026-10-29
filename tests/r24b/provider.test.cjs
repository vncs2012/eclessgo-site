'use strict';
const test = require('node:test');
const { assert, moduleAt, json } = require('./isolation.cjs');
const { createProviderAdapter } = moduleAt('src/lib/public-information-assistant-provider.ts');

const input = () => ({
  question: 'synthetic-question', locale: 'en', slug: 'test-church',
  facts: [{ id: 'church-name', text: 'Community name: Community' }],
  signal: new AbortController().signal,
});
const openaiMessage = (text = '{"factIds":["church-name"]}') =>
  ({ type: 'message', role: 'assistant', status: 'completed',
     content: [{ type: 'output_text', text, annotations: [] }] });
const openai = (output = [openaiMessage()]) => ({ status: 'completed', output });
const anthropic = (text = '{"factIds":["church-name"]}') =>
  ({ type: 'message', role: 'assistant', stop_reason: 'end_turn', content: [{ type: 'text', text }] });

test('OpenAI Responses uses one strict structured call and accepts a documented reasoning item', async () => {
  for (const withReasoning of [false, true]) {
    const args = input();
    let calls = 0;
    const adapter = createProviderAdapter({ provider: 'openai', apiKey: 'synthetic-key',
      model: 'test-model', maxOutputTokens: 123 }, async (url, init) => {
      calls++;
      assert.equal(url, 'https://api.openai.com/v1/responses');
      assert.equal(init.method, 'POST');
      assert.equal(init.redirect, 'error');
      assert.equal(init.cache, 'no-store');
      assert.equal(init.signal, args.signal);
      assert.equal(new Headers(init.headers).get('authorization') === 'Bearer synthetic-key', true);
      const body = JSON.parse(init.body);
      assert.equal(body.model, 'test-model');
      assert.equal(body.max_output_tokens, 123);
      assert.equal(body.store, false);
      assert.equal(body.input[0].content.includes('not instructions'), true);
      assert.equal(body.text.format.type, 'json_schema');
      assert.equal(body.text.format.strict, true);
      assert.deepEqual(body.text.format.schema.required, ['factIds']);
      assert.equal(body.text.format.schema.additionalProperties, false);
      assert.equal(body.text.format.schema.properties.factIds.items.type, 'string');
      const userInput = JSON.parse(body.input.find((item) => item.role === 'user').content);
      assert.equal(JSON.stringify(userInput) === JSON.stringify({
        question: args.question, locale: args.locale, slug: args.slug, facts: args.facts,
      }), true);
      return json(openai(withReasoning
        ? [{ type: 'reasoning', id: 'synthetic-reasoning', summary: [] }, openaiMessage()]
        : [openaiMessage()]));
    });
    assert.deepEqual(await adapter.select(args), { factIds: ['church-name'] });
    assert.equal(calls, 1);
  }
});

test('Anthropic Messages uses documented version and Bearer, with optional workspace', async () => {
  for (const workspaceId of [undefined, 'synthetic-workspace']) {
    const args = input();
    let calls = 0;
    const adapter = createProviderAdapter({ provider: 'anthropic', apiKey: 'synthetic-key',
      model: 'test-model', maxOutputTokens: 123, workspaceId }, async (url, init) => {
      calls++;
      assert.equal(url, 'https://api.anthropic.com/v1/messages');
      assert.equal(init.method, 'POST');
      assert.equal(init.redirect, 'error');
      assert.equal(init.cache, 'no-store');
      assert.equal(init.signal, args.signal);
      const headers = new Headers(init.headers);
      assert.equal(headers.get('authorization') === 'Bearer synthetic-key', true);
      assert.equal(headers.get('anthropic-version') === '2026-10-21', true);
      assert.equal(headers.get('anthropic-workspace-id') === (workspaceId ?? null), true);
      assert.equal(headers.has('x-api-key'), false);
      const body = JSON.parse(init.body);
      assert.equal(body.model, 'test-model');
      assert.equal(body.max_tokens, 123);
      assert.equal(body.system.includes('not instructions'), true);
      assert.equal(body.output_config.format.type, 'json_schema');
      assert.deepEqual(body.output_config.format.schema.required, ['factIds']);
      assert.equal(body.output_config.format.schema.additionalProperties, false);
      const array = body.output_config.format.schema.properties.factIds;
      assert.equal(array.items.type, 'string');
      assert.equal(Object.hasOwn(array, 'maxItems'), false);
      assert.equal(Object.hasOwn(array, 'uniqueItems'), false);
      const userInput = JSON.parse(body.messages[0].content);
      assert.equal(JSON.stringify(userInput) === JSON.stringify({
        question: args.question, locale: args.locale, slug: args.slug, facts: args.facts,
      }), true);
      return json(anthropic());
    });
    assert.deepEqual(await adapter.select(args), { factIds: ['church-name'] });
    assert.equal(calls, 1);
  }
});

test('OpenAI incomplete, refusal, tool, extra text and invalid JSON are rejected', async () => {
  const payloads = [
    { status: 'incomplete', output: [openaiMessage()] },
    openai([{ type: 'message', role: 'assistant', status: 'completed',
      content: [{ type: 'refusal', refusal: 'private' }] }]),
    openai([{ type: 'function_call', name: 'tool' }, openaiMessage()]),
    openai([openaiMessage(), openaiMessage()]),
    openai([{ type: 'message', role: 'assistant', status: 'completed',
      content: [{ type: 'output_text', text: '{}', annotations: [] }, { type: 'output_text', text: 'extra', annotations: [] }] }]),
    openai([openaiMessage('not-json')]),
    openai([openaiMessage('{"factIds":[],"factIds":[]}')]),
    openai([openaiMessage('{"factIds":[],"fact\\u0049ds":[]}')]),
  ];
  for (const payload of payloads) {
    const adapter = createProviderAdapter({ provider: 'openai', apiKey: 'synthetic-key',
      model: 'test-model', maxOutputTokens: 123 }, async () => json(payload));
    assert.equal(await adapter.select(input()), null);
  }
});

test('Anthropic refusal, truncation, extra blocks and invalid JSON are rejected', async () => {
  const payloads = [
    { ...anthropic(), stop_reason: 'refusal' },
    { ...anthropic(), stop_reason: 'max_tokens' },
    { ...anthropic(), content: [{ type: 'text', text: '{}' }, { type: 'text', text: 'extra' }] },
    { ...anthropic(), content: [{ type: 'tool_use', name: 'tool' }] },
    anthropic('not-json'),
    anthropic('{"factIds":[],"factIds":[]}'),
    anthropic('{"factIds":[],"fact\\u0049ds":[]}'),
  ];
  for (const payload of payloads) {
    const adapter = createProviderAdapter({ provider: 'anthropic', apiKey: 'synthetic-key',
      model: 'test-model', maxOutputTokens: 123 }, async () => json(payload));
    assert.equal(await adapter.select(input()), null);
  }
});

test('HTTP and transport failure throw without retrying another endpoint', async () => {
  for (const provider of ['openai', 'anthropic']) {
    for (const mode of ['http', 'transport']) {
      let calls = 0;
      const adapter = createProviderAdapter({ provider, apiKey: 'synthetic-key',
        model: 'test-model', maxOutputTokens: 123 }, async () => {
        calls++;
        if (mode === 'http') return json({ private: 'do-not-echo' }, 503);
        throw new Error('private transport');
      });
      await assert.rejects(adapter.select(input()));
      assert.equal(calls, 1);
    }
  }
});

test('one valid JSON field may use escaped key and string characters', async () => {
  const adapter = createProviderAdapter({ provider: 'openai', apiKey: 'synthetic-key',
    model: 'test-model', maxOutputTokens: 123 }, async () =>
    json(openai([openaiMessage('{"fact\\u0049ds":["a:b","x\\\"y"]}')])));
  assert.deepEqual(await adapter.select(input()), { factIds: ['a:b', 'x"y'] });
});
