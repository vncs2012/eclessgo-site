import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_API_BASE_URL } from "@/lib/site-config";
import {
  PublicPayloadTooLargeError,
  readJsonBodyWithLimit,
} from "@/lib/request-body-limit";
import {
  fetchPublicUpstream,
  getPublicRequestId,
  getPublicTraceHeaders,
  withPublicRequestId,
} from "@/lib/public-bff";
import { publicAnalyticsRequestSchema } from "@/lib/public-bff-schemas";

const ANALYTICS_BODY_LIMIT_BYTES = 16 * 1024;

export async function POST(request: NextRequest) {
  const requestId = getPublicRequestId(request);

  try {
    const rawPayload = await readJsonBodyWithLimit<unknown>(request, ANALYTICS_BODY_LIMIT_BYTES);
    const parsedPayload = publicAnalyticsRequestSchema.safeParse(rawPayload);
    if (!parsedPayload.success) {
      return withPublicRequestId(
        NextResponse.json(
          {
            statusCode: 422,
            error: "ValidationError",
            message: "O evento publico possui campos invalidos.",
          },
          { status: 422 },
        ),
        requestId,
      );
    }

    const response = await fetchPublicUpstream(`${DEFAULT_API_BASE_URL}/analytics/events`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
        ...getPublicTraceHeaders(request),
      },
      body: JSON.stringify(parsedPayload.data),
      cache: "no-store",
    });

    const text = await response.text();
    let body: unknown = null;

    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = {
          message: text,
        };
      }
    }

    const responseHeaders = new Headers();
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) responseHeaders.set("Retry-After", retryAfter);
    return withPublicRequestId(
      NextResponse.json(body, { status: response.status, headers: responseHeaders }),
      requestId,
    );
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
    const { apiErrorResponse } = await import("@/lib/api-route-error");
    return apiErrorResponse(error, "Nao foi possivel registrar o evento publico agora.", requestId);
  }
}
