"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Menu, Plus, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType, SVGProps } from "react";

import { MobileMenuContent, useMenuDisclosure } from "@/components/site/site-header-client";

/** Altura da barra sem a área segura; quem fica acima dela soma `env(safe-area-inset-bottom)`. */
export const BOTTOM_NAV_HEIGHT = "4rem";

const ITEM =
  "flex min-h-11 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg text-eg-muted transition-colors hover:text-eg-strong aria-[current=page]:text-eg-primary-text aria-expanded:text-eg-primary-text focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-eg-focus";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

function ItemContent({ icon: IconComponent, label }: { icon: Icon; label: string }) {
  return (
    <>
      <IconComponent className="h-[22px] w-[22px]" aria-hidden="true" />
      <span className="text-xs font-semibold">{label}</span>
    </>
  );
}

/**
 * Navegação fixa embaixo (abaixo de md). Por enquanto só a Busca usa; nela o cabeçalho
 * some no celular e esta barra assume Buscar / Atividades / Cadastrar / Menu.
 */
export function SiteBottomNav() {
  const t = useTranslations("finder.bottomNav");
  const tHeader = useTranslations("header");
  const pathname = usePathname();
  const { open, setOpen, toggle, panelId, buttonRef } = useMenuDisclosure();

  const links: Array<{ href: string; label: string; icon: Icon }> = [
    { href: "/comunidades", label: t("search"), icon: Search },
    { href: "/atividades", label: t("activities"), icon: CalendarDays },
    { href: "/cadastro-comunidade", label: t("register"), icon: Plus },
  ];

  return (
    <div className="md:hidden">
      {open ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-[var(--eg-scrim)]"
        />
      ) : null}
      <div
        id={panelId}
        hidden={!open}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
        className="fixed inset-x-0 z-50 rounded-t-2xl border-t border-eg-border bg-eg-surface px-4 pb-4 pt-3 text-eg-text shadow-[var(--eg-shadow-lg)]"
        style={{ bottom: `calc(${BOTTOM_NAV_HEIGHT} + env(safe-area-inset-bottom))` }}
      >
        <MobileMenuContent />
      </div>
      <nav
        aria-label={t("label")}
        className="fixed inset-x-0 bottom-0 z-50 border-t border-eg-border bg-eg-surface pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="flex h-16 items-stretch gap-1 px-2">
          {links.map((link) => {
            const current = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <li key={link.href} className="flex flex-1">
                <Link href={link.href} aria-current={current ? "page" : undefined} className={ITEM}>
                  <ItemContent icon={link.icon} label={link.label} />
                </Link>
              </li>
            );
          })}
          <li className="flex flex-1">
            <button
              ref={buttonRef}
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={open ? tHeader("menuClose") : tHeader("menuOpen")}
              className={ITEM}
            >
              <ItemContent icon={open ? X : Menu} label={t("menu")} />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
