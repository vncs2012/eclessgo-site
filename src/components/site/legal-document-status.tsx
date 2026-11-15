"use client";

import { useCallback, useEffect, useState } from "react";

import type { LegalDocumentResponse } from "@/lib/generated-api";
import { fetchWithClientTrace } from "@/lib/client-fetch";
import { formatLegalEffectiveDate, parseLegalDocuments } from "@/lib/legal";

type LegalDocumentStatusProps = {
  documentKey: "terms" | "privacy";
};

type LegalDocumentsPayload = {
  data?: unknown;
  message?: string;
};

export function LegalDocumentStatus({ documentKey }: LegalDocumentStatusProps) {
  const [document, setDocument] = useState<LegalDocumentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWithClientTrace("/api/public/legal/documents", { cache: "no-store" });
      const payload = (await response.json()) as LegalDocumentsPayload;
      if (!response.ok) {
        throw new Error(payload.message || "Não foi possível confirmar a vigência.");
      }
      const documents = parseLegalDocuments(payload.data);
      setDocument(documents[documentKey]);
    } catch (loadError) {
      setDocument(null);
      setError(loadError instanceof Error ? loadError.message : "Não foi possível confirmar a vigência.");
    } finally {
      setIsLoading(false);
    }
  }, [documentKey]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) {
    return <p className="mt-4 text-xs text-eg-muted">Confirmando a vigência do documento...</p>;
  }

  if (error || !document) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-eg-warning-text" role="status">
        <span>Vigência não confirmada pela API.</span>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-eg-border px-3 py-1.5 font-semibold text-eg-strong transition hover:bg-eg-hover"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (document.status !== "PUBLISHED") {
    return (
      <p className="mt-4 text-xs text-eg-warning-text" role="status">
        Status: {document.status}. A vigência deste documento ainda não foi confirmada.
      </p>
    );
  }

  return (
    <p className="mt-4 text-xs text-eg-muted" role="status">
      Versão {document.version} · Vigente desde {formatLegalEffectiveDate(document.effective_at)}
    </p>
  );
}
