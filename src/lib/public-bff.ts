import { NextResponse } from "next/server";

import { traceHeadersFromRequest, type TraceHeaders } from "@/lib/trace-context";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

export const PUBLIC_UPSTREAM_TIMEOUT_MS = 8_000;

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

export class PublicUpstreamTimeoutError extends Error {
  constructor() {
    super("O servico publico demorou mais que o limite para responder.");
    this.name = "PublicUpstreamTimeoutError";
  }
}

export function getPublicRequestId(request: Request): string {
  const provided = request.headers.get("x-request-id")?.trim();
  if (provided && REQUEST_ID_PATTERN.test(provided)) return provided;

  return crypto.randomUUID();
}

export function withPublicRequestId(response: NextResponse, requestId: string): NextResponse {
  response.headers.set("X-Request-ID", requestId);
  return response;
}

/**
 * Forward only a validated W3C context to the API. The BFF creates a child
 * context id so a browser/mobile request remains traceable across the boundary;
 * arbitrary header values and high-cardinality request data are discarded.
 */
export function getPublicTraceHeaders(request: Request): TraceHeaders {
  return traceHeadersFromRequest(request);
}

export async function fetchPublicUpstream(
  input: RequestInfo | URL,
  init: NextFetchInit = {},
  timeoutMs = PUBLIC_UPSTREAM_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) throw new PublicUpstreamTimeoutError();
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
