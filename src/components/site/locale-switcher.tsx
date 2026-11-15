"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { HEADER_ICON_BUTTON } from "@/components/site/site-header-client";
import { setLocale } from "@/i18n/locale-actions";
import { locales, type Locale } from "@/i18n/locales";

function useLocaleChange() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const change = (next: Locale) => {
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  };

  return { change, isPending };
}

/** Cabeçalho: alterna entre PT e EN. O rótulo acessível diz o idioma atual e o destino. */
export function LocaleSwitcher() {
  const t = useTranslations("header");
  const locale = useLocale();
  const { change, isPending } = useLocaleChange();

  const next: Locale = locale === "en" ? "pt-BR" : "en";

  return (
    <button
      type="button"
      onClick={() => change(next)}
      disabled={isPending}
      aria-label={t("toggleLanguage")}
      className={`${HEADER_ICON_BUTTON} disabled:opacity-60`}
    >
      <Globe className="h-[18px] w-[18px]" aria-hidden="true" />
      <span>{t("languageShort")}</span>
    </button>
  );
}

/** Rodapé: "PT · EN" com o idioma atual marcado. */
export function LocaleList() {
  const t = useTranslations("footer");
  const locale = useLocale();
  const { change, isPending } = useLocaleChange();

  const options: ReadonlyArray<{ value: Locale; short: string; label: string }> = [
    { value: locales[0], short: "PT", label: t("languagePt") },
    { value: locales[1], short: "EN", label: t("languageEn") },
  ];

  return (
    <div role="group" aria-label={t("languageGroup")} className="flex items-center gap-1">
      {options.map((option, index) => (
        <span key={option.value} className="flex items-center gap-1">
          {index > 0 ? <span aria-hidden="true">·</span> : null}
          <button
            type="button"
            onClick={() => change(option.value)}
            disabled={isPending || locale === option.value}
            aria-label={option.label}
            aria-pressed={locale === option.value}
            className="inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-md px-1.5 font-semibold transition-colors hover:text-eg-strong aria-pressed:text-eg-strong aria-pressed:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eg-focus"
          >
            {option.short}
          </button>
        </span>
      ))}
    </div>
  );
}
