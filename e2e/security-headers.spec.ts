import { expect, test } from "@playwright/test";

test("site público publica headers defensivos e CSP em modo report-only", async ({ request }) => {
  const response = await request.get("/");

  expect(response.ok()).toBeTruthy();
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(response.headers()["permissions-policy"]).toContain("camera=()");

  const csp = response.headers()["content-security-policy-report-only"];
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
});

test("BFF público rejeita parâmetros inválidos e devolve correlation id", async ({ request }) => {
  const response = await request.get("/api/public/reverse-geocode?lat=100&lng=-49", {
    headers: { "X-Request-ID": "public-boundary-check-01" },
  });

  expect(response.status()).toBe(400);
  expect(response.headers()["x-request-id"]).toBe("public-boundary-check-01");
  await expect(response.json()).resolves.toMatchObject({
    message: expect.any(String),
  });
});
