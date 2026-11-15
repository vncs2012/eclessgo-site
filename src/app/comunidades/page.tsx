import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ChurchFinder } from "@/components/site/church-finder";
import { ChurchFinderProvider } from "@/components/site/church-finder-context";
import { ChurchFinderSearch } from "@/components/site/church-finder-search";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteBottomNav } from "@/components/site/site-bottom-nav";
import { SiteHeader } from "@/components/site/site-header";
import { PUBLIC_CACHE_TTL_SECONDS } from "@/lib/public-cache";
import { getPublicChurches } from "@/lib/public-api";
import { GOIANIA_CENTER, SITE_URL } from "@/lib/site-config";
import type { PublicChurchListItem } from "@/types/public";

export const revalidate = 120;

const DESCRIPTION =
  "Explore comunidades no mapa público do EclessGO, filtre por distância e tradição e descubra espaços perto de você.";

export const metadata: Metadata = {
  title: "Comunidades | EclessGO",
  description: DESCRIPTION,
  alternates: {
    canonical: "/comunidades",
  },
  openGraph: {
    title: "Comunidades | EclessGO",
    description: DESCRIPTION,
    url: `${SITE_URL}/comunidades`,
    type: "website",
  },
};

type DirectoryChurchesResult = {
  churches: PublicChurchListItem[];
  loadError: string | null;
};

async function loadDirectoryChurches(loadErrorMessage: string): Promise<DirectoryChurchesResult> {
  try {
    const churches = await getPublicChurches(
      {
        lat: GOIANIA_CENTER.lat,
        lng: GOIANIA_CENTER.lng,
        limit: 100,
      },
      {
        next: { revalidate: PUBLIC_CACHE_TTL_SECONDS.directoryInitialChurches },
      },
    );
    return { churches, loadError: null };
  } catch (error) {
    console.warn("[comunidades] API publica indisponivel:", error instanceof Error ? error.message : error);
    return { churches: [], loadError: loadErrorMessage };
  }
}

export default async function CommunitiesPage() {
  const t = await getTranslations("finder");
  const { churches, loadError } = await loadDirectoryChurches(t("directory.loadError"));

  return (
    <div className="min-h-screen bg-eg-app text-eg-text max-md:pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <ChurchFinderProvider initialChurches={churches} initialCenter={GOIANIA_CENTER} initialLoadError={loadError}>
        {/* Abaixo de md a Busca não tem cabeçalho: busca e filtros ficam sobre o mapa e a
            navegação vai para a barra inferior. `contents` mantém o header sticky em md+. */}
        <div className="max-md:hidden md:contents">
          <SiteHeader variant="solid" search={<ChurchFinderSearch variant="header" />} />
        </div>
        <main>
          <h1 className="sr-only">{t("directory.title")}</h1>
          <ChurchFinder />
        </main>
      </ChurchFinderProvider>
      <SiteFooter />
      <SiteBottomNav />
    </div>
  );
}
