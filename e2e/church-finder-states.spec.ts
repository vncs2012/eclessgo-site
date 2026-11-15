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

  test("filtro de dia vai para a API (união dos dias) e lista e mapa são renumerados", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const churches = [
      {
        ...responseChurch("Domingueira"),
        id: "d1",
        slug: "d1",
        distanceKm: 0.4,
        location: { lat: -16.687, lng: -49.265 },
        schedule: [{ day: "SUNDAY", time: "09:00", title: "Culto" }],
      },
      {
        ...responseChurch("Semanal"),
        id: "w1",
        slug: "w1",
        distanceKm: 0.6,
        location: { lat: -16.69, lng: -49.27 },
        schedule: [
          { day: "WEDNESDAY", time: "19:30", title: "Oração" },
          { day: "SATURDAY", time: "18:00", title: "Jovens" },
        ],
      },
      {
        ...responseChurch("Sabatina"),
        id: "s1",
        slug: "s1",
        distanceKm: 0.9,
        location: { lat: -16.7, lng: -49.28 },
        schedule: [{ day: "SATURDAY", time: "16:00", title: "Encontro" }],
      },
    ];
    const requests: Array<{ day: string[]; feature: string[] }> = [];
    await page.route("**/api/public/churches**", async (route) => {
      const params = new URL(route.request().url()).searchParams;
      const day = params.getAll("day");
      requests.push({ day, feature: params.getAll("feature") });
      const data = day.length
        ? churches.filter((church) => church.schedule.some((entry) => day.includes(entry.day)))
        : churches;
      await route.fulfill({ json: { data } });
    });

    await openDirectory(page);
    await page.getByRole("textbox", { name: "Buscar comunidades" }).fill("todas");
    await page.locator('form[role="search"] button[type="submit"]:visible').click();
    await expect(page.getByRole("heading", { name: "3 comunidades" })).toBeVisible();

    const pinTitles = () =>
      page
        .locator(".leaflet-marker-icon[title]")
        .evaluateAll((els) => els.map((el) => el.getAttribute("title")).sort());

    // Sem dia marcado, a contagem é sobre o que foi carregado.
    await expect(page.getByRole("checkbox", { name: /^Sábado/ })).toBeVisible();
    await expect(page.locator("label", { hasText: "Sábado" }).locator("span.font-mono")).toHaveText("2");

    await page.getByRole("checkbox", { name: /^Domingo/ }).check();
    await expect(page.getByRole("heading", { name: "1 comunidade" })).toBeVisible();
    expect(requests.at(-1)).toEqual({ day: ["SUNDAY"], feature: [] });
    await expect.poll(pinTitles).toEqual(["1. Domingueira"]);

    await page.getByRole("checkbox", { name: /^Sábado/ }).check();
    await expect(page.getByRole("heading", { name: "3 comunidades" })).toBeVisible();
    expect(requests.at(-1)).toEqual({ day: ["SATURDAY", "SUNDAY"], feature: [] });
    await expect(page.locator("ol > li h3")).toHaveText(["Domingueira", "Semanal", "Sabatina"]);
    await expect.poll(pinTitles).toEqual(["1. Domingueira", "2. Semanal", "3. Sabatina"]);
    // O horário do dia filtrado vem primeiro no card.
    await expect(page.locator("#finder-result-w1 li").first()).toHaveText("Sábado, 18:00");

    await page.getByRole("checkbox", { name: /^Domingo/ }).uncheck();
    await expect(page.getByRole("heading", { name: "2 comunidades" })).toBeVisible();
    expect(requests.at(-1)).toEqual({ day: ["SATURDAY"], feature: [] });
    await expect.poll(pinTitles).toEqual(["1. Semanal", "2. Sabatina"]);

    await page.getByRole("checkbox", { name: /^Durante a semana/ }).check();
    await expect
      .poll(() => requests.at(-1)?.day)
      .toEqual(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]);
    await expect(page.getByRole("heading", { name: "2 comunidades" })).toBeVisible();
  });

  test("filtro de instalação vai para a API (todas as marcadas) e lista e mapa são renumerados", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const churches = [
      {
        ...responseChurch("Acessível e Libras"),
        id: "a1",
        slug: "a1",
        distanceKm: 0.4,
        location: { lat: -16.687, lng: -49.265 },
        features: ["Bebedouro", "LIBRAS", "ACCESSIBLE_ENTRANCE", "PARKING"],
        updatedAt: "2026-11-03T12:00:00Z",
      },
      {
        ...responseChurch("Só estacionamento"),
        id: "p1",
        slug: "p1",
        distanceKm: 0.6,
        location: { lat: -16.69, lng: -49.27 },
        features: ["PARKING"],
      },
      {
        ...responseChurch("Com crianças"),
        id: "k1",
        slug: "k1",
        distanceKm: 0.9,
        location: { lat: -16.7, lng: -49.28 },
        features: ["KIDS_AREA", "PARKING"],
      },
    ];
    const requests: string[][] = [];
    await page.route("**/api/public/churches**", async (route) => {
      const feature = new URL(route.request().url()).searchParams.getAll("feature");
      requests.push(feature);
      const data = churches.filter((church) => feature.every((code) => church.features.includes(code)));
      await route.fulfill({ json: { data } });
    });

    await openDirectory(page);
    await page.getByRole("textbox", { name: "Buscar comunidades" }).fill("todas");
    await page.locator('form[role="search"] button[type="submit"]:visible').click();
    await expect(page.getByRole("heading", { name: "3 comunidades" })).toBeVisible();

    // Pílulas: códigos traduzidos primeiro, até 3; data de atualização da comunidade.
    await expect(page.locator("#finder-result-a1 ul[aria-label='Para a visita'] li")).toHaveText([
      "Entrada acessível",
      "Libras",
      "Estacionamento",
    ]);
    await expect(page.locator("#finder-result-a1")).toContainText(
      "Atualizada pela comunidade em 03/11",
    );
    await expect(page.locator("#finder-result-p1")).not.toContainText("Atualizada");

    const pinTitles = () =>
      page
        .locator(".leaflet-marker-icon[title]")
        .evaluateAll((els) => els.map((el) => el.getAttribute("title")).sort());

    await page.getByRole("checkbox", { name: /^Estacionamento/ }).check();
    await expect.poll(() => requests.at(-1)).toEqual(["PARKING"]);
    await expect(page.getByRole("heading", { name: "3 comunidades" })).toBeVisible();

    await page.getByRole("checkbox", { name: /^Espaço infantil/ }).check();
    await expect(page.getByRole("heading", { name: "1 comunidade" })).toBeVisible();
    expect(requests.at(-1)).toEqual(["PARKING", "KIDS_AREA"]);
    await expect(page.locator("ol > li h3")).toHaveText(["Com crianças"]);
    await expect.poll(pinTitles).toEqual(["1. Com crianças"]);

    await page.getByRole("button", { name: "Limpar" }).click();
    await expect(page.getByRole("heading", { name: "3 comunidades" })).toBeVisible();
    expect(requests.at(-1)).toEqual([]);
    await expect.poll(pinTitles).toEqual(["1. Acessível e Libras", "2. Só estacionamento", "3. Com crianças"]);
  });

  test("?dia= e ?instalacao= repetidos marcam os filtros e saem na 1ª requisição", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const urls: URL[] = [];
    await page.route("**/api/public/churches**", async (route) => {
      urls.push(new URL(route.request().url()));
      await route.fulfill({
        json: {
          data: [
            {
              ...responseChurch("Filtrada"),
              schedule: [{ day: "SUNDAY", time: "09:00", title: null }],
              features: ["LIBRAS", "PARKING"],
            },
          ],
        },
      });
    });

    await page.goto("/comunidades?dia=SUNDAY&dia=saturday&instalacao=PARKING&instalacao=LIBRAS");
    await expect.poll(() => urls.length).toBeGreaterThan(0);
    expect(urls[0].searchParams.getAll("day")).toEqual(["SATURDAY", "SUNDAY"]);
    expect(urls[0].searchParams.getAll("feature")).toEqual(["PARKING", "LIBRAS"]);
    await expect(page.getByRole("checkbox", { name: /^Domingo/ })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: /^Sábado/ })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: /^Estacionamento/ })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: /^Libras/ })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: /^Durante a semana/ })).not.toBeChecked();
  });

  test("em 390 px os chips Domingo e Acessível filtram pela API", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const requests: Array<{ day: string[]; feature: string[] }> = [];
    await page.route("**/api/public/churches**", async (route) => {
      const params = new URL(route.request().url()).searchParams;
      requests.push({ day: params.getAll("day"), feature: params.getAll("feature") });
      await route.fulfill({ json: { data: [responseChurch("Chip")] } });
    });

    await openDirectory(page);
    const sunday = page.getByRole("button", { name: "Domingo", exact: true });
    await sunday.click();
    await expect(sunday).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => requests.at(-1)).toEqual({ day: ["SUNDAY"], feature: [] });

    const accessible = page.getByRole("button", { name: "Acessível", exact: true });
    await accessible.click();
    await expect(accessible).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() => requests.at(-1))
      .toEqual({ day: ["SUNDAY"], feature: ["ACCESSIBLE_ENTRANCE"] });
    await expect(page.getByRole("button", { name: /Filtros, 2 ativos/ })).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
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

  test("?q= preenche o campo e dispara a busca de texto", async ({ page }) => {
    const searches: Array<string | null> = [];
    await page.route("**/api/public/churches**", async (route) => {
      searches.push(new URL(route.request().url()).searchParams.get("search"));
      await route.fulfill({ json: { data: [responseChurch("Aurora Viva")] } });
    });

    await page.goto("/comunidades?q=Aurora");

    await expect(page.getByRole("textbox", { name: "Buscar comunidades" }).first()).toHaveValue(
      "Aurora",
    );
    await expect(
      page.getByRole("heading", { name: "Aurora Viva", exact: true }).first(),
    ).toBeVisible();
    expect(searches).toContain("Aurora");
    // A URL não ganha nem perde parâmetros por causa da busca.
    expect(new URL(page.url()).search).toBe("?q=Aurora");
  });

  test("?tradicao= repetido marca as tradições no filtro e restringe a lista", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const churches = [
      { ...responseChurch("Batista Um"), id: "b1", slug: "b1", denomination: "BATISTA" },
      { ...responseChurch("Católica Um"), id: "c1", slug: "c1", denomination: "CATOLICA" },
      { ...responseChurch("Espírita Um"), id: "e1", slug: "e1", denomination: "ESPIRITA" },
    ];
    await page.route("**/api/public/churches**", async (route) => {
      await route.fulfill({ json: { data: churches } });
    });

    await page.goto("/comunidades?tradicao=BATISTA&tradicao=CATOLICA");

    await expect(page.getByRole("checkbox", { name: /Batista/ })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: /Católica/ })).toBeChecked();

    // Depois de uma busca, o filtro de tradição continua valendo sobre o resultado.
    await page.getByRole("textbox", { name: "Buscar comunidades" }).fill("todas");
    await page.locator('form[role="search"] button[type="submit"]:visible').click();
    await expect(page.getByRole("heading", { name: "2 comunidades" })).toBeVisible();
    await expect(page.locator("ol > li h3")).toHaveText(["Batista Um", "Católica Um"]);
    await expect(page.getByRole("checkbox", { name: /Espírita/ })).not.toBeChecked();
  });

  test("?localizar=1 aciona 'Usar minha localização' e segue a permissão negada", async ({
    page,
  }) => {
    await page.goto("/comunidades?localizar=1");

    await expect(
      page.getByText("A permissão de localização foi negada.", { exact: true }),
    ).toBeVisible();
  });

  test("?localizar=1 com q prioriza a busca de texto", async ({ page }) => {
    await page.route("**/api/public/churches**", async (route) => {
      await route.fulfill({ json: { data: [responseChurch("Aurora Viva")] } });
    });

    await page.goto("/comunidades?q=Aurora&localizar=1");

    await expect(
      page.getByRole("heading", { name: "Aurora Viva", exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("A permissão de localização foi negada.", { exact: true }),
    ).toHaveCount(0);
  });

  test("o foco por teclado é visível em campo, botões e cards (outline sólido)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route("**/api/public/churches**", async (route) => {
      await route.fulfill({ json: { data: [responseChurch("Foco Um"), { ...responseChurch("Foco Dois"), id: "f2", slug: "f2" }] } });
    });

    await page.goto("/comunidades?q=foco");
    await expect(page.getByRole("heading", { name: "Foco Um", exact: true })).toBeVisible();
    await page.getByRole("textbox", { name: "Buscar comunidades" }).focus();

    const seen = new Set<string>();
    for (let step = 0; step < 40; step += 1) {
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || !el.matches(":focus-visible") || !el.closest("main, form[role=search]")) return null;
        // Checkbox/radio têm contorno no rótulo (has-[:focus-visible]).
        const target = el instanceof HTMLInputElement && el.type !== "text" ? el.closest("label") ?? el : el;
        const targetStyle = getComputedStyle(target);
        return {
          label: `${el.tagName.toLowerCase()} "${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 30) ?? ""}" .${String(el.className).slice(0, 60)}`,
          style: targetStyle.outlineStyle,
          width: targetStyle.outlineWidth,
        };
      });
      if (info) {
        // "auto" é o contorno nativo (ex.: contêiner do mapa); o resto deve ser o nosso, sólido de 2 px.
        expect(["solid", "auto"], `sem contorno de foco em ${info.label}`).toContain(info.style);
        if (info.style === "solid") expect(info.width, info.label).toBe("2px");
        seen.add(info.label);
      }
      await page.keyboard.press("Tab");
    }
    // Campo, "Minha localização", "Atualizar", pins e links dos cards e controles do mapa.
    expect(seen.size).toBeGreaterThanOrEqual(6);
  });

  test("em 390 px o selo 'Ao vivo' fica na mesma linha do nome e não estoura o card", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route("**/api/public/churches**", async (route) => {
      await route.fulfill({
        json: {
          data: [
            {
              ...responseChurch("Comunidade Evangélica Aurora Viva do Setor Central"),
              id: "live1",
              slug: "live1",
              isLive: true,
            },
          ],
        },
      });
    });

    await page.goto("/comunidades?q=aurora");
    const link = page.getByRole("link", { name: /Aurora Viva do Setor Central/ }).first();
    await expect(link).toBeVisible();
    const badge = page.getByRole("img", { name: "Transmitindo ao vivo agora" }).first();
    await expect(badge).toBeVisible();

    const linkBox = await link.boundingBox();
    const badgeBox = await badge.boundingBox();
    if (!linkBox || !badgeBox) throw new Error("sem caixa");
    // O selo alinha com a primeira linha do nome (não cai para a linha de baixo).
    expect(badgeBox.y).toBeLessThan(linkBox.y + 28);
    expect(badgeBox.x).toBeGreaterThan(linkBox.x);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    expect(badgeBox.x + badgeBox.width).toBeLessThanOrEqual(390);
  });
});
