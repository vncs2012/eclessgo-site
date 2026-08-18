import type { Coordinates } from "@/types/public";

export const DEFAULT_API_BASE_URL =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001").replace(/\/+$/, "");
export const PANEL_URL = process.env.NEXT_PUBLIC_PANEL_URL || "http://localhost:3000";
export const APP_CTA_URL = process.env.NEXT_PUBLIC_APP_CTA_URL || "/#app";

export const GOIANIA_CENTER: Coordinates = {
  lat: -16.686891,
  lng: -49.264788,
};
