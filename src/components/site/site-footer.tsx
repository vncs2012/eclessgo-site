import Link from "next/link";
import { MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ConsentPreferences } from "@/components/site/consent-preferences";
import { LocaleList } from "@/components/site/locale-switcher";
import { APP_CTA_URL, PANEL_URL } from "@/lib/site-config";

const LINK_CLASS =
  "inline-flex min-h-9 items-center rounded-md text-sm text-eg-text transition-colors hover:text-eg-strong hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-eg-focus";
const TITLE_CLASS = "mb-2 text-xs font-semibold uppercase tracking-[0.07em] text-eg-muted";

export async function SiteFooter() {
  const t = await getTranslations("footer");

  return (
    <footer className="relative z-10 border-t border-eg-border bg-eg-alt text-eg-text">
      <div className="mx-auto grid w-full max-w-[var(--eg-content-max)] grid-cols-2 gap-x-6 gap-y-8 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-11 sm:grid-cols-3 sm:px-6 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:gap-x-7 lg:px-10">
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <Link
            href="/"
            aria-label={t("homeLabel")}
            className="mb-5 inline-flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-eg-focus"
          >
            <span
              aria-hidden="true"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[image:var(--eg-gradient-logo)] text-white"
            >
              <MapPin className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-eg-strong">
              EclessGO
            </span>
          </Link>
          <p className="max-w-[16ch] font-display text-[clamp(1.875rem,4vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.035em] text-eg-strong">
            {t("quote")}
          </p>
        </div>

        <nav aria-labelledby="footer-explore">
          <h2 id="footer-explore" className={TITLE_CLASS}>
            {t("explore.title")}
          </h2>
          <ul>
            <li>
              <Link href="/" className={LINK_CLASS}>
                {t("explore.home")}
              </Link>
            </li>
            <li>
              <Link href="/comunidades" className={LINK_CLASS}>
                {t("explore.communities")}
              </Link>
            </li>
            <li>
              <Link href="/atividades" className={LINK_CLASS}>
                {t("explore.activities")}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-operation">
          <h2 id="footer-operation" className={TITLE_CLASS}>
            {t("operation.title")}
          </h2>
          <ul>
            <li>
              <a href={PANEL_URL} className={LINK_CLASS}>
                {t("operation.panel")}
              </a>
            </li>
            <li>
              <a href={APP_CTA_URL} className={LINK_CLASS}>
                {t("operation.app")}
              </a>
            </li>
            <li>
              <Link href="/cadastro-comunidade" className={LINK_CLASS}>
                {t("operation.register")}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="footer-legal">
          <h2 id="footer-legal" className={TITLE_CLASS}>
            {t("legal.title")}
          </h2>
          <ul>
            <li>
              <Link href="/termos" className={LINK_CLASS}>
                {t("legal.terms")}
              </Link>
            </li>
            <li>
              <Link href="/privacidade" className={LINK_CLASS}>
                {t("legal.privacy")}
              </Link>
            </li>
            <li className="eg-footer-consent">
              <ConsentPreferences />
            </li>
          </ul>
        </nav>

        <div className="col-span-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-eg-border pt-4 text-[13px] text-eg-muted sm:col-span-3 lg:col-span-4">
          <p>{t("copyright")}</p>
          <LocaleList />
        </div>
      </div>
    </footer>
  );
}
