import Link from "next/link";
import { CheckCircle2, LayoutDashboard, MapPinned } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { PANEL_URL } from "@/lib/site-config";

type SuccessPageProps = {
  searchParams: Promise<{
    church?: string;
    email?: string;
  }>;
};

export default async function RegisterChurchSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const t = await getTranslations("registerSuccess");
  const params = await searchParams;
  const churchName = params.church || t("churchFallback");
  const email = params.email || t("emailFallback");

  return (
    <div className="site-shell min-h-screen bg-background text-foreground">
      <div className="grid-noise absolute inset-0 opacity-35" aria-hidden="true" />
      <SiteHeader />

      <main className="relative z-10 mx-auto flex max-w-4xl flex-1 items-center px-4 py-16 sm:px-6 lg:px-8">
        <section className="glass-card w-full rounded-[2rem] p-8 text-center sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-400/15">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.24em] text-zinc-500">
            {t("eyebrow")}
          </p>
          <h1 className="section-title mt-4 text-4xl font-semibold text-zinc-50 sm:text-5xl">
            {t("title", { name: churchName })}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-zinc-400">
            {t.rich("description", {
              email: () => <span className="text-zinc-200">{email}</span>,
            })}
          </p>

          <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/8 bg-zinc-950/70 p-5">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="h-5 w-5 text-emerald-300" />
                <p className="font-semibold text-zinc-50">{t("panelStepTitle")}</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                {t("panelStepDesc")}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/8 bg-zinc-950/70 p-5">
              <div className="flex items-center gap-3">
                <MapPinned className="h-5 w-5 text-emerald-300" />
                <p className="font-semibold text-zinc-50">{t("mapStepTitle")}</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                {t("mapStepDesc")}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={PANEL_URL}
              className="inline-flex rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
            >
              {t("panelCta")}
            </a>
            <Link
              href="/comunidades"
              className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/30 hover:text-white"
            >
              {t("mapCta")}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
