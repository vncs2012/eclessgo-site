"use client";

import type { ReactNode } from "react";

import { trackPublicEvent } from "@/lib/public-analytics";

/**
 * Conta cliques nos canais de contato e de rota sem transformar cada seção em componente de
 * cliente: qualquer `<a data-track="canal">` dentro dele vira um PUBLIC_CHURCH_CONTACT_CLICK.
 */
export function CommunityClickTracker({
  churchId,
  slug,
  children,
}: {
  churchId: string;
  slug: string;
  children: ReactNode;
}) {
  return (
    <div
      className="contents"
      onClick={(event) => {
        const link = (event.target as HTMLElement).closest<HTMLElement>("a[data-track]");
        if (!link) return;
        void trackPublicEvent({
          churchId,
          eventType: "PUBLIC_CHURCH_CONTACT_CLICK",
          source: "WEB_DETAIL",
          path: `/comunidades/${slug}`,
          metadata: { channel: link.dataset.track },
        });
      }}
    >
      {children}
    </div>
  );
}
