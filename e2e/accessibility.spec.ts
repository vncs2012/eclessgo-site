import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

type AxeViolations = Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"];

const PUBLIC_ROUTES = [
  {
    path: "/",
    heading: /presença digital para comunidades/i,
    // Mapa Leaflet e widget de terceiros; nao avaliamos seu DOM interno.
    exclude: ".leaflet-container",
  },
  {
    path: "/cadastro-igreja",
    heading: /coloque sua comunidade no mapa/i,
  },
] as const;

const WCAG_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22a",
  "wcag22aa",
];

function summarizeViolations(violations: AxeViolations): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .slice(0, 3)
        .map((node) => node.target.join(", "))
        .join(" | ");

      return `${violation.id} (${violation.impact ?? "unknown"}): ${violation.help} -> ${nodes}`;
    })
    .join("\n");
}

test.describe("acessibilidade das páginas públicas (web)", () => {
  test.beforeEach(async ({ page }) => {
    // Sem backend no CI: respondemos as chamadas client-side com payload vazio
    // para evitar ruido de rede; o SSR ja degrada graciosamente via loadError.
    await page.route("**/api/v1/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [], items: [], total: 0 }),
      });
    });
  });

  for (const route of PUBLIC_ROUTES) {
    test(`${route.path} não tem violações WCAG automatizadas`, async ({ page }) => {
      await page.goto(route.path);
      await expect(
        page.getByRole("heading", { name: route.heading }).first(),
      ).toBeVisible();

      let builder = new AxeBuilder({ page }).withTags(WCAG_TAGS);
      if ("exclude" in route && route.exclude) {
        builder = builder.exclude(route.exclude);
      }

      const results = await builder.analyze();

      expect(results.violations, summarizeViolations(results.violations)).toEqual([]);
    });
  }
});
