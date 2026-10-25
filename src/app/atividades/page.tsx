import { getLocale } from "next-intl/server";
import { getPublicActivityCatalogue } from "@/lib/public-api";
import { PublicActivityCatalogueView } from "../../components/site/church-public-activities";
import type { ActivitySearch } from "../../lib/public-activity-catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicActivitiesPage({ searchParams }: {
  searchParams: Promise<ActivitySearch>;
}) {
  const result = await getPublicActivityCatalogue(await searchParams);
  const locale = await getLocale();
  // Explicit raw public config. No PANEL_URL fallback or authentication state here.
  const panelOrigin = process.env.NEXT_PUBLIC_PANEL_URL;
  return <PublicActivityCatalogueView result={result} locale={locale} panelOrigin={panelOrigin} />;
}
