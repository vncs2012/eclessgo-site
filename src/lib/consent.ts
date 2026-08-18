"use client";

const CONSENT_STORAGE_KEY = "eclessgo:consent:v1";

export type ConsentValue = "granted" | "denied";

export type ConsentRecord = {
  analytics: ConsentValue;
  decidedAt: string;
};

const CONSENT_EVENT = "eclessgo:consent-changed";
let consentCacheRaw: string | null | undefined;
let consentCacheValue: ConsentRecord | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

export function getConsent(): ConsentRecord | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (raw === consentCacheRaw) return consentCacheValue;

  consentCacheRaw = raw;
  if (!raw) {
    consentCacheValue = null;
    return consentCacheValue;
  }

  try {
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (parsed.analytics === "granted" || parsed.analytics === "denied") {
      consentCacheValue = parsed;
      return consentCacheValue;
    }
    consentCacheValue = null;
    return consentCacheValue;
  } catch {
    consentCacheValue = null;
    return consentCacheValue;
  }
}

export function setConsent(value: ConsentValue): ConsentRecord {
  const record: ConsentRecord = {
    analytics: value,
    decidedAt: new Date().toISOString(),
  };
  if (isBrowser()) {
    const raw = JSON.stringify(record);
    window.localStorage.setItem(CONSENT_STORAGE_KEY, raw);
    consentCacheRaw = raw;
    consentCacheValue = record;
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: record }));
  }
  return record;
}

export function hasAnalyticsConsent(): boolean {
  const record = getConsent();
  return record?.analytics === "granted";
}

export function subscribeToConsent(listener: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => listener();
  window.addEventListener(CONSENT_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CONSENT_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
