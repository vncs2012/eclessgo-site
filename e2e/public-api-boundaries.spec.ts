import { expect, test } from "@playwright/test";

/** O BFF de envio só aceita chamadas do próprio site: o navegador sempre manda Origin num POST. */
const sameOrigin = (baseURL: string | undefined) => ({ Origin: new URL(baseURL ?? "http://127.0.0.1:3101").origin });

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

  test("sugestão de correção valida o corpo e o slug antes do upstream", async ({ request, baseURL }) => {
    const url = "/api/public/churches/slug/comunidade-e2e/corrections";
    const valid = { category: "SCHEDULE", message: "O culto agora começa às 9h30." };
    const origin = sameOrigin(baseURL);

    const short = await request.post(url, {
      headers: { ...origin, "X-Request-ID": "boundary-correction-01" },
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
      expect((await request.post(url, { data, headers: origin })).status(), JSON.stringify(data).slice(0, 40)).toBe(422);
    }
    expect(
      (await request.post(url, { data: "{nao e json", headers: { ...origin, "Content-Type": "application/json" } })).status(),
    ).toBe(422);

    const badSlug = await request.post("/api/public/churches/slug/Slug%20Invalido/corrections", { data: valid, headers: origin });
    expect(badSlug.status()).toBe(400);
  });

  test("sugestão de correção rejeita origem ausente ou de outro site com 403, antes de ler o corpo", async ({
    request,
    baseURL,
  }) => {
    const url = "/api/public/churches/slug/comunidade-e2e/corrections";
    const valid = { category: "SCHEDULE", message: "O culto agora começa às 9h30." };

    const cases: Array<[string, Record<string, string>]> = [
      ["sem Origin", {}],
      ["Origin de outro site", { Origin: "https://evil.example" }],
      ["Origin null", { Origin: "null" }],
      ["Sec-Fetch-Site cross-site", { ...sameOrigin(baseURL), "Sec-Fetch-Site": "cross-site" }],
    ];
    for (const [label, headers] of cases) {
      const response = await request.post(url, { headers: { ...headers, "X-Request-ID": "boundary-correction-403" }, data: valid });
      expect(response.status(), label).toBe(403);
      expect(response.headers()["x-request-id"], label).toBe("boundary-correction-403");
      await expect(response.json(), label).resolves.toMatchObject({ statusCode: 403, code: "FORBIDDEN_ORIGIN" });
    }

    // A origem errada vence até um corpo inválido: nem o corpo é lido.
    const invalidBody = await request.post(url, { headers: { Origin: "https://evil.example" }, data: { ...valid, message: "curta" } });
    expect(invalidBody.status()).toBe(403);
  });

  test("sugestão de correção rejeita payload acima do orçamento antes do parse JSON", async ({ request, baseURL }) => {
    const response = await request.post("/api/public/churches/slug/comunidade-e2e/corrections", {
      headers: { ...sameOrigin(baseURL), "X-Request-ID": "boundary-correction-02" },
      data: JSON.stringify({ oversized: "x".repeat(20 * 1024) }),
    });

    expect(response.status()).toBe(413);
    expect(response.headers()["retry-after"]).toBe("60");
    expect(response.headers()["x-request-id"]).toBe("boundary-correction-02");
  });

  test("página e imagem OG da comunidade respondem 404 para slug inválido, sem consultar a API", async ({ request }) => {
    // Nenhuma API de teste sobe aqui: se o slug chegasse ao upstream, a resposta seria 5xx/indisponível.
    for (const slug of ["Slug%20Invalido", "SLUG-MAIUSCULO", "a", "x%2Fy", "a--b", "-abc", "a".repeat(81)]) {
      const page = await request.get(`/comunidades/${slug}`);
      expect(page.status(), `página ${slug}`).toBe(404);
      const image = await request.get(`/comunidades/${slug}/opengraph-image`);
      expect(image.status(), `og ${slug}`).toBe(404);
    }
  });
});
