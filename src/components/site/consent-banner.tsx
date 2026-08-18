"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

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
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-6 sm:pb-6"
    >
      <div className="glass-card mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900/90 p-4 text-sm text-zinc-100 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:gap-6 sm:p-5">
        <div className="flex-1 space-y-1">
          <p id="consent-banner-title" className="text-sm font-semibold text-white">
            {t("title")}
          </p>
          <p id="consent-banner-description" className="text-xs leading-relaxed text-zinc-300">
            {t.rich("description", {
              link: (chunks) => (
                <Link href="/privacidade" className="text-emerald-300 underline-offset-4 hover:underline">
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
            className="min-h-11 flex-1 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-100 transition hover:border-white/40 sm:flex-none"
          >
            {t("decline")}
          </button>
          <button
            type="button"
            onClick={() => setConsent("granted")}
            className="min-h-11 flex-1 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-emerald-950 transition hover:bg-emerald-400 sm:flex-none"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
