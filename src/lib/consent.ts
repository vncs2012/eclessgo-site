"use client";

const CONSENT_STORAGE_KEY = "eclessgo:consent:v1";
export const ANALYTICS_SESSION_STORAGE_KEY = "eclessgo:web:analytics-session";

export type ConsentValue = "granted" | "denied";

export type ConsentRecord = {
  analytics: ConsentValue;
  decidedAt: string;
};

const CONSENT_EVENT = "eclessgo:consent-changed";
const STORAGE_ERROR = "__eclessgo_storage_error__";
let consentCacheRaw: string | null | undefined;
let consentCacheValue: ConsentRecord | null = null;
let storageUnavailable = false;

function isBrowser() {
  return typeof window !== "undefined";
}

type StorageReadResult = {
  ok: boolean;
  value: string | null;
};

function readStorage(key: string): StorageReadResult {
  if (!isBrowser() || storageUnavailable) return { ok: false, value: null };

  try {
    return { ok: true, value: window.localStorage.getItem(key) };
  } catch {
    markStorageUnavailable();
    return { ok: false, value: null };
  }
}

function writeStorage(key: string, value: string) {
  if (!isBrowser() || storageUnavailable) return false;

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    markStorageUnavailable();
    return false;
  }
}

function removeStorage(key: string) {
  if (!isBrowser() || storageUnavailable) return false;

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    markStorageUnavailable();
    return false;
  }
}

export function markStorageUnavailable() {
  storageUnavailable = true;
  consentCacheRaw = STORAGE_ERROR;
  consentCacheValue = null;
}

function notifyConsentChange(record: ConsentRecord) {
  if (!isBrowser()) return;

  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: record }));
  } catch {
    // Storage/DOM failures must not turn a privacy control click into an
    // uncaught exception. Consumers will observe the next safe snapshot.
  }
}

export function getConsent(): ConsentRecord | null {
  if (!isBrowser()) return null;
  const storage = readStorage(CONSENT_STORAGE_KEY);
  if (!storage.ok) {
    consentCacheRaw = STORAGE_ERROR;
    consentCacheValue = null;
    return null;
  }

  const raw = storage.value;
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

function removeAnalyticsSession() {
  removeStorage(ANALYTICS_SESSION_STORAGE_KEY);
}

export function setConsent(value: ConsentValue): ConsentRecord {
  const record: ConsentRecord = {
    analytics: value,
    decidedAt: new Date().toISOString(),
  };
  if (isBrowser()) {
    const raw = JSON.stringify(record);
    const persisted = writeStorage(CONSENT_STORAGE_KEY, raw);

    if (!persisted) {
      // A denied decision is safe to apply in memory even when persistence is
      // unavailable. A failed grant must remain unknown/disabled.
      consentCacheRaw = STORAGE_ERROR;
      consentCacheValue = value === "denied" ? record : null;
      if (value === "denied") {
        removeAnalyticsSession();
        notifyConsentChange(record);
      }
      return record;
    }

    if (value === "denied") removeAnalyticsSession();
    consentCacheRaw = raw;
    consentCacheValue = record;
    notifyConsentChange(record);
  }
  return record;
}

export function hasAnalyticsConsent(): boolean {
  if (storageUnavailable) return false;
  const record = getConsent();
  if (record?.analytics === "granted") return true;

  // Keep revocation effective even when it happened in another tab and was
  // observed through localStorage rather than setConsent in this tab.
  removeAnalyticsSession();
  return false;
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
