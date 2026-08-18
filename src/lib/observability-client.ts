"use client";

type SentryGlobal = {
  init?: (options: Record<string, unknown>) => void;
  captureException?: (error: unknown, context?: Record<string, unknown>) => void;
  addBreadcrumb?: (breadcrumb: {
    category?: string;
    message?: string;
    level?: "fatal" | "error" | "warning" | "info" | "debug";
    data?: Record<string, unknown>;
  }) => void;
};

type CaptureContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
};

declare global {
  interface Window {
    Sentry?: SentryGlobal;
  }
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value.trim() === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

const clientConfig = {
  enabled: parseBoolean(process.env.NEXT_PUBLIC_SENTRY_ENABLED, false),
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ?? "",
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
};

export function captureClientException(error: unknown, context: CaptureContext = {}): void {
  if (clientConfig.enabled && clientConfig.dsn && window.Sentry?.captureException) {
    window.Sentry.captureException(error, context);
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error("[observability]", error, context);
  }
}

export type ClientRequestOperation = "public-directory.search" | "public-directory.clear" | "public-directory.location";
export type ClientRequestOutcome = "success" | "error" | "aborted";

export interface ClientRequestMetric {
  operation: ClientRequestOperation;
  operationId: string;
  outcome: ClientRequestOutcome;
  durationMs: number;
  resultCount?: number;
}

/**
 * Keeps request timing observable without adding a new analytics event or
 * sending filters/location data. Performance entries are available to RUM;
 * Sentry receives the same safe data as a breadcrumb for later errors.
 */
export function recordClientRequestMetric(metric: ClientRequestMetric): void {
  if (typeof window === "undefined") return;

  const data = {
    operation: metric.operation,
    operationId: metric.operationId,
    outcome: metric.outcome,
    durationMs: Math.round(Math.max(0, metric.durationMs)),
    ...(metric.resultCount === undefined ? {} : { resultCount: metric.resultCount }),
  };

  if (typeof performance !== "undefined" && typeof performance.mark === "function") {
    try {
      performance.mark(`eclessgo:${metric.operation}:${metric.operationId}`, { detail: data });
    } catch {
      // Performance marks are best-effort and must never affect the request.
    }
  }

  window.Sentry?.addBreadcrumb?.({
    category: "http.client",
    message: `${metric.operation} ${metric.outcome}`,
    level: metric.outcome === "error" ? "warning" : "info",
    data,
  });

  if (process.env.NODE_ENV !== "production") {
    console.debug("[observability] public request", data);
  }
}
