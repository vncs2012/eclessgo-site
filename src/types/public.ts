export interface Coordinates {
  lat: number;
  lng: number;
}

export interface PublicChurchListItem {
  id: string;
  slug: string;
  name: string;
  denomination: string;
  addressLine: string;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  location: Coordinates;
  description: string | null;
  isLive: boolean;
  memberCount: number;
  plan: string;
  distanceKm: number | null;
  thumbnail: string | null;
}

export interface PublicChurchDetails {
  id: string;
  slug: string;
  name: string;
  denomination: string;
  description: string | null;
  addressLine: string;
  city: string | null;
  state: string | null;
  neighborhood: string | null;
  address: Record<string, unknown>;
  location: Coordinates | null;
  contact: Record<string, unknown>;
  schedule: unknown[];
  memberCount: number;
  plan: string;
  pixKey: string | null;
  isLive: boolean;
  donationsEnabled: boolean;
  thumbnail: string | null;
  photos: unknown[];
}

export type RegisterChurchRequest = GeneratedRegisterChurchRequest;

export type RegisterChurchMediaPurpose = "logo" | "cover";

export type RegisterChurchMediaUploadResponse =
  Omit<GeneratedRegisterChurchMediaUploadResponse, "purpose"> & {
    purpose: RegisterChurchMediaPurpose;
  };

export type ApiEnvelope<T> = ApiResponse<T>;

export type ApiPaginatedEnvelope<T> = PaginatedResponse<T>;
import type {
  ApiResponse,
  PaginatedResponse,
  RegisterChurchMediaUploadResponse as GeneratedRegisterChurchMediaUploadResponse,
  RegisterChurchRequest as GeneratedRegisterChurchRequest,
} from "@/lib/generated-api";
