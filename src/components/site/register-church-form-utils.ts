import type { FormValues, SubmitValues } from "@/components/site/register-church-form-schema";
import type { Coordinates, RegisterChurchMediaUploadResponse, RegisterChurchRequest } from "@/types/public";
import { LEGAL_PRIVACY_VERSION, LEGAL_TERMS_VERSION } from "@/lib/legal";
import { fetchWithClientTrace } from "@/lib/client-fetch";

export type ReverseGeocodeAddress = {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  displayName?: string;
};

type ReverseGeocodeResult = {
  data?: ReverseGeocodeAddress;
  message?: string;
};

export type RegisterChurchUploadedMedia = {
  logo?: RegisterChurchMediaUploadResponse;
  cover?: RegisterChurchMediaUploadResponse;
};

function toFiniteNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getSelectedLocation(
  latitude: FormValues["latitude"],
  longitude: FormValues["longitude"],
): Coordinates | null {
  const lat = toFiniteNumber(latitude);
  const lng = toFiniteNumber(longitude);
  return lat !== null && lng !== null ? { lat, lng } : null;
}

export async function fetchReverseGeocode(location: Coordinates) {
  const query = new URLSearchParams({
    lat: String(location.lat),
    lng: String(location.lng),
  });
  const response = await fetchWithClientTrace(`/api/public/reverse-geocode?${query.toString()}`);
  const result = (await response.json()) as ReverseGeocodeResult;

  if (!response.ok) {
    throw new Error(result.message || "Não foi possível buscar o endereço.");
  }

  return result.data;
}

export function buildRegisterChurchPayload(
  values: SubmitValues,
  media: RegisterChurchUploadedMedia = {},
): RegisterChurchRequest {
  return {
    user: {
      name: values.userName.trim(),
      email: values.userEmail.trim().toLowerCase(),
      password: values.userPassword,
      phone: values.userPhone?.trim() || null,
    },
    church: {
      name: values.churchName.trim(),
      denomination: values.churchDenomination.trim(),
      description: values.churchDescription?.trim() || null,
      address: {
        street: values.street.trim(),
        city: values.city.trim(),
        state: values.state.trim(),
        number: values.number?.trim() || null,
        neighborhood: values.neighborhood?.trim() || null,
        zip_code: values.zipCode?.trim() || null,
      },
      location: {
        lat: values.latitude,
        lng: values.longitude,
      },
      contact: {
        email: values.contactEmail?.trim() || null,
        phone: values.contactPhone?.trim() || null,
      },
      logo_url: media.logo?.url ?? null,
      logo_key: media.logo?.key ?? null,
      cover_url: media.cover?.url ?? null,
      cover_key: media.cover?.key ?? null,
    },
    legal_acceptance: {
      terms_version: LEGAL_TERMS_VERSION,
      privacy_version: LEGAL_PRIVACY_VERSION,
    },
  };
}

export function buildRegistrationSuccessQuery(values: SubmitValues) {
  return new URLSearchParams({
    church: values.churchName.trim(),
    email: values.userEmail.trim().toLowerCase(),
  }).toString();
}
