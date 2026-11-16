/**
 * Regras puras da página da Comunidade (Modelo 8): horários, contatos, rotas, instalações
 * e a lista de seções que realmente têm dado. Não importa `next` nem `react`.
 */

import {
  FEATURE_GROUP_ORDER,
  featureGroupOf,
  featureLabel,
  isFeatureCode,
  orderFeatures,
  type FeatureGroupKey,
} from "./church-features.ts";
import { ADDRESS_NOT_INFORMED, normalizeDurationMinutes } from "./public-church-utils.ts";

export const WEEK_ORDER = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;
export type WeekDay = (typeof WEEK_ORDER)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function pick(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = text(record[key]);
    if (value) return value;
  }
  return null;
}

/* ---------------------------------------------------------------- Horários */

export type ScheduleRow = {
  id: string;
  /** MONDAY..SUNDAY quando reconhecido; senão o texto original (ex.: uma data). */
  day: string | null;
  time: string | null;
  title: string | null;
  description: string | null;
  /** Duração aproximada em minutos (`duration_minutes`); nula quando não informada. */
  durationMinutes: number | null;
};

function weekdayIndex(day: string | null): number {
  const index = WEEK_ORDER.indexOf((day ?? "").toUpperCase() as WeekDay);
  return index === -1 ? WEEK_ORDER.length : index;
}

/** Aceita o formato da API e também texto solto (legado). Ordena de domingo a sábado. */
export function normalizeScheduleRows(schedule: unknown): ScheduleRow[] {
  if (!Array.isArray(schedule)) return [];

  const rows: ScheduleRow[] = [];
  schedule.forEach((entry, index) => {
    if (typeof entry === "string") {
      const title = text(entry);
      if (title) rows.push({ id: `${index}`, day: null, time: null, title, description: null, durationMinutes: null });
      return;
    }
    if (!isRecord(entry)) return;

    const rawDay = pick(entry, ["day", "weekday", "date"]);
    const day = rawDay
      ? weekdayIndex(rawDay) < WEEK_ORDER.length
        ? rawDay.toUpperCase()
        : rawDay
      : null;
    const time = pick(entry, ["time", "start_time", "hour"]);
    const title = pick(entry, ["title", "name", "service", "label"]);
    const description = pick(entry, ["description", "details", "notes"]);
    if (!day && !time && !title) return;

    rows.push({
      id: String(entry.id ?? entry.slug ?? index),
      day,
      time,
      title,
      description,
      durationMinutes: normalizeDurationMinutes(entry.duration_minutes),
    });
  });

  return rows
    .map((row, index) => ({ row, index }))
    .sort(
      (a, b) =>
        weekdayIndex(a.row.day) - weekdayIndex(b.row.day) ||
        (a.row.time ?? "99:99").localeCompare(b.row.time ?? "99:99") ||
        a.index - b.index,
    )
    .map(({ row }) => row);
}

export type ScheduleGroup = {
  id: string;
  day: string | null;
  title: string | null;
  /** Horas do mesmo dia e título, em ordem e sem repetir. */
  times: string[];
  description: string | null;
  durationMinutes: number | null;
};

/**
 * Junta as linhas do mesmo dia, título e duração ("Celebração · 09:00" e "Celebração · 18:00"
 * viram uma só, com as duas horas). A descrição é a do primeiro item que tiver uma. Durações
 * diferentes não se juntam: "Cerca de 1h30" só vale para as horas que a comunidade informou.
 */
export function groupScheduleRows(rows: readonly ScheduleRow[]): ScheduleGroup[] {
  const groups = new Map<string, ScheduleGroup>();
  for (const row of rows) {
    const key = `${row.day ?? ""}|${(row.title ?? "").toLowerCase()}|${row.durationMinutes ?? ""}`;
    const group = groups.get(key);
    if (!group) {
      groups.set(key, {
        id: row.id,
        day: row.day,
        title: row.title,
        times: row.time ? [row.time] : [],
        description: row.description,
        durationMinutes: row.durationMinutes,
      });
      continue;
    }
    if (row.time && !group.times.includes(row.time)) group.times.push(row.time);
    group.description ??= row.description;
  }
  return [...groups.values()];
}

/**
 * Chave de `communityPage.schedule` e valores para "Cerca de 45 min", "Cerca de 1h" e
 * "Cerca de 1h30". Nula sem duração válida. Os textos (pt-BR/en) ficam nas mensagens.
 */
export type DurationMessage =
  | { key: "durationMinutes"; values: { minutes: number } }
  | { key: "durationHours"; values: { hours: number } }
  | { key: "durationBoth"; values: { hours: number; minutes: string } };

export function durationMessage(value: unknown): DurationMessage | null {
  const total = normalizeDurationMinutes(value);
  if (total === null) return null;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return { key: "durationMinutes", values: { minutes } };
  if (minutes === 0) return { key: "durationHours", values: { hours } };
  return { key: "durationBoth", values: { hours, minutes: String(minutes).padStart(2, "0") } };
}

/* ---------------------------------------------------------------- Contatos */

export type PhoneChannel = { display: string; href: string };

export type CommunityContact = {
  whatsapp: PhoneChannel | null;
  phone: PhoneChannel | null;
  email: string | null;
};

/** Dígitos de um número de WhatsApp (DDI 55 assumido para 10/11 dígitos); null se inválido. */
export function whatsappDigits(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if (digits.length >= 12 && digits.length <= 15) return digits;
  return null;
}

export function buildCommunityContact(contact: unknown): CommunityContact {
  const record = isRecord(contact) ? contact : {};

  const whatsappRaw = pick(record, ["whatsapp", "whatsapp_number"]);
  const digits = whatsappRaw ? whatsappDigits(whatsappRaw) : null;
  const whatsapp =
    whatsappRaw && digits ? { display: whatsappRaw, href: `https://wa.me/${digits}` } : null;

  const phoneRaw = pick(record, ["phone", "contact_phone"]);
  const phoneDigits = phoneRaw ? phoneRaw.replace(/[^\d+]/g, "") : "";
  const phone = phoneRaw && phoneDigits ? { display: phoneRaw, href: `tel:${phoneDigits}` } : null;

  return { whatsapp, phone, email: pick(record, ["email", "contact_email"]) };
}

export type MessageAction = {
  kind: "whatsapp" | "email" | "phone";
  href: string;
  /** Só o WhatsApp abre em outra aba. */
  external: boolean;
};

/** Melhor canal para "Mandar mensagem": WhatsApp, depois e-mail, depois telefone ("Ligar"). */
export function messageAction(contact: CommunityContact): MessageAction | null {
  if (contact.whatsapp) return { kind: "whatsapp", href: contact.whatsapp.href, external: true };
  if (contact.email) return { kind: "email", href: `mailto:${contact.email}`, external: false };
  if (contact.phone) return { kind: "phone", href: contact.phone.href, external: false };
  return null;
}

/** Rótulo curto de uma rede: @perfil no Instagram, endereço sem https nas demais. */
export function networkDisplay(key: string, url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (key === "instagram") {
      const handle = parsed.pathname.split("/").filter(Boolean)[0];
      return handle ? `@${handle}` : host;
    }
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${host}${path}`;
  } catch {
    return url;
  }
}

/** Só https; qualquer outro esquema (javascript:, http:, data:) é descartado. */
export function safeHttpsUrl(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- Endereço e rotas */

export type CommunityAddress = {
  hasAddress: boolean;
  /** "Rua Exemplo, 123" (ou o endereço completo quando a API só manda texto corrido). */
  street: string;
  /** "Setor Bueno, Goiânia" sem repetir o que já está na primeira linha. */
  locality: string | null;
  /** "Rua Exemplo, 123 · Setor Bueno" */
  lineOne: string;
  /** "Goiânia · GO · 74000-000" */
  lineTwo: string | null;
  /** Texto completo para copiar. */
  full: string;
};

export function buildCommunityAddress(input: {
  addressLine: string;
  address: Record<string, unknown>;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
}): CommunityAddress {
  const { addressLine, address, neighborhood, city, state } = input;
  const hasAddress = addressLine !== ADDRESS_NOT_INFORMED && addressLine.trim() !== "";
  const streetPart = [text(address.street), text(address.number)].filter(Boolean).join(", ");
  const street = streetPart || (hasAddress ? addressLine : "");
  const lower = street.toLowerCase();
  const localityParts = [neighborhood, city].filter(
    (part): part is string => Boolean(part) && !lower.includes((part as string).toLowerCase()),
  );
  const zip = pick(address, ["zip", "zip_code", "postal_code", "cep"]);

  return {
    hasAddress,
    street,
    locality: localityParts.length > 0 ? localityParts.join(", ") : null,
    lineOne: [
      street,
      neighborhood && !lower.includes(neighborhood.toLowerCase()) ? neighborhood : null,
    ]
      .filter(Boolean)
      .join(" · "),
    lineTwo: [city, state, zip].filter(Boolean).join(" · ") || null,
    full: hasAddress ? addressLine : "",
  };
}

type RouteTarget = { location: { lat: number; lng: number } | null; addressLine: string };

export function googleMapsUrl({ location, addressLine }: RouteTarget): string | null {
  if (location) {
    return `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
  }
  if (addressLine && addressLine !== ADDRESS_NOT_INFORMED) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressLine)}`;
  }
  return null;
}

export function wazeUrl({ location, addressLine }: RouteTarget): string | null {
  if (location) return `https://waze.com/ul?ll=${location.lat},${location.lng}&navigate=yes`;
  if (addressLine && addressLine !== ADDRESS_NOT_INFORMED) {
    return `https://waze.com/ul?q=${encodeURIComponent(addressLine)}&navigate=yes`;
  }
  return null;
}

/* ---------------------------------------------------------------- Instalações */

export type { FeatureGroupKey };
export type FeatureGroup = { key: FeatureGroupKey; items: string[] };

const ACCESSIBILITY_RE = /rampa|acess|libras|cadeir|adaptad|deficien|pcd|elevador|braille|tatil|surd/;
const CHILDREN_RE = /crian|infantil|fraldar|bercar|kids|baby|\bbebes?\b/;

function plain(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/**
 * Agrupa as instalações. Código do vocabulário vai para o grupo dele, com o rótulo de
 * `labels` (features.codes); texto livre cai no grupo por palavra-chave e aparece como veio.
 * Códigos vêm antes do texto livre dentro de cada grupo. Grupos vazios somem.
 */
export function groupFeatures(
  features: readonly string[],
  labels: Readonly<Record<string, string>> = {},
): FeatureGroup[] {
  const groups: Record<FeatureGroupKey, string[]> = {
    accessibility: [],
    children: [],
    structure: [],
  };
  for (const feature of orderFeatures(features)) {
    const label = featureLabel(feature, labels);
    if (!label) continue;
    let group: FeatureGroupKey;
    if (isFeatureCode(feature)) {
      group = featureGroupOf(feature);
    } else {
      const key = plain(feature);
      group = ACCESSIBILITY_RE.test(key)
        ? "accessibility"
        : CHILDREN_RE.test(key)
          ? "children"
          : "structure";
    }
    if (!groups[group].includes(label)) groups[group].push(label);
  }
  return FEATURE_GROUP_ORDER.filter((key) => groups[key].length > 0).map((key) => ({
    key,
    items: groups[key],
  }));
}

/* ---------------------------------------------------------------- Seções */

export const SECTION_IDS = [
  "sobre",
  "horarios",
  "como-chegar",
  "instalacoes",
  "quem-e-quem",
  "contato",
  "contribuir",
  "perto",
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

/** Só as seções com dado entram no menu, na ordem do Modelo 8. */
export function availableSections(has: Record<SectionId, boolean>): SectionId[] {
  return SECTION_IDS.filter((id) => has[id]);
}

/* ---------------------------------------------------------------- Apresentação */

/** Índice (1..4) do degradê de foto, estável por comunidade. */
export function photoGradientIndex(seed: string): number {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return (hash % 4) + 1;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const first = parts[0].charAt(0);
  const second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : parts[0].charAt(1);
  return `${first}${second}`.toUpperCase();
}

export function formatUpdatedDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

/** dd/mm (sem o ano), para o aviso curto do celular. */
export function formatShortDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
