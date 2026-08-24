import { expect, test } from "@playwright/test";

test.describe("aceite legal no cadastro web", () => {
  const publishedDocuments = {
    data: {
      terms: {
        key: "terms",
        version: "2026-08-23",
        title: "Termos de Uso",
        url: "/termos",
        effective_at: "2026-08-23",
        status: "PUBLISHED",
      },
      privacy: {
        key: "privacy",
        version: "2026-08-24",
        title: "Política de Privacidade",
        url: "/privacidade",
        effective_at: "2026-08-24",
        status: "PUBLISHED",
      },
    },
  };

  test("publica documentos e mantém o checkbox desmarcado", async ({ page }) => {
    await page.route("**/api/public/legal/documents", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(publishedDocuments),
      });
    });
    await page.goto("/cadastro-igreja");

    const checkbox = page.getByRole("checkbox");
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeEnabled();
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

    await page.route("**/api/public/legal/documents", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(publishedDocuments),
      });
    });

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
        terms_version: "2026-08-23",
        privacy_version: "2026-08-24",
      },
    });
    await expect(page).toHaveURL(/\/cadastro-comunidade\/sucesso/);
  });

  test("falha fechado quando a API informa documento não publicado", async ({ page }) => {
    await page.route("**/api/public/legal/documents", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            ...publishedDocuments.data,
            terms: { ...publishedDocuments.data.terms, status: "PENDING_APPROVAL" },
          },
        }),
      });
    });

    await page.goto("/cadastro-igreja");
    await expect(page.getByRole("checkbox")).toBeDisabled();
    await expect(page.getByText(/O cadastro fica indisponível até que Termos e Privacidade estejam publicados/)).toBeVisible();
  });

  test("permite retry quando a consulta legal falha", async ({ page }) => {
    let attempts = 0;
    await page.route("**/api/public/legal/documents", async (route) => {
      attempts += 1;
      if (attempts === 1) {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ statusCode: 503, message: "Legal indisponível" }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(publishedDocuments),
      });
    });

    await page.goto("/cadastro-igreja");
    await expect(page.getByText("Legal indisponível")).toBeVisible();
    await page.getByRole("button", { name: "Tentar novamente" }).click();
    await expect(page.getByRole("checkbox")).toBeEnabled();
    expect(attempts).toBe(2);
  });

  test("refaz a consulta e desmarca o aceite após conflito de versão", async ({ page }) => {
    let legalAttempts = 0;
    let registrationAttempts = 0;

    await page.route("**/api/public/legal/documents", async (route) => {
      legalAttempts += 1;
      const documents = legalAttempts === 1
        ? publishedDocuments
        : {
            data: {
              ...publishedDocuments.data,
              terms: { ...publishedDocuments.data.terms, version: "2026-09-01", effective_at: "2026-09-01" },
              privacy: { ...publishedDocuments.data.privacy, version: "2026-09-01", effective_at: "2026-09-01" },
            },
          };
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(documents) });
    });
    await page.route("**/api/public/register-church", async (route) => {
      registrationAttempts += 1;
      if (registrationAttempts === 1) {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            statusCode: 409,
            code: "LEGAL_TERMS_VERSION_INVALID",
            message: "A versão dos Termos de Uso precisa ser atualizada.",
          }),
        });
        return;
      }
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ data: { user: { id: "user-e2e" } } }),
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

    await expect(page.getByRole("checkbox")).not.toBeChecked();
    await expect(page.getByText(/Os documentos legais foram atualizados/)).toBeVisible();
    await expect(page.getByText(/Vigência confirmada\. Termos 2026-09-01/)).toBeVisible();
    expect(legalAttempts).toBe(2);
    expect(registrationAttempts).toBe(1);
  });
});
