"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { getConsent, subscribeToConsent } from "@/lib/consent";
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
  const consent = useSyncExternalStore(subscribeToConsent, getConsent, () => null);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    // Do not consume the one-shot beacon while consent is still unknown or
    // denied. The consent event causes this effect to run again after the
    // banner is accepted in the same page load.
    if (hasTrackedRef.current || !churchId || consent?.analytics !== "granted") return;
    hasTrackedRef.current = true;

    void trackPublicEvent({
      churchId,
      eventType,
      source,
      path,
      metadata,
    });
  }, [churchId, consent, eventType, metadata, path, source]);

  return null;
}
