import { NextResponse } from "next/server";

import { buildAppleAppSiteAssociation, getUniversalLinkConfig } from "@/lib/release-config";

export const dynamic = "force-dynamic";

const EMPTY_ASSOCIATION = {
  applinks: {
    apps: [],
    details: [],
  },
  webcredentials: {
    apps: [],
  },
};

export function GET() {
  const validation = getUniversalLinkConfig();
  const appId = validation.appleAvailable ? validation.appId : null;
  const configured = Boolean(appId);
  const status = !configured && validation.strict ? 503 : 200;

  return NextResponse.json(
    appId ? buildAppleAppSiteAssociation({ appId }) : EMPTY_ASSOCIATION,
    {
      status,
      headers: {
        "Cache-Control": configured ? "public, max-age=3600" : "no-store",
        "X-Release-Config": configured ? "configured" : "unavailable",
      },
    },
  );
}
