"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { FINDER_FOCUS } from "@/components/site/church-finder-search";
import { useTraditionLabel } from "@/components/site/church-finder-context";
import { type FinderDistance } from "@/lib/public-church-utils";
import { cn } from "@/lib/utils";

export type FinderFacetOption = { value: string; label: string; count?: number };

interface ChurchFinderFiltersProps {
  distance: FinderDistance;
  traditions: string[];
  traditionOptions: Array<{ value: string; count: number }>;
  hasLive: boolean;
  /**
   * "Costuma ter encontro" e "Para a visita" (filtrados pela API). Os grupos só aparecem
   * quando receberem opções; sem `count`, a opção não mostra número.
   */
  dayOptions?: FinderFacetOption[];
  selectedDays?: string[];
  onDaysChange?: (value: string[]) => void;
  featureOptions?: FinderFacetOption[];
  selectedFeatures?: string[];
  onFeaturesChange?: (value: string[]) => void;
  hasActiveFilters: boolean;
  onDistanceChange: (value: FinderDistance) => void;
  onTraditionsChange: (value: string[]) => void;
  onHasLiveChange: (value: boolean) => void;
  onClear: () => void;
  /** Cabeçalho do painel (no celular/tablet traz o botão de fechar). */
  headerExtra?: ReactNode;
  titleId: string;
}

function toggle(list: readonly string[], value: string, checked: boolean) {
  return checked ? [...list, value] : list.filter((item) => item !== value);
}

function Group({ title, badge, children }: { title: string; badge?: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-eg-border pt-4">
      <legend className="float-left mb-2.5 flex w-full items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-eg-muted">
        {title}
        {badge ? (
          <span className="rounded-full bg-eg-primary-soft px-2 py-0.5 text-[11px] font-bold normal-case tracking-normal text-eg-primary-text">
            {badge}
          </span>
        ) : null}
      </legend>
      <div className="clear-both grid gap-0.5">{children}</div>
    </fieldset>
  );
}

const CONTROL_ROW =
  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-[15px] text-eg-strong hover:bg-eg-hover has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-eg-focus";
const CONTROL = "h-5 w-5 shrink-0 cursor-pointer accent-[var(--eg-action-primary)] outline-none";

function CheckRow({
  label,
  count,
  countLabel,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  countLabel?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  // Opção sem comunidade fica atenuada (texto secundário), mas segue visível e marcável.
  const muted = count === 0 && !checked;
  return (
    <label className={cn(CONTROL_ROW, muted && "text-eg-muted")}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className={CONTROL}
      />
      <span className="min-w-0 flex-1">{label}</span>
      {typeof count === "number" ? (
        <span className="font-mono text-xs text-eg-muted" aria-label={countLabel}>
          {count}
        </span>
      ) : null}
    </label>
  );
}

export function ChurchFinderFilters({
  distance,
  traditions,
  traditionOptions,
  hasLive,
  dayOptions = [],
  selectedDays = [],
  onDaysChange,
  featureOptions = [],
  selectedFeatures = [],
  onFeaturesChange,
  hasActiveFilters,
  onDistanceChange,
  onTraditionsChange,
  onHasLiveChange,
  onClear,
  headerExtra,
  titleId,
}: ChurchFinderFiltersProps) {
  const t = useTranslations("finder.filters");
  const traditionLabel = useTraditionLabel();

  const distanceOptions: Array<{ value: FinderDistance; label: string; hint?: string }> = [
    { value: "near", label: t("near"), hint: t("nearHint") },
    { value: "drive", label: t("drive"), hint: t("driveHint") },
    { value: "all", label: t("all") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id={titleId} className="font-display text-lg font-extrabold text-eg-strong">
          {t("title")}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClear}
            disabled={!hasActiveFilters}
            className={cn(
              "inline-flex min-h-11 cursor-pointer items-center rounded-lg px-2 text-sm font-semibold text-eg-text underline underline-offset-4 hover:text-eg-strong disabled:cursor-default disabled:no-underline disabled:opacity-50",
              FINDER_FOCUS,
            )}
          >
            <span className="font-semibold">{t("clear")}</span>
          </button>
          {headerExtra}
        </div>
      </div>

      <Group title={t("distance")}>
        {distanceOptions.map((option) => (
          <label key={option.value} className={cn(CONTROL_ROW, "items-start py-1.5")}>
            <input
              type="radio"
              name="finder-distance"
              value={option.value}
              checked={distance === option.value}
              onChange={() => onDistanceChange(option.value)}
              className={cn(CONTROL, "mt-0.5")}
            />
            <span className="leading-tight">
              {option.label}
              {option.hint ? (
                <span className="block text-xs text-eg-muted">{option.hint}</span>
              ) : null}
            </span>
          </label>
        ))}
      </Group>

      {traditionOptions.length > 0 ? (
        <Group title={t("tradition")}>
          {traditionOptions.map((option) => (
            <CheckRow
              key={option.value}
              label={traditionLabel(option.value)}
              count={option.count}
              countLabel={t("traditionCount", { count: option.count })}
              checked={traditions.includes(option.value)}
              onChange={(checked) => onTraditionsChange(toggle(traditions, option.value, checked))}
            />
          ))}
        </Group>
      ) : null}

      <Group title={t("liveGroup")}>
        <label className={cn(CONTROL_ROW, "items-start py-1.5")}>
          <input
            type="checkbox"
            checked={hasLive}
            onChange={(event) => onHasLiveChange(event.target.checked)}
            className={cn(CONTROL, "mt-0.5")}
          />
          <span className="leading-tight">
            {t("live")}
            <span className="block text-xs text-eg-muted">{t("liveHint")}</span>
          </span>
        </label>
      </Group>

      {dayOptions.length > 0 && onDaysChange ? (
        <Group title={t("days")}>
          {dayOptions.map((option) => (
            <CheckRow
              key={option.value}
              label={option.label}
              count={option.count}
              countLabel={
                option.count === undefined ? undefined : t("optionCount", { count: option.count })
              }
              checked={selectedDays.includes(option.value)}
              onChange={(checked) => onDaysChange(toggle(selectedDays, option.value, checked))}
            />
          ))}
        </Group>
      ) : null}

      {featureOptions.length > 0 && onFeaturesChange ? (
        <Group title={t("visit")} badge={t("new")}>
          {featureOptions.map((option) => (
            <CheckRow
              key={option.value}
              label={option.label}
              count={option.count}
              countLabel={
                option.count === undefined ? undefined : t("optionCount", { count: option.count })
              }
              checked={selectedFeatures.includes(option.value)}
              onChange={(checked) =>
                onFeaturesChange(toggle(selectedFeatures, option.value, checked))
              }
            />
          ))}
        </Group>
      ) : null}
    </div>
  );
}
