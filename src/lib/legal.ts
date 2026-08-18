export const LEGAL_TERMS_VERSION = process.env.NEXT_PUBLIC_LEGAL_TERMS_VERSION || "2026-07-12";
export const LEGAL_PRIVACY_VERSION = process.env.NEXT_PUBLIC_LEGAL_PRIVACY_VERSION || "2026-07-12";

export const LEGAL_TERMS_PATH = "/termos";
export const LEGAL_PRIVACY_PATH = "/privacidade";

export function formatLegalEffectiveDate(version: string): string {
  const date = new Date(`${version}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return version;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}
