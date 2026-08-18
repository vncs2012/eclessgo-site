import { ChurchFinder } from "@/components/site/church-finder";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { PUBLIC_CACHE_TTL_SECONDS } from "@/lib/public-cache";
import { getPublicChurches } from "@/lib/public-api";
import { GOIANIA_CENTER } from "@/lib/site-config";
import type { PublicChurchListItem } from "@/types/public";

export const revalidate = 120;

type DirectoryChurchesResult = {
  churches: PublicChurchListItem[];
  loadError: string | null;
};

async function loadDirectoryChurches(): Promise<DirectoryChurchesResult> {
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
    return {
      churches,
      loadError: null,
    };
  } catch (error) {
    console.warn("[igrejas] API publica indisponivel:", error instanceof Error ? error.message : error);
    return {
      churches: [],
      loadError: "Não foi possível carregar o diretório público agora porque a API do EclessGO não respondeu.",
    };
  }
}

export default async function ChurchesPage() {
  const { churches, loadError } = await loadDirectoryChurches();

  return (
    <div className="site-shell min-h-screen bg-background text-foreground">
      <div className="grid-noise absolute inset-0 opacity-35" aria-hidden="true" />
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <section className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Mapa público</p>
          <h1 className="section-title mt-4 text-5xl font-semibold tracking-tight text-zinc-50">
            Descubra comunidades cadastradas no EclessGO
          </h1>
          <p className="mt-5 text-base leading-8 text-zinc-400">
            Este diretório mostra apenas comunidades com latitude e longitude válidas. A pessoa pode
            buscar por nome, filtrar por tradição, usar a própria localização e abrir a página
            pública de cada espaço.
          </p>
        </section>

        <section className="mt-10">
          {loadError ? (
            <div className="mb-5 rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm leading-7 text-amber-100">
              {loadError}
            </div>
          ) : null}

          <ChurchFinder
            initialChurches={churches}
            initialCenter={GOIANIA_CENTER}
            initialLoadError={loadError}
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
