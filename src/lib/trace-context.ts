const TRACEPARENT_PATTERN =
  /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})(?:-([0-9a-f]{2}))?$/i;
const TRACESTATE_PATTERN = /^[\x20-\x7e]{1,512}$/;

export type TraceHeaders = {
  traceparent?: string;
  tracestate?: string;
};

type ParsedTraceparent = {
  traceId: string;
  spanId: string;
  flags: string;
};

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function nonZeroHex(byteLength: number): string {
  let value = randomHex(byteLength);
  while (/^0+$/.test(value)) value = randomHex(byteLength);
  return value;
}

export function parseTraceparent(value: string | null | undefined): ParsedTraceparent | null {
  const normalized = value?.trim();
  if (!normalized) return null;

  const match = TRACEPARENT_PATTERN.exec(normalized);
  if (!match || match[1] === "0".repeat(32) || match[2] === "0".repeat(16)) {
    return null;
  }

  const flags = match[3].toLowerCase();
  if (flags === "ff") return null;

  return {
    traceId: match[1].toLowerCase(),
    spanId: match[2].toLowerCase(),
    flags,
  };
}

export function createTraceparent(
  parent: string | null | undefined,
  defaultFlags = "01",
): string {
  const parsedParent = parseTraceparent(parent);
  const traceId = parsedParent?.traceId ?? nonZeroHex(16);
  const flags = parsedParent?.flags ?? (defaultFlags === "ff" ? "00" : defaultFlags);
  return `00-${traceId}-${nonZeroHex(8)}-${flags}`;
}

export function sanitizeTracestate(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized && TRACESTATE_PATTERN.test(normalized) ? normalized : null;
}

export function traceHeadersFromRequest(request: Request): TraceHeaders {
  const parent = request.headers.get("traceparent");
  const parsedParent = parseTraceparent(parent);
  if (!parsedParent) return {};

  const headers: TraceHeaders = {
    // The BFF is a propagation boundary: preserve the inbound trace and create
    // a new child context id without exposing request data in the header.
    traceparent: createTraceparent(parent, parsedParent.flags),
  };
  const tracestate = sanitizeTracestate(request.headers.get("tracestate"));
  if (tracestate) headers.tracestate = tracestate;
  return headers;
}

export function isClientTracePropagationEnabled(): boolean {
  const value = process.env.NEXT_PUBLIC_OTEL_ENABLED?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function createClientTraceHeaders(): TraceHeaders {
  if (!isClientTracePropagationEnabled()) return {};
  return { traceparent: createTraceparent(undefined, "01") };
}
