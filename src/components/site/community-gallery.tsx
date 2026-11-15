"use client";

import { useId, useRef } from "react";
import { Images, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { COMMUNITY_FOCUS } from "@/components/site/community-section";
import {
  PROFILE_IMAGE_DECODING,
  PROFILE_IMAGE_LOADING,
  PROFILE_IMAGE_REFERRER_POLICY,
} from "@/lib/public-church-profile";
import { cn } from "@/lib/utils";

type CommunityGalleryProps = {
  name: string;
  photos: string[];
  variant: "pill" | "icon";
};

/** "Ver as N fotos": abre as imagens num <dialog> nativo (foco preso, Esc e clique fora fecham). */
export function CommunityGallery({ name, photos, variant }: CommunityGalleryProps) {
  const t = useTranslations("communityPage.hero");
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  if (photos.length === 0) return null;

  const label = t("seePhotos", { count: photos.length });

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        aria-label={variant === "icon" ? label : undefined}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center gap-2 font-semibold transition-colors",
          variant === "icon"
            ? "h-11 w-11 rounded-full bg-eg-surface text-eg-strong shadow-[var(--eg-shadow-md)] hover:bg-eg-hover"
            : "min-h-11 rounded-full border border-white/80 bg-[rgb(14_20_48/0.4)] px-4 text-sm text-white backdrop-blur-sm hover:bg-[rgb(14_20_48/0.6)]",
          COMMUNITY_FOCUS,
        )}
      >
        <Images className="h-4 w-4" aria-hidden="true" />
        {variant === "pill" ? <span className="font-semibold">{label}</span> : null}
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto max-h-[92vh] w-[min(68rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-eg-border bg-eg-surface p-0 text-eg-text backdrop:bg-[var(--eg-scrim)]"
      >
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              id={titleId}
              className="font-display text-lg font-extrabold text-eg-strong"
            >
              {t("photosTitle", { name })}
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label={t("close")}
              className={cn(
                "inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-eg-strong hover:bg-eg-hover",
                COMMUNITY_FOCUS,
              )}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((url, index) => (
              <li key={`${index}-${url}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={t("galleryAlt", { index: index + 1, name })}
                  loading={PROFILE_IMAGE_LOADING}
                  decoding={PROFILE_IMAGE_DECODING}
                  referrerPolicy={PROFILE_IMAGE_REFERRER_POLICY}
                  className="aspect-[4/3] w-full rounded-xl object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}
