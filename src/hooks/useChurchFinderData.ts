"use client";

import { useEffect, useRef, useState } from "react";

import { fetchWithClientTrace } from "@/lib/client-fetch";
import { GOIANIA_CENTER } from "@/lib/site-config";
import {
  captureClientException,
  recordClientRequestMetric,
  type ClientRequestOperation,
  type ClientRequestOutcome,
} from "@/lib/observability-client";
import type { Coordinates, PublicChurchListItem } from "@/types/public";

export interface ChurchFinderFiltersState {
  search: string;
  denomination: string;
  city: string;
  neighborhood: string;
  hasLive: boolean;
}

export interface ChurchFinderStatusMessages {
  initialShowing: string;
  initialEmpty: string;
  filtersClearedShowing: string;
  filtersClearedEmpty: string;
  clearFailed: string;
  searchUpdated: string;
  searchEmpty: string;
  filterFailed: string;
  geoUnavailable: string;
  recalculated: string;
  locationFailed: string;
  permissionDenied: string;
}

interface UseChurchFinderDataParams {
  initialChurches: PublicChurchListItem[];
  initialCenter?: Coordinates;
  initialLoadError?: string | null;
  filters: ChurchFinderFiltersState;
  messages: ChurchFinderStatusMessages;
}

interface FetchChurchesParams {
  lat: number;
  lng: number;
  search?: string;
  denomination?: string;
  city?: string;
  neighborhood?: string;
  hasLive?: boolean;
}

type FinderRequestOperation = "search" | "clear" | "location";

interface ActiveFinderRequest {
  controller: AbortController;
  id: string;
  operation: FinderRequestOperation;
  startedAt: number;
  finished: boolean;
}

function requestMetricOperation(operation: FinderRequestOperation): ClientRequestOperation {
  return `public-directory.${operation}`;
}

function now() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function isAbortError(error: unknown, signal: AbortSignal) {
  return (
    signal.aborted ||
    (error instanceof Error && error.name === "AbortError") ||
    (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError")
  );
}

async function fetchChurches(
  params: FetchChurchesParams,
  signal?: AbortSignal,
): Promise<PublicChurchListItem[]> {
  const query = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    limit: "100",
  });

  if (params.search) query.set("search", params.search);
  if (params.denomination) query.set("denomination", params.denomination);
  if (params.city) query.set("city", params.city);
  if (params.neighborhood) query.set("neighborhood", params.neighborhood);
  if (params.hasLive) query.set("hasLive", "true");

  const response = await fetchWithClientTrace(`/api/public/churches?${query.toString()}`, { signal });
  if (!response.ok) throw new Error("public-churches-request-failed");

  const payload = (await response.json()) as { data: PublicChurchListItem[] };
  return payload.data;
}

function toFetchParams(center: Coordinates, filters?: ChurchFinderFiltersState): FetchChurchesParams {
  return {
    lat: center.lat,
    lng: center.lng,
    search: filters?.search.trim() || undefined,
    denomination: filters?.denomination || undefined,
    city: filters?.city || undefined,
    neighborhood: filters?.neighborhood || undefined,
    hasLive: filters?.hasLive,
  };
}

export function useChurchFinderData({
  initialChurches,
  initialCenter = GOIANIA_CENTER,
  initialLoadError = null,
  filters,
  messages,
}: UseChurchFinderDataParams) {
  const [churches, setChurches] = useState(initialChurches);
  const [selectedChurchId, setSelectedChurchId] = useState<string | null>(initialChurches[0]?.id ?? null);
  const [center, setCenter] = useState(initialCenter);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    initialLoadError || (initialChurches.length > 0 ? messages.initialShowing : messages.initialEmpty),
  );

  const activeRequestRef = useRef<ActiveFinderRequest | null>(null);
  const requestSequenceRef = useRef(0);
  const mountedRef = useRef(true);

  function isCurrentRequest(request: ActiveFinderRequest) {
    return activeRequestRef.current?.id === request.id && !request.controller.signal.aborted;
  }

  function completeRequest(
    request: ActiveFinderRequest,
    outcome: ClientRequestOutcome,
    resultCount?: number,
  ) {
    if (request.finished) return;

    request.finished = true;
    recordClientRequestMetric({
      operation: requestMetricOperation(request.operation),
      operationId: request.id,
      outcome,
      durationMs: now() - request.startedAt,
      resultCount,
    });

    if (activeRequestRef.current?.id !== request.id) return;

    activeRequestRef.current = null;
    if (mountedRef.current) setIsLoading(false);
  }

  function startRequest(operation: FinderRequestOperation): ActiveFinderRequest {
    const previousRequest = activeRequestRef.current;
    if (previousRequest) {
      previousRequest.controller.abort();
      completeRequest(previousRequest, "aborted");
    }

    const request: ActiveFinderRequest = {
      controller: new AbortController(),
      id: `finder-${requestSequenceRef.current + 1}`,
      operation,
      startedAt: now(),
      finished: false,
    };
    requestSequenceRef.current += 1;
    activeRequestRef.current = request;
    setIsLoading(true);
    return request;
  }

  function reportRequestError(error: unknown, request: ActiveFinderRequest) {
    captureClientException(error, {
      tags: {
        feature: "public-directory",
        operation: request.operation,
      },
      extra: {
        operationId: request.id,
        durationMs: Math.round(Math.max(0, now() - request.startedAt)),
      },
    });
  }

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      const activeRequest = activeRequestRef.current;
      if (!activeRequest) return;

      activeRequest.controller.abort();
      completeRequest(activeRequest, "aborted");
    };
  }, []);

  async function searchChurches() {
    const request = startRequest("search");

    try {
      const items = await fetchChurches(toFetchParams(center, filters), request.controller.signal);
      if (!isCurrentRequest(request)) {
        completeRequest(request, "aborted");
        return;
      }

      setChurches(items);
      setSelectedChurchId(items[0]?.id ?? null);
      setStatusMessage(items.length > 0 ? messages.searchUpdated : messages.searchEmpty);
      completeRequest(request, "success", items.length);
    } catch (error) {
      if (isAbortError(error, request.controller.signal) || !isCurrentRequest(request)) {
        completeRequest(request, "aborted");
        return;
      }

      reportRequestError(error, request);
      setStatusMessage(messages.filterFailed);
      completeRequest(request, "error");
    }
  }

  async function clearFilters() {
    const request = startRequest("clear");

    try {
      const items = await fetchChurches(toFetchParams(center), request.controller.signal);
      if (!isCurrentRequest(request)) {
        completeRequest(request, "aborted");
        return;
      }

      setChurches(items);
      setSelectedChurchId(items[0]?.id ?? null);
      setStatusMessage(items.length > 0 ? messages.filtersClearedShowing : messages.filtersClearedEmpty);
      completeRequest(request, "success", items.length);
    } catch (error) {
      if (isAbortError(error, request.controller.signal) || !isCurrentRequest(request)) {
        completeRequest(request, "aborted");
        return;
      }

      reportRequestError(error, request);
      setStatusMessage(messages.clearFailed);
      completeRequest(request, "error");
    }
  }

  async function useMyLocation() {
    const request = startRequest("location");

    if (!navigator.geolocation) {
      setStatusMessage(messages.geoUnavailable);
      completeRequest(request, "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (!isCurrentRequest(request)) {
          completeRequest(request, "aborted");
          return;
        }

        const nextCenter = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCenter(nextCenter);

        try {
          const items = await fetchChurches(
            toFetchParams(nextCenter, filters),
            request.controller.signal,
          );
          if (!isCurrentRequest(request)) {
            completeRequest(request, "aborted");
            return;
          }

          setChurches(items);
          setSelectedChurchId(items[0]?.id ?? null);
          setStatusMessage(messages.recalculated);
          completeRequest(request, "success", items.length);
        } catch (error) {
          if (isAbortError(error, request.controller.signal) || !isCurrentRequest(request)) {
            completeRequest(request, "aborted");
            return;
          }

          reportRequestError(error, request);
          setStatusMessage(messages.locationFailed);
          completeRequest(request, "error");
        }
      },
      (error) => {
        if (!isCurrentRequest(request)) {
          completeRequest(request, "aborted");
          return;
        }

        setStatusMessage(error.code === error.PERMISSION_DENIED ? messages.permissionDenied : messages.locationFailed);
        completeRequest(request, "error");
      },
      { enableHighAccuracy: true, timeout: 8_000 },
    );
  }

  const selectedChurch = churches.find((church) => church.id === selectedChurchId) ?? null;

  return {
    churches,
    center,
    selectedChurchId,
    selectedChurch,
    isLoading,
    statusMessage,
    selectChurch: setSelectedChurchId,
    searchChurches,
    clearFilters,
    useMyLocation,
  };
}
