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

const IP_PATTERN = /^[0-9a-f:.]{2,45}$/i;

function ipv4ToNumber(value: string): number | null {
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    if (!/^[0-9]{1,3}$/.test(part) || Number(part) > 255) return null;
    result = result * 256 + Number(part);
  }
  return result;
}

/** True when `ip` is one of the proxies listed in `ASSISTANT_TRUSTED_PROXY_CIDRS` (IPv4 CIDR or exact address). */
function isTrustedProxyHop(ip: string, entries: readonly string[]): boolean {
  return entries.some((entry) => {
    const [base = "", bits] = entry.split("/");
    if (bits === undefined) return base.toLowerCase() === ip.toLowerCase();
    const prefix = Number(bits);
    const address = ipv4ToNumber(ip);
    const network = ipv4ToNumber(base);
    if (address === null || network === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      return false;
    }
    const blockSize = 2 ** (32 - prefix);
    return Math.floor(address / blockSize) === Math.floor(network / blockSize);
  });
}

/**
 * Client IP from proxy headers, read only behind a proxy that sets them.
 *
 * - On Vercel (`VERCEL` is set) the edge overwrites `x-real-ip` / `x-vercel-forwarded-for` /
 *   `x-forwarded-for` with the real client address, so those are used in that order.
 * - Elsewhere set `ASSISTANT_TRUST_PROXY_HEADERS=true` only when a trusted proxy appends the peer
 *   address it saw to `X-Forwarded-For`. The client controls everything to the LEFT of what the
 *   proxy appended, so the first entry is forgeable: the client is the rightmost entry that is not
 *   a trusted proxy. List extra proxy hops in `ASSISTANT_TRUSTED_PROXY_CIDRS` (comma separated,
 *   IPv4 CIDR or exact address); without it the rightmost entry is the client. `x-real-ip` is only
 *   a fallback when there is no `X-Forwarded-For`.
 * Without trust the headers are client-controlled, so every request shares one bucket instead.
 */
export function clientIp(request: Request, env: Environment = {}): string {
  const onVercel = Boolean(env.VERCEL?.trim());
  const trusted = onVercel || env.ASSISTANT_TRUST_PROXY_HEADERS?.trim().toLowerCase() === "true";
  if (!trusted) return "untrusted";

  const single = (name: string): string | null => {
    const value = request.headers.get(name)?.split(",")[0]?.trim();
    return value && IP_PATTERN.test(value) ? value : null;
  };

  if (onVercel) {
    const edge = single("x-real-ip") ?? single("x-vercel-forwarded-for");
    if (edge) return edge;
  }

  const chain = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);
  if (chain.length > 0) {
    const trustedProxies = (env.ASSISTANT_TRUSTED_PROXY_CIDRS ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    for (let index = chain.length - 1; index >= 0; index -= 1) {
      const hop = chain[index]!;
      if (index > 0 && isTrustedProxyHop(hop, trustedProxies)) continue;
      return IP_PATTERN.test(hop) ? hop : "unknown";
    }
  }

  return (!onVercel ? single("x-real-ip") : null) ?? "unknown";
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

/**
 * `Origin` that may be relayed to the API: only the browser origin that equals the configured site
 * origin (`NEXT_PUBLIC_SITE_URL`). Anything else (another host, `null`, junk) is not forwarded.
 */
export function forwardableOrigin(request: Request, env: Environment): string | null {
  const raw = request.headers.get("origin");
  const configured = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw || !configured) return null;
  try {
    const origin = new URL(raw);
    const site = new URL(configured);
    const httpOnly = (url: URL) => url.protocol === "https:" || url.protocol === "http:";
    return httpOnly(origin) && httpOnly(site) && origin.origin === site.origin ? origin.origin : null;
  } catch {
    return null;
  }
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeQuestion(question: string): string {
  return question.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

/** Fixed-window counter; returns seconds until reset when over `limit`. */
async function windowedOverLimit(
  store: AssistantProtectionStore,
  now: () => number,
  keyPrefix: string,
  scope: string,
  limit: number,
  windowMs: number,
): Promise<number | null> {
  const window = Math.floor(now() / windowMs);
  const count = await store.increment(`${keyPrefix}:rl:${scope}:${windowMs}:${window}`, windowMs);
  if (count <= limit) return null;
  return Math.max(1, Math.ceil(((window + 1) * windowMs - now()) / 1000));
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

  const overLimit = (scope: string, limit: number, windowMs: number) =>
    windowedOverLimit(options.store, now, KEY_PREFIX, scope, limit, windowMs);

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

/** Limits for public form submissions that the BFF relays to the API (community corrections). */
export interface SubmissionLimits {
  ipPerHour: number;
  slugPerDay: number;
}

export type SubmissionAdmission =
  | { kind: "allowed" }
  | { kind: "rate-limited"; retryAfterSeconds: number }
  | { kind: "unavailable" };

/** Same numbers as the API: 5 per hour per client, 20 per day per community. */
export const DEFAULT_CORRECTION_LIMITS: SubmissionLimits = Object.freeze({
  ipPerHour: 5,
  slugPerDay: 20,
});

export function readCorrectionLimits(env: Environment): SubmissionLimits {
  return {
    ipPerHour: nonNegativeInteger(env.CORRECTION_RATE_LIMIT_IP_PER_HOUR, DEFAULT_CORRECTION_LIMITS.ipPerHour),
    slugPerDay: nonNegativeInteger(env.CORRECTION_RATE_LIMIT_SLUG_PER_DAY, DEFAULT_CORRECTION_LIMITS.slugPerDay),
  };
}

/**
 * Per-client and per-community submission counters on the same store as the assistant, under their
 * own key prefix. The per-client counter needs a trustworthy IP: when `clientIp` says "untrusted" or
 * "unknown" it is skipped (a shared bucket would let one caller lock everyone out) and only the
 * per-community counter applies. Fails closed when the store is unavailable.
 */
export function createSubmissionLimiter(options: {
  store: AssistantProtectionStore;
  limits?: SubmissionLimits | (() => SubmissionLimits);
  env?: Environment | (() => Environment);
  now?: () => number;
  keyPrefix?: string;
}) {
  const now = options.now ?? Date.now;
  const keyPrefix = options.keyPrefix ?? "eclessgo:corrections";
  const limits = () =>
    typeof options.limits === "function" ? options.limits() : (options.limits ?? DEFAULT_CORRECTION_LIMITS);
  const env = () => (typeof options.env === "function" ? options.env() : (options.env ?? {}));

  return {
    async admit(request: Request, slug: string): Promise<SubmissionAdmission> {
      const current = limits();
      try {
        const address = clientIp(request, env());
        const checks: [string, number, number][] = [];
        if (address !== "untrusted" && address !== "unknown") {
          checks.push([`ip:${await sha256Hex(address)}`, current.ipPerHour, HOUR_MS]);
        }
        checks.push([`slug:${slug}`, current.slugPerDay, DAY_MS]);
        for (const [scope, limit, windowMs] of checks) {
          const retryAfterSeconds = await windowedOverLimit(options.store, now, keyPrefix, scope, limit, windowMs);
          if (retryAfterSeconds !== null) return { kind: "rate-limited", retryAfterSeconds };
        }
        return { kind: "allowed" };
      } catch {
        return { kind: "unavailable" };
      }
    },
  };
}
