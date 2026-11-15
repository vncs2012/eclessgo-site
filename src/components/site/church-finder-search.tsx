"use client";

import { useId, type FormEvent } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

import { useChurchFinder } from "@/components/site/church-finder-context";
import { cn } from "@/lib/utils";

/**
 * Foco visível padrão da Busca. Sem `outline-none`/`outline-hidden`: no Tailwind 4 os dois
 * definem `outline-style: none` e anulam o `focus-visible:outline-2` (que precisa do estilo
 * padrão `solid`). O navegador só desenha contorno em `:focus-visible`, então o clique com
 * mouse continua sem anel.
 */
export const FINDER_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-eg-focus";

type ChurchFinderSearchProps = {
  /**
   * "header": cabeçalho compacto (lg+), no slot `search` do SiteHeader.
   * "page": na própria página abaixo de lg (sobre o mapa no celular, acima da lista no tablet).
   */
  variant: "header" | "page";
  className?: string;
};

export function ChurchFinderSearch({ variant, className }: ChurchFinderSearchProps) {
  const t = useTranslations("finder");
  const inputId = useId();
  const {
    search,
    setSearch,
    isLoading,
    searchChurches,
    useMyLocation: requestMyLocation,
  } = useChurchFinder();
  const compact = variant === "page";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void searchChurches();
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        "flex min-w-0 items-center gap-1.5 rounded-xl text-sm border border-eg-border-strong/60 bg-eg-surface p-1 pl-3 text-eg-text",
        "focus-within:border-eg-focus",
        compact && "shadow-[var(--eg-shadow-md)] md:shadow-none",
        className,
      )}
    >
      <MapPin className="h-[18px] w-[18px] shrink-0 text-eg-muted" aria-hidden="true" />
      <label htmlFor={inputId} className="sr-only">
        {t("search.aria")}
      </label>
      <input
        id={inputId}
        data-finder-search=""
        type="text"
        enterKeyHint="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t("search.placeholder")}
        autoComplete="off"
        className={cn(
          "h-10 min-w-0 flex-1 rounded-md bg-transparent px-1 text-sm text-eg-strong placeholder:text-eg-muted",
          FINDER_FOCUS,
          compact && "h-11",
        )}
      />
      <button
        type="button"
        onClick={() => void requestMyLocation()}
        aria-label={compact ? t("myLocation") : undefined}
        className={cn(
          "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-eg-primary-soft px-2.5 text-[13px] font-semibold text-eg-primary-text transition-colors hover:bg-eg-hover",
          FINDER_FOCUS,
          compact && "h-11 w-11 px-0 md:w-auto md:px-3",
        )}
      >
        <LocateFixed className="h-4 w-4" aria-hidden="true" />
        <span
          className={cn(
            "whitespace-nowrap text-[13px] font-semibold",
            compact && "hidden md:inline",
          )}
          aria-hidden={compact || undefined}
        >
          {t("myLocation")}
        </span>
      </button>
      <button
        type="submit"
        className={cn(
          "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg bg-eg-primary px-4 text-sm font-bold text-eg-inverse transition-colors hover:bg-eg-primary-hover",
          FINDER_FOCUS,
          compact && "hidden h-11 md:inline-flex",
        )}
      >
        <span className="font-bold">{isLoading ? t("updating") : t("update")}</span>
      </button>
    </form>
  );
}
