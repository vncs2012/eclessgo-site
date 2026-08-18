"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

import type { Coordinates } from "@/types/public";

type LocationPickerMapCanvasProps = {
  center: Coordinates;
  selectedLocation: Coordinates | null;
  onSelectLocation: (location: Coordinates) => void;
};

const selectedIcon = L.divIcon({
  className: "",
  html: '<div class="register-location-marker"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

function MapClickHandler({
  onSelectLocation,
}: {
  onSelectLocation: (location: Coordinates) => void;
}) {
  useMapEvents({
    click: (event) => {
      onSelectLocation({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

function MapFocus({
  center,
  selectedLocation,
}: {
  center: Coordinates;
  selectedLocation: Coordinates | null;
}) {
  const map = useMap();

  useEffect(() => {
    const nextCenter = selectedLocation ?? center;
    map.setView([nextCenter.lat, nextCenter.lng], selectedLocation ? 16 : map.getZoom());
  }, [center, map, selectedLocation]);

  return null;
}

export default function LocationPickerMapCanvas({
  center,
  selectedLocation,
  onSelectLocation,
}: LocationPickerMapCanvasProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      scrollWheelZoom={false}
      className="min-h-[360px]"
      aria-label="Mapa para selecionar a localização da comunidade"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler onSelectLocation={onSelectLocation} />
      <MapFocus center={center} selectedLocation={selectedLocation} />

      {selectedLocation ? (
        <Marker
          position={[selectedLocation.lat, selectedLocation.lng]}
          icon={selectedIcon}
          keyboard
        />
      ) : null}
    </MapContainer>
  );
}
