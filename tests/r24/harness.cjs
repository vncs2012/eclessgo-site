const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const DEFAULT_SOURCE_ROOT = path.resolve(__dirname, "../..");
const SOURCE_IMPORTS = Object.freeze({
  "src/lib/public-information-assistant.ts": Object.freeze([]),
  "src/lib/public-information-assistant-provider.ts": Object.freeze([]),
  "src/app/api/public/churches/slug/[slug]/assistant/route.ts": Object.freeze([
    "@/lib/public-api",
    "@/lib/public-information-assistant",
    "@/lib/public-information-assistant-provider",
  ]),
  "src/components/site/public-information-assistant.tsx": Object.freeze([
    "react",
    "react/jsx-runtime",
    "next-intl",
  ]),
});

const PUBLIC_API_IMPORT = "@/lib/public-api";
const ASSISTANT_IMPORT = "@/lib/public-information-assistant";
const PROVIDER_IMPORT = "@/lib/public-information-assistant-provider";
const ROUTE_SOURCE = "src/app/api/public/churches/slug/[slug]/assistant/route.ts";
const COMPONENT_SOURCE = "src/components/site/public-information-assistant.tsx";
const PAGE_SOURCE = "src/app/igrejas/[slug]/page.tsx";
const ALIAS_PAGE_SOURCE = "src/app/comunidades/[slug]/page.tsx";
const MESSAGE_SOURCES = Object.freeze({
  "pt-BR": "src/messages/pt-BR.json",
  en: "src/messages/en.json",
});

function readWhitelistedText(relativeSource, selectedRoot) {
  const root = path.resolve(selectedRoot || DEFAULT_SOURCE_ROOT);
  const sourcePath = path.resolve(root, relativeSource);
  const relativePath = path.relative(root, sourcePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("R24 source escaped the selected root");
  }
  const realRoot = fs.realpathSync(root);
  const realSourcePath = fs.realpathSync(sourcePath);
  const realRelativePath = path.relative(realRoot, realSourcePath);
  if (realRelativePath.startsWith("..") || path.isAbsolute(realRelativePath)) {
    throw new Error("R24 source resolved outside the selected root");
  }
  return fs.readFileSync(realSourcePath, "utf8");
}

function loadR24Messages(options = {}) {
  return Object.fromEntries(Object.entries(MESSAGE_SOURCES).map(([locale, relativeSource]) => [
    locale,
    JSON.parse(readWhitelistedText(relativeSource, options.root)),
  ]));
}

function readR24PageSource(options = {}) {
  return readWhitelistedText(PAGE_SOURCE, options.root);
}

function readR24AliasPageSource(options = {}) {
  return readWhitelistedText(ALIAS_PAGE_SOURCE, options.root);
}

function loadR24Source(relativeSource, options = {}) {
  const allowedImports = SOURCE_IMPORTS[relativeSource];
  if (!allowedImports) throw new Error(`R24 source is not allowlisted: ${relativeSource}`);

  const root = path.resolve(options.root || DEFAULT_SOURCE_ROOT);
  const sourcePath = path.resolve(root, relativeSource);
  const relativePath = path.relative(root, sourcePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("R24 source escaped the selected root");
  }
  const realRoot = fs.realpathSync(root);
  const realSourcePath = fs.realpathSync(sourcePath);
  const realRelativePath = path.relative(realRoot, realSourcePath);
  if (realRelativePath.startsWith("..") || path.isAbsolute(realRelativePath)) {
    throw new Error("R24 source resolved outside the selected root");
  }

  const mocks = options.mocks || Object.create(null);
  for (const importName of Object.keys(mocks)) {
    if (!allowedImports.includes(importName)) {
      throw new Error(`R24 import mock is not allowlisted: ${importName}`);
    }
  }

  const source = fs.readFileSync(realSourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      strict: true,
      ...(relativeSource.endsWith(".tsx") ? { jsx: ts.JsxEmit.ReactJSX } : {}),
    },
    reportDiagnostics: true,
  });
  const syntaxErrors = (transpiled.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (syntaxErrors.length > 0) {
    throw new Error(`R24 TypeScript syntax errors: ${syntaxErrors.map((item) => item.code).join(",")}`);
  }

  const blockedConsole = Object.freeze({
    log() { throw new Error("Console access is blocked in the R24 source sandbox"); },
    warn() { throw new Error("Console access is blocked in the R24 source sandbox"); },
    error() { throw new Error("Console access is blocked in the R24 source sandbox"); },
  });
  const context = vm.createContext({
    AbortController,
    Request,
    Response,
    TextDecoder,
    clearTimeout,
    console: blockedConsole,
    fetch: options.fetch,
    setTimeout,
  });
  const module = { exports: {} };
  const guardedRequire = (importName) => {
    if (!allowedImports.includes(importName) || !Object.prototype.hasOwnProperty.call(mocks, importName)) {
      throw new Error(`R24 import is blocked: ${importName}`);
    }
    return mocks[importName];
  };
  const executeModule = vm.runInContext(
    `(function(exports, require, module, __filename, __dirname) { ${transpiled.outputText}\n})`,
    context,
    { filename: realSourcePath },
  );
  executeModule(module.exports, guardedRequire, module, realSourcePath, path.dirname(realSourcePath));
  return module.exports;
}

function loadT1Modules(options = {}) {
  return {
    assistant: loadR24Source("src/lib/public-information-assistant.ts", options),
    provider: loadR24Source("src/lib/public-information-assistant-provider.ts", options),
  };
}

function loadT2Route(options = {}) {
  const requestedMocks = options.mocks || Object.create(null);
  const allowedMocks = new Set([PUBLIC_API_IMPORT, ASSISTANT_IMPORT, PROVIDER_IMPORT]);
  for (const importName of Object.keys(requestedMocks)) {
    if (!allowedMocks.has(importName)) {
      throw new Error(`R24 route mock is not allowlisted: ${importName}`);
    }
  }
  if (!Object.prototype.hasOwnProperty.call(requestedMocks, PUBLIC_API_IMPORT)) {
    throw new Error("R24 route requires a public-api mock");
  }
  const publicApiMock = requestedMocks[PUBLIC_API_IMPORT];
  if (
    !publicApiMock ||
    typeof publicApiMock.getPublicChurchBySlug !== "function" ||
    typeof publicApiMock.ApiRequestError !== "function"
  ) {
    throw new Error("R24 route public-api mock has an invalid shape");
  }

  const sourceOptions = options.root ? { root: options.root } : {};
  const ownModules = loadT1Modules(sourceOptions);
  const assistantModule = Object.prototype.hasOwnProperty.call(requestedMocks, ASSISTANT_IMPORT)
    ? requestedMocks[ASSISTANT_IMPORT]
    : ownModules.assistant;
  const providerModule = Object.prototype.hasOwnProperty.call(requestedMocks, PROVIDER_IMPORT)
    ? requestedMocks[PROVIDER_IMPORT]
    : ownModules.provider;
  if (!assistantModule || typeof assistantModule.createPublicInformationAssistantHandler !== "function") {
    throw new Error("R24 route assistant module has an invalid shape");
  }
  if (
    !providerModule ||
    !Object.prototype.hasOwnProperty.call(providerModule, "publicInformationAssistantProvider")
  ) {
    throw new Error("R24 route provider module has an invalid shape");
  }

  const mocks = Object.create(null);
  mocks[PUBLIC_API_IMPORT] = publicApiMock;
  mocks[ASSISTANT_IMPORT] = assistantModule;
  mocks[PROVIDER_IMPORT] = providerModule;

  return loadR24Source(ROUTE_SOURCE, { ...sourceOptions, mocks });
}

function loadR24Component(options = {}) {
  if (typeof options.fetch !== "function") {
    throw new Error("R24 component requires an explicit fetch stub");
  }
  if (
    !options.nextIntl ||
    typeof options.nextIntl.useLocale !== "function" ||
    typeof options.nextIntl.useTranslations !== "function"
  ) {
    throw new Error("R24 component requires a synthetic next-intl module");
  }

  const mocks = Object.create(null);
  mocks.react = require("react");
  mocks["react/jsx-runtime"] = require("react/jsx-runtime");
  mocks["next-intl"] = options.nextIntl;

  return loadR24Source(COMPONENT_SOURCE, {
    root: options.root,
    mocks,
    fetch: options.fetch,
  });
}

module.exports = {
  loadR24Source,
  loadT1Modules,
  loadT2Route,
  loadR24Messages,
  readR24PageSource,
  readR24AliasPageSource,
  loadR24Component,
};
