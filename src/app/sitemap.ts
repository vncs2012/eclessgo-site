import type { MetadataRoute } from "next";

import { PUBLIC_CACHE_TTL_SECONDS } from "@/lib/public-cache";
import { getPublicChurchesPage } from "@/lib/public-api";
import { SITE_URL } from "@/lib/site-config";

export const revalidate = 3600;

const SITEMAP_PAGE_SIZE = 100;
const MAX_SITEMAP_URLS = 50_000;

async function loadSitemapChurches() {
  const options = { next: { revalidate: PUBLIC_CACHE_TTL_SECONDS.sitemap } };
  const firstPage = await getPublicChurchesPage({ limit: SITEMAP_PAGE_SIZE }, options);
  const churches = [...firstPage.churches];
  const maxPages = Math.min(
    firstPage.totalPages,
    Math.ceil(MAX_SITEMAP_URLS / SITEMAP_PAGE_SIZE),
  );

  for (let page = 2; page <= maxPages; page += 1) {
    const nextPage = await getPublicChurchesPage({ limit: SITEMAP_PAGE_SIZE, page }, options);
    churches.push(...nextPage.churches);
  }

  return churches;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/comunidades`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/igrejas`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/cadastro-comunidade`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const churches = await loadSitemapChurches();
    dynamicRoutes = churches
      .filter((church) => church.slug)
      .map((church) => ({
        url: `${SITE_URL}/comunidades/${church.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
  } catch (error) {
    // Sitemap nao deve quebrar build se a API estiver fora.
    console.warn("[sitemap] Falha ao listar comunidades:", error instanceof Error ? error.message : error);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
