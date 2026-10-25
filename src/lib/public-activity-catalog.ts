import { isCanonicalUuid } from "./public-panel-activity-origin";

export type ActivitySearch = Record<string, string | string[] | undefined>;
export type ActivityQuery = { page: number; limit: number; church_id?: string };
export type PublicActivity = {
  event_id: string; church_id: string; church_name: string; title: string;
  start_at: string; end_at: string | null;
};
export type PublicActivityPage = {
  data: PublicActivity[];
  meta: { page: number; limit: number; total: number; total_pages: number };
};
export type CatalogueResult =
  | { status: "invalid" }
  | { status: "error"; query: ActivityQuery }
  | { status: "ready" | "empty"; query: ActivityQuery; page: PublicActivityPage };

function boundedInteger(value: unknown, fallback: number, maximum: number): number | null {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^[1-9][0-9]*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= maximum ? number : null;
}

export function parseActivityQuery(input: ActivitySearch): ActivityQuery | null {
  const page = boundedInteger(input.page, 1, 1000);
  const limit = boundedInteger(input.limit, 20, 100);
  if (page === null || limit === null) return null;
  if (input.church_id !== undefined && !isCanonicalUuid(input.church_id)) return null;
  return { page, limit, ...(input.church_id === undefined ? {} : { church_id: input.church_id }) };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function utcDate(value: unknown): value is string {
  if (typeof value !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 19) === value.slice(0, 19);
}

export function decodeActivityPage(value: unknown, query: ActivityQuery): PublicActivityPage | null {
  if (!record(value) || !Array.isArray(value.data) || !record(value.meta)) return null;
  const { page, limit, total, total_pages } = value.meta;
  if (page !== query.page || limit !== query.limit ||
      typeof total !== "number" || !Number.isSafeInteger(total) || total < 0 ||
      total_pages !== Math.ceil(total / query.limit) || value.data.length > query.limit ||
      value.data.length > total) return null;
  const data: PublicActivity[] = [];
  for (const item of value.data) {
    if (!record(item) || !isCanonicalUuid(item.event_id) || !isCanonicalUuid(item.church_id) ||
        (query.church_id !== undefined && item.church_id !== query.church_id) ||
        typeof item.church_name !== "string" || !item.church_name.trim() ||
        typeof item.title !== "string" || !item.title.trim() || !utcDate(item.start_at) ||
        (item.end_at !== null && !utcDate(item.end_at))) return null;
    // Deliberately construct only the public contract, never spread upstream objects.
    data.push({
      event_id: item.event_id, church_id: item.church_id, church_name: item.church_name,
      title: item.title, start_at: item.start_at, end_at: item.end_at,
    });
  }
  return { data, meta: { page: query.page, limit: query.limit, total, total_pages: total_pages as number } };
}

export function activityCatalogueHref(query: ActivityQuery): string {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
  if (query.church_id) params.set("church_id", query.church_id);
  return "/atividades?" + params.toString();
}

export async function loadPublicActivityCatalogue(
  apiRoot: string, input: ActivitySearch, fetcher: typeof fetch = fetch, signal?: AbortSignal,
  timeoutMs?: number,
): Promise<CatalogueResult> {
  const query = parseActivityQuery(input);
  if (!query) return { status: "invalid" };
  if (signal?.aborted) return { status: "error", query };
  const controller = new AbortController();
  let releaseCancellation: () => void = () => {};
  const cancellation = new Promise<null>(resolve => { releaseCancellation = () => resolve(null); });
  const abort = () => { controller.abort(); releaseCancellation(); };
  signal?.addEventListener("abort", abort, { once: true });
  // The production entry passes the existing public I/O budget, never a business TTL.
  const timer = timeoutMs === undefined ? undefined : setTimeout(abort, timeoutMs);
  try {
    if (signal?.aborted) abort();
    if (controller.signal.aborted) return { status: "error", query };
    const url = new URL(apiRoot);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      return { status: "error", query };
    }
    url.pathname = url.pathname.replace(/\/$/, "") + "/public/activities";
    url.searchParams.set("page", String(query.page));
    url.searchParams.set("limit", String(query.limit));
    if (query.church_id) url.searchParams.set("church_id", query.church_id);
    const readPage = async () => {
      const response = await fetcher(url.toString(), {
        method: "GET", cache: "no-store", credentials: "omit", redirect: "error",
        headers: { Accept: "application/json" },
        signal: timeoutMs === undefined && signal ? signal : controller.signal,
      });
      if (controller.signal.aborted || signal?.aborted || !response.ok) return null;
      const payload: unknown = await response.json();
      // A body reader may ignore abort and still resolve. Never promote that body.
      if (controller.signal.aborted || signal?.aborted) return null;
      return decodeActivityPage(payload, query);
    };
    const page = await Promise.race([readPage(), cancellation]);
    if (!page || controller.signal.aborted || signal?.aborted) return { status: "error", query };
    return { status: page.data.length ? "ready" : "empty", query, page };
  } catch {
    return { status: "error", query };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
