import Link from "next/link";
import { LocateFixed, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import { COMMUNITY_FOCUS } from "@/components/site/community-section";

/**
 * Busca do cabeçalho na página da Comunidade. O provider da Busca (ChurchFinderProvider) não
 * serve aqui: a página não tem lista para filtrar. Esta versão leva a pessoa para /comunidades
 * com a consulta em `q` (mesmo contrato do campo da Home) ou com `localizar=1`.
 */
export function CommunityHeaderSearch() {
  const t = useTranslations("finder");

  return (
    <form
      role="search"
      action="/comunidades"
      method="get"
      className="flex min-w-0 items-center gap-1.5 rounded-xl border border-eg-border-strong/60 bg-eg-surface p-1 pl-3 text-sm text-eg-text focus-within:border-eg-focus"
    >
      <MapPin className="h-[18px] w-[18px] shrink-0 text-eg-muted" aria-hidden="true" />
      <label htmlFor="community-header-search" className="sr-only">
        {t("search.aria")}
      </label>
      <input
        id="community-header-search"
        type="search"
        name="q"
        enterKeyHint="search"
        autoComplete="off"
        placeholder={t("search.placeholder")}
        className={`h-10 min-w-0 flex-1 rounded-md bg-transparent px-1 text-sm text-eg-strong placeholder:text-eg-muted ${COMMUNITY_FOCUS}`}
      />
      <Link
        href="/comunidades?localizar=1"
        className={`inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-eg-primary-soft px-2.5 text-[13px] font-semibold text-eg-primary-text transition-colors hover:bg-eg-hover ${COMMUNITY_FOCUS}`}
      >
        <LocateFixed className="h-4 w-4" aria-hidden="true" />
        <span className="whitespace-nowrap text-[13px] font-semibold">{t("myLocation")}</span>
      </Link>
      <button
        type="submit"
        className={`inline-flex h-10 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg bg-eg-primary px-4 text-sm font-bold text-eg-inverse transition-colors hover:bg-eg-primary-hover ${COMMUNITY_FOCUS}`}
      >
        <span className="font-bold">{t("update")}</span>
      </button>
    </form>
  );
}
