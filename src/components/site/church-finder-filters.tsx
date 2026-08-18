"use client";

import type { FormEvent } from "react";
import { LocateFixed, Search } from "lucide-react";
import { useTranslations } from "next-intl";

interface ChurchFinderFiltersProps {
  search: string;
  city: string;
  neighborhood: string;
  denomination: string;
  hasLive: boolean;
  cities: string[];
  neighborhoods: string[];
  denominations: string[];
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onNeighborhoodChange: (value: string) => void;
  onDenominationChange: (value: string) => void;
  onHasLiveChange: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUseMyLocation: () => void;
}

export function ChurchFinderFilters({
  search,
  city,
  neighborhood,
  denomination,
  hasLive,
  cities,
  neighborhoods,
  denominations,
  isLoading,
  onSearchChange,
  onCityChange,
  onNeighborhoodChange,
  onDenominationChange,
  onHasLiveChange,
  onSubmit,
  onUseMyLocation,
}: ChurchFinderFiltersProps) {
  const t = useTranslations("finder");

  return (
    <form onSubmit={onSubmit} className="glass-card rounded-[1.75rem] p-4 sm:p-5">
      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_0.6fr_auto_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label={t("search.aria")}
            placeholder={t("search.placeholder")}
            className="input-surface h-12 w-full rounded-2xl pl-11 pr-4 text-sm"
          />
        </label>

        <select
          value={city}
          onChange={(event) => onCityChange(event.target.value)}
          aria-label={t("filters.cityAria")}
          className="input-surface h-12 rounded-2xl px-4 text-sm"
        >
          <option value="">{t("filters.allCities")}</option>
          {cities.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        <select
          value={neighborhood}
          onChange={(event) => onNeighborhoodChange(event.target.value)}
          aria-label={t("filters.neighborhoodAria")}
          className="input-surface h-12 rounded-2xl px-4 text-sm"
        >
          <option value="">{t("filters.allNeighborhoods")}</option>
          {neighborhoods.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        <select
          value={denomination}
          onChange={(event) => onDenominationChange(event.target.value)}
          aria-label={t("filters.denominationAria")}
          className="input-surface h-12 rounded-2xl px-4 text-sm"
        >
          <option value="">{t("filters.allDenominations")}</option>
          {denominations.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        <label className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-zinc-950/70 px-4 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={hasLive}
            onChange={(event) => onHasLiveChange(event.target.checked)}
            className="h-4 w-4 accent-emerald-500"
          />
          {t("filters.live")}
        </label>

        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-500 px-5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
        >
          {isLoading ? t("updating") : t("update")}
        </button>

        <button
          type="button"
          onClick={onUseMyLocation}
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 px-5 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/30 hover:text-white"
        >
          <LocateFixed className="mr-2 h-4 w-4" aria-hidden="true" />
          {t("myLocation")}
        </button>
      </div>
    </form>
  );
}
