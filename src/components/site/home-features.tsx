import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

export type HomeFeatureOption = {
  id: string;
  label: string;
  description: string;
  /** Quantas comunidades marcaram esta opção (dado real; nunca estimado). */
  count: number;
  href: string;
  icon: LucideIcon;
};

/**
 * "Encontre pelo que importa para você". Só aparece com opções que têm contagem real:
 * depende da Etapa 2 (a API ainda não envia `features` na lista). Sem opções, não renderiza.
 */
export async function HomeFeatures({ options }: { options: readonly HomeFeatureOption[] }) {
  const available = options.filter((option) => option.count > 0);
  if (available.length === 0) return null;
  const t = await getTranslations("home.features");

  return (
    <section
      aria-labelledby="home-features-title"
      className="mx-auto w-full max-w-[var(--eg-content-max)] px-4 pt-20 sm:px-6 lg:px-10 lg:pt-[88px]"
    >
      <p className="text-xs font-bold uppercase tracking-[0.08em] text-eg-warm">{t("eyebrow")}</p>
      <h2
        id="home-features-title"
        className="mt-2 font-display text-[clamp(1.625rem,3vw,2.125rem)] font-extrabold leading-tight tracking-[-0.03em] text-eg-strong"
      >
        {t("title")}
      </h2>
      <p className="mt-2 text-eg-muted">{t("description")}</p>
      <ul
        aria-label={t("listLabel")}
        className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6"
      >
        {available.map((option) => (
          <li key={option.id}>
            <Link
              href={option.href}
              className="flex h-full flex-col gap-3 rounded-2xl border border-eg-border bg-eg-surface p-4 transition-colors hover:border-eg-border-strong hover:bg-eg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-eg-focus"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-eg-primary-soft text-eg-primary-text">
                <option.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <b className="block font-bold text-eg-strong">{option.label}</b>
                <span className="text-sm text-eg-muted">
                  {option.description} · {option.count}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
