"use client";

import { LocateFixed } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { FileUpload } from "@/components/site/file-upload";
import { Field } from "@/components/site/register-church-field";
import type { FormValues } from "@/components/site/register-church-form-schema";
import { LocationPickerMap } from "@/components/site/location-picker-map";
import type { Coordinates } from "@/types/public";

type BaseStepProps = {
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
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
      <StepTitle number={1}>{t("steps.responsible.title")}</StepTitle>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("fields.userName")} error={fieldError(errors.userName?.message)}>
          <input {...register("userName")} className="input-surface h-12 w-full rounded-2xl px-4" />
        </Field>
        <Field label={t("fields.userEmail")} error={fieldError(errors.userEmail?.message)}>
          <input {...register("userEmail")} type="email" className="input-surface h-12 w-full rounded-2xl px-4" />
        </Field>
        <Field label={t("fields.userPassword")} error={fieldError(errors.userPassword?.message)}>
          <input
            {...register("userPassword")}
            type="password"
            className="input-surface h-12 w-full rounded-2xl px-4"
          />
        </Field>
        <Field label={t("fields.userPhone")} error={fieldError(errors.userPhone?.message)}>
          <input {...register("userPhone")} className="input-surface h-12 w-full rounded-2xl px-4" />
        </Field>
      </div>
    </section>
  );
}

export function CommunityStep({ register, errors }: BaseStepProps) {
  const t = useTranslations("register");
  const fieldError = (message?: string) => (message ? t(message) : undefined);
  return (
    <section className="space-y-4">
      <StepTitle number={2}>{t("steps.community.title")}</StepTitle>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("fields.churchName")} error={fieldError(errors.churchName?.message)}>
          <input {...register("churchName")} className="input-surface h-12 w-full rounded-2xl px-4" />
        </Field>
        <Field label={t("fields.churchDenomination")} error={fieldError(errors.churchDenomination?.message)}>
          <input {...register("churchDenomination")} className="input-surface h-12 w-full rounded-2xl px-4" />
        </Field>
        <Field label={t("fields.churchDescription")} error={fieldError(errors.churchDescription?.message)} className="md:col-span-2">
          <textarea
            {...register("churchDescription")}
            className="input-surface min-h-32 w-full rounded-[1.5rem] px-4 py-3"
          />
        </Field>
      </div>
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
      <StepTitle number={3}>{t("steps.location.title")}</StepTitle>

      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950/70 p-3">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-100">{t("location.publicTitle")}</p>
            <p className="text-xs text-zinc-500">{t("location.publicHint")}</p>
          </div>
          <button
            type="button"
            onClick={onUseCurrentLocation}
            className="inline-flex items-center justify-center rounded-full border border-emerald-400/25 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-300 hover:text-white"
          >
            <LocateFixed className="mr-2 h-4 w-4" />
            {t("location.useCurrent")}
          </button>
        </div>
        <LocationPickerMap
          center={mapCenter}
          selectedLocation={selectedLocation}
          onSelectLocation={onSelectLocation}
        />
        <p className="mt-3 text-xs leading-5 text-zinc-400" aria-live="polite">
          {locationStatus || t("location.editableHint")}
        </p>
        {isResolvingAddress ? (
          <p className="mt-1 text-xs text-emerald-300" aria-live="polite">
            {t("location.resolving")}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("fields.street")} error={fieldError(errors.street?.message)} className="md:col-span-2">
          <input {...register("street")} className="input-surface h-12 w-full rounded-2xl px-4" />
        </Field>
        <Field label={t("fields.number")} error={fieldError(errors.number?.message)}>
          <input {...register("number")} className="input-surface h-12 w-full rounded-2xl px-4" />
        </Field>
        <Field label={t("fields.neighborhood")} error={fieldError(errors.neighborhood?.message)}>
          <input {...register("neighborhood")} className="input-surface h-12 w-full rounded-2xl px-4" />
        </Field>
        <Field label={t("fields.city")} error={fieldError(errors.city?.message)}>
          <input {...register("city")} className="input-surface h-12 w-full rounded-2xl px-4" />
        </Field>
        <Field label={t("fields.state")} error={fieldError(errors.state?.message)}>
          <input {...register("state")} className="input-surface h-12 w-full rounded-2xl px-4" />
        </Field>
        <Field label={t("fields.zipCode")} error={fieldError(errors.zipCode?.message)}>
          <input {...register("zipCode")} className="input-surface h-12 w-full rounded-2xl px-4" />
        </Field>
        <Field label={t("fields.latitude")} error={fieldError(errors.latitude?.message)}>
          <input {...register("latitude")} type="number" step="any" className="input-surface h-12 w-full rounded-2xl px-4" />
        </Field>
        <Field label={t("fields.longitude")} error={fieldError(errors.longitude?.message)}>
          <input {...register("longitude")} type="number" step="any" className="input-surface h-12 w-full rounded-2xl px-4" />
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
      <StepTitle number={5}>{t("steps.contact.title")}</StepTitle>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t("fields.contactEmail")} error={fieldError(errors.contactEmail?.message)}>
          <input {...register("contactEmail")} type="email" className="input-surface h-12 w-full rounded-2xl px-4" />
        </Field>
        <Field label={t("fields.contactPhone")} error={fieldError(errors.contactPhone?.message)}>
          <input {...register("contactPhone")} className="input-surface h-12 w-full rounded-2xl px-4" />
        </Field>
      </div>
    </section>
  );
}

export function MediaStep({ logoFile, coverFile, onLogoChange, onCoverChange }: MediaStepProps) {
  const t = useTranslations("register");
  return (
    <section className="space-y-4">
      <StepTitle number={4}>{t("steps.media.title")}</StepTitle>
      <div className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-100">
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

function StepTitle({ number, children }: { number: number; children: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-zinc-950/80 text-xs">
        {number}
      </span>
      {children}
    </div>
  );
}
