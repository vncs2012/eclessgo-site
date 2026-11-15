import Link from "next/link";
import { ArrowRight, CalendarDays, LocateFixed, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { HomeArt } from "@/components/site/home-art";
import { HomeFeatures, type HomeFeatureOption } from "@/components/site/home-features";
import { HomeNearby } from "@/components/site/home-nearby";
import { buildTraditionShortcuts, traditionHref } from "@/components/site/home-shortcuts";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import {
  FEATURE_ICONS,
  VISIT_FEATURE_CODES,
  countDayFilter,
  countFeature,
  daysForFilters,
  featureHref,
} from "@/lib/church-features";
import { getPublicChurchesPage } from "@/lib/public-api";
import { PUBLIC_CACHE_TTL_SECONDS } from "@/lib/public-cache";
import { formatTradition, numberResults } from "@/lib/public-church-utils";
import { GOIANIA_CENTER, PANEL_URL } from "@/lib/site-config";
import type { PublicChurchListItem } from "@/types/public";

export const revalidate = 300;

/** Quantas comunidades a Home carrega para contar tradições e montar a prévia. */
const HOME_CHURCH_LIMIT = 100;
const NEARBY_COUNT = 4;

type HomeChurches = {
  churches: PublicChurchListItem[];
  /** Total de comunidades que casam com o filtro (da API); null quando a API não informa. */
  total: number | null;
};

async function loadHomeChurches(): Promise<HomeChurches> {
  try {
    const page = await getPublicChurchesPage(
      { lat: GOIANIA_CENTER.lat, lng: GOIANIA_CENTER.lng, limit: HOME_CHURCH_LIMIT },
      { next: { revalidate: PUBLIC_CACHE_TTL_SECONDS.landingFeaturedChurches } },
    );
    return {
      churches: page.churches,
      total: page.total,
    };
  } catch (error) {
    console.warn(
      "[home] API publica indisponivel:",
      error instanceof Error ? error.message : error,
    );
    return { churches: [], total: null };
  }
}

type HomeFeatureCount = {
  id: string;
  count: number;
} & ({ kind: "feature"; code: (typeof VISIT_FEATURE_CODES)[number] } | { kind: "weekdays" });

/**
 * Quantas comunidades marcaram cada instalação de "Para a visita" e quantas costumam ter
 * encontro durante a semana. Se a Home carregou todas (`total` <= carregadas), conta
 * localmente, sem custo. Senão, uma requisição `limit=1` por opção lê o `meta.total` da API
 * (cacheada como o resto da Home). Opção cuja contagem falhar fica de fora (sem número estimado).
 */
async function loadFeatureCounts(home: HomeChurches): Promise<HomeFeatureCount[]> {
  const complete = home.total !== null && home.churches.length >= home.total;
  if (complete) {
    return [
      ...VISIT_FEATURE_CODES.map((code) => ({
        id: code,
        kind: "feature" as const,
        code,
        count: countFeature(home.churches, code),
      })),
      {
        id: "WEEKDAYS",
        kind: "weekdays" as const,
        count: countDayFilter(home.churches, "WEEKDAYS"),
      },
    ];
  }
  if (home.total === null && home.churches.length === 0) return [];
  const count = async (filters: { features?: string[]; days?: string[] }) => {
    try {
      const page = await getPublicChurchesPage(
        { lat: GOIANIA_CENTER.lat, lng: GOIANIA_CENTER.lng, ...filters, limit: 1 },
        { next: { revalidate: PUBLIC_CACHE_TTL_SECONDS.landingFeaturedChurches } },
      );
      return page.total;
    } catch {
      return null;
    }
  };
  const results = await Promise.all([
    ...VISIT_FEATURE_CODES.map(async (code) => {
      const total = await count({ features: [code] });
      return total === null ? null : { id: code, kind: "feature" as const, code, count: total };
    }),
    (async () => {
      const total = await count({ days: daysForFilters(["WEEKDAYS"]) });
      return total === null ? null : { id: "WEEKDAYS", kind: "weekdays" as const, count: total };
    })(),
  ]);
  return results.filter((item): item is NonNullable<typeof item> => item !== null);
}

const FOCUS_ON_PHOTO =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eg-focus";
const WRAP = "mx-auto w-full max-w-[var(--eg-content-max)] px-4 sm:px-6 lg:px-10";
const KICKER = "text-xs font-bold uppercase tracking-[0.08em] text-eg-warm";
const SECTION_TITLE =
  "mt-2 font-display text-[clamp(1.75rem,3.4vw,2.25rem)] font-extrabold leading-tight tracking-[-0.03em] text-eg-strong";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tf = await getTranslations("finder");
  const tv = await getTranslations("features");
  const home = await loadHomeChurches();
  const { churches, total } = home;

  const labels = tf.raw("traditions") as Record<string, string>;
  const shortcuts = buildTraditionShortcuts(churches, (value) => formatTradition(value, labels));
  // Sem localização da pessoa, a distância seria a do centro da cidade: não mostramos.
  const nearby = numberResults(
    churches.slice(0, NEARBY_COUNT).map((church) => ({ ...church, distanceKm: null })),
  );

  // Contagem real por opção (instalação ou dia); opção sem comunidade (ou sem contagem) não
  // aparece e, sem nenhuma opção, a seção some.
  const featureOptions: HomeFeatureOption[] = (await loadFeatureCounts(home)).map((item) =>
    item.kind === "feature"
      ? {
          id: item.id,
          label: tv(`short.${item.code}`),
          description: tv(`hints.${item.code}`),
          count: item.count,
          href: featureHref([item.code]),
          icon: FEATURE_ICONS[item.code],
        }
      : {
          id: item.id,
          label: t("features.weekdays.label"),
          description: t("features.weekdays.description"),
          count: item.count,
          href: "/comunidades?dia=WEEKDAYS",
          icon: CalendarDays,
        },
  );

  const steps = [
    { number: "01", photo: 4 as const, key: "first" as const },
    { number: "02", photo: 3 as const, key: "second" as const },
    { number: "03", photo: 2 as const, key: "third" as const },
  ];
  const requirements = ["address", "point", "schedule", "contact"] as const;

  return (
    <div className="min-h-screen bg-eg-app text-eg-text">
      <section
        aria-label={t("hero.label")}
        className="relative isolate flex min-h-[660px] items-end overflow-hidden bg-eg-nav text-white"
      >
        <HomeArt photo={1} className="absolute inset-0 -z-20" />
        {/* Escurecimento para o texto branco (contraste AA): véu uniforme + degradê de token. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[var(--eg-scrim)] opacity-60"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{ backgroundImage: "var(--eg-photo-scrim-strong)" }}
        />
        <SiteHeader variant="overlay" />

        <div className={`${WRAP} pb-14 pt-36 lg:pb-16`}>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-white">
            {total !== null && total > 0
              ? t("hero.eyebrowCount", { count: total })
              : t("hero.eyebrow")}
          </p>
          <h1 className="mt-3 max-w-[13ch] font-display text-[clamp(2.5rem,5.4vw,4.75rem)] font-extrabold leading-[1.04] tracking-[-0.04em] text-white">
            {t("hero.title")}
          </h1>
          <p className="mb-6 mt-4 max-w-[50ch] text-[clamp(1.0625rem,1rem+0.3vw,1.25rem)] leading-relaxed text-white">
            {t("hero.subtitle")}
          </p>

          <form
            role="search"
            action="/comunidades"
            method="get"
            aria-label={t("hero.search.aria")}
            className="flex max-w-[780px] flex-wrap items-center gap-2 rounded-[20px] bg-eg-surface p-2 pl-4 text-eg-muted shadow-[var(--eg-shadow-lg)] sm:flex-nowrap sm:pl-5"
          >
            <MapPin className="hidden h-5 w-5 shrink-0 sm:block" aria-hidden="true" />
            <label htmlFor="home-search" className="sr-only">
              {t("hero.search.label")}
            </label>
            <input
              id="home-search"
              type="search"
              name="q"
              enterKeyHint="search"
              autoComplete="off"
              placeholder={t("hero.search.placeholder")}
              className={`h-12 min-w-0 flex-1 basis-full rounded-md bg-transparent px-1 text-base text-eg-strong placeholder:text-eg-muted sm:h-14 sm:basis-auto sm:text-lg ${FOCUS}`}
            />
            <Link
              href="/comunidades?localizar=1"
              className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-eg-primary-soft px-3.5 text-sm font-semibold text-eg-primary-text transition-colors hover:bg-eg-hover sm:flex-none ${FOCUS}`}
            >
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
              {t("hero.search.locate")}
            </Link>
            <button
              type="submit"
              className={`inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-[14px] bg-eg-primary px-7 text-base font-bold text-eg-inverse transition-colors hover:bg-eg-primary-hover sm:h-14 sm:flex-none ${FOCUS}`}
            >
              <span className="font-bold">{t("hero.search.submit")}</span>
            </button>
          </form>

          {shortcuts.items.length > 0 ? (
            <div className="mt-[18px] flex flex-wrap items-center gap-x-3 gap-y-2.5 text-[15px]">
              <span className="font-semibold text-white">{t("hero.traditionsLabel")}</span>
              <ul aria-label={t("hero.traditionsAria")} className="flex flex-wrap gap-2.5">
                {shortcuts.items.map((item) => (
                  <li key={item.label}>
                    <TraditionChip
                      href={traditionHref(item.values)}
                      label={item.label}
                      count={item.count}
                      ariaLabel={t("hero.traditionLink", { label: item.label, count: item.count })}
                    />
                  </li>
                ))}
                {shortcuts.others ? (
                  <li>
                    <TraditionChip
                      href={traditionHref(shortcuts.others.values)}
                      label={t("hero.others")}
                      count={shortcuts.others.count}
                      ariaLabel={t("hero.traditionLink", {
                        label: t("hero.others"),
                        count: shortcuts.others.count,
                      })}
                    />
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <main>
        {nearby.length > 0 ? <HomeNearby items={nearby} center={GOIANIA_CENTER} /> : null}

        <HomeFeatures options={featureOptions} />

        <section
          id="como-funciona"
          aria-labelledby="home-how-title"
          className="mt-20 scroll-mt-20 bg-eg-alt py-14 lg:mt-24 lg:py-24"
        >
          <div className={WRAP}>
            <p className={KICKER}>{t("how.eyebrow")}</p>
            <h2 id="home-how-title" className={SECTION_TITLE}>
              {t("how.title")}
            </h2>
            <ol className="mt-9 grid gap-9 md:grid-cols-3 md:gap-7">
              {steps.map((step) => (
                // O app aparece no passo 2 ("Aparece na busca e no app"): âncora do rodapé (/#app).
                <li
                  key={step.number}
                  id={step.key === "second" ? "app" : undefined}
                  className="scroll-mt-20"
                >
                  <HomeArt photo={step.photo} className="aspect-[4/3] rounded-3xl" />
                  <span
                    aria-hidden="true"
                    className="mb-2 mt-[18px] block font-display text-[44px] font-extrabold leading-none tracking-[-0.04em] text-eg-warm"
                  >
                    {step.number}
                  </span>
                  <h3 className="font-display text-[22px] font-extrabold leading-snug text-eg-strong">
                    {t(`how.steps.${step.key}.title`)}
                  </h3>
                  <p className="mt-2 text-eg-text">{t(`how.steps.${step.key}.description`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="para-comunidades"
          aria-labelledby="home-for-title"
          className={`${WRAP} grid scroll-mt-20 items-center gap-10 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24`}
        >
          <div>
            <p className={KICKER}>{t("forCommunities.eyebrow")}</p>
            <h2 id="home-for-title" className={SECTION_TITLE}>
              {t("forCommunities.title")}
            </h2>
            <p className="mt-3 text-lg text-eg-text">{t("forCommunities.lead")}</p>
            <ul className="mb-7 mt-5 grid gap-x-6 gap-y-[18px] sm:grid-cols-2">
              {requirements.map((key, index) => (
                <li key={key} className="flex items-start gap-3.5">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-eg-warm-soft font-bold text-eg-warm"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <b className="block text-eg-strong">
                      {t(`forCommunities.requirements.${key}.title`)}
                    </b>
                    <span className="text-[15px] text-eg-muted">
                      {t(`forCommunities.requirements.${key}.description`)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/cadastro-comunidade"
                className={`inline-flex min-h-12 items-center gap-2 rounded-full bg-eg-primary px-6 text-base font-bold text-eg-inverse transition-colors hover:bg-eg-primary-hover ${FOCUS}`}
              >
                {t("forCommunities.register")}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href={PANEL_URL}
                className={`inline-flex min-h-12 items-center rounded-full border border-eg-border-strong px-6 text-base font-bold text-eg-strong transition-colors hover:bg-eg-hover ${FOCUS}`}
              >
                {t("forCommunities.panel")}
              </a>
            </div>
          </div>
          <HomeArt
            photo={3}
            className="aspect-[4/3] rounded-3xl shadow-[var(--eg-shadow-md)] lg:aspect-auto lg:min-h-[420px]"
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function TraditionChip({
  href,
  label,
  count,
  ariaLabel,
}: {
  href: string;
  label: string;
  count: number;
  ariaLabel: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-white/55 bg-white/15 px-4 font-semibold text-white transition-colors hover:bg-white/25 ${FOCUS_ON_PHOTO}`}
    >
      <span aria-hidden="true">{label}</span>
      <span aria-hidden="true" className="font-mono text-[12.5px] font-normal opacity-90">
        {count}
      </span>
    </Link>
  );
}
