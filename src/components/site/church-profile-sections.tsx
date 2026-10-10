import { useTranslations } from "next-intl";

import type { NetworkKey } from "@/lib/public-church-profile";

type ChurchProfileAttributesProps = {
  features: string[];
};

export function ChurchProfileAttributes({ features }: ChurchProfileAttributesProps) {
  const t = useTranslations("publicChurchProfile");

  if (features.length === 0) {
    return null;
  }

  return (
    <section className="glass-card rounded-[1.9rem] p-6">
      <h2 className="text-xs uppercase tracking-[0.24em] text-zinc-500">
        {t("attributes.title")}
      </h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {features.map((feature, index) => (
          <li
            key={`${index}-${feature}`}
            className="rounded-full border border-white/10 px-3 py-1 text-sm text-zinc-300"
          >
            {feature}
          </li>
        ))}
      </ul>
    </section>
  );
}

type ChurchProfileLinksProps = {
  links: Array<{ key: NetworkKey; url: string }>;
  churchName: string;
};

export function ChurchProfileLinks({ links, churchName }: ChurchProfileLinksProps) {
  const t = useTranslations("publicChurchProfile");

  if (links.length === 0) {
    return null;
  }

  return (
    <section className="glass-card rounded-[1.9rem] p-6">
      <h2 className="text-xs uppercase tracking-[0.24em] text-zinc-500">
        {t("networks.title")}
      </h2>
      <ul className="mt-4 flex flex-wrap gap-3">
        {links.map(({ key, url }) => {
          const network = t(`networks.${key}`);

          return (
            <li key={key}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label={t("networks.openAria", { network, name: churchName })}
                className="inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-emerald-400/30 hover:text-white"
              >
                {network}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type ChurchProfileMediaProps = {
  name: string;
  logo: string | null;
  cover: string | null;
  gallery: string[];
};

export function ChurchProfileMedia({ name, logo, cover, gallery }: ChurchProfileMediaProps) {
  const t = useTranslations("publicChurchProfile");

  if (!logo && !cover && gallery.length === 0) {
    return null;
  }

  return (
    <section className="glass-card space-y-6 rounded-[1.9rem] p-6">
      {cover ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={t("media.coverAlt", { name })}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-48 w-full rounded-2xl object-cover"
          />
        </>
      ) : null}
      {logo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo}
            alt={t("media.logoAlt", { name })}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-20 w-20 rounded-2xl object-cover"
          />
        </>
      ) : null}
      {gallery.length > 0 ? (
        <div>
          <h2 className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            {t("gallery.title")}
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((url, index) => (
              <li key={`${index}-${url}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={t("media.galleryAlt", { index: index + 1, name })}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="aspect-square w-full rounded-2xl object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
