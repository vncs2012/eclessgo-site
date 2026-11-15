"use client";

import { LocateFixed } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import { FileUpload } from "@/components/site/file-upload";
import {
  Field,
  REGISTER_FOCUS,
  REGISTER_INPUT_CLASS,
  REGISTER_TEXTAREA_CLASS,
} from "@/components/site/register-church-field";
import { FeatureChips } from "@/components/site/register-church-feature-chips";
import type { FormValues } from "@/components/site/register-church-form-schema";
import { ScheduleEditor } from "@/components/site/register-church-schedule-editor";
import { CHURCH_DESCRIPTION_MAX, CHURCH_LINE_MAX, REGISTER_TRADITION_CODES } from "@/lib/church-register";
import { LocationPickerMap } from "@/components/site/location-picker-map";
import type { Coordinates } from "@/types/public";

type BaseStepProps = {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
};

type CommunityStepProps = BaseStepProps & {
  control: Control<FormValues>;
};

type LocationStepProps = BaseStepProps & {
  mapCenter: Coordinates;
  selectedLocation: Coordinates | null;
  locationStatus: string | null;
  isResolvingAddress: boolean;
  onSelectLocation: (location: Coordinates) => void;
  onUseCurrentLocation: () => void;
};

type MediaStepProps = {
  logoFile: File | null;
  coverFile: File | null;
  onLogoChange: (file: File | null) => void;
  onCoverChange: (file: File | null) => void;
};

export function ResponsibleStep({ register, errors }: BaseStepProps) {
  const t = useTranslations("register");
  const fieldError = (message?: string) => (message ? t(message) : undefined);
  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("fields.userName")} required error={fieldError(errors.userName?.message)}>
          <input {...register("userName")} aria-required="true" className={REGISTER_INPUT_CLASS} />
        </Field>
        <Field label={t("fields.userEmail")} required error={fieldError(errors.userEmail?.message)}>
          <input {...register("userEmail")} type="email" aria-required="true" className={REGISTER_INPUT_CLASS} />
        </Field>
        <Field label={t("fields.userPassword")} required error={fieldError(errors.userPassword?.message)}>
          <input
            {...register("userPassword")}
            type="password"
            aria-required="true"
            className={REGISTER_INPUT_CLASS}
          />
        </Field>
        <Field label={t("fields.userPhone")} error={fieldError(errors.userPhone?.message)}>
          <input {...register("userPhone")} className={REGISTER_INPUT_CLASS} />
        </Field>
      </div>
    </section>
  );
}

export function CommunityStep({ register, errors, control }: CommunityStepProps) {
  const t = useTranslations("register");
  const tTraditions = useTranslations("finder.traditions");
  const fieldError = (message?: string) => (message ? t(message) : undefined);
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label={t("fields.churchName")}
          required
          error={fieldError(errors.churchName?.message)}
          className="md:col-span-2"
        >
          <input {...register("churchName")} aria-required="true" className={REGISTER_INPUT_CLASS} />
        </Field>
        <Field label={t("fields.churchTradition")} required error={fieldError(errors.churchTradition?.message)}>
          <select {...register("churchTradition")} aria-required="true" className={REGISTER_INPUT_CLASS}>
            <option value="">{t("fields.churchTraditionPlaceholder")}</option>
            {REGISTER_TRADITION_CODES.map((code) => (
              <option key={code} value={code}>
                {tTraditions(code)}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={t("fields.churchLine")}
          optionalLabel={t("optional")}
          error={fieldError(errors.churchLine?.message)}
        >
          <input {...register("churchLine")} maxLength={CHURCH_LINE_MAX} className={REGISTER_INPUT_CLASS} />
        </Field>
        <Field
          label={t("fields.churchDescription")}
          optionalLabel={t("optional")}
          hint={t("fields.churchDescriptionHint", { max: CHURCH_DESCRIPTION_MAX })}
          error={fieldError(errors.churchDescription?.message)}
          className="md:col-span-2"
        >
          <textarea
            {...register("churchDescription")}
            rows={3}
            className={REGISTER_TEXTAREA_CLASS}
          />
        </Field>
      </div>

      <ScheduleEditor control={control} register={register} errors={errors} />

      <Controller
        control={control}
        name="features"
        render={({ field }) => <FeatureChips value={field.value ?? []} onChange={field.onChange} />}
      />
    </section>
  );
}

export function LocationStep({
  register,
  errors,
  mapCenter,
  selectedLocation,
  locationStatus,
  isResolvingAddress,
  onSelectLocation,
  onUseCurrentLocation,
}: LocationStepProps) {
  const t = useTranslations("register");
  const fieldError = (message?: string) => (message ? t(message) : undefined);
  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-eg-border bg-eg-subtle p-3">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-eg-strong">{t("location.publicTitle")}</p>
            <p className="text-xs text-eg-muted">{t("location.publicHint")}</p>
          </div>
          <button
            type="button"
            onClick={onUseCurrentLocation}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-eg-border-strong px-4 text-eg-primary-text transition hover:bg-eg-hover md:min-h-10 ${REGISTER_FOCUS}`}
          >
            <LocateFixed className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm font-semibold">{t("location.useCurrent")}</span>
          </button>
        </div>
        <LocationPickerMap
          center={mapCenter}
          selectedLocation={selectedLocation}
          onSelectLocation={onSelectLocation}
        />
        <p className="mt-3 text-xs leading-5 text-eg-muted" aria-live="polite">
          {locationStatus || t("location.editableHint")}
        </p>
        {isResolvingAddress ? (
          <p className="mt-1 text-xs text-eg-primary-text" aria-live="polite">
            {t("location.resolving")}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("fields.street")} required error={fieldError(errors.street?.message)} className="md:col-span-2">
          <input {...register("street")} aria-required="true" className={REGISTER_INPUT_CLASS} />
        </Field>
        <Field label={t("fields.number")} error={fieldError(errors.number?.message)}>
          <input {...register("number")} className={REGISTER_INPUT_CLASS} />
        </Field>
        <Field label={t("fields.neighborhood")} error={fieldError(errors.neighborhood?.message)}>
          <input {...register("neighborhood")} className={REGISTER_INPUT_CLASS} />
        </Field>
        <Field label={t("fields.city")} required error={fieldError(errors.city?.message)}>
          <input {...register("city")} aria-required="true" className={REGISTER_INPUT_CLASS} />
        </Field>
        <Field label={t("fields.state")} required error={fieldError(errors.state?.message)}>
          <input {...register("state")} aria-required="true" className={REGISTER_INPUT_CLASS} />
        </Field>
        <Field label={t("fields.zipCode")} error={fieldError(errors.zipCode?.message)}>
          <input {...register("zipCode")} className={REGISTER_INPUT_CLASS} />
        </Field>
        <Field label={t("fields.latitude")} required error={fieldError(errors.latitude?.message)}>
          <input {...register("latitude")} type="number" step="any" aria-required="true" className={REGISTER_INPUT_CLASS} />
        </Field>
        <Field label={t("fields.longitude")} required error={fieldError(errors.longitude?.message)}>
          <input {...register("longitude")} type="number" step="any" aria-required="true" className={REGISTER_INPUT_CLASS} />
        </Field>
      </div>
    </section>
  );
}

export function ContactStep({ register, errors }: BaseStepProps) {
  const t = useTranslations("register");
  const fieldError = (message?: string) => (message ? t(message) : undefined);
  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("fields.contactEmail")} error={fieldError(errors.contactEmail?.message)}>
          <input {...register("contactEmail")} type="email" className={REGISTER_INPUT_CLASS} />
        </Field>
        <Field label={t("fields.contactPhone")} error={fieldError(errors.contactPhone?.message)}>
          <input {...register("contactPhone")} className={REGISTER_INPUT_CLASS} />
        </Field>
      </div>
    </section>
  );
}

export function MediaStep({ logoFile, coverFile, onLogoChange, onCoverChange }: MediaStepProps) {
  const t = useTranslations("register");
  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-eg-success/30 bg-eg-success-soft px-4 py-3 text-sm leading-6 text-eg-success-text">
        {t("media.banner")}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <FileUpload
          label={t("media.logoLabel")}
          description={t("media.logoDescription")}
          value={logoFile}
          onChange={onLogoChange}
          recommendedSize={t("media.logoSize")}
        />
        <FileUpload
          label={t("media.coverLabel")}
          description={t("media.coverDescription")}
          value={coverFile}
          onChange={onCoverChange}
          recommendedSize={t("media.coverSize")}
        />
      </div>
    </section>
  );
}
