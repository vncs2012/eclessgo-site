import { NextRequest, NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api-route-error";
import { PUBLIC_CACHE_TTL_SECONDS } from "@/lib/public-cache";
import { getPublicChurches } from "@/lib/public-api";
import { getPublicRequestId, getPublicTraceHeaders, withPublicRequestId } from "@/lib/public-bff";
import { publicDirectoryQuerySchema } from "@/lib/public-bff-schemas";

/** Valores repetidos de `key` (sem duplicar); undefined quando ausente. */
function uniqueParams(searchParams: URLSearchParams, key: string): string[] | undefined {
  const values = Array.from(new Set(searchParams.getAll(key).map((value) => value.trim())));
  return values.length > 0 ? values : undefined;
}

export async function GET(request: NextRequest) {
  const requestId = getPublicRequestId(request);

  try {
    const searchParams = request.nextUrl.searchParams;
    const parsedQuery = publicDirectoryQuerySchema.safeParse({
      lat: searchParams.get("lat") ?? undefined,
      lng: searchParams.get("lng") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      denomination: searchParams.get("denomination") ?? undefined,
      city: searchParams.get("city") ?? undefined,
      neighborhood: searchParams.get("neighborhood") ?? undefined,
      hasLive: searchParams.get("hasLive") ?? searchParams.get("has_live") ?? undefined,
      day: uniqueParams(searchParams, "day"),
      feature: uniqueParams(searchParams, "feature"),
      limit: searchParams.get("limit") ?? undefined,
      page: searchParams.get("page") ?? undefined,
    });

    if (!parsedQuery.success) {
      return withPublicRequestId(
        NextResponse.json(
          { statusCode: 400, error: "BadRequest", message: "Os filtros informados sao invalidos." },
          { status: 400 },
        ),
        requestId,
      );
    }

    const query = parsedQuery.data;

    const data = await getPublicChurches(
      {
        lat: query.lat,
        lng: query.lng,
        search: query.search,
        denomination: query.denomination,
        city: query.city,
        neighborhood: query.neighborhood,
        hasLive: query.hasLive === undefined ? undefined : query.hasLive === "true",
        days: query.day,
        features: query.feature,
        limit: query.limit,
        page: query.page,
      },
      {
        next: { revalidate: PUBLIC_CACHE_TTL_SECONDS.directoryQuery },
        requestId,
        traceHeaders: getPublicTraceHeaders(request),
      },
    );

    return withPublicRequestId(NextResponse.json({ data }), requestId);
  } catch (error) {
    return apiErrorResponse(error, "Não foi possível carregar o diretório público de comunidades.", requestId);
  }
}
