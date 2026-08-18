"use client";

import { createClientTraceHeaders } from "@/lib/trace-context";

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function hasHeader(headers: Headers, name: string): boolean {
  return headers.has(name);
}

export function fetchWithClientTrace(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!hasHeader(headers, "X-Request-ID")) headers.set("X-Request-ID", createRequestId());

  const traceHeaders = createClientTraceHeaders();
  if (traceHeaders.traceparent && !hasHeader(headers, "traceparent")) {
    headers.set("traceparent", traceHeaders.traceparent);
  }
  if (traceHeaders.tracestate && !hasHeader(headers, "tracestate")) {
    headers.set("tracestate", traceHeaders.tracestate);
  }

  return fetch(input, { ...init, headers });
}
