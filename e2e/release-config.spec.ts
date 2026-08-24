import { expect, test } from "@playwright/test";

const configured = process.env.E2E_RELEASE_LINKS_CONFIGURED === "1";

test.describe("release deep-link configuration", () => {
  test("serves JSON without publishing placeholders when credentials are unavailable", async ({ request }) => {
    test.skip(configured, "the configured-payload assertions cover this mode");

    for (const path of ["/.well-known/apple-app-site-association", "/.well-known/assetlinks.json"]) {
      const response = await request.get(path);
      expect([200, 503]).toContain(response.status());
      expect(response.headers()["content-type"]).toContain("application/json");
      expect(response.headers()["x-release-config"]).toBe("unavailable");
      expect(response.headers()["cache-control"]).toBe("no-store");
      expect(JSON.stringify(await response.json())).not.toMatch(/TEAMID|REPLACE|PLACEHOLDER/i);
    }
  });

  test("serves the exact configured platform payloads with cache headers", async ({ request }) => {
    test.skip(!configured, "requires non-secret CI fixture credentials");

    const appleResponse = await request.get("/.well-known/apple-app-site-association");
    expect(appleResponse.status()).toBe(200);
    expect(appleResponse.headers()["content-type"]).toContain("application/json");
    expect(appleResponse.headers()["cache-control"]).toBe("public, max-age=3600");
    expect(appleResponse.headers()["x-release-config"]).toBe("configured");
    const applePayload = await appleResponse.json();
    expect(applePayload.applinks.details[0].appIDs).toEqual(["ABCDE12345.com.eclessgo.app"]);
    expect(applePayload.applinks.details[0].components.map((component: { "/": string }) => component["/"])).toEqual([
      "/comunidades/*",
      "/eventos/*",
    ]);
    expect(JSON.stringify(applePayload)).not.toMatch(/TEAMID|REPLACE|PLACEHOLDER/i);

    const androidResponse = await request.get("/.well-known/assetlinks.json");
    expect(androidResponse.status()).toBe(200);
    expect(androidResponse.headers()["content-type"]).toContain("application/json");
    expect(androidResponse.headers()["cache-control"]).toBe("public, max-age=3600");
    expect(androidResponse.headers()["x-release-config"]).toBe("configured");
    const androidPayload = await androidResponse.json();
    expect(androidPayload[0].target.package_name).toBe("com.eclessgo.app");
    expect(androidPayload[0].target.sha256_cert_fingerprints).toEqual([
      "AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA",
    ]);
    expect(JSON.stringify(androidPayload)).not.toMatch(/TEAMID|REPLACE|PLACEHOLDER/i);
  });
});
