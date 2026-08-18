import Link from "next/link";
import { MapPinned, Smartphone, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { APP_CTA_URL, PANEL_URL } from "@/lib/site-config";

export async function SiteHeader() {
  const t = await getTranslations("header");

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-black/55 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/18 text-emerald-300 ring-1 ring-emerald-400/20 sm:h-11 sm:w-11 sm:rounded-2xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-zinc-50">EclessGO</p>
            <p className="hidden text-xs text-zinc-500 sm:block">{t("tagline")}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
          <Link href="/comunidades" className="transition hover:text-white">
            {t("nav.communities")}
          </Link>
          <Link href="/#como-funciona" className="transition hover:text-white">
            {t("nav.howItWorks")}
          </Link>
          <Link href="/#para-comunidades" className="transition hover:text-white">
            {t("nav.forCommunities")}
          </Link>
          <Link href="/cadastro-comunidade" className="transition hover:text-white">
            {t("nav.register")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <a
            href={APP_CTA_URL}
            className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-emerald-400/30 hover:text-white sm:inline-flex"
          >
            <Smartphone className="mr-2 h-4 w-4" />
            {t("appCta")}
          </a>
          <a
            href={PANEL_URL}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-emerald-950 transition hover:bg-emerald-400 sm:h-auto sm:w-auto sm:px-4 sm:py-2 sm:text-sm sm:font-semibold"
          >
            <MapPinned className="h-4 w-4 sm:mr-2" />
            <span className="sr-only sm:not-sr-only">{t("panelCta")}</span>
          </a>
        </div>
      </div>
    </header>
  );
}
