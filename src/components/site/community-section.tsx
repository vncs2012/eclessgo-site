import type { ReactNode } from "react";

import type { SectionId } from "@/lib/public-community-page";

/**
 * Casca comum das seções da página da Comunidade: âncora com id estável, título h2 e divisor.
 * Cada seção só é montada quando há dado, então `first:` remove o divisor da primeira visível.
 */
export function CommunitySection({
  id,
  title,
  titleId = `community-${id}-title`,
  children,
}: {
  id: SectionId;
  title: ReactNode;
  titleId?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className="scroll-mt-24 border-t border-eg-border py-8 first:border-t-0 first:pt-0 md:py-9"
    >
      <h2
        id={titleId}
        className="mb-4 font-display text-xl font-extrabold tracking-[-0.025em] text-eg-strong md:text-[26px]"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Foco visível para links e botões da página (outline-hidden: no Tailwind 4 outline-none anula o foco). */
export const COMMUNITY_FOCUS =
  "outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-eg-focus";
