import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api-route-error";
import { PUBLIC_CACHE_TTL_SECONDS } from "@/lib/public-cache";
import { getPublicChurchBySlug } from "@/lib/public-api";
import { getPublicRequestId, getPublicTraceHeaders, withPublicRequestId } from "@/lib/public-bff";
import { publicSlugSchema } from "@/lib/public-bff-schemas";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const requestId = getPublicRequestId(request);

  try {
    const { slug } = await context.params;
    const parsedSlug = publicSlugSchema.safeParse(slug);
    if (!parsedSlug.success) {
      return withPublicRequestId(
        NextResponse.json(
          { statusCode: 400, error: "BadRequest", message: "O identificador da comunidade e invalido." },
          { status: 400 },
        ),
        requestId,
      );
    }
    const data = await getPublicChurchBySlug(parsedSlug.data, {
      next: { revalidate: PUBLIC_CACHE_TTL_SECONDS.churchDetail },
      requestId,
      traceHeaders: getPublicTraceHeaders(request),
    });
    return withPublicRequestId(NextResponse.json({ data }), requestId);
  } catch (error) {
    return apiErrorResponse(error, "Não foi possível carregar a página pública da comunidade.", requestId);
  }
}
