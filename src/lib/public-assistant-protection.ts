/**
 * Abuse and spend protection for the public information assistant.
 *
 * Storage: when Upstash Redis REST credentials are present (Vercel Marketplace
 * injects KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/TOKEN),
 * counters and cache are shared across every function instance through plain
 * `fetch` calls (no SDK dependency). Without them, an in-memory store scoped to
 * the function instance is used; Fluid Compute reuses instances, so it still
 * bounds bursts, but the limits then apply per instance.
 */

type Environment = Readonly<Record<string, string | undefined>>;

export interface AssistantProtectionStore {
  /** Increments `key` and returns the new count; the key expires after `ttlMs`. */
  increment(key: string, ttlMs: number): Promise<number>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlMs: number): Promise<void>;
}

export interface AssistantProtectionLimits {
  ipPerMinute: number;
  ipPerHour: number;
  slugPerHour: number;
  globalPerDay: number;
  cacheTtlMs: number;
}

export type AssistantAdmission =
  | { kind: "allowed" }
  | { kind: "rate-limited"; retryAfterSeconds: number }
  | { kind: "over-budget" }
  | { kind: "unavailable" };

export interface AssistantProtection {
  isAllowedOrigin(request: Request): boolean;
  admit(request: Request, slug: string): Promise<AssistantAdmission>;
  readCached(
    slug: string,
    locale: string,
    question: string,
  ): Promise<Record<string, unknown> | null>;
  writeCached(
    slug: string,
    locale: string,
    question: string,
    payload: Record<string, unknown>,
  ): Promise<void>;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const KEY_PREFIX = "eclessgo:assistant";

export const DEFAULT_ASSISTANT_PROTECTION_LIMITS: AssistantProtectionLimits = Object.freeze({
  ipPerMinute: 5,
  ipPerHour: 30,
  slugPerHour: 120,
  globalPerDay: 1000,
  cacheTtlMs: 5 * MINUTE_MS,
});

function nonNegativeInteger(value: string | undefined, fallback: number): number {
  const raw = value?.trim();
  if (!raw || !/^[0-9]+$/.test(raw)) return fallback;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
}

/** Reads limits from env; invalid values fall back to the defaults. */
export function readAssistantProtectionLimits(env: Environment): AssistantProtectionLimits {
  const defaults = DEFAULT_ASSISTANT_PROTECTION_LIMITS;
  return {
    ipPerMinute: nonNegativeInteger(env.ASSISTANT_RATE_LIMIT_IP_PER_MINUTE, defaults.ipPerMinute),
    ipPerHour: nonNegativeInteger(env.ASSISTANT_RATE_LIMIT_IP_PER_HOUR, defaults.ipPerHour),
    slugPerHour: nonNegativeInteger(env.ASSISTANT_RATE_LIMIT_SLUG_PER_HOUR, defaults.slugPerHour),
    globalPerDay: nonNegativeInteger(env.ASSISTANT_GLOBAL_DAILY_LIMIT, defaults.globalPerDay),
    cacheTtlMs:
      nonNegativeInteger(env.ASSISTANT_RESPONSE_CACHE_TTL_SECONDS, defaults.cacheTtlMs / 1000) *
      1000,
  };
}

export function createMemoryProtectionStore(
  options: { now?: () => number; maxEntries?: number } = {},
): AssistantProtectionStore {
  const now = options.now ?? Date.now;
  const maxEntries = options.maxEntries ?? 10_000;
  type Entry = { value: string; expiresAt: number };
  // Counters and cache live apart: a flood of cache writes or fresh keys must
  // never evict a live counter, or limits and the spend ceiling would reset.
  const counters = new Map<string, Entry>();
  const cache = new Map<string, Entry>();

  const live = (map: Map<string, Entry>, key: string) => {
    const entry = map.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= now()) {
      map.delete(key);
      return null;
    }
    return entry;
  };
  const dropExpired = (map: Map<string, Entry>) => {
    const current = now();
    for (const [key, entry] of map) if (entry.expiresAt <= current) map.delete(key);
  };

  return {
    async increment(key, ttlMs) {
      const entry = live(counters, key);
      if (entry) {
        entry.value = String(Number(entry.value) + 1);
        return Number(entry.value);
      }
      if (counters.size >= maxEntries) dropExpired(counters);
      // Still full: fail closed (callers answer "unavailable") instead of
      // forgetting live counts. The global counter is always admitted.
      if (counters.size >= maxEntries && !key.includes(":rl:global:")) {
        throw new Error("Protection counter store is full");
      }
      counters.set(key, { value: "1", expiresAt: now() + ttlMs });
      return 1;
    },
    async get(key) {
      return live(cache, key)?.value ?? live(counters, key)?.value ?? null;
    },
    async set(key, value, ttlMs) {
      cache.delete(key);
      if (cache.size >= maxEntries) dropExpired(cache);
      // Cache entries are disposable: drop the oldest insertions first.
      for (const oldest of cache.keys()) {
        if (cache.size < maxEntries) break;
        cache.delete(oldest);
      }
      cache.set(key, { value, expiresAt: now() + ttlMs });
    },
  };
}

export function createUpstashProtectionStore(options: {
  url: string;
  token: string;
  fetchImpl?: typeof fetch;
}): AssistantProtectionStore {
  const base = options.url.replace(/\/+$/, "");
  const doFetch = options.fetchImpl ?? ((input, init) => fetch(input, init));

  async function pipeline(commands: (string | number)[][]): Promise<unknown[]> {
    const response = await doFetch(`${base}/pipeline`, {
      method: "POST",
      cache: "no-store",
      headers: { Authorization: `Bearer ${options.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) throw new Error(`Protection store failed with ${response.status}`);
    const payload: unknown = await response.json();
    if (!Array.isArray(payload) || payload.length !== commands.length) {
      throw new Error("Invalid protection store response");
    }
    return payload.map((item) => {
      if (typeof item !== "object" || item === null || "error" in item) {
        throw new Error("Protection store command failed");
      }
      return (item as { result?: unknown }).result;
    });
  }

  return {
    async increment(key, ttlMs) {
      const [count] = await pipeline([
        ["INCR", key],
        ["PEXPIRE", key, ttlMs, "NX"],
      ]);
      if (typeof count !== "number") throw new Error("Invalid counter");
      return count;
    },
    async get(key) {
      const [value] = await pipeline([["GET", key]]);
      return typeof value === "string" ? value : null;
    },
    async set(key, value, ttlMs) {
      await pipeline([["SET", key, value, "PX", ttlMs]]);
    },
  };
}

/** Picks the shared Redis store when credentials exist, else the in-memory one. */
export function createProtectionStoreFromEnv(env: Environment): AssistantProtectionStore {
  const url = env.KV_REST_API_URL?.trim() || env.UPSTASH_REDIS_REST_URL?.trim();
  const token = env.KV_REST_API_TOKEN?.trim() || env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return url && token
    ? createUpstashProtectionStore({ url, token })
    : createMemoryProtectionStore();
}

/**
 * Client IP from proxy headers, read only behind a proxy that overwrites them:
 * on Vercel (`VERCEL` is set) the edge replaces `x-real-ip` / `x-forwarded-for`
 * with the real client address. Elsewhere set `ASSISTANT_TRUST_PROXY_HEADERS=true`
 * only when a trusted proxy does the same. Without that trust the headers are
 * client-controlled, so every request shares one bucket instead.
 */
export function clientIp(request: Request, env: Environment = {}): string {
  const trusted =
    Boolean(env.VERCEL?.trim()) || env.ASSISTANT_TRUST_PROXY_HEADERS?.trim().toLowerCase() === "true";
  if (!trusted) return "untrusted";
  for (const header of ["x-real-ip", "x-vercel-forwarded-for", "x-forwarded-for"]) {
    const value = request.headers.get(header)?.split(",")[0]?.trim();
    if (value) return value.slice(0, 64);
  }
  return "unknown";
}

function originHost(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.host.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * Browsers always send `Origin` on a POST fetch, so a missing or foreign origin
 * means another site (or a script) is driving the endpoint. `Sec-Fetch-Site`,
 * when sent, must say the call came from this same origin.
 */
export function isSameOriginRequest(request: Request, env: Environment): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite !== null && fetchSite !== "same-origin") return false;

  const origin = originHost(request.headers.get("origin"));
  if (!origin) return false;

  const allowed = new Set<string>();
  for (const candidate of [
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim(),
    request.headers.get("host")?.trim(),
  ]) {
    if (candidate) allowed.add(candidate.toLowerCase());
  }
  const requestHost = originHost(request.url);
  if (requestHost) allowed.add(requestHost);
  const siteHost = originHost(env.NEXT_PUBLIC_SITE_URL);
  if (siteHost) allowed.add(siteHost);

  return allowed.has(origin);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeQuestion(question: string): string {
  return question.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

export function createAssistantProtection(options: {
  store: AssistantProtectionStore;
  limits?: AssistantProtectionLimits | (() => AssistantProtectionLimits);
  env?: Environment | (() => Environment);
  now?: () => number;
}): AssistantProtection {
  const now = options.now ?? Date.now;
  const limits = () =>
    typeof options.limits === "function"
      ? options.limits()
      : (options.limits ?? DEFAULT_ASSISTANT_PROTECTION_LIMITS);
  const env = () => (typeof options.env === "function" ? options.env() : (options.env ?? {}));

  /** Fixed-window counter; returns seconds until reset when over `limit`. */
  async function overLimit(scope: string, limit: number, windowMs: number): Promise<number | null> {
    const window = Math.floor(now() / windowMs);
    const count = await options.store.increment(
      `${KEY_PREFIX}:rl:${scope}:${windowMs}:${window}`,
      windowMs,
    );
    if (count <= limit) return null;
    return Math.max(1, Math.ceil(((window + 1) * windowMs - now()) / 1000));
  }

  async function cacheKey(slug: string, locale: string, question: string) {
    return `${KEY_PREFIX}:cache:${await sha256Hex(`${slug}\n${locale}\n${normalizeQuestion(question)}`)}`;
  }

  return {
    isAllowedOrigin(request) {
      return isSameOriginRequest(request, env());
    },

    async admit(request, slug) {
      const current = limits();
      try {
        const ip = await sha256Hex(clientIp(request, env()));
        for (const [scope, limit, windowMs] of [
          [`ip:${ip}`, current.ipPerMinute, MINUTE_MS],
          [`ip:${ip}`, current.ipPerHour, HOUR_MS],
          [`slug:${slug}`, current.slugPerHour, HOUR_MS],
        ] as const) {
          const retryAfterSeconds = await overLimit(scope, limit, windowMs);
          if (retryAfterSeconds !== null) return { kind: "rate-limited", retryAfterSeconds };
        }
        if ((await overLimit("global", current.globalPerDay, DAY_MS)) !== null)
          return { kind: "over-budget" };
        return { kind: "allowed" };
      } catch {
        // Fail closed: without counters there is no spend ceiling.
        return { kind: "unavailable" };
      }
    },

    async readCached(slug, locale, question) {
      if (limits().cacheTtlMs <= 0) return null;
      try {
        const raw = await options.store.get(await cacheKey(slug, locale, question));
        if (raw === null) return null;
        const parsed: unknown = JSON.parse(raw);
        return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : null;
      } catch {
        return null;
      }
    },

    async writeCached(slug, locale, question, payload) {
      const ttlMs = limits().cacheTtlMs;
      if (ttlMs <= 0) return;
      try {
        await options.store.set(
          await cacheKey(slug, locale, question),
          JSON.stringify(payload),
          ttlMs,
        );
      } catch {
        // Cache is best effort.
      }
    },
  };
}
