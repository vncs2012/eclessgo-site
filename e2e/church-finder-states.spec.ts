import { expect, test, type Page } from "@playwright/test";

function responseChurch(name: string) {
  return {
    id: name.toLowerCase().replaceAll(" ", "-"),
    slug: name.toLowerCase().replaceAll(" ", "-"),
    name,
    denomination: "BATISTA",
    addressLine: `Rua ${name}`,
    city: "Goiânia",
    state: "GO",
    neighborhood: "Centro",
    location: { lat: -16.6869, lng: -49.2648 },
    description: null,
    isLive: false,
    memberCount: 0,
    plan: "BASIC",
    distanceKm: 1,
    thumbnail: null,
  };
}

async function openDirectory(page: Page) {
  await page.goto("/comunidades");
}

test.describe("estados do diretório público", () => {
  test("expõe loading enquanto a busca está pendente", async ({ page }) => {
    let release!: () => void;
    const responseReleased = new Promise<void>((resolve) => {
      release = resolve;
    });

    await page.route("**/api/public/churches**", async (route) => {
      await responseReleased;
      await route.fulfill({ json: { data: [responseChurch("Resultado loading")] } });
    });

    await openDirectory(page);
    await page.getByRole("textbox", { name: "Buscar comunidades" }).fill("loading");
    await page.locator('form button[type="submit"]').click();

    await expect(page.locator('form button[type="submit"]')).toHaveText("Buscando...");
    release();
    await expect(page.getByRole("heading", { name: "Resultado loading", exact: true }).first()).toBeVisible();
  });

  test("exibe mensagem de erro quando a busca falha", async ({ page }) => {
    await page.route("**/api/public/churches**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "upstream-failed" }),
      });
    });

    await openDirectory(page);
    await page.getByRole("textbox", { name: "Buscar comunidades" }).fill("erro");
    await page.locator('form button[type="submit"]').click();

    await expect(page.getByText("Não foi possível aplicar os filtros agora.", { exact: true })).toBeVisible();
  });

  test("exibe empty state quando a busca não encontra comunidades", async ({ page }) => {
    await page.route("**/api/public/churches**", async (route) => {
      await route.fulfill({ json: { data: [] } });
    });

    await openDirectory(page);
    await page.getByRole("textbox", { name: "Buscar comunidades" }).fill("vazio");
    await page.locator('form button[type="submit"]').click();

    await expect(page.getByText("Nenhuma comunidade encontrada para os filtros informados.", { exact: true })).toBeVisible();
  });

  test("trata permissão de localização negada sem alterar o diretório", async ({ page }) => {
    await openDirectory(page);
    await page.getByRole("button", { name: "Minha localização" }).click();

    await expect(page.getByText("A permissão de localização foi negada.", { exact: true })).toBeVisible();
  });
});
