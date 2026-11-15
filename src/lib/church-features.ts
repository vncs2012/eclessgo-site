import {
  Accessibility,
  ArrowUpDown,
  Baby,
  CircleParking,
  Hand,
  Smile,
  Toilet,
  type LucideIcon,
} from "lucide-react";

/**
 * Vocabulário de instalações/acessibilidade e filtros de dia da Busca (Modelo 8).
 * Regras puras (sem `next`/`react`): usadas por cards, filtros, Home, Cadastro e página da comunidade.
 * Ícone por código mora aqui; os rótulos ficam em messages/*.json, em `features`:
 * `codes` (completos: página da comunidade), `short` (curtos: pílulas, filtros, Home) e
 * `describe` (descritivos: chips do Cadastro), além de `groups` e `hints`.
 */

/** Mesmos códigos e grupos de `ChurchFeatureCode` / `GET /churches/features/vocabulary`. */
export const FEATURE_VOCABULARY = [
  { code: "ACCESSIBLE_ENTRANCE", group: "accessibility" },
  { code: "ACCESSIBLE_RESTROOM", group: "accessibility" },
  { code: "ELEVATOR", group: "accessibility" },
  { code: "LIBRAS", group: "accessibility" },
  { code: "KIDS_AREA", group: "children" },
  { code: "NURSERY", group: "children" },
  { code: "PARKING", group: "structure" },
] as const;

export type FeatureCode = (typeof FEATURE_VOCABULARY)[number]["code"];
export type FeatureGroupKey = "accessibility" | "children" | "structure";
export const FEATURE_GROUP_ORDER: readonly FeatureGroupKey[] = ["accessibility", "children", "structure"];

export const FEATURE_CODES: readonly FeatureCode[] = FEATURE_VOCABULARY.map((item) => item.code);

const GROUP_BY_CODE = new Map<string, FeatureGroupKey>(
  FEATURE_VOCABULARY.map((item) => [item.code, item.group]),
);

/** Ícone (lucide, decorativo: renderizar com `aria-hidden`) de cada código do vocabulário. */
export const FEATURE_ICONS: Record<FeatureCode, LucideIcon> = {
  ACCESSIBLE_ENTRANCE: Accessibility,
  ACCESSIBLE_RESTROOM: Toilet,
  ELEVATOR: ArrowUpDown,
  LIBRAS: Hand,
  KIDS_AREA: Smile,
  NURSERY: Baby,
  PARKING: CircleParking,
};

export function isFeatureCode(value: string): value is FeatureCode {
  return GROUP_BY_CODE.has(value);
}

export function featureGroupOf(code: FeatureCode): FeatureGroupKey {
  return GROUP_BY_CODE.get(code) ?? "structure";
}

/** Código traduzido por `labels` (features.codes); texto livre aparece como veio. */
export function featureLabel(value: string, labels: Readonly<Record<string, string>>): string {
  const trimmed = value.trim();
  return isFeatureCode(trimmed) ? (labels[trimmed] ?? trimmed) : trimmed;
}

/** Códigos primeiro (na ordem do vocabulário), depois texto livre na ordem recebida; sem repetir. */
export function orderFeatures(features: readonly string[] | undefined): string[] {
  if (!features) return [];
  const seen = new Set<string>();
  const codes: string[] = [];
  const free: string[] = [];
  for (const raw of features) {
    const value = raw.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    (isFeatureCode(value) ? codes : free).push(value);
  }
  codes.sort((a, b) => FEATURE_CODES.indexOf(a as FeatureCode) - FEATURE_CODES.indexOf(b as FeatureCode));
  return [...codes, ...free];
}

export type FeaturePill = {
  /** Código do vocabulário (tem ícone); null para texto livre. */
  code: FeatureCode | null;
  label: string;
};

/**
 * Pílulas do card: até `limit` itens, códigos primeiro, já com rótulo (curto, de `features.short`).
 * Texto livre aparece como veio, sem ícone.
 */
export function featurePills(
  features: readonly string[] | undefined,
  labels: Readonly<Record<string, string>>,
  limit = 3,
): FeaturePill[] {
  const out: FeaturePill[] = [];
  for (const value of orderFeatures(features)) {
    const label = featureLabel(value, labels);
    if (!out.some((pill) => pill.label === label)) {
      out.push({ code: isFeatureCode(value) ? value : null, label });
    }
    if (out.length >= limit) break;
  }
  return out;
}

/* ---------------------------------------------------------------- Filtros da Busca */

/** "Para a visita": códigos oferecidos no filtro, nos chips e na Home. */
export const VISIT_FEATURE_CODES = ["ACCESSIBLE_ENTRANCE", "KIDS_AREA", "LIBRAS", "PARKING"] as const satisfies readonly FeatureCode[];

/** "Costuma ter encontro": cada opção vira um ou mais dias da API (semântica OU). */
export const DAY_FILTERS = {
  SUNDAY: ["SUNDAY"],
  WEEKDAYS: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
  SATURDAY: ["SATURDAY"],
} as const;
export type DayFilterKey = keyof typeof DAY_FILTERS;
export const DAY_FILTER_KEYS = Object.keys(DAY_FILTERS) as DayFilterKey[];

export const API_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export function isDayFilterKey(value: string): value is DayFilterKey {
  return Object.hasOwn(DAY_FILTERS, value);
}

/** União dos dias das opções marcadas, na ordem MONDAY..SUNDAY. */
export function daysForFilters(keys: readonly string[]): string[] {
  const days = new Set<string>();
  for (const key of keys) if (isDayFilterKey(key)) for (const day of DAY_FILTERS[key]) days.add(day);
  return API_DAYS.filter((day) => days.has(day));
}

type FacetChurch = {
  features?: readonly string[];
  schedule?: ReadonlyArray<{ day: string | null }>;
};

/** Quantos dos itens têm a instalação (sobre os resultados carregados). */
export function countFeature(churches: readonly FacetChurch[], code: string): number {
  return churches.filter((church) => church.features?.includes(code)).length;
}

/** Quantos dos itens costumam ter encontro em algum dia da opção (sobre os carregados). */
export function countDayFilter(churches: readonly FacetChurch[], key: DayFilterKey): number {
  const days = new Set<string>(DAY_FILTERS[key]);
  return churches.filter((church) => church.schedule?.some((entry) => entry.day !== null && days.has(entry.day)))
    .length;
}

/**
 * Entrada pela URL (`dia` e `instalacao` repetíveis, como `tradicao`). Aceita os códigos em
 * qualquer caixa; valores desconhecidos são ignorados.
 */
export function readFeatureEntryParams(params: URLSearchParams): { days: DayFilterKey[]; features: FeatureCode[] } {
  const days = Array.from(
    new Set(params.getAll("dia").map((value) => value.trim().toUpperCase()).filter(isDayFilterKey)),
  );
  const features = Array.from(
    new Set(params.getAll("instalacao").map((value) => value.trim().toUpperCase()).filter(isFeatureCode)),
  );
  return { days, features };
}

/** Link de /comunidades filtrado por instalação (`instalacao` repetível). */
export function featureHref(codes: readonly string[]): string {
  const params = new URLSearchParams();
  for (const code of codes) params.append("instalacao", code);
  return `/comunidades?${params.toString()}`;
}
