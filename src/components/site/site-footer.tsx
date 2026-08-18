import Link from "next/link";
import { MapPinned, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PANEL_URL } from "@/lib/site-config";

export async function SiteFooter() {
  const t = await getTranslations("footer");

  return (
    <footer className="relative z-10 border-t border-white/8 bg-black">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.3fr_0.7fr_0.7fr] lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/18 text-emerald-300 ring-1 ring-emerald-400/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-zinc-50">EclessGO</p>
              <p className="text-sm text-zinc-500">{t("tagline")}</p>
            </div>
          </div>
          <p className="max-w-xl text-sm leading-6 text-zinc-400">
            {t("description")}
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <p className="font-semibold uppercase tracking-[0.24em] text-zinc-500">{t("explore.title")}</p>
          <Link href="/" className="block text-zinc-300 transition hover:text-white">
            {t("explore.home")}
          </Link>
          <Link href="/comunidades" className="block text-zinc-300 transition hover:text-white">
            {t("explore.map")}
          </Link>
          <Link href="/cadastro-comunidade" className="block text-zinc-300 transition hover:text-white">
            {t("explore.register")}
          </Link>
        </div>

        <div className="space-y-3 text-sm">
          <p className="font-semibold uppercase tracking-[0.24em] text-zinc-500">{t("operation.title")}</p>
          <a href={PANEL_URL} className="block text-zinc-300 transition hover:text-white">
            {t("operation.panel")}
          </a>
          <Link href="/#como-funciona" className="block text-zinc-300 transition hover:text-white">
            {t("operation.howItWorks")}
          </Link>
          <Link href="/#app" className="block text-zinc-300 transition hover:text-white">
            {t("operation.app")}
          </Link>
          <Link href="/termos" className="block text-zinc-300 transition hover:text-white">
            Termos de Uso
          </Link>
          <Link href="/privacidade" className="block text-zinc-300 transition hover:text-white">
            Política de Privacidade
          </Link>
        </div>
      </div>

      <div className="border-t border-white/6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>{t("copyright")}</p>
          <p className="inline-flex items-center gap-2">
            <MapPinned className="h-3.5 w-3.5" />
            {t("mapCredit")}
          </p>
        </div>
      </div>
    </footer>
  );
}
