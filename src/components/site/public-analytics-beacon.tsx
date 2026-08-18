"use client";

import { useEffect, useRef } from "react";

import type { PublicAnalyticsEventType } from "@/lib/public-analytics";
import { trackPublicEvent } from "@/lib/public-analytics";

type PublicAnalyticsBeaconProps = {
  churchId: string;
  eventType: PublicAnalyticsEventType;
  source: "WEB_DIRECTORY" | "WEB_DETAIL" | "WEB_LANDING";
  path?: string;
  metadata?: Record<string, unknown>;
};

export function PublicAnalyticsBeacon({
  churchId,
  eventType,
  source,
  path,
  metadata,
}: PublicAnalyticsBeaconProps) {
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (hasTrackedRef.current || !churchId) return;
    hasTrackedRef.current = true;

    void trackPublicEvent({
      churchId,
      eventType,
      source,
      path,
      metadata,
    });
  }, [churchId, eventType, metadata, path, source]);

  return null;
}
