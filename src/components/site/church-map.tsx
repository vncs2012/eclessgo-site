"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

function ChurchMapLoading() {
  const t = useTranslations("finder");

  return (
    <div className="flex min-h-[340px] items-center justify-center rounded-[1.5rem] border border-white/10 bg-zinc-950 text-sm text-zinc-400">
      {t("map.loading")}
    </div>
  );
}

const ChurchMapCanvas = dynamic(() => import("./church-map-canvas"), {
  ssr: false,
  loading: ChurchMapLoading,
});

export { ChurchMapCanvas as ChurchMap };
