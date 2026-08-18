import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { LOCALE_COOKIE, defaultLocale, isLocale } from "./locales";

/**
 * Configuracao de i18n sem roteamento por URL (`[locale]/`).
 *
 * A locale vem do cookie `NEXT_LOCALE` (gravado pela server action
 * `setLocale`), com fallback para `defaultLocale` (pt-BR). Ler `cookies()` aqui
 * torna as paginas que usam traducao dinamicas — tradeoff aceito para permitir
 * a troca de idioma em runtime sem reestruturar para rotas `[locale]/`.
 */
export default getRequestConfig(async () => {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = stored && isLocale(stored) ? stored : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
