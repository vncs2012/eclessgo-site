"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { ResultCard, type NumberedChurch } from "@/components/site/church-finder-results";
import { CommunitySection } from "@/components/site/community-section";

/**
 * Outras comunidades perto: os mesmos cartões numerados da Busca. O 1 é esta comunidade
 * (pin do mapa de "Como chegar"), então a lista começa no 2.
 */
export function CommunityNearby({ items, name }: { items: NumberedChurch[]; name: string }) {
  const t = useTranslations("communityPage.nearby");
  const router = useRouter();

  if (items.length === 0) return null;

  return (
    <CommunitySection id="perto" title={t("title")} titleId="community-nearby-title">
      <ol aria-label={t("listLabel", { name })} className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <ResultCard
            key={item.church.id}
            item={item}
            selected={false}
            onSelect={() => router.push(`/comunidades/${item.church.slug}`)}
          />
        ))}
      </ol>
    </CommunitySection>
  );
}
