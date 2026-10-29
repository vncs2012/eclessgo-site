'use strict';
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');

const blocked = [
  '.specs/evidence/r11-t13/boot-resume/logs/api-serve-ttl15.log',
  'src/api/config.ts',
  'tests/r19b/receipts/tsc-r19b-v1.log',
  'tests/r19b/tsconfig.json',
];
function check(value) {
  if (typeof value !== 'string' && !Buffer.isBuffer(value)) return;
  const p = String(value).replaceAll('\\', '/');
  if (blocked.some((suffix) => p.endsWith(suffix)) || /(^|\/)\.env(?:[./]|$)/.test(p)) {
    throw new Error('protected path');
  }
}
for (const name of ['readFileSync', 'openSync', 'statSync', 'lstatSync', 'realpathSync']) {
  const original = fs[name];
  const wrapped = function (value, ...args) { check(value); return original.call(this, value, ...args); };
  if (original.native) wrapped.native = function (value, ...args) {
    check(value);
    return original.native.call(this, value, ...args);
  };
  fs[name] = wrapped;
}
const deny = () => { throw new Error('network disabled'); };
require('node:net').connect = deny;
require('node:net').createConnection = deny;
require('node:http').request = deny;
require('node:https').request = deny;
globalThis.fetch = deny;
assert.deepEqual(Object.keys(process.env).sort(), ['PATH']);
const scratch = process.argv[2], web = process.argv[3], panel = process.argv[4];
assert.ok(path.isAbsolute(scratch) && path.isAbsolute(web) && path.isAbsolute(panel));
const fromWeb = Module.createRequire(path.join(web, 'package.json'));
const fromPanel = Module.createRequire(path.join(panel, 'package.json'));
const ts = fromWeb('typescript');
const React = fromWeb('react');
const { JSDOM } = fromPanel('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLTextAreaElement', 'Event', 'MouseEvent']) {
  Object.defineProperty(globalThis, name, { configurable: true, value: dom.window[name] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const state = { church: null, churchError: null, resolver: async () => ({ kind: 'not-configured' }),
  resolveCalls: 0, churchCalls: 0, adapterCalls: 0 };
class ApiRequestError extends Error {
  constructor(statusCode) { super('synthetic error'); this.statusCode = statusCode; }
}
class PublicUpstreamTimeoutError extends Error {}
const placeholder = () => null;
const stubs = {
  'next/link': { __esModule: true, default: ({ href, children }) => React.createElement('a', { href }, children) },
  'next/navigation': { notFound: () => { throw new Error('SYNTHETIC_NOT_FOUND'); } },
  'next-intl/server': { getTranslations: async () => (key) => key },
  'lucide-react': Object.fromEntries(['ArrowLeft','Church','HeartHandshake','MapPinned','Radio','ShieldCheck']
    .map((name) => [name, placeholder])),
  '@/components/site/church-contact-card': { ChurchContactCard: placeholder },
  '@/components/site/church-detail-actions': { ChurchDetailActions: placeholder },
  '@/components/site/church-map': { ChurchMap: placeholder },
  '@/components/site/church-public-activities': { ChurchPublicActivities: placeholder },
  '@/components/site/church-profile-sections': {
    ChurchProfileAttributes: placeholder, ChurchProfileLinks: placeholder, ChurchProfileMedia: placeholder,
  },
  '@/components/site/public-analytics-beacon': { PublicAnalyticsBeacon: placeholder },
  '@/components/site/site-footer': { SiteFooter: placeholder },
  '@/components/site/site-header': { SiteHeader: placeholder },
  '@/lib/public-cache': { PUBLIC_CACHE_TTL_SECONDS: { churchStaticParams: 300, churchDetail: 300 } },
  '@/lib/public-bff': { PublicUpstreamTimeoutError },
  '@/lib/public-api': {
    ApiRequestError,
    getPublicChurchBySlug: async () => {
      state.churchCalls++;
      if (state.churchError) throw state.churchError;
      return state.church;
    },
    getPublicChurches: async () => [],
  },
  '@/lib/public-church-profile': { buildPublicChurchProfile: () => ({
    logo: null, cover: null, gallery: [], features: [], links: [],
  }) },
  '@/lib/site-config': { SITE_URL: 'https://site.example.invalid' },
  '@/lib/public-information-assistant-resolver': {
    resolvePublicInformationAssistant: async () => { state.resolveCalls++; return state.resolver(); },
  },
};
const aliases = new Set(['@/components/site/public-information-assistant']);
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  check(request);
  if (Object.hasOwn(stubs, request)) return stubs[request];
  if (request.startsWith('@/')) {
    if (!aliases.has(request)) throw new Error('unlisted alias');
    const target = path.join(scratch, 'src', request.slice(2));
    check(target);
    return originalLoad.call(this, target, parent, isMain);
  }
  if (request.startsWith('.') && parent?.filename) check(path.join(path.dirname(parent.filename), request));
  if (parent?.filename?.startsWith(scratch + path.sep) && !request.startsWith('.') &&
      !path.isAbsolute(request) && !request.startsWith('node:')) {
    return originalLoad.call(this, fromWeb.resolve(request), parent, isMain);
  }
  return originalLoad.call(this, request, parent, isMain);
};
for (const extension of ['.ts', '.tsx']) {
  Module._extensions[extension] = function (module, filename) {
    check(filename);
    if (!filename.startsWith(scratch + path.sep)) throw new Error('source outside scratch');
    const source = fs.readFileSync(filename, 'utf8');
    const output = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    }, fileName: filename }).outputText;
    module._compile(output, filename);
  };
}

const { createRoot } = fromWeb('react-dom/client');
const { NextIntlClientProvider } = fromWeb('next-intl');
function moduleAt(relative) { return require(path.join(scratch, relative)); }
const { PublicInformationAssistant } = moduleAt('src/components/site/public-information-assistant.tsx');
const messages = {};
for (const locale of ['en', 'pt-BR']) {
  messages[locale] = JSON.parse(fs.readFileSync(path.join(scratch, 'src/messages', locale + '.json'), 'utf8'));
}
async function mount({ locale = 'en', slug = 'test-church', available = false } = {}) {
  const node = document.createElement('div');
  document.body.appendChild(node);
  const root = createRoot(node);
  async function render(next) {
    locale = next.locale ?? locale;
    slug = next.slug ?? slug;
    available = next.available ?? available;
    await React.act(async () => root.render(React.createElement(NextIntlClientProvider,
      { locale, messages: messages[locale], timeZone: 'UTC' },
      React.createElement(PublicInformationAssistant, { slug, available }))));
  }
  await render({ locale, slug, available });
  return {
    node, render,
    async flush() { await React.act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); }); },
    async question(value) {
      const element = node.querySelector('textarea');
      await React.act(async () => {
        const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(element, value);
        element.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      });
    },
    async submit() {
      await React.act(async () => node.querySelector('form').dispatchEvent(
        new dom.window.Event('submit', { bubbles: true, cancelable: true })));
    },
    async close() { await React.act(async () => root.unmount()); node.remove(); },
  };
}
function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
function church() {
  return { id: 'synthetic-id', slug: 'test-church', name: 'Community', denomination: '',
    addressLine: '', city: '', state: '', neighborhood: '', description: '', contact: {}, schedule: [],
    location: null, memberCount: 0, plan: '', donationsEnabled: false, pixKey: null,
    isLive: false, features: [], thumbnail: null, photos: [] };
}
module.exports = { assert, React, dom, scratch, state, ApiRequestError, moduleAt, mount, json, deferred, church,
  PublicInformationAssistant };
