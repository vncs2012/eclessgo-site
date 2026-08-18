import { type FieldPath } from "react-hook-form";
import { z } from "zod";

// As mensagens sao chaves relativas a `register` (`validation.*`), resolvidas
// no render via `t(...)` no ponto de exibicao do erro (componentes de step).
export const registerChurchSchema = z.object({
  userName: z.string().min(2, "validation.userNameMin"),
  userEmail: z.string().email("validation.userEmail"),
  userPassword: z.string().min(8, "validation.userPasswordMin"),
  userPhone: z.string().optional(),
  churchName: z.string().min(2, "validation.churchNameMin"),
  churchDenomination: z.string().min(2, "validation.churchDenominationMin"),
  churchDescription: z.string().optional(),
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
  fields: FormField[];
};

// `label`/`title`/`description` sao chaves i18n relativas a `register`
// (`steps.*`), resolvidas no render via `t(...)`.
// resolvidas no render via `t(...)`.
export const FORM_STEPS: RegistrationFormStep[] = [
  {
    id: "responsible",
    label: "steps.responsible.label",
    title: "steps.responsible.title",
    description: "steps.responsible.description",
    fields: ["userName", "userEmail", "userPassword", "userPhone"],
  },
  {
    id: "community",
    label: "steps.community.label",
    title: "steps.community.title",
    description: "steps.community.description",
    fields: ["churchName", "churchDenomination", "churchDescription"],
  },
  {
    id: "location",
    label: "steps.location.label",
    title: "steps.location.title",
    description: "steps.location.description",
    fields: ["street", "number", "neighborhood", "city", "state", "zipCode", "latitude", "longitude"],
  },
  {
    id: "media",
    label: "steps.media.label",
    title: "steps.media.title",
    description: "steps.media.description",
    fields: [],
  },
  {
    id: "contact",
    label: "steps.contact.label",
    title: "steps.contact.title",
    description: "steps.contact.description",
    fields: ["contactEmail", "contactPhone"],
  },
];

export const LAST_STEP_INDEX = FORM_STEPS.length - 1;
