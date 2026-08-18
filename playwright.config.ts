import { defineConfig } from "@playwright/test";

const projectRoot = __dirname;
const port = process.env.PLAYWRIGHT_PORT ?? "3101";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
// O desenvolvimento local usa o Chrome instalado; runners CI instalam o
// Chromium gerenciado pelo Playwright e não devem depender de Chrome global.
const browserChannel = process.env.PLAYWRIGHT_CHANNEL ?? (process.env.CI ? undefined : "chrome");
const launchArgs = ["--disable-dev-shm-usage"];

if (process.env.PLAYWRIGHT_DISABLE_GPU === "1") {
  launchArgs.push("--disable-gpu", "--disable-software-rasterizer");
}

const serverCommand = process.env.PLAYWRIGHT_DEV_SERVER === "1"
  ? `cd "${projectRoot}" && npm run dev -- --port ${port} --hostname 127.0.0.1`
  : `cd "${projectRoot}" && npm run start -- -H 127.0.0.1 -p ${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // Um único worker evita iniciar vários Next dev servers/browsers quando o
  // CI executa a11y e E2E no mesmo host. Aumente explicitamente apenas quando
  // houver memória e portas dedicadas disponíveis.
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL,
    // O ambiente de desenvolvimento já fornece Chrome estável; usar o canal
    // instalado evita baixar uma revisão incompatível com a imagem do runner.
    channel: browserChannel,
    trace: "on-first-retry",
    launchOptions: {
      args: launchArgs,
    },
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: serverCommand,
        cwd: projectRoot,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        url: baseURL,
      },
});
