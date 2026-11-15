"use client";

import dynamic from "next/dynamic";

const LocationPickerMapCanvas = dynamic(() => import("./location-picker-map-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[360px] items-center justify-center rounded-[1.5rem] border border-eg-border bg-eg-subtle text-sm text-eg-muted">
      Carregando mapa de localização...
    </div>
  ),
});

export { LocationPickerMapCanvas as LocationPickerMap };
