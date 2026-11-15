import { MessageSquare, Navigation, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

import { COMMUNITY_FOCUS } from "@/components/site/community-section";
import { EXTERNAL_LINK_REL, EXTERNAL_LINK_TARGET } from "@/lib/public-church-profile";
import type { MessageAction } from "@/lib/public-community-page";
import { cn } from "@/lib/utils";

type CommunityActionButtonsProps = {
  directionsUrl: string | null;
  message: MessageAction | null;
  /** "summary": faixa-resumo (desktop); "bar": barra fixa do celular. */
  variant: "summary" | "bar";
};

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-colors";

/** "Como chegar" (Google Maps) e "Mandar mensagem" (WhatsApp, e-mail ou telefone, o que existir). */
export function CommunityActionButtons({ directionsUrl, message, variant }: CommunityActionButtonsProps) {
  const t = useTranslations("communityPage.summary");
  const bar = variant === "bar";
  const size = bar ? "min-h-[50px] flex-1 px-3 text-base" : "min-h-11 px-[18px] text-[14.5px]";
  const MessageIcon = message?.kind === "phone" ? Phone : MessageSquare;
  const messageLabel =
    message?.kind === "phone" ? t(bar ? "callShort" : "call") : t(bar ? "messageShort" : "message");

  return (
    <>
      {directionsUrl ? (
        <a
          href={directionsUrl}
          data-track="maps"
          target={EXTERNAL_LINK_TARGET}
          rel={EXTERNAL_LINK_REL}
          className={cn(
            BASE,
            size,
            "bg-eg-primary text-eg-inverse shadow-[var(--eg-shadow-md)] hover:bg-eg-primary-hover",
            COMMUNITY_FOCUS,
          )}
        >
          <Navigation className="h-[18px] w-[18px]" aria-hidden="true" />
          <span className="font-bold">{t("directions")}</span>
        </a>
      ) : null}
      {message ? (
        <a
          href={message.href}
          data-track={message.kind}
          {...(message.external ? { target: EXTERNAL_LINK_TARGET, rel: EXTERNAL_LINK_REL } : {})}
          className={cn(
            BASE,
            size,
            "border-[1.5px] border-eg-border-strong bg-transparent text-eg-strong hover:bg-eg-hover",
            COMMUNITY_FOCUS,
          )}
        >
          <MessageIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          <span className="font-bold">{messageLabel}</span>
        </a>
      ) : null}
    </>
  );
}

/** Barra fixa embaixo no celular (< md), respeitando a área segura. */
export function CommunityMobileBar({ directionsUrl, message }: Omit<CommunityActionButtonsProps, "variant">) {
  const t = useTranslations("communityPage.mobileBar");

  if (!directionsUrl && !message) return null;

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="fixed inset-x-0 bottom-0 z-30 flex gap-2.5 border-t border-eg-border bg-eg-surface px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:hidden"
    >
      <CommunityActionButtons directionsUrl={directionsUrl} message={message} variant="bar" />
    </div>
  );
}
