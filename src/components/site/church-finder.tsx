"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ChurchMap } from "@/components/site/church-map";
import { ChurchFinderFilters } from "@/components/site/church-finder-filters";
import { ChurchFinderResults } from "@/components/site/church-finder-results";
import { trackPublicEvent } from "@/lib/public-analytics";
import {
  useChurchFinderData,
  type ChurchFinderFiltersState,
  type ChurchFinderStatusMessages,
} from "@/hooks/useChurchFinderData";
import { GOIANIA_CENTER } from "@/lib/site-config";
import type { Coordinates, PublicChurchListItem } from "@/types/public";

type ChurchFinderProps = {
  initialChurches: PublicChurchListItem[];
  initialCenter?: Coordinates;
  initialLoadError?: string | null;
};

export function ChurchFinder({
  initialChurches,
  initialCenter = GOIANIA_CENTER,
  initialLoadError = null,
}: ChurchFinderProps) {
  const t = useTranslations("finder");
  const trackedMapViewsRef = useRef<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [denomination, setDenomination] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [hasLive, setHasLive] = useState(false);
  const filters: ChurchFinderFiltersState = { search, denomination, city, neighborhood, hasLive };
  const messages: ChurchFinderStatusMessages = {
    initialShowing: t("status.initialShowing"),
    initialEmpty: t("status.initialEmpty"),
    filtersClearedShowing: t("status.filtersClearedShowing"),
    filtersClearedEmpty: t("status.filtersClearedEmpty"),
    clearFailed: t("status.clearFailed"),
    searchUpdated: t("status.searchUpdated"),
    searchEmpty: t("status.searchEmpty"),
    filterFailed: t("status.filterFailed"),
    geoUnavailable: t("status.geoUnavailable"),
    recalculated: t("status.recalculated"),
    locationFailed: t("status.locationFailed"),
    permissionDenied: t("status.permissionDenied"),
  };
  const {
    churches,
    center,
    selectedChurchId,
    selectedChurch,
    isLoading,
    statusMessage,
    selectChurch,
    searchChurches,
    clearFilters,
    useMyLocation: requestMyLocation,
  } = useChurchFinderData({ initialChurches, initialCenter, initialLoadError, filters, messages });

  const denominations = useMemo(() => {
    return Array.from(new Set(churches.map((church) => church.denomination))).sort();
  }, [churches]);

  const cities = useMemo(() => {
    return Array.from(
      new Set(
        churches
          .map((church) => church.city)
          .filter((value): value is string => typeof value === "string" && value.length > 0),
      ),
    ).sort();
  }, [churches]);

  const neighborhoods = useMemo(() => {
    return Array.from(
      new Set(
        churches
          .filter((church) => !city || church.city === city)
          .map((church) => church.neighborhood)
          .filter((value): value is string => typeof value === "string" && value.length > 0),
      ),
    ).sort();
  }, [churches, city]);

  useEffect(() => {
    if (neighborhood && !neighborhoods.includes(neighborhood)) {
      setNeighborhood("");
    }
  }, [neighborhood, neighborhoods]);

  const hasActiveFilters =
    Boolean(search.trim()) || Boolean(denomination) || Boolean(city) || Boolean(neighborhood) || hasLive;

  function handleClearFilters() {
    setSearch("");
    setDenomination("");
    setCity("");
    setNeighborhood("");
    setHasLive(false);
    void clearFilters();
  }

  useEffect(() => {
    if (!selectedChurch) return;

    if (trackedMapViewsRef.current.has(selectedChurch.id)) return;
    trackedMapViewsRef.current.add(selectedChurch.id);

    void trackPublicEvent({
      churchId: selectedChurch.id,
      eventType: "PUBLIC_MAP_VIEW",
      source: "WEB_DIRECTORY",
      path: "/comunidades",
      metadata: {
        denomination: selectedChurch.denomination,
        city: selectedChurch.city,
        neighborhood: selectedChurch.neighborhood,
        isLive: selectedChurch.isLive,
      },
    });
  }, [selectedChurch]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void searchChurches();
  }

  function handleUseMyLocation() {
    void requestMyLocation();
  }

  return (
    <div className="space-y-6">
      <ChurchFinderFilters
        search={search}
        city={city}
        neighborhood={neighborhood}
        denomination={denomination}
        hasLive={hasLive}
        cities={cities}
        neighborhoods={neighborhoods}
        denominations={denominations}
        isLoading={isLoading}
        onSearchChange={setSearch}
        onCityChange={setCity}
        onNeighborhoodChange={setNeighborhood}
        onDenominationChange={setDenomination}
        onHasLiveChange={setHasLive}
        onSubmit={handleSearch}
        onUseMyLocation={handleUseMyLocation}
      />

      <div className={churches.length > 0 ? "grid gap-6 lg:grid-cols-[1.2fr_0.8fr]" : "grid gap-6"}>
        {churches.length > 0 ? (
          <div className="glass-card rounded-[1.9rem] p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between px-2">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-zinc-500">{t("map.eyebrow")}</p>
                <p className="text-sm text-zinc-300">{t("map.subtitle")}</p>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                {t("map.visibleCount", { count: churches.length })}
              </span>
            </div>
            <ChurchMap
              churches={churches}
              center={center}
              selectedChurchId={selectedChurchId}
              onSelectChurch={(church) => selectChurch(church.id)}
            />
          </div>
        ) : null}

        <ChurchFinderResults
          churches={churches}
          selectedChurchId={selectedChurchId}
          selectedChurch={selectedChurch}
          statusMessage={statusMessage}
          hasActiveFilters={hasActiveFilters}
          isLoading={isLoading}
          onSelectChurch={selectChurch}
          onClearFilters={() => void handleClearFilters()}
        />
      </div>

    </div>
  );
}
