type SentryNextModule = {
  init?: (options: Record<string, unknown>) => void;
  captureException?: (error: unknown, context?: Record<string, unknown>) => void;
};

let sentry: SentryNextModule | null = null;
let initialized = false;

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value.trim() === "") return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function parseSampleRate(value: string | undefined): number {
  const parsed = Number(value ?? "0");
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), 1);
}

async function importOptionalSentry(): Promise<SentryNextModule | null> {
  try {
    const dynamicImport = new Function("specifier", "return import(specifier)") as (
      specifier: string,
    ) => Promise<SentryNextModule>;
    return await dynamicImport("@sentry/nextjs");
  } catch {
    return null;
  }
}

export async function registerServerObservability(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const dsn = (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "").trim();
  const enabled = parseBoolean(process.env.SENTRY_ENABLED, Boolean(dsn));
  if (!enabled || !dsn) return;

  sentry = await importOptionalSentry();
  if (!sentry?.init) {
    console.info("[observability] Sentry configurado, mas @sentry/nextjs nao esta instalado.");
    return;
  }

  sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ||
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
      process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE),
    sendDefaultPii: false,
  });
}

export function captureServerException(error: unknown, context?: Record<string, unknown>): void {
  sentry?.captureException?.(error, context);
}
