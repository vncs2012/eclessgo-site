import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Church,
  HeartHandshake,
  MapPinned,
  Radio,
  ShieldCheck,
} from "lucide-react";

import { ChurchContactCard } from "@/components/site/church-contact-card";
import { ChurchDetailActions } from "@/components/site/church-detail-actions";
import { ChurchMap } from "@/components/site/church-map";
import { PublicAnalyticsBeacon } from "@/components/site/public-analytics-beacon";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { PUBLIC_CACHE_TTL_SECONDS } from "@/lib/public-cache";
import { PublicUpstreamTimeoutError } from "@/lib/public-bff";
import { ApiRequestError, getPublicChurchBySlug, getPublicChurches } from "@/lib/public-api";
import { SITE_URL } from "@/lib/site-config";
import type { PublicChurchDetails, PublicChurchListItem } from "@/types/public";

export const dynamic = "force-dynamic";
export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

const WEEKDAY_LABELS: Record<string, string> = {
  MONDAY: "Segunda-feira",
  TUESDAY: "Terça-feira",
  WEDNESDAY: "Quarta-feira",
  THURSDAY: "Quinta-feira",
  FRIDAY: "Sexta-feira",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

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

function pickRecordValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function localizeScheduleDay(value: string | null) {
  if (!value) return null;
  return WEEKDAY_LABELS[value.toUpperCase()] || value;
}

function normalizeScheduleEntries(schedule: unknown[]) {
  return schedule
    .map((entry, index) => {
      if (typeof entry === "string" && entry.trim()) {
        return {
          id: `${index}-${entry}`,
          title: entry.trim(),
          meta: null,
          description: null,
        };
      }

      if (!entry || typeof entry !== "object") return null;

      const record = entry as Record<string, unknown>;
      const title =
        pickRecordValue(record, ["title", "name", "service", "label"]) || `Programação ${index + 1}`;
      const day = localizeScheduleDay(pickRecordValue(record, ["day", "weekday", "date"]));
      const time = pickRecordValue(record, ["time", "start_time", "hour"]);
      const description = pickRecordValue(record, ["description", "details", "notes"]);

      return {
        id: String(record.id || record.slug || index),
        title,
        meta: [day, time].filter(Boolean).join(" • ") || null,
        description,
      };
    })
    .filter((item): item is { id: string; title: string; meta: string | null; description: string | null } => item !== null);
}

function toMapChurch(church: PublicChurchDetails): PublicChurchListItem[] {
  if (!church.location) return [];

  return [
    {
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
    },
  ];
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
      `[igrejas/${slug}] API publica indisponivel:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

function PublicChurchUnavailable({ slug }: { slug: string }) {
  return (
    <div className="site-shell min-h-screen bg-background text-foreground">
      <div className="grid-noise absolute inset-0 opacity-35" aria-hidden="true" />
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <section
          className="glass-card rounded-[2rem] border border-amber-400/20 bg-amber-500/5 p-8 sm:p-10"
          aria-labelledby="public-church-unavailable-title"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-amber-200">Diretório público</p>
          <h1
            id="public-church-unavailable-title"
            className="mt-4 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl"
          >
            Esta página está temporariamente indisponível
          </h1>
          <p className="mt-5 text-base leading-8 text-zinc-300">
            O serviço de dados não respondeu agora. Tente novamente em alguns instantes ou volte ao
            mapa público.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/comunidades"
              className="inline-flex rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
            >
              Voltar ao mapa
            </Link>
            <Link
              href={`/comunidades/${slug}`}
              className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/30 hover:bg-emerald-500/20"
            >
              Tentar novamente
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

export default async function ChurchDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const church = await loadChurch(slug);
  if (!church) return <PublicChurchUnavailable slug={slug} />;

  const publicUrl = `${SITE_URL}/comunidades/${church.slug}`;
  const email = pickRecordValue(church.contact, ["email", "contact_email"]);
  const phone = pickRecordValue(church.contact, ["phone", "whatsapp", "contact_phone"]);
  const scheduleEntries = normalizeScheduleEntries(church.schedule);
  const mapChurches = toMapChurch(church);

  return (
    <div className="site-shell min-h-screen bg-background text-foreground">
      <div className="grid-noise absolute inset-0 opacity-35" aria-hidden="true" />
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Link
          href="/comunidades"
          className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-emerald-400/30 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar ao mapa de comunidades
        </Link>

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

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-card rounded-[2rem] p-8 sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/8 bg-zinc-950/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                Página pública
              </span>
              {church.isLive ? (
                <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-200">
                  <Radio className="mr-1.5 h-3.5 w-3.5" />
                  Ao vivo agora
                </span>
              ) : null}
            </div>

            <h1 className="section-title mt-6 text-5xl font-semibold tracking-tight text-zinc-50">
              {church.name}
            </h1>
            <p className="mt-4 text-lg font-medium text-emerald-300">{church.denomination}</p>

            <p className="mt-6 text-base leading-8 text-zinc-300">
              {church.description || "Esta comunidade já está publicada no diretório do EclessGO."}
            </p>

            <ChurchDetailActions
              churchId={church.id}
              churchName={church.name}
              publicUrl={publicUrl}
              slug={church.slug}
            />

            <p className="mt-4 text-xs text-zinc-500">
              Link público: <span className="text-zinc-300">{publicUrl}</span>
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/8 bg-zinc-950/70 p-5">
                <Church className="h-5 w-5 text-emerald-300" />
                <p className="mt-4 text-sm text-zinc-500">Plano</p>
                <p className="mt-1 font-semibold text-zinc-50">{church.plan}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/8 bg-zinc-950/70 p-5">
                <HeartHandshake className="h-5 w-5 text-emerald-300" />
                <p className="mt-4 text-sm text-zinc-500">Membros</p>
                <p className="mt-1 font-semibold text-zinc-50">{church.memberCount}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/8 bg-zinc-950/70 p-5">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <p className="mt-4 text-sm text-zinc-500">Doações</p>
                <p className="mt-1 font-semibold text-zinc-50">
                  {church.donationsEnabled ? "Disponíveis" : "Não configuradas"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="glass-card rounded-[1.9rem] p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Endereço</p>
              <div className="mt-4 flex items-start gap-3">
                <MapPinned className="mt-1 h-5 w-5 text-emerald-300" />
                <p className="text-sm leading-7 text-zinc-300">{church.addressLine}</p>
              </div>
              {church.location ? (
                <p className="mt-4 text-xs text-zinc-500">
                  Coordenadas: {church.location.lat.toFixed(6)}, {church.location.lng.toFixed(6)}
                </p>
              ) : (
                <p className="mt-4 text-xs text-zinc-500">
                  Esta comunidade ainda não possui coordenadas públicas para o mapa.
                </p>
              )}
            </div>

            <ChurchContactCard
              churchId={church.id}
              slug={church.slug}
              email={email}
              phone={phone}
              pixKey={church.pixKey}
            />
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.95fr]">
          <div className="glass-card rounded-[1.9rem] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Programação</p>
            {scheduleEntries.length > 0 ? (
              <div className="mt-5 grid gap-4">
                {scheduleEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.4rem] border border-white/8 bg-zinc-950/70 p-5"
                  >
                    <p className="font-semibold text-zinc-50">{entry.title}</p>
                    {entry.meta ? (
                      <p className="mt-2 text-sm font-medium text-emerald-300">{entry.meta}</p>
                    ) : null}
                    {entry.description ? (
                      <p className="mt-2 text-sm leading-7 text-zinc-400">{entry.description}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-7 text-zinc-400">
                A comunidade ainda não publicou uma programação visível no diretório público.
              </p>
            )}
          </div>

          <div className="glass-card rounded-[1.9rem] p-4 sm:p-5">
            <div className="mb-4 px-2">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Mapa local</p>
              <p className="mt-1 text-sm text-zinc-300">
                O marker destaca a localização pública da comunidade na plataforma web.
              </p>
            </div>
            {mapChurches.length > 0 && church.location ? (
              <ChurchMap
                churches={mapChurches}
                center={church.location}
                selectedChurchId={church.id}
              />
            ) : (
              <div className="flex min-h-[340px] items-center justify-center rounded-[1.5rem] border border-white/8 bg-zinc-950/80 px-6 text-center text-sm leading-7 text-zinc-400">
                Sem latitude e longitude válidas, a comunidade não pode ser exibida no mapa web.
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
