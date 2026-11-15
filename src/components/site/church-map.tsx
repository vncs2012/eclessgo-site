"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

function ChurchMapLoading() {
  const t = useTranslations("finder");

  return (
    <div className="flex h-full min-h-[280px] w-full items-center justify-center bg-eg-subtle text-sm text-eg-muted">
      {t("map.loading")}
    </div>
  );
}

const ChurchMapCanvas = dynamic(() => import("./church-map-canvas"), {
  ssr: false,
  loading: ChurchMapLoading,
});

export type { ChurchMapCanvasProps, ChurchMapItem } from "./church-map-canvas";
export { ChurchMapCanvas as ChurchMap };
