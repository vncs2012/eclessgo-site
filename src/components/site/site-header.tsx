import Link from "next/link";
import { MapPinned, Menu, Smartphone, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/site/locale-switcher";
import { APP_CTA_URL, PANEL_URL } from "@/lib/site-config";

export async function SiteHeader() {
  const t = await getTranslations("header");

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-black/55 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-3 px-4 py-3 sm:gap-x-4 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="order-1 mr-auto flex min-w-0 items-center gap-3 xl:mr-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/18 text-emerald-300 ring-1 ring-emerald-400/20 sm:h-11 sm:w-11 sm:rounded-2xl">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold tracking-tight text-zinc-50">EclessGO</p>
            <p className="hidden text-xs text-zinc-500 lg:block">{t("tagline")}</p>
          </div>
        </Link>

        <div className="order-2 flex shrink-0 items-center gap-2 xl:order-3">
          <LocaleSwitcher />
          <a
            href={APP_CTA_URL}
            className="hidden whitespace-nowrap rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-emerald-400/30 hover:text-white sm:inline-flex"
          >
            <Smartphone className="mr-2 h-4 w-4" />
            {t("appCta")}
          </a>
        </div>

        <a
          href={PANEL_URL}
          className="order-3 inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-full bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 sm:w-auto sm:px-4 sm:py-2 xl:order-4"
        >
          <MapPinned className="mr-2 h-4 w-4" aria-hidden="true" />
          {t("panelCta")}
        </a>

        <details className="order-4 w-full md:hidden">
          <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-emerald-400/30 hover:text-white">
            <Menu className="h-4 w-4" aria-hidden="true" />
            Menu
          </summary>
          <nav aria-label="Menu" className="mt-2 grid gap-1 rounded-2xl border border-white/10 bg-zinc-950/95 p-2 text-sm text-zinc-200 shadow-xl sm:grid-cols-2">
            <Link href="/comunidades" className="rounded-xl px-4 py-3 transition hover:bg-white/5 hover:text-white">
              {t("nav.communities")}
            </Link>
            <Link href="/#como-funciona" className="rounded-xl px-4 py-3 transition hover:bg-white/5 hover:text-white">
              {t("nav.howItWorks")}
            </Link>
            <Link href="/#para-comunidades" className="rounded-xl px-4 py-3 transition hover:bg-white/5 hover:text-white">
              {t("nav.forCommunities")}
            </Link>
            <Link href="/cadastro-comunidade" className="rounded-xl px-4 py-3 transition hover:bg-white/5 hover:text-white">
              {t("nav.register")}
            </Link>
            <a
              href={APP_CTA_URL}
              className="inline-flex items-center rounded-xl px-4 py-3 transition hover:bg-white/5 hover:text-white sm:hidden"
            >
              <Smartphone className="mr-2 h-4 w-4" aria-hidden="true" />
              {t("appCta")}
            </a>
          </nav>
        </details>

        <nav className="order-5 hidden w-full items-center justify-center gap-6 text-sm text-zinc-300 md:flex xl:order-2 xl:w-auto">
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
      </div>
    </header>
  );
}
