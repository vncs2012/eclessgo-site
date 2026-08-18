import { z } from "zod";

const nullableText = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable().optional();

const coordinatesSchema = z
  .object({
    lat: z.number().finite().min(-90).max(90),
    lng: z.number().finite().min(-180).max(180),
  })
  .strict();

export const registerChurchPublicRequestSchema = z
  .object({
    legal_acceptance: z
      .object({
        terms_version: z.string().trim().min(1).max(32),
        privacy_version: z.string().trim().min(1).max(32),
        purpose: z.literal("ACCOUNT_REGISTRATION").optional(),
      })
      .strict(),
    user: z
      .object({
        name: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(254),
        password: z.string().min(8).max(128),
        phone: nullableText(20),
      })
      .strict(),
    church: z
      .object({
        name: z.string().trim().min(2).max(160),
        denomination: z.string().trim().min(2).max(120),
        description: nullableText(2_000),
        address: z
          .object({
            street: z.string().trim().min(2).max(160),
            city: z.string().trim().min(2).max(120),
            state: z.string().trim().length(2),
            number: nullableText(32),
            neighborhood: nullableText(120),
            zip_code: nullableText(16),
          })
          .strict(),
        location: coordinatesSchema,
        contact: z
          .object({
            email: nullableText(254),
            phone: nullableText(20),
          })
          .strict()
          .nullable()
          .optional(),
        logo_url: nullableText(2_048),
        logo_key: nullableText(512),
        cover_url: nullableText(2_048),
        cover_key: nullableText(512),
      })
      .strict(),
  })
  .strict();

const publicAnalyticsEventSchema = z.enum([
  "PUBLIC_MAP_VIEW",
  "PUBLIC_CHURCH_VIEW",
  "PUBLIC_CHURCH_CONTACT_CLICK",
  "PUBLIC_CHURCH_APP_CLICK",
  "PUBLIC_CHURCH_SHARE",
]);

const publicAnalyticsSourceSchema = z.enum(["WEB_DIRECTORY", "WEB_DETAIL", "WEB_LANDING"]);

const analyticsMetadataValueSchema = z.union([
  z.string().max(500),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const publicAnalyticsRequestSchema = z
  .object({
    churchId: z.string().trim().min(1).max(64),
    eventType: publicAnalyticsEventSchema,
    source: publicAnalyticsSourceSchema,
    sessionId: z.string().trim().min(1).max(120).optional(),
    path: z.string().trim().max(500).optional(),
    metadata: z
      .record(z.string().trim().min(1).max(64), analyticsMetadataValueSchema)
      .refine((value) => Object.keys(value).length <= 40, "metadata excede 40 campos")
      .optional(),
  })
  .strict();

export const publicDirectoryQuerySchema = z
  .object({
    lat: z.coerce.number().finite().min(-90).max(90).optional(),
    lng: z.coerce.number().finite().min(-180).max(180).optional(),
    search: z.string().trim().max(120).optional(),
    denomination: z.string().trim().max(120).optional(),
    city: z.string().trim().max(120).optional(),
    neighborhood: z.string().trim().max(120).optional(),
    hasLive: z.enum(["true", "false"]).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    page: z.coerce.number().int().min(1).max(10_000).optional(),
  })
  .strict();

export const publicSlugSchema = z.string().trim().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const reverseGeocodeQuerySchema = z
  .object({
    lat: z.coerce.number().finite().min(-90).max(90),
    lng: z.coerce.number().finite().min(-180).max(180),
  })
  .strict();

export const publicUploadPurposeSchema = z.enum(["logo", "cover"]);
export const publicUploadMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
