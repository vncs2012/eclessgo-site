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

// Etapa 1a: o botão do cabeçalho diz o idioma atual e o destino.
const LOCALE_TOGGLE_PT = "Idioma: português. Mudar para inglês";
const LOCALE_TOGGLE_EN = "Language: English. Switch to Portuguese";

async function toggleLocale(page: Page) {
  const toggle = page.getByRole("button", {
    name: new RegExp(`${LOCALE_TOGGLE_PT}|${LOCALE_TOGGLE_EN}`),
  });
  const currentLabel = await toggle.getAttribute("aria-label");
  const nextLabel = currentLabel === LOCALE_TOGGLE_PT ? LOCALE_TOGGLE_EN : LOCALE_TOGGLE_PT;

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
    await page.locator('form[role="search"] button[type="submit"]:visible').click();

    await expect(page.locator('form[role="search"] button[type="submit"]:visible')).toHaveText(
      "Buscando...",
    );
    release();
    await expect(
      page.getByRole("heading", { name: "Resultado loading", exact: true }).first(),
    ).toBeVisible();
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
    await page.locator('form[role="search"] button[type="submit"]:visible').click();

    await expect(
      page.getByText("Não foi possível aplicar os filtros agora.", { exact: true }),
    ).toBeVisible();
  });

  test("exibe empty state quando a busca não encontra comunidades", async ({ page }) => {
    await page.route("**/api/public/churches**", async (route) => {
      await route.fulfill({ json: { data: [] } });
    });

    await openDirectory(page);
    await page.getByRole("textbox", { name: "Buscar comunidades" }).fill("vazio");
    await page.locator('form[role="search"] button[type="submit"]:visible').click();

    await expect(
      page.getByText("Nenhuma comunidade encontrada para os filtros informados.", { exact: true }),
    ).toBeVisible();
  });

  test("trata permissão de localização negada sem alterar o diretório", async ({ page }) => {
    await openDirectory(page);
    await page.getByRole("button", { name: "Minha localização" }).click();

    await expect(
      page.getByText("A permissão de localização foi negada.", { exact: true }),
    ).toBeVisible();
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
    const submit = page.locator('form[role="search"] button[type="submit"]:visible');

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
    await expect(status).toHaveText(
      "Filters cleared. Showing published communities near the current reference.",
    );
    expect(publicDirectoryRequests).toBe(requestsAfterEmptySearch + 1);

    await toggleLocale(page);
    await expect(status).toHaveText(
      "Filtros limpos. Exibindo comunidades publicadas próximas da referência atual.",
    );
    const requestsAfterClear = publicDirectoryRequests;

    await search.fill("erro");
    await submit.click();
    await expect(status).toHaveText("Não foi possível aplicar os filtros agora.");

    await toggleLocale(page);
    await expect(status).toHaveText("Could not apply the filters right now.");
    expect(publicDirectoryRequests).toBe(requestsAfterClear + 1);
    expect(documentLoads).toBe(1);
  });

  test("lista e mapa usam os mesmos números, inclusive depois de filtrar", async ({ page }) => {
    const churches = [
      {
        ...responseChurch("Perto Dois"),
        id: "p2",
        slug: "p2",
        distanceKm: 1.5,
        location: { lat: -16.69, lng: -49.27 },
      },
      {
        ...responseChurch("Perto Um"),
        id: "p1",
        slug: "p1",
        distanceKm: 0.4,
        location: { lat: -16.687, lng: -49.265 },
      },
      {
        ...responseChurch("Longe"),
        id: "l1",
        slug: "l1",
        distanceKm: 6,
        location: { lat: -16.73, lng: -49.3 },
      },
    ];
    await page.route("**/api/public/churches**", async (route) => {
      await route.fulfill({ json: { data: churches } });
    });

    await openDirectory(page);
    await page.getByRole("textbox", { name: "Buscar comunidades" }).fill("todas");
    await page.locator('form[role="search"] button[type="submit"]:visible').click();
    await expect(page.getByRole("heading", { name: "3 comunidades" })).toBeVisible();

    const pinTitles = () =>
      page
        .locator(".leaflet-marker-icon[title]")
        .evaluateAll((els) => els.map((el) => el.getAttribute("title")).sort());
    const cardOrder = () => page.locator("ol > li h3").allTextContents();

    await expect(cardOrder()).resolves.toEqual(["Perto Um", "Perto Dois", "Longe"]);
    await expect.poll(pinTitles).toEqual(["1. Perto Um", "2. Perto Dois", "3. Longe"]);

    await page.getByRole("radio", { name: /Aqui perto/ }).check();
    await expect(page.getByRole("heading", { name: "2 comunidades até 2 km" })).toBeVisible();
    await expect.poll(pinTitles).toEqual(["1. Perto Um", "2. Perto Dois"]);

    await page.locator('.leaflet-marker-icon[title="2. Perto Dois"]').click();
    await expect(
      page.getByRole("button", { name: "Destacar 2 no mapa: Perto Dois" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("/igrejas redireciona 301 para /comunidades preservando a query", async ({ request }) => {
    const list = await request.get("/igrejas?q=centro", { maxRedirects: 0 });
    expect(list.status()).toBe(301);
    expect(
      new URL(list.headers().location, "http://x").pathname +
        new URL(list.headers().location, "http://x").search,
    ).toBe("/comunidades?q=centro");

    const detail = await request.get("/igrejas/alguma-comunidade", { maxRedirects: 0 });
    expect(detail.status()).toBe(301);
    expect(new URL(detail.headers().location, "http://x").pathname).toBe(
      "/comunidades/alguma-comunidade",
    );
  });

  test("em 1440 px, arrastar o mapa mostra 'Buscar nesta área' e renumera a partir do novo centro", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const centers: string[] = [];
    await page.route("**/api/public/churches**", async (route) => {
      const url = new URL(route.request().url());
      centers.push(`${url.searchParams.get("lat")},${url.searchParams.get("lng")}`);
      const area = centers.length > 1;
      await route.fulfill({
        json: {
          data: area
            ? [
                { ...responseChurch("Area Um"), id: "a1", slug: "a1", distanceKm: 0.2 },
                {
                  ...responseChurch("Area Dois"),
                  id: "a2",
                  slug: "a2",
                  distanceKm: 0.8,
                  location: { lat: -16.69, lng: -49.27 },
                },
              ]
            : [responseChurch("Inicial")],
        },
      });
    });

    await openDirectory(page);
    await page.getByRole("textbox", { name: "Buscar comunidades" }).fill("x");
    await page.locator('form[role="search"] button[type="submit"]:visible').click();
    await expect(page.getByRole("heading", { name: "Inicial", exact: true })).toBeVisible();

    const searchArea = page.getByRole("button", { name: "Buscar nesta área" });
    await expect(searchArea).toHaveCount(0);

    const box = await page.locator(".leaflet-container").boundingBox();
    if (!box) throw new Error("mapa sem caixa");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 160, box.y + box.height / 2 - 90, { steps: 8 });
    await page.mouse.up();

    await expect(searchArea).toBeVisible();
    await searchArea.click();
    await expect(page.getByRole("heading", { name: "Area Um", exact: true })).toBeVisible();
    expect(centers).toHaveLength(2);
    expect(centers[1]).not.toBe(centers[0]);
    await expect(searchArea).toHaveCount(0);
    await expect
      .poll(() =>
        page
          .locator(".leaflet-marker-icon[title]")
          .evaluateAll((els) => els.map((el) => el.getAttribute("title")).sort()),
      )
      .toEqual(["1. Area Um", "2. Area Dois"]);
  });
});
