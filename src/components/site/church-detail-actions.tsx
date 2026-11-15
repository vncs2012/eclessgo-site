"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { SITE_URL } from "@/lib/site-config";
import { trackPublicEvent } from "@/lib/public-analytics";
import { buildCommunityUniversalPath, buildCommunityUniversalUrl } from "@/lib/release-paths";

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
  const t = useTranslations("finder");
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    t("actions.shareMessage", { name: churchName, url: publicUrl }),
  )}`;
  const path = buildCommunityUniversalPath(slug);
  const appUrl = buildCommunityUniversalUrl(slug, SITE_URL);

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <a
        href={appUrl}
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
        className="inline-flex rounded-full bg-eg-primary px-5 py-3 text-sm font-semibold text-eg-inverse transition hover:bg-eg-primary-hover"
      >
        {t("actions.openApp")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </a>
      <Link
        href="/cadastro-comunidade"
        className="inline-flex rounded-full border border-eg-border px-5 py-3 text-sm font-semibold text-eg-strong transition hover:bg-eg-hover"
      >
        {t("actions.registerAnother")}
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
        className="inline-flex rounded-full border border-eg-border px-5 py-3 text-sm font-semibold text-eg-strong transition hover:bg-eg-hover"
      >
        {t("actions.share")}
      </a>
    </div>
  );
}
