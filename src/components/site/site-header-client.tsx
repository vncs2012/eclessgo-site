"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { THEME_COOKIE, type Theme } from "@/components/site/theme";

/** Foco visível: índigo/lilás sobre fundos sólidos, branco sobre a foto da Home. */
export const HEADER_FOCUS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eg-focus group-data-[variant=overlay]/header:focus-visible:outline-white";

/** Botão de ícone/texto discreto do cabeçalho (idioma, tema, menu). */
export const HEADER_ICON_BUTTON = `inline-flex h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-eg-text transition-colors duration-150 hover:bg-eg-hover group-data-[variant=overlay]/header:text-white group-data-[variant=overlay]/header:hover:bg-white/15 ${HEADER_FOCUS}`;

/** O painel do menu é sempre sólido, então o foco não usa a variante sobre a foto. */
const MENU_FOCUS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eg-focus";

type NavLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "bar" | "menu";
};

export function NavLink({ href, children, variant = "bar" }: NavLinkProps) {
  const pathname = usePathname();
  const isCurrent = !href.includes("#") && (pathname === href || pathname.startsWith(`${href}/`));

  const base =
    variant === "bar"
      ? "inline-flex h-11 items-center whitespace-nowrap rounded-lg px-2 text-sm font-semibold xl:px-3 transition-colors duration-150 text-eg-muted hover:text-eg-strong group-data-[variant=overlay]/header:text-white group-data-[variant=overlay]/header:hover:bg-white/15 aria-[current=page]:text-eg-strong aria-[current=page]:shadow-[inset_0_-3px_0_var(--eg-action-focus)] group-data-[variant=overlay]/header:aria-[current=page]:shadow-[inset_0_-2px_0_#fff]"
      : "flex min-h-12 items-center rounded-lg px-4 text-base font-semibold text-eg-strong transition-colors hover:bg-eg-hover aria-[current=page]:bg-eg-primary-soft aria-[current=page]:text-eg-primary-text";

  return (
    <Link
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      className={`${base} ${variant === "bar" ? HEADER_FOCUS : MENU_FOCUS}`}
    >
      {children}
    </Link>
  );
}

export function ThemeToggle({ initialTheme }: { initialTheme: Theme }) {
  const t = useTranslations("header");
  const [theme, setTheme] = useState<Theme>(initialTheme);

  function handleToggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    setTheme(next);
  }

  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={theme === "dark" ? t("themeToLight") : t("themeToDark")}
      className={HEADER_ICON_BUTTON}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  );
}

/**
 * Abre/fecha um menu: fecha ao navegar e com Escape (devolvendo o foco ao botão).
 * Usado pelo menu do cabeçalho e pela barra inferior da Busca no celular.
 */
export function useMenuDisclosure() {
  const pathname = usePathname();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fecha ao navegar (ajuste de estado durante o render, sem efeito).
  if (open && openedAt !== pathname) {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function toggle() {
    setOpenedAt(pathname);
    setOpen((current) => !current);
  }

  return { open, setOpen, toggle, panelId, buttonRef };
}

/** Menu compacto (abaixo de lg): painel sob o cabeçalho, sem rolagem lateral. */
export function MobileMenu({ children }: { children: ReactNode }) {
  const t = useTranslations("header");
  const { open, setOpen, toggle, panelId, buttonRef } = useMenuDisclosure();

  const Icon = open ? X : Menu;

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t("menuClose") : t("menuOpen")}
        className={HEADER_ICON_BUTTON}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </button>
      <div
        id={panelId}
        hidden={!open}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
        className="absolute inset-x-0 top-full border-b border-eg-border bg-eg-surface px-4 pb-5 pt-2 text-eg-text shadow-[var(--eg-shadow-md)] sm:px-6"
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Conteúdo do menu compacto (mesmos links e CTA que o cabeçalho passa ao MobileMenu),
 * para quem renderiza no cliente, como a barra inferior da Busca.
 */
export function MobileMenuContent() {
  const t = useTranslations("header");
  const links = [
    { href: "/comunidades", label: t("nav.communities") },
    { href: "/atividades", label: t("nav.activities") },
    { href: "/#como-funciona", label: t("nav.howItWorks") },
    { href: "/#para-comunidades", label: t("nav.forCommunities") },
  ];

  return (
    <>
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
        href="/cadastro-comunidade"
        className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-eg-primary px-5 text-base font-bold text-eg-inverse transition-colors hover:bg-eg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eg-focus"
      >
        {t("registerCta")}
      </Link>
    </>
  );
}
