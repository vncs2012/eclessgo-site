import type { ChurchResponse, PublicChurchResponse } from "@/lib/generated-api";
import type { PublicChurchDetails, PublicChurchListItem } from "@/types/public";

type RawChurch = Omit<Partial<PublicChurchResponse & ChurchResponse>, "address" | "location"> & {
  id: string;
  slug: string;
  name: string;
  address?: string | Record<string, unknown> | null;
  location?: Record<string, unknown> | null;
};

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getAddressRecord(address: RawChurch["address"]): Record<string, unknown> {
  return typeof address === "object" && address ? address : {};
}

function normalizeOptionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function normalizeAddress(address: RawChurch["address"]): string {
  if (!address) return "Endereço não informado";
  if (typeof address === "string") return address;

  const record = getAddressRecord(address);
  const explicit =
    record.formatted_address ||
    record.full_address ||
    record.display_name ||
    record.address ||
    record.street;

  if (typeof explicit === "string" && explicit.trim()) {
    return explicit.trim();
  }

  const parts = [record.street, record.number, record.neighborhood, record.city, record.state]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .map((part) => part.trim());

  return parts.length > 0 ? parts.join(", ") : "Endereço não informado";
}

export function normalizeLocation(location: RawChurch["location"]) {
  if (!location || typeof location !== "object") return null;

  const lat = toNumber(location.lat ?? location.latitude);
  const lng = toNumber(location.lng ?? location.longitude);

  if (lat === null || lng === null) return null;
  return { lat, lng };
}

export function mapPublicChurchListItem(church: RawChurch): PublicChurchListItem | null {
  const location = normalizeLocation(church.location);
  if (!location) return null;
  const addressRecord = getAddressRecord(church.address);

  return {
    id: church.id,
    slug: church.slug,
    name: church.name,
    denomination: church.denomination || "Comunidade",
    addressLine: normalizeAddress(church.address),
    city: normalizeOptionalText(addressRecord.city),
    state: normalizeOptionalText(addressRecord.state),
    neighborhood: normalizeOptionalText(addressRecord.neighborhood),
    location,
    description: church.description ?? null,
    isLive: Boolean(church.is_live),
    memberCount: Number(church.member_count || 0),
    plan: church.plan || "FREE",
    distanceKm: typeof church.distance === "number" ? church.distance : null,
    thumbnail: church.thumbnail ?? null,
  };
}

export function mapPublicChurchDetails(church: RawChurch): PublicChurchDetails {
  const addressRecord = getAddressRecord(church.address);
  return {
    id: church.id,
    slug: church.slug,
    name: church.name,
    denomination: church.denomination || "Comunidade",
    description: church.description ?? null,
    addressLine: normalizeAddress(church.address),
    city: normalizeOptionalText(addressRecord.city),
    state: normalizeOptionalText(addressRecord.state),
    neighborhood: normalizeOptionalText(addressRecord.neighborhood),
    address: addressRecord,
    location: normalizeLocation(church.location),
    contact: church.contact ?? {},
    schedule: Array.isArray(church.schedule) ? church.schedule : [],
    memberCount: Number(church.member_count || 0),
    plan: church.plan || "FREE",
    pixKey: church.pix_key ?? null,
    isLive: Boolean(church.is_live),
    donationsEnabled: Boolean(church.donations_enabled),
    thumbnail: church.thumbnail ?? null,
    photos: Array.isArray(church.photos) ? church.photos : [],
  };
}

export function extractContactValue(contact: Record<string, unknown>, key: string) {
  const value = contact[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
