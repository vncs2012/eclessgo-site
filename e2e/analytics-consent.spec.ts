import { expect, test } from "@playwright/test";

const consentKey = "eclessgo:consent:v1";
const sessionKey = "eclessgo:web:analytics-session";

test.describe("consentimento de analytics", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ consentStorageKey, sessionStorageKey }) => {
      localStorage.removeItem(consentStorageKey);
      localStorage.removeItem(sessionStorageKey);
    }, { consentStorageKey: consentKey, sessionStorageKey: sessionKey });
  });

  test("unknown -> granted não cria id sem um evento e o banner desaparece", async ({ page }) => {
    const analyticsRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/public/analytics")) analyticsRequests.push(request.url());
    });

    await page.goto("/");
    const banner = page.getByRole("dialog", { name: /aceita o uso de cookies/i });
    await expect(banner).toBeVisible();
    expect(await page.evaluate((key) => localStorage.getItem(key), sessionKey)).toBeNull();
    expect(analyticsRequests).toHaveLength(0);

    await banner.getByRole("button", { name: "Aceitar", exact: true }).click();
    await expect(banner).toHaveCount(0);
    expect(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null")?.analytics, consentKey),
    ).toBe("granted");
    expect(await page.evaluate((key) => localStorage.getItem(key), sessionKey)).toBeNull();
    expect(analyticsRequests).toHaveLength(0);
  });

  test("diretório mantém o map view pendente até aceitar e bloqueia o próximo após revogar", async ({ page }) => {
    const firstChurch = {
      id: "church-consent-one",
      slug: "consent-one",
      name: "Comunidade Um",
      denomination: "Comunidade",
      addressLine: "Rua Um, 1",
      city: "Goiânia",
      state: "GO",
      neighborhood: "Centro",
      location: { lat: -16.68, lng: -49.26 },
      description: "",
      isLive: false,
      memberCount: 1,
      plan: "free",
      distanceKm: null,
      thumbnail: null,
    };
    const secondChurch = { ...firstChurch, id: "church-consent-two", slug: "consent-two", name: "Comunidade Dois" };
    const analyticsRequests: string[] = [];

    await page.route("**/api/public/churches?**", async (route) => {
      const url = new URL(route.request().url());
      const data = url.searchParams.get("search")?.includes("dois") ? [secondChurch] : [firstChurch];
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data }) });
    });
    await page.route("**/api/public/analytics", async (route) => {
      analyticsRequests.push(route.request().postData() ?? "");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: {} }),
      });
    });

    await page.goto("/comunidades");
    await page.getByLabel("Buscar comunidades").fill("um");
    await page.getByRole("button", { name: "Atualizar", exact: true }).click();
    await expect(page.locator("article").filter({ hasText: "Comunidade Um" }).first()).toBeVisible();
    await expect.poll(() => analyticsRequests.length).toBe(0);
    expect(await page.evaluate((key) => localStorage.getItem(key), sessionKey)).toBeNull();

    await page.getByRole("dialog", { name: /aceita o uso de cookies/i })
      .getByRole("button", { name: "Aceitar", exact: true })
      .click();
    await expect.poll(() => analyticsRequests.length).toBe(1);
    expect(await page.evaluate((key) => localStorage.getItem(key), sessionKey)).toBeTruthy();

    await page.getByRole("button", { name: "Preferências de privacidade" }).click();
    await page.getByRole("dialog", { name: "Preferências de analytics" })
      .getByRole("button", { name: "Recusar", exact: true })
      .click();
    expect(await page.evaluate((key) => localStorage.getItem(key), sessionKey)).toBeNull();

    await page.getByLabel("Buscar comunidades").fill("dois");
    await page.getByRole("button", { name: "Atualizar", exact: true }).click();
    await expect(page.locator("article").filter({ hasText: "Comunidade Dois" }).first()).toBeVisible();
    await expect.poll(() => analyticsRequests.length).toBe(1);
  });

  test("granted -> denied remove o id e mantém o controle permanente acessível", async ({ page }) => {
    await page.addInitScript(({ consentStorageKey, sessionStorageKey }) => {
      localStorage.setItem(
        consentStorageKey,
        JSON.stringify({ analytics: "granted", decidedAt: new Date().toISOString() }),
      );
      localStorage.setItem(sessionStorageKey, "existing-session");
    }, { consentStorageKey: consentKey, sessionStorageKey: sessionKey });

    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Preferências de privacidade" });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "Preferências de analytics" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Fechar preferências" })).toBeFocused();
    await dialog.getByRole("button", { name: "Recusar", exact: true }).click();
    await expect(page.getByRole("button", { name: "Preferências de privacidade" })).toBeVisible();

    expect(await page.evaluate((key) => localStorage.getItem(key), sessionKey)).toBeNull();
    expect(
      await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null")?.analytics, consentKey),
    ).toBe("denied");
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });

  test("storage Web indisponível falha fechado sem POST ou erro de página", async ({ page }) => {
    await page.addInitScript(({ consentStorageKey, sessionStorageKey }) => {
      localStorage.setItem(
        consentStorageKey,
        JSON.stringify({ analytics: "granted", decidedAt: new Date().toISOString() }),
      );
      localStorage.setItem(sessionStorageKey, "existing-session");

      const unavailable = () => {
        throw new Error("localStorage unavailable");
      };
      Storage.prototype.getItem = unavailable;
      Storage.prototype.setItem = unavailable;
      Storage.prototype.removeItem = unavailable;

      const nativeFetch = window.fetch.bind(window);
      (window as Window & { analyticsPosts?: number }).analyticsPosts = 0;
      window.fetch = async (input, init) => {
        if (String(input).includes("/api/public/analytics")) {
          const target = window as Window & { analyticsPosts?: number };
          target.analyticsPosts = (target.analyticsPosts ?? 0) + 1;
        }
        return nativeFetch(input, init);
      };
    }, { consentStorageKey: consentKey, sessionStorageKey: sessionKey });

    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto("/");
    const banner = page.getByRole("dialog", { name: /aceita o uso de cookies/i });
    await expect(banner).toBeVisible();
    await banner.getByRole("button", { name: "Aceitar", exact: true }).click();
    await expect(banner).toBeVisible();
    expect(await page.evaluate(() => (window as Window & { analyticsPosts?: number }).analyticsPosts)).toBe(0);
    expect(pageErrors).toEqual([]);
  });

  test("beacon envia uma única primeira visita depois de aceitar no mesmo carregamento", async ({ page }) => {
    test.skip(
      process.env.E2E_HEALTHY_API !== "1",
      "O beacon precisa de uma comunidade publicada em uma API saudável; use E2E_HEALTHY_API=1.",
    );

    const slug = process.env.E2E_PUBLIC_CHURCH_SLUG || "igreja-esperanca";
    const analyticsRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/public/analytics")) analyticsRequests.push(request.url());
    });

    await page.goto(`/comunidades/${slug}`);
    expect(await page.evaluate((key) => localStorage.getItem(key), sessionKey)).toBeNull();
    expect(analyticsRequests).toHaveLength(0);

    await page.getByRole("dialog", { name: /aceita o uso de cookies/i })
      .getByRole("button", { name: "Aceitar", exact: true })
      .click();
    await expect.poll(() => analyticsRequests.length).toBe(1);
    expect(await page.evaluate((key) => localStorage.getItem(key), sessionKey)).toBeTruthy();

    const trigger = page.getByRole("button", { name: "Preferências de privacidade" });
    await trigger.click();
    await page.getByRole("dialog", { name: "Preferências de analytics" })
      .getByRole("button", { name: "Recusar", exact: true })
      .click();
    expect(await page.evaluate((key) => localStorage.getItem(key), sessionKey)).toBeNull();
  });
});
