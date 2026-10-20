const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const DEFAULT_SOURCE_ROOT = path.resolve(__dirname, "../..");
const SOURCE_IMPORTS = Object.freeze({
  "src/lib/public-information-assistant.ts": Object.freeze([]),
  "src/lib/public-information-assistant-provider.ts": Object.freeze([]),
});

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

module.exports = { loadR24Source, loadT1Modules };
