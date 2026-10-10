/**
 * Regras puras do perfil público da igreja: atributos, redes e mídia.
 *
 * Espelham as regras de escrita da API (church_profile_validators.py), para que
 * dados legados inválidos sejam omitidos sem erro. Não importa `next` nem `react`.
 */

export const PUBLIC_FEATURES_MAX = 20;
export const PUBLIC_GALLERY_MAX = 10;
export const NETWORK_KEYS = ["website", "instagram", "facebook", "youtube"] as const;
export type NetworkKey = (typeof NETWORK_KEYS)[number];

/** Atributos de link e de imagem do perfil público; os componentes os usam e os testes os provam. */
export const EXTERNAL_LINK_REL = "noopener noreferrer nofollow";
export const EXTERNAL_LINK_TARGET = "_blank";
export const PROFILE_IMAGE_LOADING = "lazy";
export const PROFILE_IMAGE_DECODING = "async";
export const PROFILE_IMAGE_REFERRER_POLICY = "no-referrer";

export type PublicChurchProfile = {
  features: string[];
  links: Array<{ key: NetworkKey; url: string }>;
  logo: string | null;
  cover: string | null;
  gallery: string[];
};

type PhotoType = "logo" | "cover" | "gallery";
type PublicPhoto = { type: PhotoType; url: string };

const URL_MAX_LENGTH = 500;
const HTTPS_PREFIX = "https://";
const HTTPS_PREFIX_RE = /^https:\/\//i;
const FORBIDDEN_CHARS_RE = /[\s\x00-\x1f\x7f\\]/;
const AUTHORITY_END_RE = /[/?#]/;
const DNS_HOST_RE =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/;
const IPV4_RE = /^\d+(\.\d+){3}$/;
const PHOTO_TYPES: readonly string[] = ["logo", "cover", "gallery"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPhotoType(value: string): value is PhotoType {
  return PHOTO_TYPES.includes(value);
}

function codePointLength(value: string): number {
  return Array.from(value).length;
}

/**
 * Devolve o host em minúsculas quando a URL passa nas regras estruturais da API:
 * até 500 code points, sem espaço, controle ou barra invertida, esquema https,
 * autoridade sem credenciais nem porta e host DNS ASCII. Caso contrário, null.
 */
function httpsHost(value: string): string | null {
  if (codePointLength(value) > URL_MAX_LENGTH) return null;
  if (FORBIDDEN_CHARS_RE.test(value)) return null;
  if (!HTTPS_PREFIX_RE.test(value)) return null;

  const rest = value.slice(HTTPS_PREFIX.length);
  const end = rest.search(AUTHORITY_END_RE);
  const authority = end === -1 ? rest : rest.slice(0, end);

  if (authority === "" || authority.includes("@") || authority.includes(":")) return null;

  const host = authority.toLowerCase();

  return DNS_HOST_RE.test(host) ? host : null;
}

function isDomainOrSubdomain(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function hasNumericLastLabel(host: string): boolean {
  const lastLabel = host.split(".").pop() ?? "";

  return /^\d+$/.test(lastLabel) || lastLabel.startsWith("0x");
}

function isNetworkHostAllowed(key: NetworkKey, host: string): boolean {
  if (key === "instagram") return isDomainOrSubdomain(host, "instagram.com");
  if (key === "facebook") return isDomainOrSubdomain(host, "facebook.com");
  if (key === "youtube") {
    return isDomainOrSubdomain(host, "youtube.com") || host === "youtu.be";
  }
  if (key === "website") {
    return (
      host.includes(".") &&
      host !== "localhost" &&
      !IPV4_RE.test(host) &&
      !hasNumericLastLabel(host)
    );
  }

  return false;
}

/** Vale para site e redes sociais: mesmas regras de formato e de host da API. */
export function isValidNetworkUrl(key: NetworkKey, value: unknown): value is string {
  if (typeof value !== "string") return false;

  const host = httpsHost(value);

  return host !== null && isNetworkHostAllowed(key, host);
}

function httpsOriginOf(mediaOrigin: string | undefined): string | null {
  if (typeof mediaOrigin !== "string" || mediaOrigin === "") return null;

  try {
    const parsed = new URL(mediaOrigin);

    return parsed.protocol === "https:" ? parsed.origin : null;
  } catch {
    return null;
  }
}

/** Foto só é renderizada quando tem a mesma origem https de NEXT_PUBLIC_MEDIA_ORIGIN. */
export function isAllowedMediaUrl(url: unknown, mediaOrigin: string | undefined): url is string {
  if (typeof url !== "string") return false;

  const expectedOrigin = httpsOriginOf(mediaOrigin);

  if (expectedOrigin === null || httpsHost(url) === null) return false;

  try {
    return new URL(url).origin === expectedOrigin;
  } catch {
    return false;
  }
}

function publicFeatures(features: unknown): string[] {
  if (!Array.isArray(features)) return [];

  const result: string[] = [];

  for (const item of features) {
    if (result.length >= PUBLIC_FEATURES_MAX) break;
    if (typeof item !== "string") continue;

    const trimmed = item.trim();

    if (trimmed !== "") result.push(trimmed);
  }

  return result;
}

function publicLinks(contact: unknown): PublicChurchProfile["links"] {
  if (!isRecord(contact)) return [];

  const links: PublicChurchProfile["links"] = [];

  for (const key of NETWORK_KEYS) {
    const value = contact[key];

    if (isValidNetworkUrl(key, value)) links.push({ key, url: value });
  }

  return links;
}

function allowedPhotos(photos: unknown, mediaOrigin: string | undefined): PublicPhoto[] {
  if (!Array.isArray(photos)) return [];

  const result: PublicPhoto[] = [];

  for (const entry of photos) {
    if (!isRecord(entry)) continue;

    const type = entry.type;
    const url = entry.url;

    if (typeof type !== "string" || !isPhotoType(type)) continue;
    if (!isAllowedMediaUrl(url, mediaOrigin)) continue;

    result.push({ type, url });
  }

  return result;
}

function firstPhotoUrl(photos: PublicPhoto[], type: PhotoType): string | null {
  const found = photos.find((photo) => photo.type === type);

  return found ? found.url : null;
}

export function buildPublicChurchProfile(input: {
  features: unknown;
  contact: unknown;
  thumbnail: unknown;
  photos: unknown;
  mediaOrigin: string | undefined;
}): PublicChurchProfile {
  const { features, contact, thumbnail, photos, mediaOrigin } = input;
  const allowed = allowedPhotos(photos, mediaOrigin);

  const logo = isAllowedMediaUrl(thumbnail, mediaOrigin)
    ? thumbnail
    : firstPhotoUrl(allowed, "logo");

  const gallery = allowed
    .filter((photo) => photo.type === "gallery")
    .map((photo) => photo.url)
    .slice(0, PUBLIC_GALLERY_MAX);

  return {
    features: publicFeatures(features),
    links: publicLinks(contact),
    logo,
    cover: firstPhotoUrl(allowed, "cover"),
    gallery,
  };
}
