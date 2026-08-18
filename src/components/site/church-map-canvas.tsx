"use client";

import { useEffect } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import type { Coordinates, PublicChurchListItem } from "@/types/public";

type ChurchMapCanvasProps = {
  churches: PublicChurchListItem[];
  center: Coordinates;
  selectedChurchId?: string | null;
  onSelectChurch?: (church: PublicChurchListItem) => void;
};

function buildMarkerIcon(isLive: boolean, isSelected: boolean) {
  return L.divIcon({
    className: "",
    html: `<div class="church-marker${isLive ? " is-live" : ""}${isSelected ? " is-selected" : ""}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

function MapFocus({
  center,
  selectedChurch,
}: {
  center: Coordinates;
  selectedChurch?: PublicChurchListItem | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedChurch) {
      map.flyTo([selectedChurch.location.lat, selectedChurch.location.lng], 14, {
        animate: true,
        duration: 1,
      });
      return;
    }

    map.setView([center.lat, center.lng], map.getZoom());
  }, [center, map, selectedChurch]);

  return null;
}

export default function ChurchMapCanvas({
  churches,
  center,
  selectedChurchId,
  onSelectChurch,
}: ChurchMapCanvasProps) {
  const selectedChurch = churches.find((church) => church.id === selectedChurchId) ?? null;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={12}
      scrollWheelZoom={false}
      className="min-h-[340px]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapFocus center={center} selectedChurch={selectedChurch} />

      {churches.map((church) => (
        <Marker
          key={church.id}
          position={[church.location.lat, church.location.lng]}
          icon={buildMarkerIcon(church.isLive, church.id === selectedChurchId)}
          eventHandlers={{
            click: () => onSelectChurch?.(church),
          }}
        >
          <Popup>
            <div className="map-popup space-y-2 p-1 text-sm text-zinc-900">
              <div>
                <p className="font-semibold">{church.name}</p>
                <p className="text-xs text-zinc-500">{church.denomination}</p>
              </div>
              <p className="text-xs text-zinc-600">{church.addressLine}</p>
              <Link href={`/comunidades/${church.slug}`} className="inline-flex text-xs">
                Ver página da comunidade
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
