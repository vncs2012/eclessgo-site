"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPinned, Radio, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { PublicChurchListItem } from "@/types/public";

interface ChurchFinderResultsProps {
  churches: PublicChurchListItem[];
  selectedChurchId: string | null;
  selectedChurch: PublicChurchListItem | null;
  statusMessage: string;
  hasActiveFilters: boolean;
  isLoading: boolean;
  onSelectChurch: (churchId: string) => void;
  onClearFilters: () => void;
}

export function ChurchFinderResults({
  churches,
  selectedChurchId,
  selectedChurch,
  statusMessage,
  hasActiveFilters,
  isLoading,
  onSelectChurch,
  onClearFilters,
}: ChurchFinderResultsProps) {
  const t = useTranslations("finder");

  return (
    <div className="space-y-4" aria-busy={isLoading}>
      <div className="glass-card rounded-[1.75rem] p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-1 h-5 w-5 text-emerald-300" />
          <div>
            <p className="font-semibold text-zinc-50">{t("directoryRealtime")}</p>
            <p className="mt-1 text-sm leading-6 text-zinc-400" role="status" aria-live="polite">
              {statusMessage}
            </p>
          </div>
        </div>
      </div>

      {churches.length === 0 ? (
        <div className="glass-card rounded-[1.75rem] p-6 text-center">
          <Image
            src="/illustrations/empty-communities.png"
            alt=""
            aria-hidden="true"
            width={800}
            height={600}
            className="mx-auto h-auto w-full max-w-[280px]"
          />
          <p className="mt-4 font-display text-xl font-semibold text-zinc-50">{t("empty.title")}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-400">
            {hasActiveFilters ? t("empty.withFilters") : t("empty.noFilters")}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex min-h-11 items-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/30 hover:text-white"
              >
                {isLoading ? t("empty.clearing") : t("empty.clearFilters")}
              </button>
            ) : null}
            <Link
              href="/cadastro-comunidade"
              className="inline-flex min-h-11 items-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
            >
              {t("empty.register")}
            </Link>
          </div>
        </div>
      ) : (
        churches.map((church) => (
          <article
            key={church.id}
            className={cn(
              "glass-card w-full rounded-[1.75rem] p-5 text-left transition hover:-translate-y-0.5",
              church.id === selectedChurchId && "border-emerald-400/35",
            )}
          >
            <button
              type="button"
              onClick={() => onSelectChurch(church.id)}
              aria-pressed={church.id === selectedChurchId}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl font-semibold text-zinc-50">{church.name}</h3>
                    {church.isLive ? (
                      <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-200">
                        <Radio className="mr-1.5 h-3.5 w-3.5" />
                        {t("card.live")}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm font-medium text-emerald-300">{church.denomination}</p>
                  {(church.neighborhood || church.city) ? (
                    <p className="text-xs text-zinc-500">
                      {[church.neighborhood, church.city].filter(Boolean).join(" • ")}
                    </p>
                  ) : null}
                  <p className="text-sm leading-6 text-zinc-400">{church.addressLine}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                    {church.distanceKm !== null ? (
                      <span className="rounded-full border border-white/8 bg-zinc-950/80 px-2.5 py-1">
                        {t("card.km", { km: church.distanceKm.toFixed(1) })}
                      </span>
                    ) : null}
                    <span className="rounded-full border border-white/8 bg-zinc-950/80 px-2.5 py-1">
                      {t("card.plan", { plan: church.plan })}
                    </span>
                    <span className="rounded-full border border-white/8 bg-zinc-950/80 px-2.5 py-1">
                      {t("card.members", { count: church.memberCount })}
                    </span>
                  </div>
                </div>

                <MapPinned className="h-5 w-5 shrink-0 text-zinc-500" />
              </div>
            </button>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href={`/comunidades/${church.slug}`}
                className="inline-flex min-h-11 items-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
              >
                {t("card.viewPublic")}
              </Link>
              <span className="text-xs text-zinc-500">{t("card.hint")}</span>
            </div>
          </article>
        ))
      )}

      {selectedChurch ? (
        <div className="glass-card rounded-[1.75rem] p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">{t("highlighted.eyebrow")}</p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="font-display text-2xl font-semibold text-zinc-50">{selectedChurch.name}</h3>
              <p className="mt-1 text-sm text-zinc-400">{selectedChurch.addressLine}</p>
            </div>
            <Link
              href={`/comunidades/${selectedChurch.slug}`}
              className="inline-flex min-h-11 items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300/30 hover:bg-emerald-500/20"
            >
              {t("highlighted.openFull")}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
