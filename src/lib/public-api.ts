import { DEFAULT_API_BASE_URL } from "@/lib/site-config";
import type { AuthResponse, ChurchResponse, PublicChurchResponse } from "@/lib/generated-api";
import { fetchPublicUpstream } from "@/lib/public-bff";
import type { TraceHeaders } from "@/lib/trace-context";
import { mapPublicChurchDetails, mapPublicChurchListItem } from "@/lib/public-church-utils";
import type {
  ApiEnvelope,
  ApiPaginatedEnvelope,
  PublicChurchDetails,
  PublicChurchListItem,
  RegisterChurchMediaPurpose,
  RegisterChurchMediaUploadResponse,
  RegisterChurchRequest,
} from "@/types/public";

type QueryValue = string | number | boolean | null | undefined;

const MAX_PUBLIC_CHURCHES_PER_PAGE = 100;

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown | FormData;
  query?: Record<string, QueryValue>;
  cache?: RequestCache;
  next?: {
    revalidate?: number;
  };
  requestId?: string;
  traceHeaders?: TraceHeaders;
  headers?: Record<string, string>;
}

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

type ApiErrorPayload = {
  statusCode?: number;
  code?: string;
  error?: string;
  message?: string;
  details?: unknown;
};

type RawPublicChurch = Partial<PublicChurchResponse & ChurchResponse> & {
  id: string;
  slug: string;
  name: string;
};

export type PublicChurchesPage = {
  churches: PublicChurchListItem[];
  page: number;
  totalPages: number;
};

export class ApiRequestError extends Error {
  statusCode: number;
  code?: string;
  details?: unknown;
  retryAfter?: string;

  constructor(
    message: string,
    statusCode: number,
    details?: unknown,
    retryAfter?: string,
    code?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.retryAfter = retryAfter;
  }
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(path.startsWith("http") ? path : `${DEFAULT_API_BASE_URL}${path}`);

  if (!query) return url.toString();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function parsePayload(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function fetchApi<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const body = options.body;
  const hasBody = body !== undefined && body !== null;
  const isMultipart = isFormDataBody(body);
  const method = options.method || "GET";
  const cache = options.cache ?? (method === "GET" && options.next ? undefined : "no-store");
  let requestBody: BodyInit | undefined;
  if (isMultipart) {
    requestBody = body as BodyInit;
  } else if (hasBody) {
    requestBody = JSON.stringify(body);
  }

  const fetchOptions: RequestInit & { next?: RequestOptions["next"] } = {
    method,
    headers: {
      Accept: "application/json",
      ...options.headers,
      ...(hasBody && !isMultipart ? { "Content-Type": "application/json" } : {}),
      ...(options.requestId ? { "X-Request-ID": options.requestId } : {}),
      ...options.traceHeaders,
    },
    body: requestBody,
    next: options.next,
  };

  if (cache) {
    fetchOptions.cache = cache;
  }

  const response = await fetchPublicUpstream(buildUrl(path, options.query), {
    ...fetchOptions,
  });

  const payload = await parsePayload(response);

  if (!response.ok) {
    const errorPayload = payload && typeof payload === "object" ? (payload as ApiErrorPayload) : {};
    throw new ApiRequestError(
      errorPayload.message || "Não foi possível concluir a requisição.",
      errorPayload.statusCode || response.status,
      errorPayload.details,
      response.headers.get("retry-after") || undefined,
      errorPayload.code,
    );
  }

  return payload as T;
}

export async function getPublicChurchesPage(
  params: {
    lat?: number;
    lng?: number;
    search?: string;
    denomination?: string;
    city?: string;
    neighborhood?: string;
    hasLive?: boolean;
    limit?: number;
    page?: number;
  } = {},
  options: Pick<RequestOptions, "cache" | "next" | "requestId" | "traceHeaders"> = {},
): Promise<PublicChurchesPage> {
  const limit = Math.min(Math.max(params.limit ?? 50, 1), MAX_PUBLIC_CHURCHES_PER_PAGE);
  const page = Math.max(params.page ?? 1, 1);
  const response = await fetchApi<ApiPaginatedEnvelope<RawPublicChurch>>("/churches", {
    query: {
      lat: params.lat,
      lng: params.lng,
      search: params.search,
      denomination: params.denomination,
      city: params.city,
      neighborhood: params.neighborhood,
      has_live: params.hasLive,
      limit,
      page,
    },
    ...options,
  });

  return {
    churches: response.data
      .map((church) => mapPublicChurchListItem(church))
      .filter((church): church is PublicChurchListItem => church !== null),
    page: response.meta.page,
    totalPages: response.meta.total_pages,
  };
}

export async function getPublicChurches(
  params: {
    lat?: number;
    lng?: number;
    search?: string;
    denomination?: string;
    city?: string;
    neighborhood?: string;
    hasLive?: boolean;
    limit?: number;
    page?: number;
  } = {},
  options: Pick<RequestOptions, "cache" | "next" | "requestId" | "traceHeaders"> = {},
) {
  const response = await getPublicChurchesPage(params, options);
  return response.churches;
}

export async function getPublicChurchBySlug(
  slug: string,
  options: Pick<RequestOptions, "cache" | "next" | "requestId" | "traceHeaders"> = {},
) {
  const response = await fetchApi<ApiEnvelope<RawPublicChurch>>(`/churches/slug/${slug}`, options);
  return mapPublicChurchDetails(response.data) as PublicChurchDetails;
}

export async function registerChurch(
  payload: RegisterChurchRequest,
  options: Pick<RequestOptions, "requestId" | "traceHeaders"> = {},
) {
  return fetchApi<ApiEnvelope<AuthResponse>>("/auth/register-church", {
    method: "POST",
    body: payload,
    ...options,
    headers: { "X-Client-Source": "web" },
  });
}

export async function uploadRegisterChurchImage(input: {
  file: File;
  purpose: RegisterChurchMediaPurpose;
}, options: Pick<RequestOptions, "requestId" | "traceHeaders"> = {}) {
  const formData = new FormData();
  formData.set("purpose", input.purpose);
  formData.set("file", input.file);

  const response = await fetchApi<ApiEnvelope<RegisterChurchMediaUploadResponse>>(
    "/auth/register-church/uploads",
    {
      method: "POST",
      body: formData,
      ...options,
    },
  );

  return response.data;
}
