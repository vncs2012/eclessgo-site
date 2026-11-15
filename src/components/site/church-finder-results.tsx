"use client";

import Image from "next/image";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { Check, Clock3, MapPin } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { FINDER_FOCUS } from "@/components/site/church-finder-search";
import { useTraditionLabel } from "@/components/site/church-finder-context";
import { featurePills } from "@/lib/church-features";
import { summarizeSchedule, type FinderSort } from "@/lib/public-church-utils";
import { cn } from "@/lib/utils";
import type { PublicChurchListItem } from "@/types/public";

export type NumberedChurch = { church: PublicChurchListItem; number: number };

interface ChurchFinderResultsProps {
  heading: string;
  results: NumberedChurch[];
  /** Dias filtrados (MONDAY..SUNDAY): os horários desses dias aparecem primeiro no card. */
  priorityDays?: readonly string[];
  remaining: number;
  selectedChurchId: string | null;
  sort: FinderSort;
  centerPlace: string;
  statusMessage: string;
  /** Status em destaque (erro, vazio, permissão); os demais só para leitores de tela. */
  statusVisible: boolean;
  hasActiveFilters: boolean;
  isLoading: boolean;
  /** Controles extras no topo (alça da gaveta no celular). */
  top?: ReactNode;
  onSortChange: (value: FinderSort) => void;
  onChangeCenter: () => void;
  onSelectChurch: (churchId: string) => void;
  onShowMore: () => void;
  onClearFilters: () => void;
}

const PHOTO_GRADIENTS = [
  "var(--eg-photo-1)",
  "var(--eg-photo-2)",
  "var(--eg-photo-4)",
  "var(--eg-photo-3)",
];

function formatDistance(
  km: number,
  t: ReturnType<typeof useTranslations<"finder">>,
  locale: string,
) {
  if (km < 1) return t("card.distanceM", { m: Math.max(10, Math.round((km * 1000) / 10) * 10) });
  return t("card.distanceKm", {
    km: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(km),
  });
}

function formatUpdatedAt(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

/** Exportado para a Home reaproveitar o mesmo cartão numerado da Busca. */
export function ResultCard({
  item,
  selected,
  onSelect,
  priorityDays = [],
}: {
  item: NumberedChurch;
  selected: boolean;
  onSelect: () => void;
  priorityDays?: readonly string[];
}) {
  const t = useTranslations("finder");
  const tv = useTranslations("features");
  const locale = useLocale();
  const { church, number } = item;
  const href = `/comunidades/${church.slug}`;
  const traditionLabel = useTraditionLabel();
  const tradition = traditionLabel(church.denomination);
  const distance = church.distanceKm !== null ? formatDistance(church.distanceKm, t, locale) : null;
  // md+: "tradição · bairro" com a distância à direita. Gaveta do celular: "tradição · distância".
  const meta = [tradition, church.neighborhood].filter(Boolean).join(" · ");
  const compactMeta = [tradition, distance].filter(Boolean).join(" · ");
  const scheduleLines = summarizeSchedule(
    church.schedule,
    (day) => (t.has(`card.days.${day}`) ? t(`card.days.${day}` as "card.days.SUNDAY") : day),
    (times) => times.join(t("card.scheduleJoin")),
    2,
    priorityDays,
  );
  // Até 3 pílulas, códigos do vocabulário primeiro (traduzidos); texto livre como veio.
  const features = featurePills(church.features, tv.raw("codes") as Record<string, string>);

  function handleClick(event: MouseEvent<HTMLElement>) {
    // Clique no card destaca no mapa; links e botões internos seguem o próprio comportamento.
    if ((event.target as HTMLElement).closest("a, button")) return;
    onSelect();
  }

  return (
    <li id={`finder-result-${church.id}`} className="scroll-mt-3">
      <article
        onClick={handleClick}
        className={cn(
          "relative grid cursor-pointer grid-cols-[auto_auto_minmax(0,1fr)] gap-3 rounded-xl border bg-eg-surface p-3 transition-colors md:gap-3.5",
          selected
            ? "border-eg-focus shadow-[0_0_0_1px_var(--eg-action-focus)]"
            : "border-eg-border hover:border-eg-border-strong",
        )}
      >
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={t("card.selectOnMap", { number, name: church.name })}
          className={cn(
            "mt-1 inline-flex h-7 min-w-7 shrink-0 cursor-pointer items-center justify-center self-start rounded-full px-1.5 text-xs font-bold transition-colors",
            "before:absolute before:-inset-2 before:content-[''] relative",
            selected
              ? "bg-[var(--eg-map-pin-selected)] text-eg-app"
              : "bg-[var(--eg-map-pin)] text-eg-app",
            FINDER_FOCUS,
          )}
        >
          <span className="text-xs font-bold">{number}</span>
        </button>

        <div
          aria-hidden="true"
          className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg md:h-24 md:w-24"
          style={{ background: PHOTO_GRADIENTS[(number - 1) % PHOTO_GRADIENTS.length] }}
        >
          {church.thumbnail ? (
            <Image
              src={church.thumbnail}
              alt=""
              fill
              sizes="96px"
              unoptimized
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              <h3 className="min-w-0 font-display text-[17px] font-extrabold leading-snug text-eg-strong">
                <Link
                  href={href}
                  className={cn(
                    "rounded-sm hover:underline hover:underline-offset-4",
                    FINDER_FOCUS,
                  )}
                >
                  {church.name}
                </Link>
              </h3>
              {church.isLive ? (
                <span
                  role="img"
                  className="mt-[3px] inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--eg-feedback-danger-soft)] px-2 py-0.5 text-[11px] font-bold leading-4 text-[var(--eg-feedback-danger-text)]"
                  aria-label={t("card.liveAria")}
                  title={t("card.liveAria")}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                  <span aria-hidden="true">{t("card.live")}</span>
                </span>
              ) : null}
            </div>
            {distance ? (
              <span className="hidden shrink-0 whitespace-nowrap pt-0.5 text-sm font-bold text-eg-strong md:inline">
                {distance}
              </span>
            ) : null}
          </div>
          {meta ? <p className="mt-0.5 hidden text-sm text-eg-muted md:block">{meta}</p> : null}
          {compactMeta ? (
            <p className="mt-0.5 text-sm text-eg-muted md:hidden">{compactMeta}</p>
          ) : null}

          {scheduleLines.length > 0 ? (
            <ul className="mt-2.5 grid gap-1 text-sm text-eg-strong">
              {scheduleLines.map((line, index) => (
                <li
                  key={line}
                  className={cn("flex items-start gap-2", index > 0 && "max-md:hidden")}
                >
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-eg-muted" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
          ) : null}

          {features.length > 0 ? (
            <ul className="mt-2.5 hidden flex-wrap gap-1.5 md:flex" aria-label={t("card.features")}>
              {features.map((feature) => (
                <li
                  key={feature}
                  className="rounded-full bg-eg-subtle px-2.5 py-1 text-xs font-semibold text-eg-text"
                >
                  {feature}
                </li>
              ))}
            </ul>
          ) : null}

          {church.updatedAt ? (
            <p className="mt-2 hidden items-center gap-1.5 text-xs text-eg-muted md:flex">
              <Check
                className="h-3.5 w-3.5 text-[var(--eg-feedback-success-text)]"
                aria-hidden="true"
              />
              {t("card.updatedAt", { date: formatUpdatedAt(church.updatedAt, locale) })}
            </p>
          ) : null}
        </div>
      </article>
    </li>
  );
}

export function ChurchFinderResults({
  heading,
  results,
  priorityDays,
  remaining,
  selectedChurchId,
  sort,
  centerPlace,
  statusMessage,
  statusVisible,
  hasActiveFilters,
  isLoading,
  top,
  onSortChange,
  onChangeCenter,
  onSelectChurch,
  onShowMore,
  onClearFilters,
}: ChurchFinderResultsProps) {
  const t = useTranslations("finder");

  return (
    <div className="flex min-h-0 flex-col" aria-busy={isLoading}>
      {top}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2
          id="finder-results-heading"
          className="font-display text-lg font-extrabold tracking-tight text-eg-strong md:text-[22px]"
        >
          {heading}
        </h2>
        <label className="sr-only" htmlFor="finder-sort">
          {t("results.sortLabel")}
        </label>
        {/* globals.css reseta `font` em select/button: o tamanho vem do pai. */}
        <div className="text-[13px] font-medium">
          <select
            id="finder-sort"
            value={sort}
            onChange={(event) => onSortChange(event.target.value as FinderSort)}
            className={cn(
              "h-10 cursor-pointer rounded-xl border border-eg-border-strong/70 bg-eg-surface px-3 text-[13px] font-medium text-eg-strong md:min-w-[200px]",
              FINDER_FOCUS,
            )}
          >
            <option value="distance">{t("results.sortDistance")}</option>
            <option value="name">{t("results.sortName")}</option>
          </select>
        </div>
      </div>

      <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[13px] text-eg-muted">
        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t("results.center", { place: centerPlace })} ·</span>
        <button
          type="button"
          onClick={onChangeCenter}
          aria-label={t("results.centerChangeAria")}
          className={cn(
            "cursor-pointer rounded-sm text-eg-primary-text underline underline-offset-4",
            FINDER_FOCUS,
          )}
        >
          {t("results.centerChange")}
        </button>
      </p>

      <p
        role="status"
        aria-live="polite"
        className={
          statusVisible
            ? "mt-3 rounded-lg border border-[var(--eg-feedback-warning)]/40 bg-eg-warm-soft px-3 py-2 text-sm text-eg-strong"
            : "sr-only"
        }
      >
        {statusMessage}
      </p>

      {results.length === 0 ? (
        <div className="mt-4 rounded-xl border border-eg-border bg-eg-surface p-6 text-center">
          <Image
            src="/illustrations/empty-communities.png"
            loading="eager"
            alt=""
            aria-hidden="true"
            width={800}
            height={600}
            className="mx-auto h-auto w-full max-w-[220px]"
          />
          <p className="mt-4 font-display text-lg font-bold text-eg-strong">{t("empty.title")}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-eg-muted">
            {hasActiveFilters ? t("empty.withFilters") : t("empty.noFilters")}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className={cn(
                  "inline-flex min-h-11 cursor-pointer items-center rounded-full border border-eg-border-strong px-4 text-sm font-semibold text-eg-strong hover:bg-eg-hover",
                  FINDER_FOCUS,
                )}
              >
                <span className="font-semibold">
                  {isLoading ? t("empty.clearing") : t("empty.clearFilters")}
                </span>
              </button>
            ) : null}
            <Link
              href="/cadastro-comunidade"
              className={cn(
                "inline-flex min-h-11 items-center rounded-full bg-eg-primary px-4 text-sm font-semibold text-eg-inverse hover:bg-eg-primary-hover",
                FINDER_FOCUS,
              )}
            >
              {t("empty.register")}
            </Link>
          </div>
        </div>
      ) : (
        <ol className="mt-3 grid gap-2.5" aria-labelledby="finder-results-heading">
          {results.map((item) => (
            <ResultCard
              key={item.church.id}
              item={item}
              selected={item.church.id === selectedChurchId}
              onSelect={() => onSelectChurch(item.church.id)}
              priorityDays={priorityDays}
            />
          ))}
        </ol>
      )}

      {remaining > 0 ? (
        <button
          type="button"
          onClick={onShowMore}
          className={cn(
            "mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-eg-border-strong/70 bg-eg-surface px-4 text-sm font-semibold text-eg-strong hover:bg-eg-hover",
            FINDER_FOCUS,
          )}
        >
          <span className="font-semibold">
            {t("results.showMore", { count: Math.min(remaining, 20) })}
          </span>
        </button>
      ) : null}
    </div>
  );
}
