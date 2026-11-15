import { expect, test, type Page } from "@playwright/test";

/*
 * Cadastro (Modelo 8), passo "Comunidade": horarios habituais em linhas repetiveis e chips
 * "Para a visita". O BFF e interceptado: o teste confere o corpo enviado (schedule e features).
 */

const documents = {
  data: {
    terms: { key: "terms", version: "2026-08-23", title: "Termos de Uso", url: "/termos", effective_at: "2026-08-23", status: "PUBLISHED" },
    privacy: { key: "privacy", version: "2026-08-24", title: "Política de Privacidade", url: "/privacidade", effective_at: "2026-08-24", status: "PUBLISHED" },
  },
};

async function mockApis(page: Page, onRegister: (body: Record<string, unknown>) => void) {
  await page.route("**/api/public/legal/documents", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(documents) }),
  );
  await page.route("**/api/public/register-church", async (route) => {
    onRegister(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ data: { user: { id: "u" } } }) });
  });
}

async function fillResponsible(page: Page) {
  await page.goto("/cadastro-igreja");
  await page.getByLabel("Nome do responsável", { exact: true }).fill("Responsável E2E");
  await page.getByLabel("E-mail do responsável", { exact: true }).fill("e2e@example.com");
  await page.getByLabel("Senha de acesso", { exact: true }).fill("Secret123!");
  await page.getByRole("button", { name: "Continuar" }).click();
}

async function fillCommunity(page: Page) {
  await page.getByLabel("Nome da comunidade", { exact: true }).fill("Comunidade E2E");
  await page.getByLabel("Tradição", { exact: true }).selectOption("EVANGELICA");
}

async function finish(page: Page) {
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
}

test.describe("horários habituais e instalações no cadastro", () => {
  test("adiciona e remove horários, marca chips e envia schedule e features ao BFF", async ({ page }) => {
    let payload: { church?: Record<string, unknown> } | null = null;
    await mockApis(page, (body) => (payload = body));
    await fillResponsible(page);
    await fillCommunity(page);
    await page.getByLabel("Linha ou denominação").fill("Independente");

    // Adicionar leva o foco ao "Dia" da linha nova.
    const add = page.getByRole("button", { name: "Adicionar horário" });
    await add.click();
    const row1 = page.getByRole("group", { name: "Horário 1" });
    await expect(row1.getByLabel("Dia")).toBeFocused();
    await row1.getByLabel("Horário", { exact: true }).fill("09:00");
    await row1.getByLabel("Tipo de encontro").fill("Celebração");

    await add.click();
    const row2 = page.getByRole("group", { name: "Horário 2" });
    await expect(row2.getByLabel("Dia")).toBeFocused();
    await row2.getByLabel("Dia").selectOption("WEDNESDAY");
    await row2.getByLabel("Horário", { exact: true }).fill("19:30");
    await row2.getByLabel("Tipo de encontro").fill("Encontro de oração");

    await add.click();
    const row3 = page.getByRole("group", { name: "Horário 3" });
    await row3.getByLabel("Horário", { exact: true }).fill("20:00");
    await row3.getByLabel("Tipo de encontro").fill("Linha a remover");

    // A prévia agrupa por dia e mostra as pílulas marcadas.
    await page.getByRole("checkbox", { name: "Libras" }).check();
    await page.getByRole("checkbox", { name: "Estacionamento" }).check();
    await page.getByRole("checkbox", { name: "Berçário" }).check();
    await page.getByRole("checkbox", { name: "Berçário" }).uncheck();
    await expect(page.getByRole("checkbox", { name: "Libras" })).toBeChecked();
    const preview = page.getByRole("complementary", { name: "Prévia da comunidade" });
    await expect(preview.getByText("Domingo, 09:00 e 20:00").first()).toBeVisible();
    await expect(preview.getByText("Quarta, 19:30").first()).toBeVisible();
    await expect(preview.getByText("Evangélica independente").first()).toBeVisible();

    // Remover leva o foco à linha que ocupou o lugar (ou à anterior, se era a última).
    await page.getByRole("button", { name: "Remover horário 3" }).click();
    await expect(page.getByRole("group", { name: "Horário 3" })).toHaveCount(0);
    await expect(row2.getByLabel("Dia")).toBeFocused();
    await page.getByRole("button", { name: "Remover horário 1" }).click();
    await expect(page.getByRole("group", { name: /Horário \d/ })).toHaveCount(1);
    await expect(page.getByRole("group", { name: "Horário 1" }).getByLabel("Dia")).toBeFocused();
    await expect(page.getByRole("group", { name: "Horário 1" }).getByLabel("Tipo de encontro")).toHaveValue("Encontro de oração");

    await finish(page);

    await expect.poll(() => payload).not.toBeNull();
    const church = payload!.church!;
    expect(church.denomination).toBe("Evangélica Independente");
    expect(church.schedule).toEqual([{ title: "Encontro de oração", day: "WEDNESDAY", time: "19:30" }]);
    expect(church.features).toEqual(["LIBRAS", "PARKING"]);
    await expect(page).toHaveURL(/\/cadastro-comunidade\/sucesso/);
  });

  test("sem horários e sem instalações o corpo não leva schedule nem features", async ({ page }) => {
    let payload: { church?: Record<string, unknown> } | null = null;
    await mockApis(page, (body) => (payload = body));
    await fillResponsible(page);
    await fillCommunity(page);
    // Adicionar e remover a única linha volta ao estado sem horários e leva o foco ao botão.
    await page.getByRole("button", { name: "Adicionar horário" }).click();
    await page.getByRole("button", { name: "Remover horário 1" }).click();
    await expect(page.getByRole("button", { name: "Adicionar horário" })).toBeFocused();
    await finish(page);

    await expect.poll(() => payload).not.toBeNull();
    expect(payload!.church).not.toHaveProperty("schedule");
    expect(payload!.church).not.toHaveProperty("features");
    expect(payload!.church!.denomination).toBe("EVANGELICA");
  });

  test("linha incompleta bloqueia o avanço com mensagens por campo", async ({ page }) => {
    await mockApis(page, () => undefined);
    await fillResponsible(page);
    await fillCommunity(page);
    await page.getByRole("button", { name: "Adicionar horário" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    const row = page.getByRole("group", { name: "Horário 1" });
    await expect(row.getByText("Informe o horário (hora e minuto).")).toBeVisible();
    await expect(row.getByText("Diga que tipo de encontro é (ex.: Celebração).")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Sobre a comunidade" })).toBeVisible();
  });

  test("tradição é obrigatória", async ({ page }) => {
    await mockApis(page, () => undefined);
    await fillResponsible(page);
    await page.getByLabel("Nome da comunidade", { exact: true }).fill("Comunidade E2E");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText("Escolha a tradição.")).toBeVisible();
  });

  test("no celular a prévia fica recolhida abaixo do formulário e abre sob demanda", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockApis(page, () => undefined);
    await fillResponsible(page);
    await fillCommunity(page);
    const toggle = page.getByRole("button", { name: "Ver prévia" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText("Assim aparece na busca")).toBeHidden();
    await toggle.click();
    await expect(page.getByText("Assim aparece na busca")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });

  test("o BFF rejeita horário inválido antes de chamar a API", async ({ request }) => {
    const base = {
      legal_acceptance: { terms_version: "1", privacy_version: "1" },
      user: { name: "Responsável", email: "e2e@example.com", password: "Secret123!" },
      church: {
        name: "Comunidade E2E",
        denomination: "BATISTA",
        address: { street: "Rua E2E", city: "Goiânia", state: "GO" },
        location: { lat: -16.68, lng: -49.26 },
      },
    };
    for (const schedule of [
      [{ title: "", day: "SUNDAY", time: "09:00" }],
      [{ title: "Culto", day: "SUNDAY", time: "9h" }],
      [{ title: "Culto", day: "DOMINGO", time: "09:00" }],
      Array.from({ length: 31 }, () => ({ title: "Culto", day: "SUNDAY", time: "09:00" })),
    ]) {
      const response = await request.post("/api/public/register-church", {
        data: { ...base, church: { ...base.church, schedule } },
      });
      expect(response.status()).toBe(422);
    }
  });
});
