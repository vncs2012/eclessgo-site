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

  test("diretório rejeita dia ou instalação fora do vocabulário antes do upstream", async ({
    request,
  }) => {
    for (const query of ["day=FUNDAY", "feature=PISCINA", "day=SUNDAY&feature=parking"]) {
      const response = await request.get(`/api/public/churches?${query}`);
      expect(response.status(), query).toBe(400);
    }
  });

  test("sugestão de correção valida o corpo e o slug antes do upstream", async ({ request }) => {
    const url = "/api/public/churches/slug/comunidade-e2e/corrections";
    const valid = { category: "SCHEDULE", message: "O culto agora começa às 9h30." };

    const short = await request.post(url, {
      headers: { "X-Request-ID": "boundary-correction-01" },
      data: { ...valid, message: "curta" },
    });
    expect(short.status()).toBe(422);
    expect(short.headers()["x-request-id"]).toBe("boundary-correction-01");
    await expect(short.json()).resolves.toMatchObject({
      error: "ValidationError",
      fields: { message: "messageMin" },
    });

    for (const data of [
      { ...valid, category: "OUTRA" },
      { ...valid, contact: "a".repeat(255) },
      { ...valid, unexpected: "field" },
    ]) {
      expect((await request.post(url, { data })).status(), JSON.stringify(data).slice(0, 40)).toBe(422);
    }
    expect((await request.post(url, { data: "{nao e json", headers: { "Content-Type": "application/json" } })).status()).toBe(422);

    const badSlug = await request.post("/api/public/churches/slug/Slug%20Invalido/corrections", { data: valid });
    expect(badSlug.status()).toBe(400);
  });

  test("sugestão de correção rejeita payload acima do orçamento antes do parse JSON", async ({ request }) => {
    const response = await request.post("/api/public/churches/slug/comunidade-e2e/corrections", {
      headers: { "X-Request-ID": "boundary-correction-02" },
      data: JSON.stringify({ oversized: "x".repeat(20 * 1024) }),
    });

    expect(response.status()).toBe(413);
    expect(response.headers()["retry-after"]).toBe("60");
    expect(response.headers()["x-request-id"]).toBe("boundary-correction-02");
  });
});
