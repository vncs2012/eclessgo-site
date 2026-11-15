import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { ChurchProfileAttributes, ChurchProfileContact } from "@/components/site/church-profile-sections";
import { ChurchPublicActivities } from "@/components/site/church-public-activities";
import { CommunityMobileBar } from "@/components/site/community-actions";
import { CommunityClickTracker } from "@/components/site/community-click-tracker";
import { CommunityContribute } from "@/components/site/community-contribute";
import { CommunityDirections } from "@/components/site/community-directions";
import { CommunityHeaderSearch } from "@/components/site/community-header-search";
import { CommunityHero, CommunityTopBar } from "@/components/site/community-hero";
import { CommunityNearby } from "@/components/site/community-nearby";
import { CommunitySectionNav, CommunityUpdateStamp } from "@/components/site/community-section-nav";
import {
  CommunityAbout,
  CommunityPeople,
  CommunitySchedule,
  CommunityScheduleNote,
  type CommunityPerson,
} from "@/components/site/community-sections";
import { CommunitySummary } from "@/components/site/community-summary";
import { PublicAnalyticsBeacon } from "@/components/site/public-analytics-beacon";
import { PublicInformationAssistant } from "@/components/site/public-information-assistant";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { PublicUpstreamTimeoutError } from "@/lib/public-bff";
import { PUBLIC_CACHE_TTL_SECONDS } from "@/lib/public-cache";
import { ApiRequestError, getPublicChurchBySlug, getPublicChurches } from "@/lib/public-api";
import { buildPublicChurchProfile } from "@/lib/public-church-profile";
import { formatTradition, summarizeSchedule } from "@/lib/public-church-utils";
import {
  availableSections,
  buildCommunityAddress,
  buildCommunityContact,
  formatShortDate,
  formatUpdatedDate,
  googleMapsUrl,
  groupFeatures,
  messageAction,
  networkDisplay,
  normalizeScheduleRows,
  safeHttpsUrl,
  wazeUrl,
  type SectionId,
} from "@/lib/public-community-page";
import { resolvePublicInformationAssistant } from "@/lib/public-information-assistant-resolver";
import { SITE_URL } from "@/lib/site-config";
import type { PublicChurchDetails, PublicChurchListItem } from "@/types/public";

export const dynamic = "force-dynamic";
export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Quantas "Outras comunidades perto" aparecem (o pin 1 do mapa é esta comunidade). */
const NEARBY_LIMIT = 3;

/**
 * "Quem é quem": a API ainda não envia pessoas (Etapa 3). Com a lista vazia a seção não
 * aparece; quando o dado existir, basta preencher aqui a partir de `church`.
 */
const NO_PEOPLE: CommunityPerson[] = [];

export async function generateStaticParams() {
  try {
    const churches = await getPublicChurches(
      { limit: 100 },
      { next: { revalidate: PUBLIC_CACHE_TTL_SECONDS.churchStaticParams } },
    );

    return churches.filter((church) => church.slug).map((church) => ({ slug: church.slug }));
  } catch {
    return [];
  }
}

function toMapChurch(church: PublicChurchDetails): PublicChurchListItem | null {
  if (!church.location) return null;

  return {
    id: church.id,
    slug: church.slug,
    name: church.name,
    denomination: church.denomination,
    addressLine: church.addressLine,
    city: church.city,
    state: church.state,
    neighborhood: church.neighborhood,
    location: church.location,
    description: church.description,
    isLive: church.isLive,
    memberCount: church.memberCount,
    plan: church.plan,
    distanceKm: null,
    thumbnail: null,
  };
}

async function loadChurch(slug: string) {
  try {
    return await getPublicChurchBySlug(slug, {
      next: { revalidate: PUBLIC_CACHE_TTL_SECONDS.churchDetail },
    });
  } catch (error) {
    if (error instanceof ApiRequestError && error.statusCode === 404) {
      notFound();
    }

    const upstreamUnavailable =
      error instanceof TypeError ||
      error instanceof PublicUpstreamTimeoutError ||
      (error instanceof ApiRequestError && error.statusCode >= 500);

    if (!upstreamUnavailable) throw error;

    console.warn(
      `[comunidades/${slug}] API publica indisponivel:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/** Vizinhas mais próximas desta comunidade; qualquer falha só esconde a seção. */
async function loadNearby(church: PublicChurchDetails) {
  if (!church.location) return [];

  try {
    const churches = await getPublicChurches(
      { lat: church.location.lat, lng: church.location.lng, limit: NEARBY_LIMIT + 2 },
      { next: { revalidate: PUBLIC_CACHE_TTL_SECONDS.directoryInitialChurches } },
    );
    // O número 1 é esta comunidade (pin de "Como chegar"); as vizinhas seguem de 2 em diante.
    return churches
      .filter((item) => item.id !== church.id && item.slug !== church.slug)
      .slice(0, NEARBY_LIMIT)
      .map((item, index) => ({ church: item, number: index + 2 }));
  } catch {
    return [];
  }
}

async function loadAssistantAvailability() {
  try {
    return (await resolvePublicInformationAssistant()).kind === "ready";
  } catch {
    // Disponibilidade é só um retrato; uma checagem que falha continua indisponível.
    return false;
  }
}

async function PublicChurchUnavailable({ slug }: { slug: string }) {
  const t = await getTranslations("finder");
  const link =
    "inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-eg-focus";

  return (
    <div className="min-h-screen bg-eg-app text-eg-text">
      <SiteHeader variant="solid" />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <section
          className="rounded-3xl border border-eg-border bg-eg-surface p-8 sm:p-10"
          aria-labelledby="public-church-unavailable-title"
        >
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-eg-warm">
            {t("detail.unavailable.eyebrow")}
          </p>
          <h1
            id="public-church-unavailable-title"
            className="mt-3 font-display text-3xl font-extrabold tracking-tight text-eg-strong sm:text-4xl"
          >
            {t("detail.unavailable.title")}
          </h1>
          <p className="mt-4 text-base leading-7 text-eg-text">{t("detail.unavailable.description")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/comunidades"
              className={`${link} bg-eg-primary text-eg-inverse hover:bg-eg-primary-hover`}
            >
              {t("detail.unavailable.back")}
            </Link>
            <Link
              href={`/comunidades/${slug}`}
              className={`${link} border-[1.5px] border-eg-border-strong text-eg-strong hover:bg-eg-hover`}
            >
              {t("detail.unavailable.retry")}
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const church = await getPublicChurchBySlug(slug, {
      next: { revalidate: PUBLIC_CACHE_TTL_SECONDS.churchDetail },
    });
    const locality = [church.city, church.state].filter(Boolean).join(" - ");
    const title = locality ? `${church.name} em ${locality} | EclessGO` : `${church.name} | EclessGO`;
    const description =
      church.description ||
      `${church.name} está publicada no diretório público do EclessGO${locality ? ` em ${locality}` : ""}.`;
    return {
      title,
      description,
      alternates: {
        canonical: `/comunidades/${church.slug}`,
      },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/comunidades/${church.slug}`,
        type: "website",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Comunidade | EclessGO",
      description: "Página pública de comunidade no diretório EclessGO.",
    };
  }
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const church = await loadChurch(slug);
  if (!church) return <PublicChurchUnavailable slug={slug} />;

  const [assistantAvailable, nearby, tf, tp, locale] = await Promise.all([
    loadAssistantAvailability(),
    loadNearby(church),
    getTranslations("finder"),
    getTranslations("communityPage"),
    getLocale(),
  ]);

  const publicUrl = `${SITE_URL}/comunidades/${church.slug}`;
  const profile = buildPublicChurchProfile({
    features: church.features,
    contact: church.contact,
    thumbnail: church.thumbnail,
    photos: church.photos,
    mediaOrigin: process.env.NEXT_PUBLIC_MEDIA_ORIGIN,
  });
  const contact = buildCommunityContact(church.contact);
  const message = messageAction(contact);
  const address = buildCommunityAddress(church);
  const scheduleRows = normalizeScheduleRows(church.schedule);
  const mapItem = toMapChurch(church);
  const target = { location: church.location, addressLine: church.addressLine };
  const googleMapsHref = googleMapsUrl(target);
  const wazeHref = wazeUrl(target);
  const updatedDate = church.updatedAt ? formatUpdatedDate(church.updatedAt, locale) : null;
  const updatedShort = church.updatedAt ? formatShortDate(church.updatedAt, locale) : null;
  const instagramLink = profile.links.find((link) => link.key === "instagram");
  const photos = Array.from(
    new Set([profile.cover, ...profile.gallery].filter((url): url is string => Boolean(url))),
  );
  const tradition = formatTradition(church.denomination, tf.raw("traditions") as Record<string, string>);

  const scheduleLines = summarizeSchedule(
    scheduleRows.map((row) => ({ day: row.day, time: row.time, title: row.title })),
    (day) => (tf.has(`card.days.${day}`) ? tf(`card.days.${day}` as "card.days.SUNDAY") : day),
    (times) => times.join(tf("card.scheduleJoin")),
    6,
  );
  const scheduleSummary =
    scheduleLines.length > 0
      ? { main: scheduleLines[0], rest: scheduleLines.slice(1).join(" · ") || null }
      : null;

  const hasChannels = Boolean(contact.whatsapp || contact.phone || contact.email || profile.links.length > 0);
  const hasPix = church.donationsEnabled && Boolean(church.pixKey);
  const sectionIds = availableSections({
    sobre: Boolean(church.description?.trim()),
    horarios: scheduleRows.length > 0,
    "como-chegar": address.hasAddress || mapItem !== null,
    instalacoes: groupFeatures(profile.features).length > 0,
    "quem-e-quem": NO_PEOPLE.length > 0,
    contato: hasChannels,
    contribuir: hasPix,
    perto: nearby.length > 0,
  } satisfies Record<SectionId, boolean>);
  const sections = sectionIds.map((id) => ({ id, label: tp(`nav.${id}`) }));
  const updatedLabel = updatedDate ? tp("nav.updated", { date: updatedDate }) : null;
  // "Sugerir correção" depende do fluxo da Etapa 3 e o site não tem um e-mail de contato:
  // sem destino válido, o link não aparece.
  const suggestHref: string | null = null;

  return (
    <div
      className={`min-h-screen bg-eg-app text-eg-text ${
        googleMapsHref || message ? "max-md:pb-[calc(5.5rem+env(safe-area-inset-bottom))]" : ""
      }`}
    >
      {/* Abaixo de md o cabeçalho some: voltar e compartilhar ficam sobre a foto e a barra fixa
          de baixo cuida das ações. `contents` mantém o header sticky em md+. */}
      <div className="max-md:hidden md:contents">
        <SiteHeader variant="solid" search={<CommunityHeaderSearch />} />
      </div>

      <PublicAnalyticsBeacon
        churchId={church.id}
        eventType="PUBLIC_CHURCH_VIEW"
        source="WEB_DETAIL"
        path={`/comunidades/${church.slug}`}
        metadata={{
          denomination: church.denomination,
          city: church.city,
          state: church.state,
          isLive: church.isLive,
        }}
      />

      <CommunityClickTracker churchId={church.id} slug={church.slug}>
        <main className="mx-auto w-full max-w-[var(--eg-content-max)] px-4 pb-16 sm:px-6 lg:px-10">
          <CommunityTopBar name={church.name} neighborhood={church.neighborhood} />

          <CommunityHero
            churchId={church.id}
            slug={church.slug}
            name={church.name}
            tradition={tradition}
            neighborhood={church.neighborhood}
            cover={profile.cover}
            photos={photos}
            hasGallery={profile.gallery.length > 0}
            isLive={church.isLive}
            liveUrl={church.isLive ? safeHttpsUrl(church.liveUrl) : null}
            publicUrl={publicUrl}
          />

          <CommunitySummary
            address={address}
            schedule={scheduleSummary}
            contact={contact}
            instagram={instagramLink ? networkDisplay("instagram", instagramLink.url) : null}
            directionsUrl={googleMapsHref}
            message={message}
          />

          {scheduleRows.length > 0 ? (
            <CommunityScheduleNote
              short
              date={updatedShort}
              whatsappHref={contact.whatsapp?.href ?? null}
              className="mt-4 md:hidden"
            />
          ) : null}

          <div className="mt-4 lg:mt-10 lg:grid lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-14">
            <CommunitySectionNav
              sections={sections}
              ariaLabel={tp("nav.label")}
              updatedLabel={updatedLabel}
              suggestHref={suggestHref}
              suggestLabel={tp("nav.suggest")}
            />

            <div className="min-w-0 max-lg:mt-5">
              <CommunityAbout description={church.description} />
              <CommunitySchedule
                rows={scheduleRows}
                date={updatedDate}
                whatsappHref={contact.whatsapp?.href ?? null}
              />
              <CommunityDirections
                name={church.name}
                address={address}
                mapItem={mapItem}
                googleMapsHref={googleMapsHref}
                wazeHref={wazeHref}
              />
              <ChurchProfileAttributes features={profile.features} />
              <CommunityPeople people={NO_PEOPLE} />
              <ChurchProfileContact
                churchName={church.name}
                contact={contact}
                links={profile.links}
              />
              <CommunityContribute
                churchId={church.id}
                churchName={church.name}
                slug={church.slug}
                pixKey={church.pixKey}
                donationsEnabled={church.donationsEnabled}
              />
              <CommunityNearby items={nearby} name={church.name} />

              <CommunityUpdateStamp
                updatedLabel={updatedLabel}
                suggestHref={suggestHref}
                suggestLabel={tp("nav.suggest")}
                className="mt-2 border-t border-eg-border pt-5 lg:hidden"
              />
              <ChurchPublicActivities churchId={church.id} />
              <PublicInformationAssistant slug={church.slug} available={assistantAvailable} />
            </div>
          </div>
        </main>
      </CommunityClickTracker>

      <SiteFooter />
      <CommunityMobileBar directionsUrl={googleMapsHref} message={message} />
    </div>
  );
}
