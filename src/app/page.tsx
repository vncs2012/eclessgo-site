import Link from "next/link";
import {
  ArrowRight,
  Church,
  LayoutDashboard,
  MapPinned,
  Radio,
  Route,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ChurchMap } from "@/components/site/church-map";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { PUBLIC_CACHE_TTL_SECONDS } from "@/lib/public-cache";
import { APP_CTA_URL, GOIANIA_CENTER, PANEL_URL } from "@/lib/site-config";
import { getPublicChurches } from "@/lib/public-api";
import type { PublicChurchListItem } from "@/types/public";

export const revalidate = 300;

type FeaturedChurchesResult = {
  churches: PublicChurchListItem[];
  hasLoadError: boolean;
};

async function loadFeaturedChurches(): Promise<FeaturedChurchesResult> {
  try {
    const churches = await getPublicChurches(
      {
        lat: GOIANIA_CENTER.lat,
        lng: GOIANIA_CENTER.lng,
        limit: 6,
      },
      {
        next: { revalidate: PUBLIC_CACHE_TTL_SECONDS.landingFeaturedChurches },
      },
    );
    return {
      churches,
      hasLoadError: false,
    };
  } catch (error) {
    console.warn("[home] API publica indisponivel:", error instanceof Error ? error.message : error);
    return {
      churches: [],
      hasLoadError: true,
    };
  }
}

export default async function HomePage() {
  const t = await getTranslations("home");
  const { churches: featuredChurches, hasLoadError } = await loadFeaturedChurches();
  const mapPreview = featuredChurches.slice(0, 4);
  const liveCount = featuredChurches.filter((church) => church.isLive).length;
  const pillars = [
    {
      icon: MapPinned,
      title: t("pillars.findable.title"),
      description: t("pillars.findable.description"),
    },
    {
      icon: LayoutDashboard,
      title: t("pillars.operation.title"),
      description: t("pillars.operation.description"),
    },
    {
      icon: Smartphone,
      title: t("pillars.mobile.title"),
      description: t("pillars.mobile.description"),
    },
  ];
  const steps = [t("steps.first"), t("steps.second"), t("steps.third")];
  const requirements = [
    {
      icon: Route,
      title: t("requirements.address.title"),
      description: t("requirements.address.description"),
    },
    {
      icon: MapPinned,
      title: t("requirements.coordinates.title"),
      description: t("requirements.coordinates.description"),
    },
    {
      icon: Church,
      title: t("requirements.identity.title"),
      description: t("requirements.identity.description"),
    },
    {
      icon: ShieldCheck,
      title: t("requirements.contact.title"),
      description: t("requirements.contact.description"),
    },
  ];
  const appJourney = [
    {
      title: t("appJourney.map.title"),
      description: t("appJourney.map.description"),
    },
    {
      title: t("appJourney.publicPage.title"),
      description: t("appJourney.publicPage.description"),
    },
    {
      title: t("appJourney.appCta.title"),
      description: t("appJourney.appCta.description"),
    },
  ];

  return (
    <div className="site-shell min-h-screen bg-background text-foreground">
      <div className="grid-noise absolute inset-0 opacity-35" aria-hidden="true" />
      <SiteHeader />

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                {t("hero.badge")}
              </div>

              <h1 className="section-title mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-zinc-50 sm:text-6xl">
                {t("hero.title")}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
                {t("hero.description")}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/cadastro-comunidade"
                  className="inline-flex rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                >
                  {t("hero.registerCta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/comunidades"
                  className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/30 hover:text-white"
                >
                  {t("hero.exploreCta")}
                </Link>
                <a
                  href={APP_CTA_URL}
                  className="inline-flex rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:border-emerald-400/30 hover:text-white"
                >
                  {t("hero.appCta")}
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="glass-card rounded-[1.6rem] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    {t("stats.visible.label")}
                  </p>
                  <p className="mt-3 font-display text-3xl font-semibold text-zinc-50">
                    {featuredChurches.length}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {t("stats.visible.description")}
                  </p>
                </div>
                <div className="glass-card rounded-[1.6rem] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    {t("stats.live.label")}
                  </p>
                  <p className="mt-3 font-display text-3xl font-semibold text-zinc-50">{liveCount}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {t("stats.live.description")}
                  </p>
                </div>
                <div className="glass-card rounded-[1.6rem] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                    {t("stats.ecosystem.label")}
                  </p>
                  <p className="mt-3 font-display text-3xl font-semibold text-zinc-50">
                    {t("stats.ecosystem.value")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {t("stats.ecosystem.description")}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-4 px-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-zinc-500">
                    {t("mapPreview.eyebrow")}
                  </p>
                  <p className="text-sm text-zinc-300">{t("mapPreview.description")}</p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  {t("mapPreview.badge")}
                </span>
              </div>

              {mapPreview.length > 0 ? (
                <ChurchMap
                  churches={mapPreview}
                  center={GOIANIA_CENTER}
                  selectedChurchId={mapPreview[0]?.id}
                />
              ) : hasLoadError ? (
                <div className="flex min-h-[340px] items-center justify-center rounded-[1.6rem] border border-amber-500/20 bg-amber-500/10 px-6 text-center text-sm leading-7 text-amber-100">
                  {t("mapPreview.apiError")}
                </div>
              ) : (
                <div className="flex min-h-[340px] items-center justify-center rounded-[1.6rem] border border-white/8 bg-zinc-950/80 px-6 text-center text-sm leading-7 text-zinc-400">
                  {t("mapPreview.empty")}
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {featuredChurches.slice(0, 2).map((church) => (
                  <Link
                    key={church.id}
                    href={`/comunidades/${church.slug}`}
                    className="rounded-[1.4rem] border border-white/8 bg-zinc-950/75 p-4 transition hover:border-emerald-400/25"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-zinc-50">{church.name}</p>
                        <p className="mt-1 text-sm text-zinc-400">{church.addressLine}</p>
                      </div>
                      {church.isLive ? (
                        <Radio className="h-4 w-4 text-red-300" />
                      ) : (
                        <MapPinned className="h-4 w-4 text-zinc-500" />
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="glass-card rounded-[1.9rem] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-400/15">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <h2 className="section-title mt-5 text-2xl font-semibold text-zinc-50">
                  {pillar.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-zinc-400">{pillar.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="como-funciona"
          className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8 lg:py-24"
        >
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{t("howItWorks.eyebrow")}</p>
            <h2 className="section-title mt-4 text-4xl font-semibold text-zinc-50">
              {t("howItWorks.title")}
            </h2>
            <p className="mt-4 text-base leading-8 text-zinc-400">
              {t("howItWorks.description")}
            </p>
            <div className="mt-8 space-y-3">
              <a
                href={PANEL_URL}
                className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/30 hover:text-white"
              >
                {t("howItWorks.panelCta")}
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div key={step} className="glass-card rounded-[1.7rem] p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-950/90 text-sm font-semibold text-zinc-50">
                    0{index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-7 text-zinc-300">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          id="para-comunidades"
          className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        >
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="glass-card rounded-[2rem] p-7 sm:p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                {t("forCommunities.eyebrow")}
              </p>
              <h2 className="section-title mt-4 text-4xl font-semibold text-zinc-50">
                {t("forCommunities.title")}
              </h2>
              <p className="mt-4 text-base leading-8 text-zinc-400">
                {t("forCommunities.description")}
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {requirements.map((requirement) => (
                  <div key={requirement.title} className="rounded-[1.5rem] border border-white/8 bg-zinc-950/70 p-5">
                    <requirement.icon className="h-5 w-5 text-emerald-300" />
                    <p className="mt-4 font-semibold text-zinc-50">{requirement.title}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{requirement.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div id="app" className="glass-card rounded-[2rem] p-7 sm:p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                {t("forPeople.eyebrow")}
              </p>
              <h2 className="section-title mt-4 text-4xl font-semibold text-zinc-50">
                {t("forPeople.title")}
              </h2>
              <p className="mt-4 text-base leading-8 text-zinc-400">
                {t("forPeople.description")}
              </p>

              <div className="mt-8 space-y-4">
                {appJourney.map((item) => (
                  <div key={item.title} className="rounded-[1.5rem] border border-white/8 bg-zinc-950/70 p-5">
                    <p className="font-semibold text-zinc-50">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={APP_CTA_URL}
                  className="inline-flex rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
                >
                  {t("hero.appCta")}
                </a>
                <Link
                  href="/comunidades"
                  className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/30 hover:text-white"
                >
                  {t("forPeople.mapCta")}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="glass-card rounded-[2rem] p-8 text-center sm:p-10">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{t("finalCta.eyebrow")}</p>
            <h2 className="section-title mt-4 text-4xl font-semibold text-zinc-50">
              {t("finalCta.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-zinc-400">
              {t("finalCta.description")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/cadastro-comunidade"
                className="inline-flex rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
              >
                {t("hero.registerCta")}
              </Link>
              <Link
                href="/comunidades"
                className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/30 hover:text-white"
              >
                {t("finalCta.exploreCta")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
