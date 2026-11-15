"use client";

import { useEffect, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { COMMUNITY_FOCUS } from "@/components/site/community-section";
import { trackPublicEvent } from "@/lib/public-analytics";
import { cn } from "@/lib/utils";

type CommunityShareButtonProps = {
  churchId: string;
  slug: string;
  name: string;
  url: string;
  /** "pill": botão com texto sobre a foto (md+); "icon": botão redondo do celular. */
  variant: "pill" | "icon";
};

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard indisponível");
}

/** Web Share API quando existe; senão copia o link. */
export function CommunityShareButton({ churchId, slug, name, url, variant }: CommunityShareButtonProps) {
  const t = useTranslations("communityPage.hero");
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  function track(target: "native" | "copy") {
    void trackPublicEvent({
      churchId,
      eventType: "PUBLIC_CHURCH_SHARE",
      source: "WEB_DETAIL",
      path: `/comunidades/${slug}`,
      metadata: { target },
    });
  }

  async function handleClick() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: name, text: t("shareText", { name }), url });
        track("native");
        return;
      } catch (error) {
        // Fechar a folha de compartilhamento não é erro; qualquer outra falha cai na cópia.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await copyText(url);
      track("copy");
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Sem área de transferência não há o que mostrar; o link segue na barra de endereço.
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        aria-label={variant === "icon" ? t("share") : undefined}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center gap-2 font-semibold transition-colors",
          variant === "icon"
            ? "h-11 w-11 rounded-full bg-eg-surface text-eg-strong shadow-[var(--eg-shadow-md)] hover:bg-eg-hover"
            : "min-h-11 rounded-full border border-white/80 bg-[rgb(14_20_48/0.4)] px-4 text-sm text-white backdrop-blur-sm hover:bg-[rgb(14_20_48/0.6)]",
          COMMUNITY_FOCUS,
        )}
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        {variant === "pill" ? <span className="font-semibold">{t("share")}</span> : null}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? t("shareCopied") : ""}
      </span>
    </>
  );
}
