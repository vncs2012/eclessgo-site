const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
const PLACEHOLDER_MARKERS = [
  "TEAMID",
  "REPLACE",
  "PLACEHOLDER",
  "YOUR_",
  "CHANGE_ME",
  "CHANGE-THIS",
  "00000000",
];

export type ReleaseConfigEnv = Record<string, string | undefined>;

export type ReleaseConfig = {
  apiBaseUrl: string;
  siteUrl: string;
  panelUrl: string;
  appCtaUrl: string;
  appleTeamId: string | null;
  iosBundleId: string | null;
  androidPackageName: string | null;
  androidSha256CertFingerprint: string | null;
};

export type ReleaseConfigValidation = {
  strict: boolean;
  errors: string[];
  config: ReleaseConfig;
};

function isTruthy(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes(value?.trim().toLowerCase() || "");
}

export function isStrictReleaseMode(env: ReleaseConfigEnv = process.env): boolean {
  return isTruthy(env.ECLESSGO_RELEASE_STRICT);
}

function read(env: ReleaseConfigEnv, name: string): string {
  return env[name]?.trim() || "";
}

function hasPlaceholder(value: string): boolean {
  const normalized = value.toUpperCase();
  return PLACEHOLDER_MARKERS.some((marker) => normalized.includes(marker));
}

function parseUrl(
  value: string,
  name: string,
  errors: string[],
  options: { required: boolean; https: boolean; rejectLocal?: boolean; allowRelative?: boolean },
) {
  if (!value) {
    if (options.required) errors.push(`${name} ausente`);
    return null;
  }

  if (options.allowRelative && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    errors.push(`${name} precisa ser uma URL absoluta válida`);
    return null;
  }

  if (options.https && parsed.protocol !== "https:") {
    errors.push(`${name} precisa usar HTTPS em release`);
  }
  if (options.rejectLocal && LOCAL_HOSTNAMES.has(parsed.hostname.toLowerCase())) {
    errors.push(`${name} não pode apontar para localhost em release`);
  }
  return parsed.toString().replace(/\/$/, "");
}

function parseIdentifier(
  value: string,
  name: string,
  errors: string[],
  pattern: RegExp,
  required: boolean,
) {
  if (!value) {
    if (required) errors.push(`${name} ausente`);
    return null;
  }
  const placeholder = hasPlaceholder(value);
  const invalidFormat = !pattern.test(value);
  if (placeholder) errors.push(`${name} usa placeholder`);
  if (invalidFormat) errors.push(`${name} possui formato inválido`);
  return placeholder || invalidFormat ? null : value;
}

function normalizeFingerprint(value: string): string | null {
  if (!value) return null;
  const compact = value.replace(/[^0-9a-f]/gi, "");
  if (compact.length !== 64) return value;
  return compact.toUpperCase().match(/.{2}/g)?.join(":") || value;
}

function parseFingerprint(value: string, errors: string[], required: boolean): string | null {
  if (!value) {
    if (required) errors.push("ANDROID_SHA256_CERT_FINGERPRINT ausente");
    return null;
  }
  const placeholder = hasPlaceholder(value);
  if (placeholder) errors.push("ANDROID_SHA256_CERT_FINGERPRINT usa placeholder");
  const normalized = value.replace(/[^0-9a-f]/gi, "");
  const invalidFormat = normalized.length !== 64 || !/^[0-9a-f]{64}$/i.test(normalized);
  if (invalidFormat) {
    errors.push("ANDROID_SHA256_CERT_FINGERPRINT precisa ter 32 bytes em hexadecimal");
  }
  return placeholder || invalidFormat ? null : normalizeFingerprint(value);
}

export function validateReleaseConfig(
  env: ReleaseConfigEnv = process.env,
  options: { strict?: boolean } = {},
): ReleaseConfigValidation {
  const strict = options.strict ?? isStrictReleaseMode(env);
  const errors: string[] = [];

  const apiBaseUrlValue = read(env, "API_BASE_URL") || "http://127.0.0.1:8000/api/v1";
  const siteUrlValue = read(env, "NEXT_PUBLIC_SITE_URL");
  const siteUrl = parseUrl(siteUrlValue || "http://localhost:3001", "NEXT_PUBLIC_SITE_URL", errors, {
    required: strict,
    https: strict,
    rejectLocal: strict,
  });
  const panelUrlValue = read(env, "NEXT_PUBLIC_PANEL_URL");
  const panelUrl = parseUrl(panelUrlValue || "http://localhost:3000", "NEXT_PUBLIC_PANEL_URL", errors, {
    required: strict,
    https: strict,
    rejectLocal: strict,
  });
  const appCtaUrl = parseUrl(read(env, "NEXT_PUBLIC_APP_CTA_URL"), "NEXT_PUBLIC_APP_CTA_URL", errors, {
    required: strict,
    https: strict,
    rejectLocal: strict,
    allowRelative: !strict,
  });

  if (strict) {
    if (!siteUrlValue) errors.push("NEXT_PUBLIC_SITE_URL ausente");
    if (!panelUrlValue) errors.push("NEXT_PUBLIC_PANEL_URL ausente");
    if (!read(env, "API_BASE_URL")) errors.push("API_BASE_URL ausente; use a variável server-only no release");
    parseUrl(apiBaseUrlValue, "API_BASE_URL", errors, { required: true, https: true, rejectLocal: true });
  }

  const appleTeamId = parseIdentifier(read(env, "APPLE_TEAM_ID"), "APPLE_TEAM_ID", errors, /^[A-Z0-9]{10}$/, strict);
  const iosBundleId = parseIdentifier(
    read(env, "IOS_BUNDLE_ID"),
    "IOS_BUNDLE_ID",
    errors,
    /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)+$/,
    strict,
  );
  const androidPackageName = parseIdentifier(
    read(env, "ANDROID_PACKAGE_NAME"),
    "ANDROID_PACKAGE_NAME",
    errors,
    /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)+$/,
    strict,
  );
  const androidSha256CertFingerprint = parseFingerprint(
    read(env, "ANDROID_SHA256_CERT_FINGERPRINT"),
    errors,
    strict,
  );

  return {
    strict,
    errors,
    config: {
      apiBaseUrl: apiBaseUrlValue.replace(/\/$/, ""),
      siteUrl: siteUrl || "http://localhost:3001",
      panelUrl: panelUrl || "http://localhost:3000",
      appCtaUrl: appCtaUrl || "/#app",
      appleTeamId,
      iosBundleId,
      androidPackageName,
      androidSha256CertFingerprint,
    },
  };
}

export function assertReleaseConfig(env: ReleaseConfigEnv = process.env): ReleaseConfig {
  const validation = validateReleaseConfig(env);
  if (validation.strict && validation.errors.length > 0) {
    throw new Error(`[release-config] configuração inválida:\n- ${validation.errors.join("\n- ")}`);
  }
  return validation.config;
}

export function getUniversalLinkConfig(env: ReleaseConfigEnv = process.env) {
  const validation = validateReleaseConfig(env);
  const { config } = validation;
  const appleAvailable = Boolean(config.appleTeamId && config.iosBundleId);
  const androidAvailable = Boolean(config.androidPackageName && config.androidSha256CertFingerprint);
  const available = appleAvailable && androidAvailable && (!validation.strict || validation.errors.length === 0);

  return {
    ...validation,
    available,
    appleAvailable,
    androidAvailable,
    appId: appleAvailable ? `${config.appleTeamId}.${config.iosBundleId}` : null,
  };
}

export function buildAppleAppSiteAssociation(config: {
  appId: string;
}) {
  return {
    applinks: {
      apps: [],
      details: [
        {
          appIDs: [config.appId],
          components: [
            {
              "/": "/comunidades/*",
              comment: "Abrir EclessGO ao acessar página pública de comunidade",
            },
            {
              "/": "/eventos/*",
              comment: "Abrir EclessGO ao acessar evento público",
            },
          ],
        },
      ],
    },
    webcredentials: {
      apps: [config.appId],
    },
  };
}

export function buildAndroidAssetLinks(config: {
  packageName: string;
  fingerprint: string;
}) {
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: config.packageName,
        sha256_cert_fingerprints: [config.fingerprint],
      },
    },
  ];
}
