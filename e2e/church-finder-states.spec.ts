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

async function toggleLocale(page: Page) {
  const toggle = page.getByRole("button", { name: /Mudar idioma|Change language/ });
  const currentLabel = await toggle.getAttribute("aria-label");
  const nextLabel = currentLabel === "Mudar idioma" ? "Change language" : "Mudar idioma";

  await toggle.click();
  await expect(page.getByRole("button", { name: nextLabel })).toBeVisible();
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

  test("retraduz o status atual ao trocar idioma sem refazer buscas", async ({ page }) => {
    let documentLoads = 0;
    let publicDirectoryRequests = 0;
    page.on("load", () => {
      documentLoads += 1;
    });
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/public/churches") {
        publicDirectoryRequests += 1;
      }
    });

    await page.route("**/api/public/churches**", async (route) => {
      const search = new URL(route.request().url()).searchParams.get("search");
      if (search === "vazio") {
        await route.fulfill({ json: { data: [] } });
        return;
      }
      if (search === "erro") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "upstream-failed" }),
        });
        return;
      }
      await route.fulfill({ json: { data: [responseChurch("Resultado idioma")] } });
    });

    await openDirectory(page);
    const status = page.locator('p[role="status"][aria-live="polite"]');
    const initialPortuguese = await status.textContent();
    expect([
      "Exibindo comunidades públicas do EclessGO a partir da referência de Goiânia.",
      "Nenhuma comunidade com coordenadas válidas foi encontrada nesta área.",
      "Não foi possível carregar o diretório público agora porque a API do EclessGO não respondeu.",
    ]).toContain(initialPortuguese);

    await toggleLocale(page);
    const initialEnglish = await status.textContent();
    expect([
      "Showing EclessGO public communities from the Goiânia reference.",
      "No community with valid coordinates was found in this area.",
      "The public directory could not be loaded because the EclessGO API did not respond.",
    ]).toContain(initialEnglish);
    expect(initialEnglish).not.toBe(initialPortuguese);
    expect(publicDirectoryRequests).toBe(0);

    await toggleLocale(page);
    await expect(status).toHaveText(initialPortuguese ?? "");
    expect(publicDirectoryRequests).toBe(0);

    const search = page.getByRole("textbox", { name: "Buscar comunidades" });
    const submit = page.locator('form button[type="submit"]');

    await search.fill("sucesso");
    await submit.click();
    await expect(status).toHaveText("Diretório público atualizado com base na sua busca.");
    const requestsAfterSearch = publicDirectoryRequests;

    await toggleLocale(page);
    await expect(status).toHaveText("Public directory updated based on your search.");
    expect(publicDirectoryRequests).toBe(requestsAfterSearch);

    await toggleLocale(page);
    await expect(status).toHaveText("Diretório público atualizado com base na sua busca.");
    expect(publicDirectoryRequests).toBe(requestsAfterSearch);

    await search.fill("vazio");
    await submit.click();
    await expect(status).toHaveText("Nenhuma comunidade encontrada para os filtros informados.");

    await toggleLocale(page);
    await expect(status).toHaveText("No community found for the given filters.");
    const requestsAfterEmptySearch = publicDirectoryRequests;

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(status).toHaveText("Filters cleared. Showing published communities near the current reference.");
    expect(publicDirectoryRequests).toBe(requestsAfterEmptySearch + 1);

    await toggleLocale(page);
    await expect(status).toHaveText("Filtros limpos. Exibindo comunidades publicadas próximas da referência atual.");
    const requestsAfterClear = publicDirectoryRequests;

    await search.fill("erro");
    await submit.click();
    await expect(status).toHaveText("Não foi possível aplicar os filtros agora.");

    await toggleLocale(page);
    await expect(status).toHaveText("Could not apply the filters right now.");
    expect(publicDirectoryRequests).toBe(requestsAfterClear + 1);
    expect(documentLoads).toBe(1);
  });
});
