"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

import { getConsent, setConsent, subscribeToConsent, type ConsentValue } from "@/lib/consent";

export function ConsentPreferences() {
  const t = useTranslations("consent");
  const consent = useSyncExternalStore(subscribeToConsent, getConsent, () => null);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        triggerRef.current?.focus();
      }
      return;
    }

    wasOpenRef.current = true;
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function handleChoice(value: ConsentValue) {
    setConsent(value);
  }

  const status = consent?.analytics === "granted"
    ? t("statusGranted")
    : consent?.analytics === "denied"
      ? t("statusDenied")
      : t("statusUnknown");

  return (
    <div className="relative">
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="consent-preferences-dialog"
        className="text-left text-zinc-300 underline decoration-zinc-600 underline-offset-4 transition hover:text-white"
      >
        {t("manage")}
      </button>

      {isOpen ? (
        <div
          id="consent-preferences-dialog"
          role="dialog"
          aria-modal="false"
          aria-labelledby="consent-preferences-title"
          className="absolute bottom-full right-0 z-50 mb-3 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-zinc-900 p-4 text-left text-sm text-zinc-100 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p id="consent-preferences-title" className="font-semibold text-white">
                {t("dialogTitle")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">{status}</p>
            </div>
            <button
              type="button"
              ref={closeRef}
              onClick={() => setIsOpen(false)}
              aria-label={t("close")}
              className="min-h-11 min-w-11 rounded-full text-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleChoice("denied")}
              className="min-h-11 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-100 transition hover:border-white/40"
            >
              {t("decline")}
            </button>
            <button
              type="button"
              onClick={() => handleChoice("granted")}
              className="min-h-11 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-950 transition hover:bg-emerald-400"
            >
              {t("accept")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
