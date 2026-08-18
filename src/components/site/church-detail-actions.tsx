"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { APP_CTA_URL } from "@/lib/site-config";
import { trackPublicEvent } from "@/lib/public-analytics";

type ChurchDetailActionsProps = {
  churchId: string;
  churchName: string;
  publicUrl: string;
  slug: string;
};

export function ChurchDetailActions({
  churchId,
  churchName,
  publicUrl,
  slug,
}: ChurchDetailActionsProps) {
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `Conheca ${churchName} no mapa publico do EclessGO: ${publicUrl}`,
  )}`;
  const path = `/comunidades/${slug}`;

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <a
        href={APP_CTA_URL}
        onClick={() =>
          void trackPublicEvent({
            churchId,
            eventType: "PUBLIC_CHURCH_APP_CLICK",
            source: "WEB_DETAIL",
            path,
            metadata: {
              target: "app",
            },
          })
        }
        className="inline-flex rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
      >
        Abrir no app
        <ArrowRight className="ml-2 h-4 w-4" />
      </a>
      <Link
        href="/cadastro-comunidade"
        className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/30 hover:text-white"
      >
        Cadastrar outra comunidade
      </Link>
      <a
        href={whatsappShareUrl}
        target="_blank"
        rel="noreferrer"
        onClick={() =>
          void trackPublicEvent({
            churchId,
            eventType: "PUBLIC_CHURCH_SHARE",
            source: "WEB_DETAIL",
            path,
            metadata: {
              target: "whatsapp",
            },
          })
        }
        className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/30 hover:text-white"
      >
        Compartilhar
      </a>
    </div>
  );
}
