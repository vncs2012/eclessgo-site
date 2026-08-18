import { expect, test } from "@playwright/test";

test.describe("limites do BFF público", () => {
  test("analytics rejeita contrato desconhecido antes do upstream", async ({ request }) => {
    const response = await request.post("/api/public/analytics", {
      headers: { "X-Request-ID": "boundary-analytics-01" },
      data: {
        churchId: "church-1",
        eventType: "UNKNOWN_EVENT",
        source: "WEB_DIRECTORY",
        unexpected: "field",
      },
    });

    expect(response.status()).toBe(422);
    expect(response.headers()["x-request-id"]).toBe("boundary-analytics-01");
    await expect(response.json()).resolves.toMatchObject({
      error: "ValidationError",
    });
  });

  test("cadastro rejeita payload acima do orçamento antes do parse JSON", async ({ request }) => {
    const response = await request.post("/api/public/register-church", {
      headers: { "X-Request-ID": "boundary-register-01" },
      data: JSON.stringify({ oversized: "x".repeat(70 * 1024) }),
    });

    expect(response.status()).toBe(413);
    expect(response.headers()["retry-after"]).toBe("60");
    expect(response.headers()["x-request-id"]).toBe("boundary-register-01");
  });
});
