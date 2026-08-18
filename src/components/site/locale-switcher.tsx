"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setLocale } from "@/i18n/locale-actions";
import type { Locale } from "@/i18n/locales";

export function LocaleSwitcher() {
  const t = useTranslations("header");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const next: Locale = locale === "en" ? "pt-BR" : "en";

  const handleToggle = () => {
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={t("toggleLanguage")}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-sm font-medium text-zinc-200 transition hover:border-emerald-400/30 hover:text-white disabled:opacity-60"
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      {t("languageShort")}
    </button>
  );
}
