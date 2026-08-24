import { z } from "zod";

import type { LegalDocumentsResponse } from "@/lib/generated-api";

export const LEGAL_TERMS_PATH = "/termos";
export const LEGAL_PRIVACY_PATH = "/privacidade";

const legalDocumentSchema = z
  .object({
    key: z.enum(["terms", "privacy"]),
    version: z.string().trim().min(1).max(32),
    title: z.string().trim().min(1).max(200),
    url: z.string().trim().min(1).max(2_048),
    effective_at: z.string().trim().min(1).max(64),
    status: z.enum(["DRAFT", "PENDING_APPROVAL", "PUBLISHED"]),
  })
  .strict();

export const legalDocumentsSchema = z
  .object({
    terms: legalDocumentSchema,
    privacy: legalDocumentSchema,
  })
  .strict()
  .superRefine((documents, context) => {
    if (documents.terms.key !== "terms") {
      context.addIssue({ code: "custom", path: ["terms", "key"], message: "Documento de termos inválido." });
    }
    if (documents.privacy.key !== "privacy") {
      context.addIssue({ code: "custom", path: ["privacy", "key"], message: "Documento de privacidade inválido." });
    }
  });

export class LegalDocumentsError extends Error {
  statusCode?: number;
  code?: string;

  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = "LegalDocumentsError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function parseLegalDocuments(payload: unknown): LegalDocumentsResponse {
  const parsed = legalDocumentsSchema.safeParse(payload);
  if (!parsed.success) {
    throw new LegalDocumentsError("Os documentos legais retornaram um formato inválido.");
  }
  return parsed.data;
}

export function areLegalDocumentsPublished(documents: LegalDocumentsResponse | null | undefined): documents is LegalDocumentsResponse {
  return Boolean(documents && documents.terms.status === "PUBLISHED" && documents.privacy.status === "PUBLISHED");
}

export const LEGAL_VERSION_CONFLICT_CODES = new Set([
  "LEGAL_TERMS_VERSION_INVALID",
  "LEGAL_PRIVACY_VERSION_INVALID",
]);

export function formatLegalEffectiveDate(version: string): string {
  const date = new Date(version.includes("T") ? version : `${version}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return version;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}
