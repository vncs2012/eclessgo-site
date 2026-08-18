import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "asset-budgets.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const violations = [];
const measured = [];

function filesUnder(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(fullPath) : [fullPath];
  });
}

for (const budget of config.budgets) {
  const directory = path.join(root, budget.path);
  for (const file of filesUnder(directory)) {
    const extension = path.extname(file).toLowerCase();
    if (!budget.extensions.includes(extension)) continue;
    const bytes = fs.statSync(file).size;
    const relativePath = path.relative(root, file);
    measured.push({ path: relativePath, bytes, maxBytes: budget.maxBytes });
    if (bytes > budget.maxBytes) {
      violations.push(`${relativePath}: ${bytes} bytes > ${budget.maxBytes} bytes`);
    }
  }
}

console.log(JSON.stringify({ ok: violations.length === 0, version: config.version, measured }, null, 2));
if (violations.length > 0) {
  console.error("Asset budget exceeded:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
}
