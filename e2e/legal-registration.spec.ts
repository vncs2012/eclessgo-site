import { expect, test } from "@playwright/test";

test.describe("aceite legal no cadastro web", () => {
  test("publica documentos e mantém o checkbox desmarcado", async ({ page }) => {
    await page.goto("/cadastro-igreja");

    const checkbox = page.getByRole("checkbox");
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();
    const legalFieldset = page.locator("fieldset");
    await expect(legalFieldset.getByRole("link", { name: "Termos de Uso" })).toHaveAttribute("href", "/termos");
    await expect(legalFieldset.getByRole("link", { name: "Política de Privacidade" })).toHaveAttribute(
      "href",
      "/privacidade",
    );
  });

  test("envia as versões legais no payload do cadastro", async ({ page }) => {
    let submittedPayload: Record<string, unknown> | null = null;

    await page.route("**/api/public/register-church", async (route) => {
      submittedPayload = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: { user: { id: "user-e2e" } } }),
      });
    });
    await page.route("**/api/public/register-church/upload", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: { key: "e2e", url: "https://cdn.invalid/e2e" } }),
      });
    });

    await page.goto("/cadastro-igreja");
    await page.getByLabel("Nome do responsável", { exact: true }).fill("Responsável E2E");
    await page.getByLabel("E-mail do responsável", { exact: true }).fill("e2e@example.com");
    await page.getByLabel("Senha de acesso", { exact: true }).fill("Secret123!");
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByLabel("Nome da comunidade", { exact: true }).fill("Comunidade E2E");
    await page.getByLabel("Tradição, linha ou denominação", { exact: true }).fill("BATISTA");
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByLabel("Rua", { exact: true }).fill("Rua E2E");
    await page.getByLabel("Cidade", { exact: true }).fill("Goiânia");
    await page.getByLabel("Estado", { exact: true }).fill("GO");
    await page.getByLabel("Latitude", { exact: true }).fill("-16.6869");
    await page.getByLabel("Longitude", { exact: true }).fill("-49.2648");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Cadastrar minha comunidade" }).click();

    await expect.poll(() => submittedPayload).toMatchObject({
      legal_acceptance: {
        terms_version: "2026-07-12",
        privacy_version: "2026-07-12",
      },
    });
    await expect(page).toHaveURL(/\/cadastro-comunidade\/sucesso/);
  });
});
