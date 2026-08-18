"use server";

import { cookies } from "next/headers";

import { LOCALE_COOKIE, defaultLocale, isLocale } from "./locales";

/**
 * Grava a locale escolhida no cookie `NEXT_LOCALE`. Lida pelo `getRequestConfig`
 * no proximo render (apos `router.refresh()` no cliente).
 */
export async function setLocale(value: string) {
  const locale = isLocale(value) ? value : defaultLocale;
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
