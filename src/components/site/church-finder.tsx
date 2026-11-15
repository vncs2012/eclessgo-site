"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { useChurchFinder } from "@/components/site/church-finder-context";
import { ChurchFinderFilters } from "@/components/site/church-finder-filters";
import { ChurchFinderResults } from "@/components/site/church-finder-results";
import { ChurchFinderSearch, FINDER_FOCUS } from "@/components/site/church-finder-search";
import { ChurchMap } from "@/components/site/church-map";
import type { ChurchFinderStatusKey } from "@/hooks/useChurchFinderData";
import { getConsent, subscribeToConsent } from "@/lib/consent";
import { trackPublicEvent } from "@/lib/public-analytics";
import {
  countByTradition,
  filterByDistance,
  filterByTradition,
  numberResults,
  sortChurches,
  type FinderDistance,
  type FinderSort,
} from "@/lib/public-church-utils";
import { cn } from "@/lib/utils";

/** Itens por "página" da lista (e do mapa: os dois mostram exatamente os mesmos). */
const PAGE_SIZE = 20;

/** Estados em que o status aparece em destaque; os demais ficam só para leitor de tela. */
const VISIBLE_STATUS: ReadonlySet<ChurchFinderStatusKey> = new Set([
  "initialLoadError",
  "initialEmpty",
  "filtersClearedEmpty",
  "clearFailed",
  "searchEmpty",
  "filterFailed",
  "geoUnavailable",
  "locationFailed",
  "permissionDenied",
]);

const CHIP = cn(
  "inline-flex min-h-10 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full border px-3.5 text-sm font-semibold shadow-[var(--eg-shadow-sm)] transition-colors",
  "border-eg-border bg-eg-surface text-eg-strong hover:bg-eg-hover",
  "aria-pressed:border-transparent aria-pressed:bg-[var(--eg-map-pin-selected)] aria-pressed:text-eg-app",
  FINDER_FOCUS,
);

function subscribeToLargeScreen(callback: () => void) {
  const query = window.matchMedia("(min-width: 1024px)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

export function ChurchFinder() {
  const t = useTranslations("finder");
  const consent = useSyncExternalStore(subscribeToConsent, getConsent, () => null);
  const isLargeScreen = useSyncExternalStore(
    subscribeToLargeScreen,
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => true,
  );
  const trackedMapViewsRef = useRef<Set<string>>(new Set());
  const {
    churches,
    center,
    centerSource,
    userLocation,
    selectedChurchId,
    selectedChurch,
    isLoading,
    statusKey,
    statusMessage,
    selectChurch,
    searchChurches,
    clearFilters,
    useMyLocation: requestMyLocation,
    search,
    setSearch,
    hasLive,
    setHasLive,
  } = useChurchFinder();

  const [distance, setDistance] = useState<FinderDistance>("all");
  const [traditions, setTraditions] = useState<string[]>([]);
  const [sort, setSort] = useState<FinderSort>("distance");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [loadedChurches, setLoadedChurches] = useState(churches);

  const filtersTitleId = useId();
  const drawerBodyId = useId();
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const filtersPanelRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{ startY: number; startHeight: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  // Nova resposta da API: volta para a primeira página (ajuste durante o render, sem efeito).
  if (loadedChurches !== churches) {
    setLoadedChurches(churches);
    setVisibleCount(PAGE_SIZE);
  }

  // Filtros locais sobre o que a API devolveu (até 100, já ordenado por distância).
  const distanceFiltered = useMemo(
    () => filterByDistance(churches, distance),
    [churches, distance],
  );
  const traditionOptions = useMemo(
    () => countByTradition(distanceFiltered, traditions),
    [distanceFiltered, traditions],
  );
  const numbered = useMemo(
    () => numberResults(sortChurches(filterByTradition(distanceFiltered, traditions), sort)),
    [distanceFiltered, traditions, sort],
  );
  // Lista e mapa recebem este mesmo array: o item N é o pin N.
  const shown = useMemo(() => numbered.slice(0, visibleCount), [numbered, visibleCount]);
  const effectiveSelectedId = shown.some((item) => item.church.id === selectedChurchId)
    ? selectedChurchId
    : null;

  const activeFilterCount = (distance !== "all" ? 1 : 0) + traditions.length + (hasLive ? 1 : 0);
  const hasActiveFilters = Boolean(search.trim()) || activeFilterCount > 0;

  const headingKey =
    distance === "near" ? "headingNear" : distance === "drive" ? "headingDrive" : "headingAll";
  const centerPlace =
    centerSource === "user"
      ? t("results.centerUser")
      : centerSource === "area"
        ? t("results.centerArea")
        : t("results.centerDefault");

  useEffect(() => {
    if (!selectedChurch) return;

    if (trackedMapViewsRef.current.has(selectedChurch.id)) return;
    // Keep this view pending while consent is unknown/denied. The consent
    // subscription reruns the effect after acceptance in the same load.
    if (consent?.analytics !== "granted") return;
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
  }, [consent, selectedChurch]);

  // Painel de filtros (abaixo de lg): Escape fecha e devolve o foco ao botão.
  const sheetOpen = filtersOpen && !isLargeScreen;
  useEffect(() => {
    if (!sheetOpen) return;
    filtersPanelRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeFilters();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sheetOpen]);

  function closeFilters() {
    setFiltersOpen(false);
    filtersButtonRef.current?.focus();
  }

  function resetPaging() {
    setVisibleCount(PAGE_SIZE);
  }

  function handleDistanceChange(value: FinderDistance) {
    setDistance(value);
    resetPaging();
  }

  function handleTraditionsChange(value: string[]) {
    setTraditions(value);
    resetPaging();
  }

  function handleSortChange(value: FinderSort) {
    setSort(value);
    resetPaging();
  }

  function handleHasLiveChange(value: boolean) {
    setHasLive(value);
    void searchChurches({ filters: { hasLive: value } });
  }

  function handleClearFilters() {
    const needsRequest = Boolean(search.trim()) || hasLive;
    setSearch("");
    setHasLive(false);
    setDistance("all");
    setTraditions([]);
    resetPaging();
    if (needsRequest) void clearFilters();
  }

  function handleSelectFromMap(churchId: string) {
    selectChurch(churchId);
    requestAnimationFrame(() => {
      document
        .getElementById(`finder-result-${churchId}`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }

  function focusVisibleSearch() {
    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement>("input[data-finder-search]"),
    );
    const visible = inputs.find((input) => input.getClientRects().length > 0);
    if (!visible) return;
    if (!isLargeScreen) setDrawerExpanded(false);
    visible.focus();
    visible.select();
  }

  // Gaveta do celular: arrastar pela alça ou tocar/Enter para alternar.
  function handleHandlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    const drawer = drawerRef.current;
    if (!drawer) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startY: event.clientY,
      startHeight: drawer.getBoundingClientRect().height,
      moved: false,
    };
  }

  function handleHandlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    const parent = drawerRef.current?.parentElement;
    if (!drag || !parent) return;
    const delta = event.clientY - drag.startY;
    if (Math.abs(delta) > 6) drag.moved = true;
    if (!drag.moved) return;
    const max = parent.getBoundingClientRect().height - 72;
    setDragHeight(Math.min(max, Math.max(140, drag.startHeight - delta)));
  }

  function handleHandlePointerUp() {
    const drag = dragRef.current;
    const parent = drawerRef.current?.parentElement;
    dragRef.current = null;
    if (!drag?.moved || !parent || dragHeight === null) {
      setDragHeight(null);
      return;
    }
    suppressClickRef.current = true;
    setDrawerExpanded(dragHeight > parent.getBoundingClientRect().height * 0.6);
    setDragHeight(null);
  }

  const mapItems = shown;

  return (
    <div
      className={cn(
        "relative h-[calc(100dvh-4rem-env(safe-area-inset-bottom))] min-h-[520px] overflow-hidden bg-eg-app md:h-[calc(100dvh-var(--eg-header-h))] md:min-h-[560px]",
        "md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] md:grid-rows-[auto_minmax(0,1fr)]",
        "lg:grid-cols-[236px_minmax(0,400px)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]",
        "xl:grid-cols-[272px_minmax(0,540px)_minmax(0,1fr)]",
      )}
    >
      {/* Busca + filtros abaixo de lg (no celular, sobre o mapa). */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-20 grid gap-2 p-3",
          "md:static md:col-span-2 md:border-b md:border-eg-border md:bg-eg-surface md:px-5",
          "lg:hidden",
        )}
      >
        <div className="flex min-w-0 gap-2">
          <ChurchFinderSearch variant="page" className="min-w-0 flex-1" />
          <button
            ref={filtersButtonRef}
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-expanded={sheetOpen}
            aria-haspopup="dialog"
            aria-label={
              activeFilterCount > 0
                ? t("filters.openActive", { count: activeFilterCount })
                : t("filters.open")
            }
            className={cn(
              "inline-flex min-h-[52px] shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-eg-border bg-eg-surface px-3.5 text-sm font-semibold text-eg-strong shadow-[var(--eg-shadow-md)] hover:bg-eg-hover md:shadow-none",
              FINDER_FOCUS,
            )}
          >
            <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            <span className="hidden font-semibold md:inline" aria-hidden="true">
              {t("filters.open")}
            </span>
            {activeFilterCount > 0 ? (
              <span
                className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--eg-map-pin-selected)] px-1.5 text-xs font-bold text-eg-app"
                aria-hidden="true"
              >
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>
        <div
          role="group"
          aria-label={t("filters.quick")}
          className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 [scrollbar-width:none] md:hidden"
        >
          <button
            type="button"
            aria-pressed={distance === "near"}
            onClick={() => handleDistanceChange(distance === "near" ? "all" : "near")}
            className={CHIP}
          >
            <span className="font-semibold">{t("filters.chipNear")}</span>
          </button>
          <button
            type="button"
            aria-pressed={hasLive}
            onClick={() => handleHasLiveChange(!hasLive)}
            className={CHIP}
          >
            <span className="font-semibold">{t("filters.chipLive")}</span>
          </button>
        </div>
      </div>

      {/* Filtros: coluna fixa em lg+; folha/painel abaixo disso. */}
      <aside
        aria-labelledby={sheetOpen ? undefined : filtersTitleId}
        className={cn(
          "lg:col-start-1 lg:row-start-1 lg:block lg:min-h-0 lg:overflow-y-auto lg:border-r lg:border-eg-border lg:bg-eg-surface lg:px-5 lg:py-5",
          sheetOpen
            ? "fixed inset-0 z-[70] flex flex-col justify-end md:flex-row md:justify-end"
            : "hidden",
        )}
      >
        {sheetOpen ? (
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={closeFilters}
            className="absolute inset-0 cursor-default bg-[var(--eg-scrim)]"
          />
        ) : null}
        <div
          ref={filtersPanelRef}
          role={sheetOpen ? "dialog" : undefined}
          aria-modal={sheetOpen || undefined}
          aria-labelledby={sheetOpen ? filtersTitleId : undefined}
          tabIndex={sheetOpen ? -1 : undefined}
          className={cn(
            sheetOpen &&
              "relative flex max-h-[88dvh] flex-col overflow-hidden rounded-t-2xl bg-eg-surface shadow-[var(--eg-shadow-lg)] outline-none md:h-full md:max-h-none md:w-[360px] md:rounded-none",
          )}
        >
          <div className={cn(sheetOpen && "min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-4")}>
            <ChurchFinderFilters
              titleId={filtersTitleId}
              distance={distance}
              traditions={traditions}
              traditionOptions={traditionOptions}
              hasLive={hasLive}
              hasActiveFilters={hasActiveFilters}
              onDistanceChange={handleDistanceChange}
              onTraditionsChange={handleTraditionsChange}
              onHasLiveChange={handleHasLiveChange}
              onClear={handleClearFilters}
              headerExtra={
                sheetOpen ? (
                  <button
                    type="button"
                    onClick={closeFilters}
                    aria-label={t("filters.close")}
                    className={cn(
                      "inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-eg-strong hover:bg-eg-hover",
                      FINDER_FOCUS,
                    )}
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                ) : null
              }
            />
          </div>
          {sheetOpen ? (
            <div className="border-t border-eg-border bg-eg-surface p-4">
              <button
                type="button"
                onClick={closeFilters}
                className={cn(
                  "inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-eg-primary px-4 text-base font-bold text-eg-inverse hover:bg-eg-primary-hover",
                  FINDER_FOCUS,
                )}
              >
                <span className="font-bold">
                  {t("filters.showResults", { count: numbered.length })}
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Lista: gaveta inferior no celular; coluna a partir de md. */}
      <section
        ref={drawerRef}
        aria-labelledby="finder-results-heading"
        style={dragHeight !== null ? { height: dragHeight, transition: "none" } : undefined}
        className={cn(
          "absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-2xl border-t border-eg-border bg-eg-app shadow-[0_-8px_24px_rgba(7,11,24,0.18)] transition-[height] duration-200",
          drawerExpanded ? "h-[calc(100%-4.75rem)]" : "h-[46%]",
          "md:static md:z-auto md:col-start-1 md:row-start-2 md:h-auto md:min-h-0 md:rounded-none md:border-t-0 md:shadow-none",
          "lg:col-start-2 lg:row-start-1 lg:border-r lg:border-eg-border",
        )}
      >
        <button
          type="button"
          aria-expanded={drawerExpanded}
          aria-controls={drawerBodyId}
          aria-label={drawerExpanded ? t("drawer.collapse") : t("drawer.expand")}
          onPointerDown={handleHandlePointerDown}
          onPointerMove={handleHandlePointerMove}
          onPointerUp={handleHandlePointerUp}
          onPointerCancel={handleHandlePointerUp}
          onClick={() => {
            if (suppressClickRef.current) {
              suppressClickRef.current = false;
              return;
            }
            setDrawerExpanded((value) => !value);
          }}
          className={cn(
            "flex h-7 w-full shrink-0 cursor-grab touch-none items-center justify-center rounded-t-2xl md:hidden",
            FINDER_FOCUS,
            "focus-visible:-outline-offset-2",
          )}
        >
          <span className="h-1.5 w-10 rounded-full bg-eg-border-strong" aria-hidden="true" />
        </button>
        <div
          id={drawerBodyId}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6 md:px-5 md:pt-5"
        >
          <ChurchFinderResults
            heading={t(`results.${headingKey}`, { count: numbered.length })}
            results={shown}
            remaining={numbered.length - shown.length}
            selectedChurchId={effectiveSelectedId}
            sort={sort}
            centerPlace={centerPlace}
            statusMessage={statusMessage}
            statusVisible={VISIBLE_STATUS.has(statusKey)}
            hasActiveFilters={hasActiveFilters}
            isLoading={isLoading}
            onSortChange={handleSortChange}
            onChangeCenter={focusVisibleSearch}
            onSelectChurch={selectChurch}
            onShowMore={() => setVisibleCount((count) => count + PAGE_SIZE)}
            onClearFilters={handleClearFilters}
          />
        </div>
      </section>

      {/* Mapa: em cima no celular; última coluna a partir de md. */}
      <div className="absolute inset-x-0 top-0 h-[58%] md:static md:col-start-2 md:row-start-2 md:h-auto md:min-h-0 lg:col-start-3 lg:row-start-1">
        <ChurchMap
          items={mapItems}
          center={center}
          userLocation={userLocation}
          selectedChurchId={effectiveSelectedId}
          onSelectChurch={handleSelectFromMap}
          onSearchArea={(nextCenter) => void searchChurches({ center: nextCenter })}
          onLocate={() => void requestMyLocation()}
        />
      </div>
    </div>
  );
}
