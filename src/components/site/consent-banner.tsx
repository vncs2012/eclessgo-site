"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { FOCUS_RING } from "@/components/site/theme";
import { getConsent, setConsent, subscribeToConsent } from "@/lib/consent";

export function ConsentBanner() {
  const t = useTranslations("consent");
  const consent = useSyncExternalStore(subscribeToConsent, getConsent, () => null);
  const needsDecision = !consent;

  if (!needsDecision) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-banner-title"
      aria-describedby="consent-banner-description"
      className="eg-consent-banner fixed inset-x-0 z-[45] px-3 sm:px-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-2.5 rounded-2xl border border-eg-border bg-eg-surface p-3.5 text-sm text-eg-text shadow-[var(--eg-shadow-lg)] sm:flex-row sm:items-center sm:gap-6 sm:p-5">
        <div className="flex-1 space-y-1">
          <p id="consent-banner-title" className="text-sm font-semibold text-eg-strong">
            {t("title")}
          </p>
          <p id="consent-banner-description" className="text-xs leading-relaxed text-eg-text">
            {t.rich("description", {
              link: (chunks) => (
                <Link
                  href="/privacidade"
                  className={`rounded-sm font-semibold text-eg-primary-text underline underline-offset-4 ${FOCUS_RING}`}
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={() => setConsent("denied")}
            className={`min-h-11 flex-1 cursor-pointer rounded-full border-[1.5px] border-eg-border-strong px-4 py-2 text-xs! font-bold! text-eg-strong transition-colors hover:bg-eg-hover sm:flex-none ${FOCUS_RING}`}
          >
            {t("decline")}
          </button>
          <button
            type="button"
            onClick={() => setConsent("granted")}
            className={`min-h-11 flex-1 cursor-pointer rounded-full bg-eg-primary px-4 py-2 text-xs! font-bold! text-eg-inverse transition-colors hover:bg-eg-primary-hover sm:flex-none ${FOCUS_RING}`}
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
