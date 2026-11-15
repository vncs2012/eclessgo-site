import { type FieldPath } from "react-hook-form";
import { z } from "zod";

import {
  CHURCH_DESCRIPTION_MAX,
  CHURCH_LINE_MAX,
  registerFeaturesSchema,
  registerScheduleSchema,
} from "@/lib/church-register";

// As mensagens sao chaves relativas a `register` (`validation.*`), resolvidas
// no render via `t(...)` no ponto de exibicao do erro (componentes de step).
export const registerChurchSchema = z.object({
  userName: z.string().min(2, "validation.userNameMin"),
  userEmail: z.string().email("validation.userEmail"),
  userPassword: z.string().min(8, "validation.userPasswordMin"),
  userPhone: z.string().optional(),
  churchName: z.string().min(2, "validation.churchNameMin"),
  churchTradition: z.string().min(1, "validation.churchTraditionRequired"),
  churchLine: z.string().trim().max(CHURCH_LINE_MAX, "validation.churchLineMax").optional(),
  churchDescription: z.string().max(CHURCH_DESCRIPTION_MAX, "validation.churchDescriptionMax").optional(),
  schedule: registerScheduleSchema,
  features: registerFeaturesSchema,
  street: z.string().min(2, "validation.streetMin"),
  number: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().min(2, "validation.cityMin"),
  state: z.string().min(2, "validation.stateMin"),
  zipCode: z.string().optional(),
  latitude: z.coerce.number().refine(Number.isFinite, "validation.latitudeInvalid"),
  longitude: z.coerce.number().refine(Number.isFinite, "validation.longitudeInvalid"),
  contactEmail: z.string().email("validation.contactEmail").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  acceptTerms: z.boolean().refine((value) => value === true, "validation.acceptTerms"),
});

export type FormValues = z.input<typeof registerChurchSchema>;
export type SubmitValues = z.output<typeof registerChurchSchema>;

type FormField = FieldPath<FormValues>;

export type RegistrationFormStep = {
  id: string;
  label: string;
  title: string;
  description: string;
  /** Linha curta do stepper (ex.: "Nome, tradição, horários"). */
  summary: string;
  /** Título grande da página (h1) enquanto o passo está ativo. */
  headline: string;
  fields: FormField[];
};

// `label`/`title`/`description` (e `summary`/`headline`) sao chaves i18n relativas a `register`
// (`steps.*`), resolvidas no render via `t(...)`.
export const FORM_STEPS: RegistrationFormStep[] = [
  {
    id: "responsible",
    label: "steps.responsible.label",
    title: "steps.responsible.title",
    description: "steps.responsible.description",
    summary: "steps.responsible.summary",
    headline: "steps.responsible.headline",
    fields: ["userName", "userEmail", "userPassword", "userPhone"],
  },
  {
    id: "community",
    label: "steps.community.label",
    title: "steps.community.title",
    description: "steps.community.description",
    summary: "steps.community.summary",
    headline: "steps.community.headline",
    fields: ["churchName", "churchTradition", "churchLine", "churchDescription", "schedule", "features"],
  },
  {
    id: "location",
    label: "steps.location.label",
    title: "steps.location.title",
    description: "steps.location.description",
    summary: "steps.location.summary",
    headline: "steps.location.headline",
    fields: ["street", "number", "neighborhood", "city", "state", "zipCode", "latitude", "longitude"],
  },
  {
    id: "media",
    label: "steps.media.label",
    title: "steps.media.title",
    description: "steps.media.description",
    summary: "steps.media.summary",
    headline: "steps.media.headline",
    fields: [],
  },
  {
    id: "contact",
    label: "steps.contact.label",
    title: "steps.contact.title",
    description: "steps.contact.description",
    summary: "steps.contact.summary",
    headline: "steps.contact.headline",
    fields: ["contactEmail", "contactPhone"],
  },
];

export const LAST_STEP_INDEX = FORM_STEPS.length - 1;
