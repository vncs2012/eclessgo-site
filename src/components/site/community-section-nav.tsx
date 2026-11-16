"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

import { COMMUNITY_FOCUS } from "@/components/site/community-section";
import { SuggestCorrection } from "@/components/site/community-suggest";
import { cn } from "@/lib/utils";

type NavSection = { id: string; label: string };

type CommunitySectionNavProps = {
  sections: NavSection[];
  ariaLabel: string;
  /** "Atualizada pela comunidade em dd/mm/aaaa"; nulo quando a API não informa a data. */
  updatedLabel: string | null;
  /** Slug da comunidade: com ele "Sugerir correção" abre o diálogo; nulo, o botão não aparece. */
  suggestSlug: string | null;
  suggestLabel: string;
};

/** Seção ativa: a última cujo topo já passou da faixa logo abaixo do cabeçalho fixo. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  const key = ids.join("|");

  useEffect(() => {
    const list = key ? key.split("|") : [];
    let frame = 0;
    function update() {
      frame = 0;
      let current = list[0] ?? "";
      for (const id of list) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= 120) current = id;
      }
      setActive(current);
    }
    function onScroll() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [key]);

  return active;
}

export function CommunityUpdateStamp({
  updatedLabel,
  suggestSlug,
  suggestLabel,
  className,
}: Pick<CommunitySectionNavProps, "updatedLabel" | "suggestSlug" | "suggestLabel"> & {
  className?: string;
}) {
  if (!updatedLabel && !suggestSlug) return null;

  return (
    <div className={cn("grid grid-cols-[16px_minmax(0,1fr)] items-start gap-x-2 gap-y-1 text-[13px] leading-snug text-eg-muted", className)}>
      {updatedLabel ? (
        <>
          <Check className="mt-0.5 h-4 w-4 text-[var(--eg-feedback-success-text)]" aria-hidden="true" />
          <p>{updatedLabel}</p>
        </>
      ) : null}
      {suggestSlug ? (
        <SuggestCorrection
          slug={suggestSlug}
          label={suggestLabel}
          className="col-start-2 min-h-8 justify-self-start rounded-sm text-left underline underline-offset-4 hover:text-eg-strong"
        />
      ) : null}
    </div>
  );
}

/**
 * Menu das seções que existem. lg+: coluna fixa ao lado (sticky) com a data de atualização;
 * abaixo de lg: chips roláveis na horizontal.
 */
export function CommunitySectionNav({
  sections,
  ariaLabel,
  updatedLabel,
  suggestSlug,
  suggestLabel,
}: CommunitySectionNavProps) {
  const active = useActiveSection(sections.map((section) => section.id));

  if (sections.length === 0) return null;

  return (
    <>
      <nav aria-label={ariaLabel} className="sticky top-24 hidden self-start lg:block">
        <ul className="border-l-2 border-eg-border">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active === section.id ? "location" : undefined}
                className={cn(
                  "-ml-0.5 flex min-h-[42px] items-center rounded-r-md border-l-2 border-transparent pl-4 text-[15px] font-semibold text-eg-muted transition-colors hover:text-eg-strong",
                  "aria-[current=location]:border-eg-primary aria-[current=location]:text-eg-strong",
                  COMMUNITY_FOCUS,
                )}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
        <CommunityUpdateStamp
          updatedLabel={updatedLabel}
          suggestSlug={suggestSlug}
          suggestLabel={suggestLabel}
          className="mt-5"
        />
      </nav>

      <nav aria-label={ariaLabel} className="lg:hidden">
        <ul className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((section) => (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                aria-current={active === section.id ? "location" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center whitespace-nowrap rounded-full border border-eg-border bg-eg-surface px-3.5 text-[13px] font-semibold text-eg-text transition-colors hover:bg-eg-hover",
                  "aria-[current=location]:border-eg-nav aria-[current=location]:bg-eg-nav aria-[current=location]:text-[var(--eg-text-nav-strong)]",
                  COMMUNITY_FOCUS,
                )}
              >
                {section.label}
              </a>
            </li>
          ))}
          {suggestSlug ? (
            <li className="shrink-0">
              <SuggestCorrection
                slug={suggestSlug}
                label={suggestLabel}
                className="inline-flex min-h-10 items-center whitespace-nowrap rounded-full border border-dashed border-eg-border-strong bg-transparent px-3.5 text-eg-muted transition-colors hover:bg-eg-hover hover:text-eg-strong"
                labelClassName="text-[13px] font-semibold"
              />
            </li>
          ) : null}
        </ul>
      </nav>
    </>
  );
}
