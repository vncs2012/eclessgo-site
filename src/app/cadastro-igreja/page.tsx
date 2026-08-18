import Link from "next/link";
import { CheckCircle2, LayoutDashboard, MapPinned, Route } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { RegisterChurchForm } from "@/components/site/register-church-form";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default async function RegisterChurchPage() {
  const t = await getTranslations("register.page");
  const requirements = [
    t("requirements.responsible"),
    t("requirements.identity"),
    t("requirements.address"),
    t("requirements.coordinates"),
  ];
  return (
    <div className="site-shell min-h-screen bg-background text-foreground">
      <div className="grid-noise absolute inset-0 opacity-35" aria-hidden="true" />
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <h1 className="sr-only">{t("title")}</h1>

          <div className="lg:order-2">
            <RegisterChurchForm />
          </div>

          <aside className="space-y-5 lg:order-1">
            <div className="glass-card rounded-[2rem] p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{t("eyebrow")}</p>
              <h2 className="section-title mt-4 text-5xl font-semibold tracking-tight text-zinc-50">
                {t("title")}
              </h2>
              <p className="mt-5 text-base leading-8 text-zinc-400">
                {t("intro")}
              </p>

              <div className="mt-8 grid gap-4">
                {requirements.map((requirement) => (
                  <div
                    key={requirement}
                    className="rounded-[1.5rem] border border-white/8 bg-zinc-950/70 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                      <p className="text-sm leading-7 text-zinc-300">{requirement}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{t("usableEyebrow")}</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-[1.4rem] border border-white/8 bg-zinc-950/70 p-4">
                  <div className="flex items-center gap-3">
                    <MapPinned className="h-5 w-5 text-emerald-300" />
                    <p className="font-semibold text-zinc-50">{t("mapCoherent.title")}</p>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-zinc-400">
                    {t("mapCoherent.description")}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-white/8 bg-zinc-950/70 p-4">
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="h-5 w-5 text-emerald-300" />
                    <p className="font-semibold text-zinc-50">{t("panelEntry.title")}</p>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-zinc-400">
                    {t("panelEntry.description")}
                  </p>
                </div>
                <div className="rounded-[1.4rem] border border-white/8 bg-zinc-950/70 p-4">
                  <div className="flex items-center gap-3">
                    <Route className="h-5 w-5 text-emerald-300" />
                    <p className="font-semibold text-zinc-50">{t("moreChannels.title")}</p>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-zinc-400">
                    {t("moreChannels.description")}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/comunidades"
                  className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/30 hover:text-white"
                >
                  {t("seePublished")}
                </Link>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
