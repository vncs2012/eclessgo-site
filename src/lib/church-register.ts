/**
 * Regras puras do cadastro público da comunidade (Modelo 8): horários habituais, instalações
 * e tradição. Sem `next`/`react` e só com imports relativos, para rodar também em
 * `node --experimental-strip-types` (scripts/register-church-schedule.test.ts).
 *
 * Os limites espelham `ChurchScheduleEntryRequest` e `RegisterChurchPayload` da API
 * (`POST /auth/register-church`): `schedule` (até 30 itens: title 1-120, day, time HH:MM,
 * description até 500) e `features` (códigos do vocabulário e/ou texto livre).
 */
import { z } from "zod";

import { API_DAYS, FEATURE_CODES, isFeatureCode } from "./church-features.ts";
import { formatTradition, traditionCode } from "./public-church-utils.ts";

export const SCHEDULE_MAX_ITEMS = 30;
export const SCHEDULE_TITLE_MAX = 120;
export const SCHEDULE_DESCRIPTION_MAX = 500;
/** Duração aproximada de um encontro, em minutos (`duration_minutes` da API: 15 a 600). */
export const SCHEDULE_DURATION_MIN = 15;
export const SCHEDULE_DURATION_MAX = 600;
/** HH:MM de 00:00 a 23:59 (o que `<input type="time">` devolve). */
export const SCHEDULE_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const CHURCH_DESCRIPTION_MAX = 280;
export const CHURCH_LINE_MAX = 80;
/** A API aceita até 120 caracteres em `denomination` ("Tradição" + " " + linha cabe nisso). */
export const DENOMINATION_MAX = 120;

/** Domingo primeiro, como no calendário de quem preenche; o valor segue o enum da API. */
export const SCHEDULE_DAY_OPTIONS = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const satisfies readonly (typeof API_DAYS)[number][];

/** Traduções em `finder.traditions` (mesmos códigos que a Busca agrupa e rotula). */
export const REGISTER_TRADITION_CODES = [
  "CATOLICA",
  "ORTODOXA",
  "ANGLICANA",
  "EVANGELICA",
  "ASSEMBLEIA_DE_DEUS",
  "BATISTA",
  "PRESBITERIANA",
  "METODISTA",
  "LUTERANA",
  "ADVENTISTA",
  "PENTECOSTAL",
  "QUADRANGULAR",
  "CONGREGACIONAL",
  "CONGREGACAO_CRISTA",
  "ESPIRITA",
  "MATRIZ_AFRICANA",
  "UMBANDA",
  "CANDOMBLE",
  "BUDISTA",
  "JUDAICA",
  "ISLAMICA",
  "COMUNIDADE",
  "OUTRA",
] as const;

export type ScheduleDay = (typeof SCHEDULE_DAY_OPTIONS)[number];

export type ScheduleRowValues = {
  day: ScheduleDay;
  time: string;
  title: string;
  description?: string;
  /** Minutos como o campo numérico devolve (texto); vazio = não informado. */
  duration?: string;
};

/** Texto de minutos inteiros de 15 a 600, sem zeros à esquerda nem sinais ("90"); senão null. */
export function parseScheduleDuration(value: string | undefined): number | null {
  const text = value?.trim() ?? "";
  if (!/^[1-9]\d{0,3}$/.test(text)) return null;
  const minutes = Number(text);
  return minutes >= SCHEDULE_DURATION_MIN && minutes <= SCHEDULE_DURATION_MAX ? minutes : null;
}

/* ------------------------------------------------------------------ Esquemas do formulário */

// As mensagens são chaves relativas a `register` (`validation.*`), resolvidas no render.
export const registerScheduleEntrySchema = z.object({
  day: z.enum(API_DAYS, "validation.scheduleDay"),
  time: z.string().regex(SCHEDULE_TIME_PATTERN, "validation.scheduleTime"),
  title: z
    .string()
    .trim()
    .min(1, "validation.scheduleTitleRequired")
    .max(SCHEDULE_TITLE_MAX, "validation.scheduleTitleMax"),
  description: z.string().trim().max(SCHEDULE_DESCRIPTION_MAX, "validation.scheduleDescriptionMax").optional(),
  duration: z
    .string()
    .trim()
    .refine((value) => value === "" || parseScheduleDuration(value) !== null, "validation.scheduleDuration")
    .optional(),
});

export const registerScheduleSchema = z
  .array(registerScheduleEntrySchema)
  .max(SCHEDULE_MAX_ITEMS, "validation.scheduleMax")
  .optional();

export const registerFeaturesSchema = z
  .array(z.string().refine(isFeatureCode, "validation.featureUnknown"))
  .optional();

/* ------------------------------------------------------------------ Esquemas do BFF (API) */

export const apiScheduleEntrySchema = z
  .object({
    title: z.string().trim().min(1).max(SCHEDULE_TITLE_MAX),
    day: z.enum(API_DAYS),
    time: z.string().regex(SCHEDULE_TIME_PATTERN),
    description: z.string().trim().max(SCHEDULE_DESCRIPTION_MAX).nullable().optional(),
    duration_minutes: z
      .number()
      .int()
      .min(SCHEDULE_DURATION_MIN)
      .max(SCHEDULE_DURATION_MAX)
      .nullable()
      .optional(),
  })
  .strict();

export const apiScheduleSchema = z.array(apiScheduleEntrySchema).max(SCHEDULE_MAX_ITEMS);

/** Vocabulário fechado ou texto livre (como a API aceita); sem itens vazios. */
export const apiFeaturesSchema = z
  .array(z.string().trim().min(1).max(120))
  .max(FEATURE_CODES.length + 20);

/* ------------------------------------------------------------------ Payload */

/** Linhas do formulário -> `church.schedule`. Sem linhas, `undefined`: o campo não é enviado. */
export function buildSchedulePayload(
  rows: ReadonlyArray<ScheduleRowValues> | undefined,
): Array<{
  title: string;
  day: ScheduleDay;
  time: string;
  description?: string;
  duration_minutes?: number;
}> | undefined {
  if (!rows || rows.length === 0) return undefined;
  return rows.map((row) => {
    const description = row.description?.trim();
    const durationMinutes = parseScheduleDuration(row.duration);
    return {
      title: row.title.trim(),
      day: row.day,
      time: row.time,
      ...(description ? { description } : {}),
      ...(durationMinutes !== null ? { duration_minutes: durationMinutes } : {}),
    };
  });
}

/** Instalações marcadas -> `church.features`, sem repetir e na ordem do vocabulário. Vazio -> `undefined`. */
export function buildFeaturesPayload(features: readonly string[] | undefined): string[] | undefined {
  if (!features || features.length === 0) return undefined;
  const selected = new Set(features.map((value) => value.trim()).filter(Boolean));
  const ordered = FEATURE_CODES.filter((code) => selected.has(code));
  return ordered.length > 0 ? ordered : undefined;
}

/**
 * `denomination` da API. Só a tradição: o código estável ("BATISTA"). Com linha: "Rótulo linha",
 * que `formatTradition` ainda reconhece ("Evangélica Independente" -> EVANGELICA_INDEPENDENTE).
 */
export function buildDenomination(
  tradition: string,
  line: string | undefined,
  labels: Readonly<Record<string, string>> = {},
): string {
  const code = traditionCode(tradition);
  const extra = line?.trim();
  if (!extra) return code;
  return `${formatTradition(code, labels)} ${extra}`.slice(0, DENOMINATION_MAX);
}

/** Linhas completas e válidas, para a prévia (ignora o que ainda está sendo digitado). */
export function previewScheduleEntries(
  rows: ReadonlyArray<Partial<ScheduleRowValues>> | undefined,
): Array<{ day: string; time: string; title: string; durationMinutes?: number }> {
  if (!rows) return [];
  const out: Array<{ day: string; time: string; title: string; durationMinutes?: number }> = [];
  for (const row of rows) {
    if (!row?.day || !row.time || !SCHEDULE_TIME_PATTERN.test(row.time)) continue;
    const durationMinutes = parseScheduleDuration(row.duration);
    out.push({
      day: row.day,
      time: row.time,
      title: row.title?.trim() ?? "",
      ...(durationMinutes !== null ? { durationMinutes } : {}),
    });
  }
  return out;
}
