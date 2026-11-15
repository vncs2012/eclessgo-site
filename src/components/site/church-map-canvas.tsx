"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import L from "leaflet";
import { LocateFixed, Minus, Plus, Search } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";

import { FINDER_FOCUS } from "@/components/site/church-finder-search";
import { useTraditionLabel } from "@/components/site/church-finder-context";
import { cn } from "@/lib/utils";
import type { Coordinates, PublicChurchListItem } from "@/types/public";

export type ChurchMapItem = { church: PublicChurchListItem; number: number };

export type ChurchMapCanvasProps = {
  /** Mesmo array numerado que a lista usa: o pin N é o item N. */
  items?: ChurchMapItem[];
  /**
   * Uso embutido (Home, página da comunidade): lista simples, numerada na ordem recebida,
   * no visual de cartão antigo e sem os controles da Busca.
   */
  churches?: PublicChurchListItem[];
  center: Coordinates;
  userLocation?: Coordinates | null;
  selectedChurchId?: string | null;
  onSelectChurch?: (churchId: string) => void;
  /** "Buscar nesta área": aparece depois que a pessoa arrasta o mapa. */
  onSearchArea?: (center: Coordinates) => void;
  onLocate?: () => void;
};

const OVERLAY_BUTTON = cn(
  "inline-flex cursor-pointer items-center justify-center bg-eg-surface text-eg-strong shadow-[var(--eg-shadow-md)] transition-colors hover:bg-eg-hover",
  FINDER_FOCUS,
);

/** Pin numerado (gota) em divIcon. As cores vêm dos tokens --eg-map-*, então seguem o tema. */
function buildPinIcon(number: number, selected: boolean) {
  const width = selected ? 44 : 34;
  const height = Math.round(width * 1.3);
  const fill = selected ? "var(--eg-map-pin-selected)" : "var(--eg-map-pin)";
  const fontSize = number > 99 ? (selected ? 13 : 11) : selected ? 18 : 15;
  return L.divIcon({
    className: "",
    html:
      `<span style="position:relative;display:block;width:${width}px;height:${height}px;filter:drop-shadow(0 2px 3px rgba(7,11,24,.35))">` +
      `<svg viewBox="0 0 34 44" width="${width}" height="${height}" aria-hidden="true" style="display:block">` +
      `<path d="M17 1.5C8.4 1.5 1.5 8.3 1.5 16.8c0 11.1 13.6 24.4 14.5 25.3a1.4 1.4 0 0 0 2 0c.9-.9 14.5-14.2 14.5-25.3C32.5 8.3 25.6 1.5 17 1.5z" fill="${fill}" stroke="var(--eg-map-pin-ring)" stroke-width="2"/>` +
      `</svg>` +
      `<span style="position:absolute;left:0;right:0;top:${Math.round(height * 0.2)}px;text-align:center;font:800 ${fontSize}px/1.1 var(--eg-font-sans);color:var(--eg-bg-app)">${number}</span>` +
      `</span>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height - 1],
    popupAnchor: [0, -height + 4],
  });
}

const USER_ICON = L.divIcon({
  className: "",
  html:
    '<span style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:999px;background:var(--eg-map-me-halo)">' +
    '<span style="width:16px;height:16px;border-radius:999px;background:var(--eg-map-me);border:3px solid var(--eg-map-pin-ring);box-shadow:0 1px 3px rgba(0,0,0,.3)"></span></span>',
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

function DragWatcher({ onUserMove }: { onUserMove: () => void }) {
  useMapEvents({ dragend: onUserMove });
  return null;
}

export default function ChurchMapCanvas({
  items: itemsProp,
  churches,
  center,
  userLocation = null,
  selectedChurchId = null,
  onSelectChurch,
  onSearchArea,
  onLocate,
}: ChurchMapCanvasProps) {
  const t = useTranslations("finder.map");
  const traditionLabel = useTraditionLabel();
  const [map, setMap] = useState<L.Map | null>(null);
  const [moved, setMoved] = useState(false);
  const iconCache = useRef(new Map<string, L.DivIcon>());
  const embedded = !itemsProp;
  const items = useMemo(
    () => itemsProp ?? (churches ?? []).map((church, index) => ({ church, number: index + 1 })),
    [itemsProp, churches],
  );

  function iconFor(number: number, selected: boolean) {
    const key = `${number}:${selected ? 1 : 0}`;
    let icon = iconCache.current.get(key);
    if (!icon) {
      icon = buildPinIcon(number, selected);
      iconCache.current.set(key, icon);
    }
    return icon;
  }

  // Enquadra pins + "você" sempre que o conjunto numerado muda (filtro, ordem, "mostrar mais", área).
  const fitKey = useMemo(
    () =>
      [
        items.map((item) => item.church.id).join(","),
        userLocation ? `${userLocation.lat},${userLocation.lng}` : "",
        `${center.lat},${center.lng}`,
      ].join("|"),
    [items, userLocation, center],
  );

  useEffect(() => {
    if (!map) return;
    const points: L.LatLngTuple[] = items.map((item) => [
      item.church.location.lat,
      item.church.location.lng,
    ]);
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    if (points.length === 0) {
      map.setView([center.lat, center.lng], 13, { animate: false });
    } else if (points.length === 1) {
      map.setView(points[0], 15, { animate: false });
    } else {
      // No celular a busca e os atalhos ficam sobre o topo do mapa: reserva esse espaço.
      const narrow = !embedded && map.getContainer().clientWidth < 768;
      map.fitBounds(L.latLngBounds(points), {
        paddingTopLeft: narrow ? [28, 140] : [56, 56],
        paddingBottomRight: narrow ? [28, 48] : [56, 56],
        maxZoom: 15,
        // Sem animação: o Leaflet ignora um novo zoom enquanto anima o anterior.
        animate: false,
      });
    }
    // Reenquadrar é programático: o botão "Buscar nesta área" some.
    setMoved(false);
    // fitKey resume items/userLocation/center.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitKey]);

  // Item escolhido na lista: traz o pin para a vista sem mudar o zoom. Quando o conjunto
  // acabou de mudar, o enquadramento acima já cuida disso (um panTo cortaria a animação).
  const selectedItem = items.find((item) => item.church.id === selectedChurchId) ?? null;
  // Começa nulo: o primeiro enquadramento (mapa recém-criado) também conta como "conjunto
  // novo". Sem isso, o item já selecionado numa ponta do enquadramento recentralizava o mapa.
  const lastPanKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!map) return;
    const setChanged = lastPanKeyRef.current !== fitKey;
    lastPanKeyRef.current = fitKey;
    if (!selectedItem || setChanged) return;
    const position = L.latLng(selectedItem.church.location.lat, selectedItem.church.location.lng);
    if (!map.getBounds().pad(-0.1).contains(position)) map.panTo(position);
  }, [map, selectedItem, fitKey]);

  const hasUser = Boolean(userLocation);

  return (
    <div className="relative isolate h-full w-full">
      <MapContainer
        ref={setMap}
        center={[center.lat, center.lng]}
        zoom={13}
        zoomControl={embedded}
        scrollWheelZoom={false}
        className={cn(
          embedded ? "min-h-[340px]" : "h-full min-h-[280px] !rounded-none !bg-eg-subtle",
          // Mapa escuro: inverte as tiles do OSM no tema escuro.
          "in-data-[theme=dark]:[&_.leaflet-tile-pane]:[filter:invert(1)_hue-rotate(180deg)_brightness(0.95)_contrast(0.85)_saturate(0.6)]",
        )}
        aria-label={t("label")}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DragWatcher onUserMove={() => setMoved(true)} />

        {userLocation ? (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={USER_ICON}
            title={t("you")}
            alt={t("you")}
            keyboard={false}
            interactive={false}
            zIndexOffset={-100}
          />
        ) : null}

        {items.map(({ church, number }) => {
          const selected = church.id === selectedChurchId;
          return (
            <Marker
              key={church.id}
              position={[church.location.lat, church.location.lng]}
              icon={iconFor(number, selected)}
              title={t("markerTitle", { number, name: church.name })}
              alt={t("markerTitle", { number, name: church.name })}
              zIndexOffset={selected ? 1000 : -number}
              keyboard
              eventHandlers={{ click: () => onSelectChurch?.(church.id) }}
            >
              <Popup>
                <div className="map-popup space-y-1.5 p-1 text-sm text-zinc-900">
                  <p className="font-semibold">
                    {number}. {church.name}
                  </p>
                  <p className="text-xs text-zinc-600">{traditionLabel(church.denomination)}</p>
                  <p className="text-xs text-zinc-600">{church.addressLine}</p>
                  <Link href={`/comunidades/${church.slug}`} className="inline-flex text-xs">
                    {t("openPublicPage")}
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {moved && onSearchArea && map ? (
        <button
          type="button"
          onClick={() => {
            const next = map.getCenter();
            setMoved(false);
            onSearchArea({ lat: next.lat, lng: next.lng });
          }}
          className={cn(
            OVERLAY_BUTTON,
            "absolute left-1/2 top-3 z-[500] h-11 -translate-x-1/2 gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold",
            "max-md:top-[7.5rem]",
          )}
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          <span className="font-semibold">{t("searchArea")}</span>
        </button>
      ) : null}

      {embedded ? null : (
        <div className="absolute right-3 top-3 z-[500] hidden flex-col overflow-hidden rounded-xl border border-eg-border md:flex">
          <button
            type="button"
            aria-label={t("zoomIn")}
            onClick={() => map?.zoomIn()}
            className={cn(OVERLAY_BUTTON, "h-11 w-11 shadow-none")}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={t("zoomOut")}
            onClick={() => map?.zoomOut()}
            className={cn(OVERLAY_BUTTON, "h-11 w-11 border-t border-eg-border shadow-none")}
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          {onLocate ? (
            <button
              type="button"
              aria-label={t("locate")}
              onClick={onLocate}
              className={cn(OVERLAY_BUTTON, "h-11 w-11 border-t border-eg-border shadow-none")}
            >
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      )}

      {items.length > 0 && !embedded ? (
        <p className="pointer-events-none absolute bottom-3 left-3 z-[500] hidden items-center gap-2 rounded-full border border-eg-border bg-eg-surface px-3 py-1.5 text-xs text-eg-strong shadow-[var(--eg-shadow-md)] md:flex">
          {hasUser ? (
            <>
              <span
                className="h-2.5 w-2.5 rounded-full border-2 border-[var(--eg-map-pin-ring)] bg-[var(--eg-map-me)] outline outline-1 outline-[var(--eg-map-me)]"
                aria-hidden="true"
              />
              <span className="mr-1.5">{t("legendYou")}</span>
            </>
          ) : null}
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--eg-map-pin)] text-[11px] font-bold text-eg-app"
            aria-hidden="true"
          >
            1
          </span>
          <span>{t("legendSame")}</span>
        </p>
      ) : null}
    </div>
  );
}
