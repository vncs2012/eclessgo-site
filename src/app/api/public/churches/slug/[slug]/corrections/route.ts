import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/lib/api-route-error";
import { churchCorrectionSchema, correctionFieldErrors } from "@/lib/church-correction";
import {
  clientIp,
  createProtectionStoreFromEnv,
  createSubmissionLimiter,
  forwardableOrigin,
  isSameOriginRequest,
  readCorrectionLimits,
} from "@/lib/public-assistant-protection";
import { submitChurchCorrection } from "@/lib/public-api";
import { getPublicRequestId, getPublicTraceHeaders, withPublicRequestId } from "@/lib/public-bff";
import { publicSlugSchema } from "@/lib/public-bff-schemas";
import { PublicPayloadTooLargeError, readJsonBodyWithLimit } from "@/lib/request-body-limit";

/** Mensagem (até 1000) + contato (até 254) + folga para o JSON; acima disso é abuso. */
const CORRECTION_BODY_LIMIT_BYTES = 16 * 1024;

// Escopo de módulo: os contadores sobrevivem entre requisições numa instância quente (e ficam
// compartilhados entre instâncias quando há Redis, como no assistente).
const submissionLimiter = createSubmissionLimiter({
  store: createProtectionStoreFromEnv(process.env),
  limits: () => readCorrectionLimits(process.env),
  env: () => process.env,
});

/**
 * Cabeçalhos que o BFF repassa à API além do trace. `Origin` só vai quando é a origem configurada do
 * site (`NEXT_PUBLIC_SITE_URL`). O IP do cliente (`X-Forwarded-For`) só vai quando o BFF roda atrás de
 * um proxy confiável (Vercel ou ASSISTANT_TRUST_PROXY_HEADERS) e `clientIp` conseguiu identificá-lo;
 * sem isso o cabeçalho seria controlado pelo cliente e o limite por cliente da API ficaria falsificável.
 */
function forwardedHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  const origin = forwardableOrigin(request, process.env);
  if (origin) headers.Origin = origin;
  const ip = clientIp(request, process.env);
  if (ip !== "untrusted" && ip !== "unknown") headers["X-Forwarded-For"] = ip;
  return headers;
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const requestId = getPublicRequestId(request);

  try {
    // Como o assistente: sem Origin do próprio site (ou com Sec-Fetch-Site de outro site) não há envio.
    if (!isSameOriginRequest(request, process.env)) {
      return withPublicRequestId(
        NextResponse.json(
          { statusCode: 403, error: "Forbidden", message: "Origem nao permitida.", code: "FORBIDDEN_ORIGIN" },
          { status: 403, headers: { "Cache-Control": "no-store" } },
        ),
        requestId,
      );
    }

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

    const rawPayload = await readJsonBodyWithLimit<unknown>(request, CORRECTION_BODY_LIMIT_BYTES);
    const parsedPayload = churchCorrectionSchema.safeParse(rawPayload);
    if (!parsedPayload.success) {
      return withPublicRequestId(
        NextResponse.json(
          {
            statusCode: 422,
            error: "ValidationError",
            message: "A sugestao possui campos invalidos.",
            fields: correctionFieldErrors(parsedPayload.error),
          },
          { status: 422 },
        ),
        requestId,
      );
    }

    const admission = await submissionLimiter.admit(request, parsedSlug.data);
    if (admission.kind === "rate-limited") {
      return withPublicRequestId(
        NextResponse.json(
          {
            statusCode: 429,
            error: "PublicRequestRejected",
            message: "Muitas sugestoes. Tente novamente mais tarde.",
            code: "RATE_LIMITED",
          },
          {
            status: 429,
            headers: { "Retry-After": String(admission.retryAfterSeconds), "Cache-Control": "no-store" },
          },
        ),
        requestId,
      );
    }
    if (admission.kind !== "allowed") {
      return withPublicRequestId(
        NextResponse.json(
          { statusCode: 503, error: "ServiceUnavailable", message: "Nao foi possivel enviar agora." },
          { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
        ),
        requestId,
      );
    }

    const data = await submitChurchCorrection(parsedSlug.data, parsedPayload.data, {
      requestId,
      traceHeaders: getPublicTraceHeaders(request),
      headers: forwardedHeaders(request),
    });
    return withPublicRequestId(NextResponse.json(data, { status: 202 }), requestId);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return withPublicRequestId(
        NextResponse.json(
          {
            statusCode: 422,
            error: "ValidationError",
            message: "A sugestao possui campos invalidos.",
            fields: {},
          },
          { status: 422 },
        ),
        requestId,
      );
    }
    if (error instanceof PublicPayloadTooLargeError) {
      return withPublicRequestId(
        NextResponse.json(
          { statusCode: 413, error: "PayloadTooLarge", message: error.message },
          { status: 413, headers: { "Retry-After": "60" } },
        ),
        requestId,
      );
    }
    return apiErrorResponse(error, "Não foi possível enviar a sugestão agora.", requestId);
  }
}
