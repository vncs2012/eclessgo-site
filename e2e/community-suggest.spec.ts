import http from "node:http";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/*
 * Página da comunidade (Etapa 3): "Como chegar" com entrada/ônibus/estacionamento, "Quem é quem",
 * duração dos horários e o diálogo "Sugerir correção". O SSR da página lê a API por fetch no servidor,
 * então a spec sobe uma API mínima na porta de `API_BASE_URL` (padrão 127.0.0.1:8000, de .env; mude com
 * E2E_MOCK_API_PORT se o servidor de desenvolvimento usar outra). O POST da sugestão é interceptado no
 * navegador: nenhum dado sai do teste.
 */

const API_PORT = Number(process.env.E2E_MOCK_API_PORT || 8000);
const SLUG = "comunidade-e2e";

const church = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Comunidade E2E",
  slug: SLUG,
  denomination: "EVANGELICA",
  description: "Uma comunidade de teste.",
  address: { street: "Rua Exemplo", number: "123", neighborhood: "Setor Bueno", city: "Goiânia", state: "GO" },
  location: { lat: -16.6869, lng: -49.2648 },
  contact: { whatsapp: "(62) 90000-0000" },
  schedule: [
    { title: "Celebração", day: "SUNDAY", time: "09:00", description: "Com espaço infantil", duration_minutes: 90 },
    { title: "Encontro de oração", day: "WEDNESDAY", time: "19:30", duration_minutes: 45 },
    { title: "Grupos nas casas", day: "TUESDAY", time: "20:00", duration_minutes: 60 },
    { title: "Café", day: "SATURDAY", time: "08:00", duration_minutes: null },
  ],
  directions: {
    entrance: "Pela porta lateral.",
    bus: "Parada a 400 m.",
    parking: "Na rua, sem custo.",
  },
  public_team: [
    { name: "Marcos Souza", role: "Responsável pela comunidade" },
    { name: "Ana", role: "Acolhimento" },
  ],
  features: [],
  photos: [],
  is_live: false,
  member_count: 3,
  plan: "FREE",
  donations_enabled: false,
  updated_at: "2026-11-03T12:00:00Z",
};

const bare = {
  ...church,
  id: "22222222-2222-4222-8222-222222222222",
  slug: "comunidade-simples",
  name: "Comunidade Simples",
  schedule: [{ title: "Culto", day: "SUNDAY", time: "19:00" }],
  directions: null,
  public_team: [],
};

let server: http.Server | null = null;
let serverSkipReason: string | null = null;

test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    res.setHeader("content-type", "application/json");
    const detail = url.pathname.match(/\/churches\/slug\/([^/]+)$/)?.[1];
    if (detail === SLUG) return res.end(JSON.stringify({ data: church }));
    if (detail === bare.slug) return res.end(JSON.stringify({ data: bare }));
    if (url.pathname.endsWith("/churches")) return res.end(JSON.stringify({ data: [], meta: { page: 1, limit: 5, total: 0, total_pages: 1 } }));
    res.statusCode = 404;
    res.end(JSON.stringify({ message: "not found", statusCode: 404 }));
  });
  await new Promise<void>((resolve) => {
    server!.once("error", (error: NodeJS.ErrnoException) => {
      serverSkipReason = `Não foi possível subir a API de teste na porta ${API_PORT}: ${error.code ?? error.message}`;
      server = null;
      resolve();
    });
    server!.listen(API_PORT, "127.0.0.1", () => resolve());
  });
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
});

test.beforeEach(({}, testInfo) => {
  testInfo.skip(serverSkipReason !== null, serverSkipReason ?? "");
});

type Sent = { url: string; body: Record<string, unknown> };

async function openPage(page: Page, slug = SLUG) {
  await page.goto(`/comunidades/${slug}`);
  await expect(page.locator("h1")).toHaveCount(1);
  // O aviso de cookies não deve cobrir os botões testados.
  const consent = page.getByRole("dialog", { name: /aceita o uso de cookies/i });
  if (await consent.isVisible().catch(() => false)) {
    await consent.getByRole("button", { name: "Recusar", exact: true }).click();
  }
}

/** Abre o diálogo pelo link visível do menu (lg+: coluna lateral; abaixo: chip). */
async function openDialog(page: Page) {
  const trigger = page.getByRole("button", { name: "Sugerir correção" }).locator("visible=true").first();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Sugerir correção" });
  await expect(dialog).toBeVisible();
  return { dialog, trigger };
}

test.describe("página da comunidade: campos novos da Etapa 3", () => {
  test("mostra entrada, ônibus, estacionamento, quem é quem e a duração dos horários", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page);

    const directions = page.locator("#como-chegar");
    await expect(directions.getByText("Entrada", { exact: true })).toBeVisible();
    await expect(directions.getByText("Pela porta lateral.")).toBeVisible();
    await expect(directions.getByText("Ônibus", { exact: true })).toBeVisible();
    await expect(directions.getByText("Estacionamento", { exact: true })).toBeVisible();
    await expect(directions.getByText("Na rua, sem custo.")).toBeVisible();

    const people = page.locator("#quem-e-quem");
    await expect(people.getByRole("heading", { name: "Quem é quem" })).toBeVisible();
    await expect(people.getByText("Marcos Souza")).toBeVisible();
    await expect(people.getByText("Acolhimento")).toBeVisible();
    await expect(people.getByText("MS", { exact: true })).toHaveAttribute("aria-hidden", "true");

    const schedule = page.locator("#horarios");
    await expect(schedule.getByText("Cerca de 1h30 · Com espaço infantil")).toBeVisible();
    await expect(schedule.getByText("Cerca de 45 min")).toBeVisible();
    await expect(schedule.getByText("Cerca de 1h", { exact: true })).toBeVisible();
    await expect(schedule.getByText(/Cerca de/)).toHaveCount(3);

    // O resumo do topo não leva a duração.
    await expect(page.getByLabel("Resumo da comunidade")).not.toContainText("Cerca de");
    await expect(page.getByRole("link", { name: "Quem é quem" })).toBeVisible();
  });

  test("sem directions e sem equipe, a seção Quem é quem e os detalhes não aparecem", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page, bare.slug);
    await expect(page.locator("#quem-e-quem")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Quem é quem" })).toHaveCount(0);
    await expect(page.locator("#como-chegar").getByText("Ônibus", { exact: true })).toHaveCount(0);
    await expect(page.locator("#horarios")).not.toContainText("Cerca de");
  });

  test("em en a duração sai como About", async ({ page, context }) => {
    await context.addCookies([{ name: "NEXT_LOCALE", value: "en", url: "http://127.0.0.1" }]);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/comunidades/${SLUG}`);
    await expect(page.locator("#horarios").getByText("About 1h 30min · Com espaço infantil")).toBeVisible();
    await expect(page.getByText("MISSING_MESSAGE")).toHaveCount(0);
  });
});

test.describe("Sugerir correção", () => {
  async function mockSubmit(page: Page, respond: (sent: Sent) => { status: number; headers?: Record<string, string>; body: unknown }) {
    const sent: Sent[] = [];
    await page.route("**/api/public/churches/slug/*/corrections", async (route) => {
      const entry = { url: route.request().url(), body: route.request().postDataJSON() as Record<string, unknown> };
      sent.push(entry);
      const reply = respond(entry);
      await route.fulfill({
        status: reply.status,
        headers: reply.headers,
        contentType: "application/json",
        body: JSON.stringify(reply.body),
      });
    });
    return sent;
  }

  test("abre, prende o foco, fecha no Esc e devolve o foco ao botão", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPage(page);
    const { dialog, trigger } = await openDialog(page);

    // Foco inicial dentro do diálogo; o Tab nunca chega a um elemento da página por trás (ao fim do
    // diálogo o foco vai para a interface do navegador, ou seja, `body`, e volta ao diálogo).
    await expect(dialog.getByRole("radio").first()).toBeFocused();
    for (let index = 0; index < 14; index += 1) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(
        () => document.activeElement === document.body || Boolean(document.activeElement?.closest("dialog[open]")),
      );
      expect(inside, `Tab ${index + 1}`).toBe(true);
    }
    // A isca não é alcançável pelo teclado nem pelos leitores de tela.
    const honeypot = dialog.locator('input[name="homepage"]');
    await expect(honeypot).toHaveAttribute("tabindex", "-1");
    await expect(page.getByRole("textbox", { name: /homepage/i })).toHaveCount(0);
    expect(await honeypot.evaluate((node) => Boolean(node.closest('[aria-hidden="true"]')))).toBe(true);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    // Reabrir começa do zero.
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Sugerir correção" }).getByLabel("O que precisa mudar?")).toHaveValue("");
  });

  test("valida categoria, mensagem (10 a 1000, com contador) e contato antes de enviar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const sent = await mockSubmit(page, () => ({ status: 202, body: { data: { received: true } } }));
    await openPage(page);
    const { dialog } = await openDialog(page);

    await dialog.getByRole("button", { name: "Enviar sugestão" }).click();
    await expect(dialog.getByText("Escolha sobre o que é a sugestão.")).toBeVisible();
    await expect(dialog.getByRole("radio").first()).toBeFocused();

    await dialog.getByRole("radio", { name: "Endereço" }).check({ force: true });
    const message = dialog.getByLabel("O que precisa mudar?");
    await message.fill("curta");
    await expect(dialog.getByText("5/1000")).toBeVisible();
    await dialog.getByRole("button", { name: "Enviar sugestão" }).click();
    await expect(dialog.getByText("Escreva pelo menos 10 caracteres.")).toBeVisible();
    await expect(message).toBeFocused();
    await expect(message).toHaveAttribute("aria-invalid", "true");

    await message.fill("x".repeat(1001));
    await dialog.getByRole("button", { name: "Enviar sugestão" }).click();
    await expect(dialog.getByText("Use no máximo 1000 caracteres.")).toBeVisible();

    await message.fill("A rua mudou de nome.");
    await dialog.getByLabel(/Seu contato/).fill("a".repeat(255));
    await dialog.getByRole("button", { name: "Enviar sugestão" }).click();
    await expect(dialog.getByText("Use no máximo 254 caracteres no contato.")).toBeVisible();
    expect(sent).toHaveLength(0);

    // Aviso de privacidade do contato e acessibilidade do formulário.
    await expect(dialog.getByText("Só a comunidade vê.", { exact: false })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .include("dialog[open]")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"])
      .analyze();
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });

  test("envia o corpo certo, agradece e não deixa o contato na página", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const sent = await mockSubmit(page, () => ({ status: 202, body: { data: { received: true } } }));
    await openPage(page);
    const { dialog, trigger } = await openDialog(page);

    await dialog.getByRole("radio", { name: "Horários" }).check({ force: true });
    await dialog.getByLabel("O que precisa mudar?").fill("  O culto de domingo agora começa às 9h30.  ");
    await dialog.getByLabel(/Seu contato/).fill("ana.visitante@example.org");
    await dialog.getByRole("button", { name: "Enviar sugestão" }).click();

    await expect(dialog.getByText("Obrigado!")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Fechar" }).last()).toBeFocused();
    expect(sent).toHaveLength(1);
    expect(sent[0].url).toContain(`/api/public/churches/slug/${SLUG}/corrections`);
    expect(sent[0].body).toEqual({
      category: "SCHEDULE",
      message: "O culto de domingo agora começa às 9h30.",
      contact: "ana.visitante@example.org",
      homepage: "",
    });

    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    // Nada do que a pessoa digitou fica no site.
    const html = await page.content();
    expect(html).not.toContain("ana.visitante@example.org");
    expect(html).not.toContain("agora começa às 9h30");
  });

  test("sem contato, o corpo não leva contact", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const sent = await mockSubmit(page, () => ({ status: 202, body: { data: { received: true } } }));
    await openPage(page);
    const { dialog } = await openDialog(page);
    await dialog.getByRole("radio", { name: "Outro" }).check({ force: true });
    await dialog.getByLabel("O que precisa mudar?").fill("Falta o telefone fixo da secretaria.");
    await dialog.getByRole("button", { name: "Enviar sugestão" }).click();
    await expect(dialog.getByText("Obrigado!")).toBeVisible();
    expect(sent[0].body).toEqual({ category: "OTHER", message: "Falta o telefone fixo da secretaria.", homepage: "" });
  });

  test("429 mostra 'Muitas sugestões' e mantém o que foi escrito", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockSubmit(page, () => ({
      status: 429,
      headers: { "Retry-After": "120" },
      body: { statusCode: 429, error: "PublicRequestRejected", message: "Too many" },
    }));
    await openPage(page);
    const { dialog } = await openDialog(page);
    await dialog.getByRole("radio", { name: "Contato" }).check({ force: true });
    await dialog.getByLabel("O que precisa mudar?").fill("O e-mail da secretaria mudou.");
    await dialog.getByRole("button", { name: "Enviar sugestão" }).click();
    await expect(dialog.getByRole("alert").filter({ hasText: "Muitas sugestões; tente mais tarde." })).toBeVisible();
    await expect(dialog.getByLabel("O que precisa mudar?")).toHaveValue("O e-mail da secretaria mudou.");
  });

  test("422 do servidor vira erro no campo; erro genérico vira aviso", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    let call = 0;
    await mockSubmit(page, () => {
      call += 1;
      return call === 1
        ? { status: 422, body: { statusCode: 422, error: "ValidationError", message: "x", fields: { message: "messageMin" } } }
        : { status: 500, body: { statusCode: 500, error: "InternalServerError", message: "boom" } };
    });
    await openPage(page);
    const { dialog } = await openDialog(page);
    await dialog.getByRole("radio", { name: "Instalações" }).check({ force: true });
    await dialog.getByLabel("O que precisa mudar?").fill("Agora há elevador no prédio.");
    await dialog.getByRole("button", { name: "Enviar sugestão" }).click();
    await expect(dialog.getByText("Escreva pelo menos 10 caracteres.")).toBeVisible();
    await expect(dialog.getByLabel("O que precisa mudar?")).toBeFocused();

    await dialog.getByRole("button", { name: "Enviar sugestão" }).click();
    await expect(dialog.getByRole("alert").filter({ hasText: "Não foi possível enviar agora. Tente novamente." })).toBeVisible();
  });

  test("no celular o chip abre o diálogo, sem rolagem lateral", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockSubmit(page, () => ({ status: 202, body: { data: { received: true } } }));
    await openPage(page);
    const chip = page.getByRole("navigation", { name: "Nesta página" }).getByRole("button", { name: "Sugerir correção" });
    await chip.scrollIntoViewIfNeeded();
    await chip.click();
    const dialog = page.getByRole("dialog", { name: "Sugerir correção" });
    await expect(dialog).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(chip).toBeFocused();
  });
});
