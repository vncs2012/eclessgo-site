import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

import { CommunityGallery } from "@/components/site/community-gallery";
import { COMMUNITY_FOCUS } from "@/components/site/community-section";
import { CommunityShareButton } from "@/components/site/community-share-button";
import {
  PROFILE_IMAGE_DECODING,
  PROFILE_IMAGE_REFERRER_POLICY,
} from "@/lib/public-church-profile";
import { photoGradientIndex } from "@/lib/public-community-page";

type CommunityHeroProps = {
  churchId: string;
  slug: string;
  name: string;
  /** Tradição já traduzida. */
  tradition: string;
  neighborhood: string | null;
  cover: string | null;
  /** Capa + galeria sem repetição; o botão "Ver as N fotos" só existe se houver galeria. */
  photos: string[];
  hasGallery: boolean;
  isLive: boolean;
  /** https validado; sem ele o selo "Ao vivo" não é link. */
  liveUrl: string | null;
  publicUrl: string;
};

const BACK_HREF = "/comunidades";

/** Faixa de crumbs e "Voltar" (md+). No celular os botões ficam sobre a foto. */
export function CommunityTopBar({
  name,
  neighborhood,
}: {
  name: string;
  neighborhood: string | null;
}) {
  const t = useTranslations("communityPage");

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-1 max-md:hidden">
      <Link
        href={BACK_HREF}
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg font-semibold text-eg-strong hover:underline hover:underline-offset-4 ${COMMUNITY_FOCUS}`}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        {t("back")}
      </Link>
      <nav aria-label={t("breadcrumb.label")}>
        <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-eg-muted">
          <li>
            <Link href="/" className={`rounded-sm hover:underline ${COMMUNITY_FOCUS}`}>
              {t("breadcrumb.home")}
            </Link>
          </li>
          {neighborhood ? (
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true">/</span>
              <Link
                href={`/comunidades?q=${encodeURIComponent(neighborhood)}`}
                className={`rounded-sm hover:underline ${COMMUNITY_FOCUS}`}
              >
                {neighborhood}
              </Link>
            </li>
          ) : null}
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="font-semibold text-eg-strong">
              {name}
            </span>
          </li>
        </ol>
      </nav>
    </div>
  );
}

export function CommunityHero({
  churchId,
  slug,
  name,
  tradition,
  neighborhood,
  cover,
  photos,
  hasGallery,
  isLive,
  liveUrl,
  publicUrl,
}: CommunityHeroProps) {
  const t = useTranslations("communityPage");
  const kicker = [tradition, neighborhood].filter(Boolean).join(" · ");
  const gradient = `var(--eg-photo-${photoGradientIndex(slug)})`;

  const liveBadgeClass =
    "inline-flex items-center gap-1.5 rounded-full bg-eg-surface px-2.5 py-0.5 text-[11px] font-bold normal-case tracking-normal text-[var(--eg-feedback-danger-text)]";
  const liveBadge = (
    <>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {t("hero.live")}
    </>
  );

  return (
    <section
      aria-label={name}
      className="relative -mx-4 flex h-[260px] items-end overflow-hidden text-eg-on-photo sm:-mx-6 md:mx-0 md:h-[380px] md:rounded-3xl"
    >
      <div aria-hidden="true" className="absolute inset-0" style={{ background: gradient }} />
      {cover ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt=""
            decoding={PROFILE_IMAGE_DECODING}
            referrerPolicy={PROFILE_IMAGE_REFERRER_POLICY}
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </>
      ) : null}
      <div aria-hidden="true" className="absolute inset-0 bg-[image:var(--eg-photo-scrim)]" />

      {/* Celular: voltar à esquerda, fotos e compartilhar à direita, sobre a foto. */}
      <div className="absolute inset-x-3 top-3 z-10 flex items-start justify-between md:hidden">
        <Link
          href={BACK_HREF}
          aria-label={t("back")}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full bg-eg-surface text-eg-strong shadow-[var(--eg-shadow-md)] ${COMMUNITY_FOCUS}`}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="flex gap-2">
          {hasGallery ? <CommunityGallery name={name} photos={photos} variant="icon" /> : null}
          <CommunityShareButton
            churchId={churchId}
            slug={slug}
            name={name}
            url={publicUrl}
            variant="icon"
          />
        </div>
      </div>

      <div className="relative flex w-full flex-wrap items-end justify-between gap-x-5 gap-y-4 px-4 pb-11 pt-4 md:p-8">
        <div className="min-w-0 max-w-full">
          <p className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-bold uppercase tracking-[0.08em] md:text-[13px]">
            <span>{kicker}</span>
            {isLive ? (
              liveUrl ? (
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  aria-label={t("hero.liveAria", { name })}
                  className={`${liveBadgeClass} ${COMMUNITY_FOCUS}`}
                >
                  {liveBadge}
                </a>
              ) : (
                <span className={liveBadgeClass} role="img" aria-label={t("hero.liveStatic")}>
                  {liveBadge}
                </span>
              )
            ) : null}
          </p>
          <h1 className="font-display text-[32px] font-extrabold leading-[1.02] tracking-[-0.04em] text-eg-on-photo md:text-[40px] lg:text-[54px]">
            {name}
          </h1>
        </div>

        <div className="flex gap-2.5 max-md:hidden">
          {hasGallery ? <CommunityGallery name={name} photos={photos} variant="pill" /> : null}
          <CommunityShareButton
            churchId={churchId}
            slug={slug}
            name={name}
            url={publicUrl}
            variant="pill"
          />
        </div>
      </div>
    </section>
  );
}
