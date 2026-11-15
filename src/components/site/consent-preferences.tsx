"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

import { FOCUS_RING } from "@/components/site/theme";
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
        className={`inline-flex min-h-9 cursor-pointer items-center rounded-md text-left text-sm! text-eg-text transition-colors hover:text-eg-strong hover:underline hover:underline-offset-4 ${FOCUS_RING}`}
      >
        {t("manage")}
      </button>

      {isOpen ? (
        <div
          id="consent-preferences-dialog"
          role="dialog"
          aria-modal="false"
          aria-labelledby="consent-preferences-title"
          className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[60] rounded-2xl border border-eg-border bg-eg-surface p-4 text-left text-sm text-eg-text shadow-[var(--eg-shadow-lg)] sm:absolute sm:inset-x-auto sm:bottom-full sm:right-0 sm:mb-3 sm:w-[22rem]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p id="consent-preferences-title" className="font-semibold text-eg-strong">
                {t("dialogTitle")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-eg-muted">{status}</p>
            </div>
            <button
              type="button"
              ref={closeRef}
              onClick={() => setIsOpen(false)}
              aria-label={t("close")}
              className={`min-h-11 min-w-11 cursor-pointer rounded-full text-lg! text-eg-muted transition-colors hover:bg-eg-hover hover:text-eg-strong ${FOCUS_RING}`}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleChoice("denied")}
              className={`min-h-11 cursor-pointer rounded-full border-[1.5px] border-eg-border-strong px-4 py-2 text-xs! font-bold! text-eg-strong transition-colors hover:bg-eg-hover ${FOCUS_RING}`}
            >
              {t("decline")}
            </button>
            <button
              type="button"
              onClick={() => handleChoice("granted")}
              className={`min-h-11 cursor-pointer rounded-full bg-eg-primary px-4 py-2 text-xs! font-bold! text-eg-inverse transition-colors hover:bg-eg-primary-hover ${FOCUS_RING}`}
            >
              {t("accept")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
