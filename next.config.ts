import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { assertReleaseConfig, isStrictReleaseMode } from "./src/lib/release-config";

// Production processes opt into a fail-closed startup/build gate. Local
// development keeps its documented localhost defaults when strict mode is off.
if (isStrictReleaseMode()) {
  assertReleaseConfig();
}

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

function getConfiguredMediaOrigin(value: string | undefined) {
  if (!value) return "";
  try {
    const origin = new URL(value.trim());
    return origin.protocol === "https:" ? ` ${origin.origin}` : "";
  } catch {
    return "";
  }
}

const mediaOrigins = getConfiguredMediaOrigin(process.env.NEXT_PUBLIC_MEDIA_ORIGIN);

const contentSecurityPolicyReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://a.tile.openstreetmap.org https://b.tile.openstreetmap.org https://c.tile.openstreetmap.org${mediaOrigins}`,
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'none'",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicyReportOnly },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
