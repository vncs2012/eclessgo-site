"use client";

import dynamic from "next/dynamic";

const ChurchMapCanvas = dynamic(() => import("./church-map-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[340px] items-center justify-center rounded-[1.5rem] border border-white/10 bg-zinc-950 text-sm text-zinc-400">
      Carregando mapa...
    </div>
  ),
});

export { ChurchMapCanvas as ChurchMap };
