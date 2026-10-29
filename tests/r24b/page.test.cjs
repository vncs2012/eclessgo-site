'use strict';
const test = require('node:test');
const { assert, React, state, ApiRequestError, moduleAt, church, PublicInformationAssistant } = require('./ui-isolation.cjs');
const pageModule = moduleAt('src/app/igrejas/[slug]/page.tsx');
const ChurchDetailPage = pageModule.default;
const CommunityDetailPage = moduleAt('src/app/comunidades/[slug]/page.tsx').default;

function props() { return { params: Promise.resolve({ slug: 'test-church' }) }; }
function assistantElement(value) {
  if (Array.isArray(value)) {
    for (const child of value) { const found = assistantElement(child); if (found) return found; }
    return null;
  }
  if (!React.isValidElement(value)) return null;
  if (value.type === PublicInformationAssistant) return value;
  return assistantElement(value.props.children);
}
function reset() {
  state.church = church();
  state.churchError = null;
  state.churchCalls = 0;
  state.resolveCalls = 0;
  state.adapterCalls = 0;
}

test('server page resolves once after valid detail and sends only slug plus boolean', async () => {
  reset();
  state.resolver = async () => ({ kind: 'ready', adapter: { select() { state.adapterCalls++; } },
    syntheticConfig: 'do-not-serialize' });
  const tree = await ChurchDetailPage(props());
  const assistant = assistantElement(tree);
  assert.ok(assistant);
  assert.deepEqual(assistant.props, { slug: 'test-church', available: true });
  assert.equal(state.churchCalls, 1);
  assert.equal(state.resolveCalls, 1);
  assert.equal(state.adapterCalls, 0);
  assert.equal(JSON.stringify(assistant.props).includes('do-not-serialize'), false);
});

test('not configured, unavailable and resolver exceptions become false without echo', async () => {
  for (const resolver of [
    async () => ({ kind: 'not-configured' }),
    async () => ({ kind: 'unavailable' }),
    async () => { throw new Error('private resolver detail'); },
  ]) {
    reset();
    state.resolver = resolver;
    const assistant = assistantElement(await ChurchDetailPage(props()));
    assert.deepEqual(assistant.props, { slug: 'test-church', available: false });
    assert.equal(state.resolveCalls, 1);
    assert.equal(state.adapterCalls, 0);
  }
});

test('metadata, static params, missing and 404 detail never resolve availability', async () => {
  reset();
  state.resolver = async () => { throw new Error('must not resolve'); };
  const metadata = await pageModule.generateMetadata(props());
  assert.ok(metadata.title);
  await pageModule.generateStaticParams();
  assert.equal(state.resolveCalls, 0);
  state.church = null;
  await ChurchDetailPage(props());
  assert.equal(state.resolveCalls, 0);
  state.churchError = new ApiRequestError(404);
  await assert.rejects(ChurchDetailPage(props()), /SYNTHETIC_NOT_FOUND/);
  assert.equal(state.resolveCalls, 0);
});

test('community alias delegates to the same page and one availability check', async () => {
  reset();
  state.resolver = async () => ({ kind: 'ready', adapter: { select() { state.adapterCalls++; } } });
  const alias = await CommunityDetailPage(props());
  assert.equal(alias.type, ChurchDetailPage);
  const assistant = assistantElement(await alias.type(alias.props));
  assert.deepEqual(assistant.props, { slug: 'test-church', available: true });
  assert.equal(state.resolveCalls, 1);
  assert.equal(state.adapterCalls, 0);
});
