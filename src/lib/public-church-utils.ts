import type { ChurchResponse, PublicChurchResponse } from "@/lib/generated-api";
import type {
  PublicChurchDetails,
  PublicChurchListItem,
  PublicChurchScheduleEntry,
} from "@/types/public";

type RawChurch = Omit<Partial<PublicChurchResponse & ChurchResponse>, "address" | "location"> & {
  id: string;
  slug: string;
  name: string;
  address?: string | Record<string, unknown> | null;
  location?: Record<string, unknown> | null;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getAddressRecord(address: RawChurch["address"]): Record<string, unknown> {
  return typeof address === "object" && address ? address : {};
}

function normalizeOptionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeAddressPart(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  return typeof value === "number" && Number.isFinite(value) ? String(value) : null;
}

export function normalizeAddress(address: RawChurch["address"]): string {
  if (!address) return "Endereço não informado";
  if (typeof address === "string") return address;

  const record = getAddressRecord(address);
  const explicit = [
    record.formatted_address,
    record.full_address,
    record.display_name,
    record.address,
  ].map(normalizeOptionalText).find((part) => part !== null);

  if (explicit) return explicit;

  const parts = [record.street, record.number, record.neighborhood, record.city, record.state]
    .map(normalizeAddressPart)
    .filter((part): part is string => part !== null);

  return parts.length > 0 ? parts.join(", ") : "Endereço não informado";
}

export function normalizeLocation(location: RawChurch["location"]) {
  if (!location || typeof location !== "object") return null;

  const lat = toNumber(location.lat ?? location.latitude);
  const lng = toNumber(location.lng ?? location.longitude);

  if (lat === null || lng === null) return null;
  return { lat, lng };
}

export function mapPublicChurchListItem(church: RawChurch): PublicChurchListItem | null {
  const location = normalizeLocation(church.location);
  if (!location) return null;
  const addressRecord = getAddressRecord(church.address);

  return {
    id: church.id,
    slug: church.slug,
    name: church.name,
    denomination: church.denomination || "Comunidade",
    addressLine: normalizeAddress(church.address),
    city: normalizeOptionalText(addressRecord.city),
    state: normalizeOptionalText(addressRecord.state),
    neighborhood: normalizeOptionalText(addressRecord.neighborhood),
    location,
    description: church.description ?? null,
    isLive: Boolean(church.is_live),
    memberCount: Number(church.member_count || 0),
    plan: church.plan || "FREE",
    distanceKm: typeof church.distance === "number" ? church.distance : null,
    thumbnail: church.thumbnail ?? null,
    ...mapOptionalListFields(church as Record<string, unknown>),
  };
}

function mapScheduleEntry(entry: unknown): PublicChurchScheduleEntry | null {
  if (!entry || typeof entry !== "object") return null;
  const record = entry as Record<string, unknown>;
  const day = normalizeOptionalText(record.day);
  const time = normalizeOptionalText(record.time);
  if (!day && !time) return null;
  return { day: day ? day.toUpperCase() : null, time, title: normalizeOptionalText(record.title) };
}

/**
 * Horários, instalações e data de atualização só entram no item da busca quando a API
 * os envia (Etapa 2). Ausentes, as chaves ficam fora do objeto e o card não mostra a linha.
 */
function mapOptionalListFields(raw: Record<string, unknown>): Partial<PublicChurchListItem> {
  const extra: Partial<PublicChurchListItem> = {};

  if (Array.isArray(raw.schedule)) {
    const schedule = raw.schedule
      .map(mapScheduleEntry)
      .filter((entry): entry is PublicChurchScheduleEntry => entry !== null);
    if (schedule.length > 0) extra.schedule = schedule;
  }

  if (Array.isArray(raw.features)) {
    const features = raw.features
      .map(normalizeOptionalText)
      .filter((feature): feature is string => feature !== null);
    if (features.length > 0) extra.features = features;
  }

  const updatedAt = normalizeOptionalText(raw.updated_at);
  if (updatedAt && !Number.isNaN(Date.parse(updatedAt))) extra.updatedAt = updatedAt;

  return extra;
}

/* Busca (Modelo 8): filtros locais, contagem e numeração compartilhada lista/mapa. */

export type FinderDistance = "near" | "drive" | "all";
export type FinderSort = "distance" | "name";

/** Raio de cada opção de distância em linguagem simples. "all" não limita. */
export const FINDER_DISTANCE_KM: Record<FinderDistance, number | null> = {
  near: 2,
  drive: 8,
  all: null,
};

export function filterByDistance<T extends Pick<PublicChurchListItem, "distanceKm">>(
  churches: readonly T[],
  distance: FinderDistance,
): T[] {
  const limit = FINDER_DISTANCE_KM[distance];
  if (limit === null) return [...churches];
  return churches.filter((church) => church.distanceKm !== null && church.distanceKm <= limit);
}

/** Contagem por tradição sobre os resultados carregados (a API não devolve facetas). */
export function countByTradition(
  churches: readonly Pick<PublicChurchListItem, "denomination">[],
  selected: readonly string[] = [],
): Array<{ value: string; count: number }> {
  const counts = new Map<string, number>();
  for (const value of selected) counts.set(value, 0);
  for (const church of churches) counts.set(church.denomination, (counts.get(church.denomination) ?? 0) + 1);
  return Array.from(counts, ([value, count]) => ({ value, count })).sort(
    (a, b) => b.count - a.count || a.value.localeCompare(b.value, "pt-BR"),
  );
}

export function filterByTradition<T extends Pick<PublicChurchListItem, "denomination">>(
  churches: readonly T[],
  traditions: readonly string[],
): T[] {
  if (traditions.length === 0) return [...churches];
  const wanted = new Set(traditions);
  return churches.filter((church) => wanted.has(church.denomination));
}

export function sortChurches<T extends Pick<PublicChurchListItem, "distanceKm" | "name">>(
  churches: readonly T[],
  sort: FinderSort,
): T[] {
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, "pt-BR");
  if (sort === "name") return [...churches].sort(byName);
  return [...churches].sort((a, b) => {
    if (a.distanceKm === null && b.distanceKm === null) return byName(a, b);
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    return a.distanceKm - b.distanceKm || byName(a, b);
  });
}

/**
 * Número que a lista e o mapa mostram. É a posição (1..N) no resultado final já filtrado e
 * ordenado; os dois lados recebem este mesmo array, então nunca divergem.
 */
export function numberResults<T>(churches: readonly T[]): Array<{ church: T; number: number }> {
  return churches.map((church, index) => ({ church, number: index + 1 }));
}

/** Código estável da tradição: "Católica", "CATOLICA" e "catolica " viram "CATOLICA". */
export function traditionCode(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const LOWERCASE_CONNECTORS = new Set(["de", "da", "do", "das", "dos", "e"]);

/** Fallback para código sem rótulo: "ASSEMBLEIA_DE_DEUS" -> "Assembleia de Deus". */
function humanizeTradition(value: string): string {
  const trimmed = value.trim().replaceAll("_", " ");
  if (trimmed !== trimmed.toUpperCase()) return trimmed;
  return trimmed
    .toLocaleLowerCase("pt-BR")
    .split(/\s+/)
    .map((word, index) =>
      index > 0 && LOWERCASE_CONNECTORS.has(word) ? word : word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1),
    )
    .join(" ");
}

/**
 * Rótulo da tradição. `labels` é o mapa por código de `finder.traditions` (messages/*.json);
 * código desconhecido cai na humanização.
 */
export function formatTradition(value: string, labels: Readonly<Record<string, string>> = {}): string {
  return labels[traditionCode(value)] ?? humanizeTradition(value);
}

/** Agrupa horários por dia ("Domingo, 09:00 e 18:00") e devolve no máximo `limit` linhas. */
export function summarizeSchedule(
  schedule: readonly PublicChurchScheduleEntry[] | undefined,
  dayLabel: (day: string) => string,
  joinTimes: (times: string[]) => string,
  limit = 2,
): string[] {
  if (!schedule || schedule.length === 0) return [];
  const groups = new Map<string, string[]>();
  for (const entry of schedule) {
    const key = entry.day ?? "";
    const times = groups.get(key) ?? [];
    if (entry.time && !times.includes(entry.time)) times.push(entry.time);
    groups.set(key, times);
  }
  const lines: string[] = [];
  for (const [day, times] of groups) {
    const label = day ? dayLabel(day) : "";
    const timeText = times.length > 0 ? joinTimes([...times].sort()) : "";
    const line = [label, timeText].filter(Boolean).join(", ");
    if (line) lines.push(line);
    if (lines.length >= limit) break;
  }
  return lines;
}

export function mapPublicChurchDetails(church: RawChurch): PublicChurchDetails {
  const addressRecord = getAddressRecord(church.address);
  return {
    id: church.id,
    slug: church.slug,
    name: church.name,
    denomination: church.denomination || "Comunidade",
    description: church.description ?? null,
    addressLine: normalizeAddress(church.address),
    city: normalizeOptionalText(addressRecord.city),
    state: normalizeOptionalText(addressRecord.state),
    neighborhood: normalizeOptionalText(addressRecord.neighborhood),
    address: addressRecord,
    location: normalizeLocation(church.location),
    contact: church.contact ?? {},
    schedule: Array.isArray(church.schedule) ? church.schedule : [],
    memberCount: Number(church.member_count || 0),
    plan: church.plan || "FREE",
    pixKey: normalizeOptionalText(church.pix_key),
    isLive: Boolean(church.is_live),
    donationsEnabled: Boolean(church.donations_enabled),
    thumbnail: church.thumbnail ?? null,
    photos: Array.isArray(church.photos) ? church.photos : [],
    features: Array.isArray(church.features) ? church.features.filter((item): item is string => typeof item === "string") : [],
  };
}

export function extractContactValue(contact: Record<string, unknown>, key: string) {
  const value = contact[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
