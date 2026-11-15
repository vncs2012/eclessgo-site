import Link from "next/link";
import { MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { LocaleSwitcher } from "@/components/site/locale-switcher";
import {
  HEADER_FOCUS,
  MobileMenu,
  NavLink,
  ThemeToggle,
} from "@/components/site/site-header-client";
import { THEME_COOKIE, resolveTheme } from "@/components/site/theme";

type SiteHeaderProps = {
  /**
   * "solid": barra sólida, fixa no topo (todas as páginas, exceto a Home).
   * "overlay": transparente, texto claro, posicionada sobre a foto de capa da Home
   * (o contêiner da foto precisa ser `relative` e ter o escurecimento aplicado).
   * "minimal": só o logo, o rótulo "Cadastro gratuito" e "Sair" (volta para a Home, sem
   * confirmação). Usado no Cadastro, para a pessoa não se distrair no meio do formulário.
   */
  variant?: "solid" | "overlay" | "minimal";
  /**
   * Cabeçalho compacto da Busca: campo de busca no lugar dos links de navegação
   * (visível a partir de lg; no celular a busca fica na própria página).
   */
  search?: ReactNode;
};

const REGISTER_HREF = "/cadastro-comunidade";

export async function SiteHeader({ variant = "solid", search }: SiteHeaderProps) {
  const t = await getTranslations("header");
  const theme = resolveTheme((await cookies()).get(THEME_COOKIE)?.value);
  const isOverlay = variant === "overlay";
  const isMinimal = variant === "minimal";

  const links = [
    { href: "/comunidades", label: t("nav.communities") },
    { href: "/atividades", label: t("nav.activities") },
    { href: "/#como-funciona", label: t("nav.howItWorks") },
    { href: "/#para-comunidades", label: t("nav.forCommunities") },
  ];

  return (
    <header
      data-variant={variant}
      className={`group/header z-40 w-full ${
        isOverlay
          ? "absolute inset-x-0 top-0 bg-transparent text-white"
          : "sticky top-0 border-b border-eg-border bg-eg-surface text-eg-text"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-[var(--eg-content-max)] items-center gap-3 px-4 sm:px-6 lg:gap-3 lg:px-6 xl:gap-5 xl:px-10 ${
          isOverlay ? "h-16 lg:h-20" : "h-16"
        }`}
      >
        <Link
          href="/"
          aria-label={t("homeLabel")}
          className={`mr-auto inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg lg:mr-0 ${HEADER_FOCUS}`}
        >
          <span
            aria-hidden="true"
            className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[image:var(--eg-gradient-logo)] text-white"
          >
            <MapPin className="h-[18px] w-[18px]" />
          </span>
          <span
            className={`font-display text-xl font-extrabold tracking-tight ${
              isOverlay ? "text-white" : "text-eg-strong"
            }`}
          >
            EclessGO
          </span>
        </Link>

        {isMinimal ? null : search ? (
          <div className="mx-auto hidden min-w-0 max-w-xl flex-1 lg:block">{search}</div>
        ) : (
          <nav aria-label={t("mainNav")} className="mx-auto hidden lg:block">
            <ul className="flex items-center gap-0.5">
              {links.map((link) => (
                <li key={link.href}>
                  <NavLink href={link.href}>{link.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {isMinimal ? (
          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <span className="text-sm text-eg-muted">{t("minimalLabel")}</span>
            <Link
              href="/"
              className={`inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-eg-border-strong px-5 text-sm font-bold text-eg-strong transition-colors hover:bg-eg-hover ${HEADER_FOCUS}`}
            >
              {t("minimalExit")}
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-1 sm:gap-1.5">
            <LocaleSwitcher />
            <ThemeToggle initialTheme={theme} />
            <Link
              href={REGISTER_HREF}
              className={`hidden h-11 items-center justify-center whitespace-nowrap px-4 text-sm font-bold sm:inline-flex ${HEADER_FOCUS} ${
                search
                  ? "rounded-lg px-2 text-eg-strong underline underline-offset-4 group-data-[variant=overlay]/header:text-white"
                  : "rounded-full bg-eg-primary text-eg-inverse shadow-[var(--eg-shadow-md)] transition-colors hover:bg-eg-primary-hover"
              }`}
            >
              {t("registerCta")}
            </Link>
            <MobileMenu>
              <nav aria-label={t("mainNav")}>
                <ul className="grid gap-0.5">
                  {links.map((link) => (
                    <li key={link.href}>
                      <NavLink href={link.href} variant="menu">
                        {link.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
              <Link
                href={REGISTER_HREF}
                className={`mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-eg-primary px-5 text-base font-bold text-eg-inverse transition-colors hover:bg-eg-primary-hover focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-eg-focus`}
              >
                {t("registerCta")}
              </Link>
            </MobileMenu>
          </div>
        )}
      </div>
    </header>
  );
}
