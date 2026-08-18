import { NextRequest, NextResponse } from "next/server";

import { PUBLIC_CACHE_TTL_SECONDS } from "@/lib/public-cache";
import {
  fetchPublicUpstream,
  getPublicRequestId,
  getPublicTraceHeaders,
  withPublicRequestId,
} from "@/lib/public-bff";
import { reverseGeocodeQuerySchema } from "@/lib/public-bff-schemas";
import { SITE_URL } from "@/lib/site-config";

type NominatimAddress = {
  road?: string;
  pedestrian?: string;
  footway?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  postcode?: string;
  "ISO3166-2-lvl4"?: string;
};

type NominatimResponse = {
  address?: NominatimAddress;
  display_name?: string;
};

function getStateValue(address: NominatimAddress) {
  const stateCode = address["ISO3166-2-lvl4"]?.split("-").pop();
  return stateCode || address.state || "";
}

export async function GET(request: NextRequest) {
  const requestId = getPublicRequestId(request);
  const searchParams = request.nextUrl.searchParams;
  const parsedQuery = reverseGeocodeQuerySchema.safeParse({
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
  });

  if (!parsedQuery.success) {
    return withPublicRequestId(NextResponse.json(
      {
        message: "Latitude e longitude validas sao obrigatorias.",
      },
      { status: 400 },
    ), requestId);
  }

  const { lat, lng } = parsedQuery.data;

  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/reverse");
  nominatimUrl.searchParams.set("format", "jsonv2");
  nominatimUrl.searchParams.set("lat", String(lat));
  nominatimUrl.searchParams.set("lon", String(lng));
  nominatimUrl.searchParams.set("zoom", "18");
  nominatimUrl.searchParams.set("addressdetails", "1");

  try {
    const response = await fetchPublicUpstream(nominatimUrl, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR,pt;q=0.9",
        Referer: SITE_URL,
        "User-Agent": `EclessGO Web (${SITE_URL})`,
        "X-Request-ID": requestId,
        ...getPublicTraceHeaders(request),
      },
      next: { revalidate: PUBLIC_CACHE_TTL_SECONDS.reverseGeocode },
    });

    if (!response.ok) {
      return withPublicRequestId(NextResponse.json(
        {
          message: "Nao foi possivel buscar o endereco desta coordenada agora.",
        },
        { status: response.status >= 400 && response.status < 500 ? response.status : 502 },
      ), requestId);
    }
    const payload = (await response.json()) as NominatimResponse;
    const address = payload.address ?? {};

    return withPublicRequestId(NextResponse.json({
      data: {
        street: address.road || address.pedestrian || address.footway || "",
        number: address.house_number || "",
        neighborhood: address.neighbourhood || address.suburb || "",
        city: address.city || address.town || address.village || address.municipality || "",
        state: getStateValue(address),
        zipCode: address.postcode || "",
        displayName: payload.display_name || "",
      },
    }), requestId);
  } catch (error) {
    const { apiErrorResponse } = await import("@/lib/api-route-error");
    return apiErrorResponse(error, "Nao foi possivel buscar o endereco desta coordenada agora.", requestId);
  }
}
