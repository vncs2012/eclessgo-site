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
const scratch = process.argv[2];
const web = process.argv[3];
assert.ok(path.isAbsolute(scratch) && path.isAbsolute(web));
const fromWeb = Module.createRequire(path.join(web, 'package.json'));
const ts = fromWeb('typescript');

const state = { readChurch: async () => null, reads: 0 };
class ApiRequestError extends Error {
  constructor(statusCode) { super('synthetic'); this.statusCode = statusCode; }
}
const stubs = {
  'server-only': {},
  '@/lib/site-config': { DEFAULT_API_BASE_URL: 'https://api.example.invalid/api/v1' },
  '@/lib/public-bff': { PUBLIC_UPSTREAM_TIMEOUT_MS: 8000 },
  '@/lib/public-api': {
    ApiRequestError,
    getPublicChurchBySlug: async (...args) => { state.reads++; return state.readChurch(...args); },
  },
};
const aliases = new Set([
  '@/lib/public-information-assistant', '@/lib/public-information-assistant-provider',
  '@/lib/public-information-assistant-resolver', '@/lib/public-assistant-protection',
]);
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
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
    }, fileName: filename }).outputText;
    module._compile(output, filename);
  };
}
function moduleAt(relative) { return require(path.join(scratch, relative)); }
function request(body = { question: 'When?', locale: 'en' }, raw = false, extraHeaders = {}) {
  return new Request('https://local.invalid/assistant', {
    method: 'POST', headers: { 'content-type': 'application/json', 'cookie': 'synthetic-cookie',
      'authorization': 'synthetic-visitor', 'origin': 'https://local.invalid', ...extraHeaders },
    body: raw ? body : JSON.stringify(body),
  });
}
function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
}
function env(provider = 'openai') {
  return provider === 'openai'
    ? { ASSISTANT_ENABLED: 'true', OPENAI_API_KEY: 'synthetic-openai', ASSISTANT_OPENAI_MODEL: 'test-model',
        ASSISTANT_OPENAI_MAX_OUTPUT_TOKENS: '100' }
    : { ASSISTANT_ENABLED: 'true', ANTHROPIC_API_KEY: 'synthetic-anthropic', ASSISTANT_ANTHROPIC_MODEL: 'test-model',
        ASSISTANT_ANTHROPIC_MAX_OUTPUT_TOKENS: '100' };
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}
function timer() {
  let callback;
  let cleared = false;
  return {
    setTimeout(fn, delay) { callback = fn; this.delay = delay; return 1; },
    clearTimeout() { cleared = true; },
    fire() { assert.ok(callback); callback(); },
    get cleared() { return cleared; },
  };
}
function church() {
  return { slug: 'test-church', name: 'Community', description: 'Open to visitors',
    city: 'Town', schedule: ['Sunday'], contact: 'private-contact', members: ['private-member'],
    phone: 'private-phone', donation: 'private-donation', plan: 'private-plan', id: 'private-internal-id' };
}
module.exports = { assert, scratch, state, ApiRequestError, moduleAt, request, json, env, deferred, timer, church };
