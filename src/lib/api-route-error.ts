import { NextResponse } from "next/server";

import { ApiRequestError } from "@/lib/public-api";
import { PublicUpstreamTimeoutError, withPublicRequestId } from "@/lib/public-bff";

export function apiErrorResponse(
  error: unknown,
  fallbackMessage = "Não foi possível concluir a requisição pública.",
  requestId?: string,
) {
  if (error instanceof PublicUpstreamTimeoutError) {
    const response = NextResponse.json(
      {
        statusCode: 504,
        error: "GatewayTimeout",
        message: "O servico esta demorando para responder. Tente novamente.",
      },
      { status: 504 },
    );
    return requestId ? withPublicRequestId(response, requestId) : response;
  }

  if (error instanceof ApiRequestError) {
    const statusCode = error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 502;
    const headers = new Headers();
    if (error.retryAfter) headers.set("Retry-After", error.retryAfter);
    const response = NextResponse.json(
      {
        statusCode,
        error: statusCode === 502 ? "BadGateway" : "PublicRequestRejected",
        message: statusCode === 502 ? fallbackMessage : error.message,
      },
      { status: statusCode, headers },
    );
    return requestId ? withPublicRequestId(response, requestId) : response;
  }

  // Não registrar mensagem/stack do upstream: eles podem conter URL, query ou
  // detalhes de infraestrutura. A correlação fica no header da resposta e
  // no middleware de observabilidade do runtime.
  console.error("[public-bff] request failed", error instanceof Error ? error.name : "unknown");

  const response = NextResponse.json(
    {
      statusCode: 500,
      error: "InternalServerError",
      message: fallbackMessage,
    },
    { status: 500 },
  );
  return requestId ? withPublicRequestId(response, requestId) : response;
}
