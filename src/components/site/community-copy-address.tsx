"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { COMMUNITY_FOCUS } from "@/components/site/community-section";
import { cn } from "@/lib/utils";

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

export function CommunityCopyAddress({ address }: { address: string }) {
  const t = useTranslations("communityPage.directions");
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  async function handleCopy() {
    try {
      await copyText(address);
      setState("copied");
    } catch {
      setState("error");
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2600);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleCopy()}
        className={cn(
          "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-sm text-sm font-semibold text-eg-primary-text underline underline-offset-4 hover:text-eg-strong",
          COMMUNITY_FOCUS,
        )}
      >
        {state === "copied" ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
        <span className="font-semibold">{state === "copied" ? t("copied") : t("copy")}</span>
      </button>
      <p role="status" aria-live="polite" className={state === "error" ? "text-xs text-eg-warm" : "sr-only"}>
        {state === "error" ? t("copyError") : ""}
      </p>
    </div>
  );
}
