import { expect, test } from "@playwright/test";

type FinderChurch = {
  id: string;
  slug: string;
  name: string;
  denomination: string;
  addressLine: string;
  city: string;
  state: string;
  neighborhood: string;
  location: { lat: number; lng: number };
  description: null;
  isLive: boolean;
  memberCount: number;
  plan: string;
  distanceKm: number;
  thumbnail: null;
};

function church(name: string, slug: string): FinderChurch {
  return {
    id: slug,
    slug,
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

test.describe("concorrência do diretório público", () => {
  test("descarta a resposta obsoleta quando uma nova busca começa", async ({ page }) => {
    const firstChurch = church("Resultado first", "result-first");
    const secondChurch = church("Resultado second", "result-second");
    const events: string[] = [];

    let releaseFirst!: () => void;
    const firstResponseReleased = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    let firstRequestSeen!: () => void;
    const firstRequest = new Promise<void>((resolve) => {
      firstRequestSeen = resolve;
    });

    await page.route("**/api/public/churches**", async (route) => {
      const search = new URL(route.request().url()).searchParams.get("search");
      events.push(`request:${search}`);

      if (search === "first") {
        firstRequestSeen();
        await firstResponseReleased;
        events.push("response:first");

        try {
          await route.fulfill({ json: { data: [firstChurch] } });
        } catch {
          // O AbortController pode cancelar a rota antes da resposta obsoleta.
        }
        return;
      }

      if (search === "second") {
        events.push("response:second");
        await route.fulfill({ json: { data: [secondChurch] } });
      }
    });

    await page.goto("/comunidades");

    const search = page.getByRole("textbox", { name: "Buscar comunidades" });
    const submit = page.locator('form button[type="submit"]');

    await search.fill("first");
    await submit.click();
    await firstRequest;

    await search.fill("second");
    await submit.click();

    const secondHeading = page.getByRole("heading", { name: "Resultado second", exact: true }).first();
    await expect(secondHeading).toBeVisible();

    const metrics = await page.evaluate(() =>
      performance
        .getEntriesByType("mark")
        .filter((entry) => entry.name.startsWith("eclessgo:public-directory.search"))
        .map((entry) => ({
          name: entry.name,
          detail: (entry as PerformanceEntry & { detail?: unknown }).detail,
        })),
    );

    expect(metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ detail: expect.objectContaining({ operationId: "finder-1", outcome: "aborted" }) }),
        expect.objectContaining({ detail: expect.objectContaining({ operationId: "finder-2", outcome: "success" }) }),
      ]),
    );

    releaseFirst();
    await expect(secondHeading).toBeVisible();
    await expect(page.getByRole("heading", { name: "Resultado first", exact: true })).toHaveCount(0);
    expect(events).toEqual([
      "request:first",
      "request:second",
      "response:second",
      "response:first",
    ]);
  });
});
