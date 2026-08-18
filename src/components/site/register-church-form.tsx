"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import Link from "next/link";

import { CommunityStep, ContactStep, LocationStep, MediaStep, ResponsibleStep } from "@/components/site/register-church-form-sections";
import { RegisterChurchFooter, RegisterChurchIntro } from "@/components/site/register-church-form-layout";
import { FORM_STEPS, LAST_STEP_INDEX, type FormValues, registerChurchSchema, type SubmitValues } from "@/components/site/register-church-form-schema";
import { RegisterChurchStepper } from "@/components/site/register-church-stepper";
import {
  buildRegisterChurchPayload,
  buildRegistrationSuccessQuery,
  fetchReverseGeocode,
  getSelectedLocation,
  type RegisterChurchUploadedMedia,
} from "@/components/site/register-church-form-utils";
import { GOIANIA_CENTER } from "@/lib/site-config";
import type {
  Coordinates,
  RegisterChurchMediaPurpose,
  RegisterChurchMediaUploadResponse,
} from "@/types/public";
import { LEGAL_PRIVACY_PATH, LEGAL_TERMS_PATH } from "@/lib/legal";
import { fetchWithClientTrace } from "@/lib/client-fetch";

type UploadApiResult = {
  data?: RegisterChurchMediaUploadResponse;
  message?: string;
};

type UploadMessages = {
  uploadFailed: string;
  storageNoData: string;
};

async function uploadRegistrationMediaFile(
  file: File,
  purpose: RegisterChurchMediaPurpose,
  messages: UploadMessages,
) {
  const formData = new FormData();
  formData.set("purpose", purpose);
  formData.set("file", file);

  const response = await fetchWithClientTrace("/api/public/register-church/upload", {
    method: "POST",
    body: formData,
  });
  const result = (await response.json()) as UploadApiResult;

  if (!response.ok) {
    throw new Error(result.message || messages.uploadFailed);
  }

  if (!result.data?.url || !result.data.key) {
    throw new Error(messages.storageNoData);
  }

  return result.data;
}

export function RegisterChurchForm() {
  const t = useTranslations("register");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<FormValues, unknown, SubmitValues>({
    resolver: zodResolver(registerChurchSchema),
      defaultValues: {
        state: "GO",
        city: "Goiânia",
        acceptTerms: false,
    },
  });

  const watchedLatitude = watch("latitude");
  const watchedLongitude = watch("longitude");
  const selectedLocation = getSelectedLocation(watchedLatitude, watchedLongitude);
  const mapCenter = selectedLocation ?? GOIANIA_CENTER;
  const activeStep = FORM_STEPS[currentStep];
  const isLastStep = currentStep === LAST_STEP_INDEX;

  async function reverseGeocode(location: Coordinates) {
    setIsResolvingAddress(true);
    setLocationStatus(t("status.geocoding"));

    try {
      const address = await fetchReverseGeocode(location);
      if (!address) return;

      if (address.street) setValue("street", address.street, { shouldDirty: true, shouldValidate: true });
      if (address.number) setValue("number", address.number, { shouldDirty: true, shouldValidate: true });
      if (address.neighborhood) {
        setValue("neighborhood", address.neighborhood, { shouldDirty: true, shouldValidate: true });
      }
      if (address.city) setValue("city", address.city, { shouldDirty: true, shouldValidate: true });
      if (address.state) setValue("state", address.state, { shouldDirty: true, shouldValidate: true });
      if (address.zipCode) setValue("zipCode", address.zipCode, { shouldDirty: true, shouldValidate: true });

      setLocationStatus(
        address.displayName
          ? t("status.addressFound", { address: address.displayName })
          : t("status.coordsSavedReview"),
      );
    } catch (error) {
      setLocationStatus(
        error instanceof Error ? error.message : t("status.coordsSavedNoAddress"),
      );
    } finally {
      setIsResolvingAddress(false);
    }
  }

  function handleLocationSelect(location: Coordinates) {
    setValue("latitude", location.lat, { shouldDirty: true, shouldValidate: true });
    setValue("longitude", location.lng, { shouldDirty: true, shouldValidate: true });
    void reverseGeocode(location);
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus(t("status.noGeolocation"));
      return;
    }

    setLocationStatus(t("status.requestingLocation"));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationSelect({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setLocationStatus(t("status.locationDenied"));
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function handleNextStep() {
    setServerError(null);
    const isStepValid = activeStep.fields.length === 0 || (await trigger(activeStep.fields, { shouldFocus: true }));
    if (!isStepValid) return;

    setCurrentStep((step) => Math.min(step + 1, LAST_STEP_INDEX));
  }

  function handlePreviousStep() {
    setServerError(null);
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  async function uploadSelectedMedia(): Promise<RegisterChurchUploadedMedia> {
    const media: RegisterChurchUploadedMedia = {};
    const uploadMessages: UploadMessages = {
      uploadFailed: t("errors.uploadFailed"),
      storageNoData: t("errors.storageNoData"),
    };

    if (logoFile) {
      setUploadStatus(t("status.uploadingLogo"));
      media.logo = await uploadRegistrationMediaFile(logoFile, "logo", uploadMessages);
    }

    if (coverFile) {
      setUploadStatus(t("status.uploadingCover"));
      media.cover = await uploadRegistrationMediaFile(coverFile, "cover", uploadMessages);
    }

    return media;
  }

  async function onSubmit(values: SubmitValues) {
    setServerError(null);
    setUploadStatus(null);
    setIsSubmitting(true);

    try {
      const uploadedMedia = await uploadSelectedMedia();
      setUploadStatus(t("status.finalizing"));

      const response = await fetchWithClientTrace("/api/public/register-church", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildRegisterChurchPayload(values, uploadedMedia)),
      });

      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message || t("errors.submitFailed"));
      }

      router.push(`/cadastro-comunidade/sucesso?${buildRegistrationSuccessQuery(values)}`);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : t("errors.submitFailed"));
    } finally {
      setUploadStatus(null);
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card rounded-[2rem] p-6 sm:p-8">
      <RegisterChurchIntro />

      <RegisterChurchStepper
        steps={FORM_STEPS}
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
      />

      <div className="grid gap-8">
        {currentStep === 0 ? <ResponsibleStep register={register} errors={errors} /> : null}
        {currentStep === 1 ? <CommunityStep register={register} errors={errors} /> : null}
        {currentStep === 2 ? (
          <LocationStep
            register={register}
            errors={errors}
            mapCenter={mapCenter}
            selectedLocation={selectedLocation}
            locationStatus={locationStatus}
            isResolvingAddress={isResolvingAddress}
            onSelectLocation={handleLocationSelect}
            onUseCurrentLocation={handleUseCurrentLocation}
          />
        ) : null}
        {currentStep === 3 ? (
          <MediaStep
            logoFile={logoFile}
            coverFile={coverFile}
            onLogoChange={setLogoFile}
            onCoverChange={setCoverFile}
          />
        ) : null}
        {currentStep === 4 ? <ContactStep register={register} errors={errors} /> : null}
      </div>

      <fieldset className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4">
        <legend className="sr-only">{t("legal.legend")}</legend>
        <label className="flex items-start gap-3 text-sm leading-6 text-zinc-300">
          <input
            type="checkbox"
            {...register("acceptTerms")}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-zinc-950 text-emerald-500 focus:ring-emerald-400"
          />
          <span>
            {t("legal.prefix")} {" "}
            <Link href={LEGAL_TERMS_PATH} target="_blank" className="font-semibold text-emerald-300 underline underline-offset-2">
              {t("legal.terms")}
            </Link>{" "}
            {t("legal.connector")} {" "}
            <Link href={LEGAL_PRIVACY_PATH} target="_blank" className="font-semibold text-emerald-300 underline underline-offset-2">
              {t("legal.privacy")}
            </Link>.
          </span>
        </label>
        {errors.acceptTerms?.message ? (
          <p className="mt-2 text-xs text-red-300">{t(errors.acceptTerms.message)}</p>
        ) : null}
      </fieldset>

      {serverError ? (
        <div className="mt-6 rounded-[1.5rem] border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {serverError}
        </div>
      ) : null}

      {uploadStatus ? (
        <div className="mt-6 rounded-[1.5rem] border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100" aria-live="polite">
          {uploadStatus}
        </div>
      ) : null}

      <RegisterChurchFooter
        currentStep={currentStep}
        isLastStep={isLastStep}
        isSubmitting={isSubmitting}
        onPrevious={handlePreviousStep}
        onNext={handleNextStep}
      />
    </form>
  );
}
