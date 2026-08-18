import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api-route-error";
import { registerChurch } from "@/lib/public-api";
import {
  PublicPayloadTooLargeError,
  readJsonBodyWithLimit,
} from "@/lib/request-body-limit";
import { getPublicRequestId, getPublicTraceHeaders, withPublicRequestId } from "@/lib/public-bff";
import { registerChurchPublicRequestSchema } from "@/lib/public-bff-schemas";

export async function POST(request: Request) {
  const requestId = getPublicRequestId(request);

  try {
    const rawPayload = await readJsonBodyWithLimit<unknown>(request, 64 * 1024);
    const parsedPayload = registerChurchPublicRequestSchema.safeParse(rawPayload);
    if (!parsedPayload.success) {
      return withPublicRequestId(
        NextResponse.json(
          {
            statusCode: 422,
            error: "ValidationError",
            message: "O cadastro possui campos invalidos.",
          },
          { status: 422 },
        ),
        requestId,
      );
    }

    const data = await registerChurch(parsedPayload.data, {
      requestId,
      traceHeaders: getPublicTraceHeaders(request),
    });
    return withPublicRequestId(NextResponse.json(data, { status: 201 }), requestId);
  } catch (error) {
    if (error instanceof PublicPayloadTooLargeError) {
      return withPublicRequestId(
        NextResponse.json(
          { statusCode: 413, error: "PayloadTooLarge", message: error.message },
          { status: 413, headers: { "Retry-After": "60" } },
        ),
        requestId,
      );
    }
    return apiErrorResponse(error, "Não foi possível concluir o cadastro da comunidade.", requestId);
  }
}
