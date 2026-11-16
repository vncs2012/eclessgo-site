/**
 * "Sugerir correção" da página da comunidade (Modelo 8, Etapa 3): limites e esquema do corpo de
 * `POST /churches/{slug}/corrections`. Só imports relativos e sem `next`/`react`, para rodar também
 * em `node --experimental-strip-types`.
 */
import { z } from "zod";

export const CORRECTION_CATEGORIES = ["SCHEDULE", "ADDRESS", "CONTACT", "FACILITIES", "OTHER"] as const;
export type CorrectionCategory = (typeof CORRECTION_CATEGORIES)[number];

export const CORRECTION_MESSAGE_MIN = 10;
export const CORRECTION_MESSAGE_MAX = 1000;
export const CORRECTION_CONTACT_MAX = 254;
/** O honeypot é sempre vazio; o limite só impede um corpo gigante. */
export const CORRECTION_HONEYPOT_MAX = 200;

/** Campos do formulário -> chave de erro em `communityPage.suggest.validation.*`. */
export type CorrectionFieldErrors = Partial<Record<"category" | "message" | "contact", string>>;

const optionalContact = z
  .string()
  .trim()
  .max(CORRECTION_CONTACT_MAX, "contactMax")
  .optional()
  .transform((value) => (value ? value : undefined));

export const churchCorrectionSchema = z
  .object({
    category: z.enum(CORRECTION_CATEGORIES, "categoryRequired"),
    message: z
      .string()
      .trim()
      .min(CORRECTION_MESSAGE_MIN, "messageMin")
      .max(CORRECTION_MESSAGE_MAX, "messageMax"),
    contact: optionalContact,
    homepage: z.string().max(CORRECTION_HONEYPOT_MAX).optional(),
  })
  .strict();

export type ChurchCorrectionInput = z.input<typeof churchCorrectionSchema>;
export type ChurchCorrectionPayload = z.output<typeof churchCorrectionSchema>;

/** Erros por campo (a primeira mensagem de cada um); vazio quando o corpo é válido. */
export function correctionFieldErrors(error: z.ZodError): CorrectionFieldErrors {
  const fields: CorrectionFieldErrors = {};
  for (const issue of error.issues) {
    const name = issue.path[0];
    if ((name === "category" || name === "message" || name === "contact") && !fields[name]) {
      fields[name] = issue.message;
    }
  }
  return fields;
}
