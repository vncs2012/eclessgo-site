import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api-route-error";
import { getPublicLegalDocuments } from "@/lib/public-api";
import { getPublicRequestId, getPublicTraceHeaders, withPublicRequestId } from "@/lib/public-bff";

export async function GET(request: Request) {
  const requestId = getPublicRequestId(request);

  try {
    const documents = await getPublicLegalDocuments({
      requestId,
      traceHeaders: getPublicTraceHeaders(request),
    });

    return withPublicRequestId(NextResponse.json({ data: documents }), requestId);
  } catch (error) {
    return apiErrorResponse(error, "Não foi possível confirmar a vigência dos documentos legais.", requestId);
  }
}
