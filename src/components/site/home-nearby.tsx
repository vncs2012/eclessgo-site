"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Map as MapIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { ResultCard, type NumberedChurch } from "@/components/site/church-finder-results";
import { ChurchMap } from "@/components/site/church-map";
import type { Coordinates } from "@/types/public";

type HomeNearbyProps = {
  /** Mesmo array numerado para a lista e para o mapa: o item N é o pin N. */
  items: NumberedChurch[];
  center: Coordinates;
};

const LINK_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eg-focus";

export function HomeNearby({ items, center }: HomeNearbyProps) {
  const t = useTranslations("home.nearby");
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.church.id ?? null);

  return (
    <section
      aria-labelledby="home-nearby-title"
      className="mx-auto w-full max-w-[var(--eg-content-max)] px-4 pt-16 sm:px-6 lg:px-10 lg:pt-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-eg-warm">
            {t("eyebrow")}
          </p>
          <h2
            id="home-nearby-title"
            className="mt-2 font-display text-[clamp(1.625rem,3vw,2.125rem)] font-extrabold leading-tight tracking-[-0.03em] text-eg-strong"
          >
            {t("title")}
          </h2>
          <p className="mt-2 text-eg-muted">{t("description")}</p>
        </div>
        <Link
          href="/comunidades"
          className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-eg-border-strong px-4 text-sm font-bold text-eg-strong transition-colors hover:bg-eg-hover ${LINK_FOCUS}`}
        >
          {t("seeAll")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-2 lg:gap-6">
        <ol
          aria-label={t("listLabel")}
          className="grid content-start gap-2.5"
        >
          {items.map((item) => (
            <ResultCard
              key={item.church.id}
              item={item}
              selected={item.church.id === selectedId}
              onSelect={() => setSelectedId(item.church.id)}
            />
          ))}
        </ol>

        <div className="relative isolate h-[360px] overflow-hidden rounded-2xl border border-eg-border md:h-[440px] lg:h-auto lg:min-h-[460px]">
          <ChurchMap
            items={items}
            center={center}
            selectedChurchId={selectedId}
            onSelectChurch={setSelectedId}
          />
          <Link
            href="/comunidades"
            className={`absolute bottom-3 right-3 z-[500] inline-flex min-h-11 items-center gap-2 rounded-full bg-eg-primary px-4 text-sm font-bold text-eg-inverse shadow-[var(--eg-shadow-md)] transition-colors hover:bg-eg-primary-hover ${LINK_FOCUS}`}
          >
            <MapIcon className="h-4 w-4" aria-hidden="true" />
            {t("openMap")}
          </Link>
        </div>
      </div>
    </section>
  );
}
