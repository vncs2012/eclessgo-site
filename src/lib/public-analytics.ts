"use client";

import {
  ANALYTICS_SESSION_STORAGE_KEY,
  hasAnalyticsConsent,
  markStorageUnavailable,
} from "@/lib/consent";
import { fetchWithClientTrace } from "@/lib/client-fetch";

export const ANALYTICS_SESSION_KEY = ANALYTICS_SESSION_STORAGE_KEY;

export type PublicAnalyticsEventType =
  | "PUBLIC_MAP_VIEW"
  | "PUBLIC_CHURCH_VIEW"
  | "PUBLIC_CHURCH_CONTACT_CLICK"
  | "PUBLIC_CHURCH_APP_CLICK"
  | "PUBLIC_CHURCH_SHARE";

type TrackPublicEventInput = {
  churchId: string;
  eventType: PublicAnalyticsEventType;
  source: "WEB_DIRECTORY" | "WEB_DETAIL" | "WEB_LANDING";
  path?: string;
  metadata?: Record<string, unknown>;
};

function buildSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionId() {
  if (typeof window === "undefined") return null;

  try {
    const existing = window.localStorage.getItem(ANALYTICS_SESSION_KEY);
    if (existing) return existing;

    const created = buildSessionId();
    window.localStorage.setItem(ANALYTICS_SESSION_KEY, created);
    return created;
  } catch {
    // Analytics must fail closed if browser storage is blocked or throws.
    try {
      window.localStorage.removeItem(ANALYTICS_SESSION_KEY);
    } catch {
      // Best-effort cleanup; the consent module remains blocked below.
    }
    markStorageUnavailable();
    return null;
  }
}

export async function trackPublicEvent({
  churchId,
  eventType,
  source,
  path,
  metadata,
}: TrackPublicEventInput) {
  if (typeof window === "undefined" || !churchId) return;

  try {
    // LGPD: nao coletar antes do usuario consentir. The consent helper and
    // session storage access both fail closed when browser storage throws.
    if (!hasAnalyticsConsent()) return;

    const sessionId = getSessionId();
    if (!sessionId) return;

    await fetchWithClientTrace("/api/public/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        churchId,
        eventType,
        source,
        sessionId,
        path: path || window.location.pathname,
        metadata: metadata || {},
      }),
      keepalive: true,
    });
  } catch (error) {
    console.error(error);
  }
}
