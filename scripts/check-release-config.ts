import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateReleaseConfig, type ReleaseConfigEnv } from "../src/lib/release-config.ts";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argumentsList = process.argv.slice(2);
const allowLocal = argumentsList.includes("--allow-local");

if (argumentsList.some((argument) => argument !== "--allow-local")) {
  console.error("Uso: npm run check:release-config [-- --allow-local]");
  process.exit(2);
}

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};

  const values: Record<string, string> = {};
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.trim();
    values[key] =
      (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))
        ? value.slice(1, -1)
        : value;
  }
  return values;
}

function loadEnvironment(): ReleaseConfigEnv {
  const environment: ReleaseConfigEnv = { ...process.env };
  for (const fileName of [".env", ".env.local", ".env.production", ".env.production.local", ".env.staging"]) {
    for (const [key, value] of Object.entries(parseEnvFile(resolve(projectRoot, fileName)))) {
      if (environment[key] === undefined) environment[key] = value;
    }
  }
  return environment;
}

const validation = validateReleaseConfig(loadEnvironment(), { strict: !allowLocal });

if (validation.errors.length > 0) {
  const prefix = allowLocal ? "WARN" : "FAIL";
  for (const error of validation.errors) console.error(`${prefix}: ${error}`);
}

if (!allowLocal && validation.errors.length > 0) {
  console.error("Release config inválida. Nenhum valor de ambiente foi impresso.");
  process.exit(1);
}

console.log(
  allowLocal
    ? "OK: release config em modo local permissivo; produção deve usar npm run check:release-config"
    : "OK: release config estrita validada sem expor valores",
);
