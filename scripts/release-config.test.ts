import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildAndroidAssetLinks,
  buildAppleAppSiteAssociation,
  getUniversalLinkConfig,
  validateReleaseConfig,
} from "../src/lib/release-config.ts";
import { buildCommunityUniversalPath, buildCommunityUniversalUrl } from "../src/lib/release-paths.ts";

const validEnvironment = {
  API_BASE_URL: "https://api.example.test/api/v1",
  NEXT_PUBLIC_SITE_URL: "https://www.example.test",
  NEXT_PUBLIC_PANEL_URL: "https://panel.example.test",
  NEXT_PUBLIC_APP_CTA_URL: "https://www.example.test/#app",
  APPLE_TEAM_ID: "ABCDE12345",
  IOS_BUNDLE_ID: "com.eclessgo.app",
  ANDROID_PACKAGE_NAME: "com.eclessgo.app",
  ANDROID_SHA256_CERT_FINGERPRINT: "AA".repeat(32),
};

test("accepts a complete strict release configuration", () => {
  const validation = validateReleaseConfig(validEnvironment, { strict: true });
  assert.deepEqual(validation.errors, []);
  assert.equal(validation.config.androidSha256CertFingerprint, "AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA:AA");
});

test("rejects an absent strict configuration instead of silently using localhost", () => {
  const validation = validateReleaseConfig({}, { strict: true });
  assert.ok(validation.errors.some((error) => error.includes("API_BASE_URL")));
  assert.ok(validation.errors.some((error) => error.includes("NEXT_PUBLIC_SITE_URL")));
  assert.ok(validation.errors.some((error) => error.includes("APPLE_TEAM_ID")));
  assert.equal(validation.config.siteUrl, "http://localhost:3001");
});

test("allows empty local defaults only when strict mode is explicitly disabled", () => {
  const validation = validateReleaseConfig({ NEXT_PUBLIC_APP_CTA_URL: "/#app" }, { strict: false });
  assert.deepEqual(validation.errors, []);
  assert.equal(validation.config.appCtaUrl, "/#app");
  assert.equal(getUniversalLinkConfig({}).available, false);
});

test("rejects localhost URLs and deep-link placeholders in strict mode", () => {
  const validation = validateReleaseConfig(
    {
      ...validEnvironment,
      API_BASE_URL: "http://127.0.0.1:8000/api/v1",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3001",
      NEXT_PUBLIC_PANEL_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_CTA_URL: "http://localhost:3001/#app",
      APPLE_TEAM_ID: "TEAMID1234",
      ANDROID_SHA256_CERT_FINGERPRINT: "REPLACE_WITH_RELEASE_SHA256_FINGERPRINT",
    },
    { strict: true },
  );
  assert.ok(validation.errors.some((error) => error.includes("localhost")));
  assert.ok(validation.errors.some((error) => error.includes("placeholder")));
  assert.equal(getUniversalLinkConfig({ ...validEnvironment, APPLE_TEAM_ID: "TEAMID1234" }).available, false);
});

test("keeps each platform payload independent while the combined release gate remains closed", () => {
  const partialEnvironment: Record<string, string | undefined> = { ...validEnvironment };
  delete partialEnvironment.ANDROID_PACKAGE_NAME;
  delete partialEnvironment.ANDROID_SHA256_CERT_FINGERPRINT;

  const links = getUniversalLinkConfig(partialEnvironment);
  assert.equal(links.appleAvailable, true);
  assert.equal(links.androidAvailable, false);
  assert.equal(links.available, false);
  assert.equal(links.appId, "ABCDE12345.com.eclessgo.app");
});

test("generates only the supported universal-link paths and exact app credentials", () => {
  const aasa = buildAppleAppSiteAssociation({ appId: "ABCDE12345.com.eclessgo.app" });
  assert.deepEqual(aasa.applinks.apps, []);
  assert.deepEqual(aasa.applinks.details[0]?.appIDs, ["ABCDE12345.com.eclessgo.app"]);
  assert.deepEqual(
    aasa.applinks.details[0]?.components.map((component) => component["/"]),
    ["/comunidades/*", "/eventos/*"],
  );

  const assetLinks = buildAndroidAssetLinks({
    packageName: "com.eclessgo.app",
    fingerprint: "AA:AA",
  });
  assert.equal(assetLinks[0]?.target.package_name, "com.eclessgo.app");
  assert.deepEqual(assetLinks[0]?.target.sha256_cert_fingerprints, ["AA:AA"]);
});

test("keeps a valid detail slug in the contextual CTA and rejects arbitrary targets", () => {
  assert.equal(buildCommunityUniversalPath("minha-comunidade-01"), "/comunidades/minha-comunidade-01");
  assert.equal(buildCommunityUniversalPath("javascript:alert(1)"), "/comunidades");
  assert.equal(
    buildCommunityUniversalUrl("minha-comunidade-01", "https://www.example.test"),
    "https://www.example.test/comunidades/minha-comunidade-01",
  );
  assert.equal(buildCommunityUniversalUrl("minha-comunidade-01", "http://localhost:3001"), "/comunidades/minha-comunidade-01");
});
