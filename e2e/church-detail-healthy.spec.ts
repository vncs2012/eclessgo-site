import { expect, test } from "@playwright/test";

const slug = process.env.E2E_PUBLIC_CHURCH_SLUG || "igreja-esperanca";
const apiBaseUrl = process.env.E2E_API_BASE_URL || "http://127.0.0.1:8000/api/v1";
const apiHealthUrl = process.env.E2E_API_HEALTH_URL || "http://127.0.0.1:8000/health";

test("renderiza o detalhe público completo contra uma API saudável", async ({ page, request }) => {
  test.skip(
    process.env.E2E_HEALTHY_API !== "1",
    "Smoke saudável exige E2E_HEALTHY_API=1 e uma API local/staging disponível.",
  );

  const health = await request.get(apiHealthUrl);
  expect(health.ok(), `API não saudável em ${apiHealthUrl}`).toBeTruthy();

  const upstream = await request.get(`${apiBaseUrl}/churches/slug/${slug}`);
  expect(upstream.ok(), `Comunidade ${slug} não está publicada no ambiente do smoke`).toBeTruthy();
  const payload = (await upstream.json()) as { data: { name: string } };

  await page.goto(`/comunidades/${slug}`);

  await expect(page).toHaveTitle(new RegExp(payload.data.name));
  await expect(page.getByRole("heading", { name: payload.data.name, exact: true }).first()).toBeVisible();
  await expect(page.locator("main")).toContainText(payload.data.name);
});
