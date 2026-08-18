import { z } from "zod";

const emptyToNull = (value: string | undefined | null) => {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const emailSchema = z
  .string()
  .trim()
  .email("Email invalido")
  .max(254, "Email muito longo");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Nome deve ter pelo menos 2 caracteres")
  .max(120, "Nome deve ter no maximo 120 caracteres");

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+\d\s().-]{8,20}$/, "Telefone invalido");

export const optionalPhoneSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform(emptyToNull)
  .pipe(phoneSchema.nullable());

export const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no minimo 8 caracteres")
  .max(128, "Senha deve ter no maximo 128 caracteres");

export const loginPasswordSchema = z
  .string()
  .min(6, "Senha deve ter no minimo 6 caracteres")
  .max(128, "Senha deve ter no maximo 128 caracteres");

export const cepSchema = z
  .string()
  .trim()
  .regex(/^\d{5}-?\d{3}$/, "CEP invalido");

export const cnpjSchema = z
  .string()
  .trim()
  .regex(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/, "CNPJ invalido");

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Slug deve ter pelo menos 3 caracteres")
  .max(80, "Slug deve ter no maximo 80 caracteres")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras, numeros e hifens");

export const churchRoleSchema = z.enum([
  "MEMBER",
  "CHURCH_MODERATOR",
  "CHURCH_FINANCE",
  "CHURCH_ADMIN",
]);

export const churchInviteSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: churchRoleSchema,
  phone: optionalPhoneSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z
  .object({
    name: nameSchema.min(3, "Nome deve ter no minimo 3 caracteres"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: optionalPhoneSchema.optional(),
    city: z.string().trim().max(80, "Cidade muito longa").optional().or(z.literal("")),
    state: z.string().trim().length(2, "UF deve ter 2 letras").optional().or(z.literal("")),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: "Voce deve aceitar os termos de uso",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas nao coincidem",
    path: ["confirmPassword"],
  });

export const donationSchema = z.object({
  amount: z.coerce
    .number({ message: "Valor invalido" })
    .positive("Informe um valor maior que zero"),
  donorName: z.string().trim().max(120, "Nome muito longo").optional().or(z.literal("")),
  donorEmail: z.union([emailSchema, z.literal("")]).optional(),
  paymentMethod: z.string().trim().min(1, "Informe a forma de pagamento"),
  message: z.string().trim().max(500, "Mensagem deve ter no maximo 500 caracteres").optional().or(z.literal("")),
  anonymous: z.boolean().optional(),
});

export type ChurchInviteFormData = z.infer<typeof churchInviteSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type DonationFormData = z.infer<typeof donationSchema>;
