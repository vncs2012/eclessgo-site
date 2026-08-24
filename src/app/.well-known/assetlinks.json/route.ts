import { NextResponse } from "next/server";

import { buildAndroidAssetLinks, getUniversalLinkConfig } from "@/lib/release-config";

export const dynamic = "force-dynamic";

const EMPTY_ASSET_LINKS: unknown[] = [];

export function GET() {
  const validation = getUniversalLinkConfig();
  const packageName = validation.androidAvailable ? validation.config.androidPackageName : null;
  const fingerprint = validation.androidAvailable ? validation.config.androidSha256CertFingerprint : null;
  const configured = Boolean(packageName && fingerprint);
  const status = !configured && validation.strict ? 503 : 200;

  return NextResponse.json(
    packageName && fingerprint
      ? buildAndroidAssetLinks({
          packageName,
          fingerprint,
        })
      : EMPTY_ASSET_LINKS,
    {
      status,
      headers: {
        "Cache-Control": configured ? "public, max-age=3600" : "no-store",
        "X-Release-Config": configured ? "configured" : "unavailable",
      },
    },
  );
}
