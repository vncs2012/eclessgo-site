"use client";

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";

import { createPixQrMatrix } from "@/lib/pix-qr";
import { COMMUNITY_FOCUS } from "@/components/site/community-section";
import { trackPublicEvent } from "@/lib/public-analytics";
import { cn } from "@/lib/utils";

type PixKeyDonationCardProps = {
  churchId: string;
  churchName: string;
  slug: string;
  pixKey: string;
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

function PixQrSvg({ matrix, label }: { matrix: ReturnType<typeof createPixQrMatrix>; label: string }) {
  const quietZone = 4;
  const viewBox = `${-quietZone} ${-quietZone} ${matrix.size + quietZone * 2} ${matrix.size + quietZone * 2}`;

  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-label={label}
      className="h-full w-full"
      shapeRendering="crispEdges"
    >
      <rect x={-quietZone} y={-quietZone} width={matrix.size + quietZone * 2} height={matrix.size + quietZone * 2} fill="white" />
      {matrix.modules.map((row, rowIndex) =>
        row.map((isDark, columnIndex) =>
          isDark ? <rect key={`${rowIndex}-${columnIndex}`} x={columnIndex} y={rowIndex} width="1" height="1" fill="black" /> : null,
        ),
      )}
    </svg>
  );
}

export function PixKeyDonationCard({ churchId, churchName, slug, pixKey }: PixKeyDonationCardProps) {
  const t = useTranslations("communityPage.pix");
  const titleId = useId();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const qrResult = useMemo(() => {
    try {
      return { matrix: createPixQrMatrix(pixKey), error: false };
    } catch {
      return { matrix: null, error: true };
    }
  }, [pixKey]);
  const matrix = qrResult.matrix;

  const handleCopy = async () => {
    try {
      setCopyError(false);
      await copyText(pixKey);
      setCopied(true);
      void trackPublicEvent({
        churchId,
        eventType: "PUBLIC_CHURCH_CONTACT_CLICK",
        source: "WEB_DETAIL",
        path: `/comunidades/${slug}`,
        metadata: { channel: "pix-key-copy" },
      });
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className="grid max-w-[640px] items-center gap-5 rounded-[18px] border border-eg-border bg-eg-surface p-5 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-6"
    >
      {matrix ? (
        <div className="w-[132px] max-w-full rounded-xl bg-white p-2 shadow-[var(--eg-shadow-1)] max-sm:mx-auto">
          <PixQrSvg matrix={matrix} label={t("qrLabel", { name: churchName })} />
        </div>
      ) : (
        <p className="rounded-xl bg-eg-warm-soft p-3 text-xs leading-5 text-eg-strong sm:col-span-2">
          {t("qrUnavailable")}
        </p>
      )}

      <div className="min-w-0">
        <h3 id={titleId} className="font-display text-base font-extrabold text-eg-strong">
          {t("title", { name: churchName })}
        </h3>
        <p className="mt-1 text-sm text-eg-muted">{t("description")}</p>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-eg-muted">{t("key")}</p>
        <code className="mt-1 block break-all rounded-[10px] bg-eg-subtle px-3 py-2.5 font-mono text-sm text-eg-strong">
          {pixKey}
        </code>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className={cn(
            "mt-3 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-eg-border-strong px-[18px] text-sm font-bold text-eg-strong transition-colors hover:bg-eg-hover",
            COMMUNITY_FOCUS,
          )}
        >
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          <span className="font-bold">{copied ? t("copied") : t("copy")}</span>
        </button>
        <p role="status" aria-live="polite" className={copyError ? "mt-2 text-xs text-eg-warm" : "sr-only"}>
          {copyError ? t("copyError") : ""}
        </p>
        <p className="mt-3 text-xs leading-5 text-eg-muted">{t("liability")}</p>
      </div>
      {qrResult.error ? <span className="sr-only">{t("qrError")}</span> : null}
    </div>
  );
}
