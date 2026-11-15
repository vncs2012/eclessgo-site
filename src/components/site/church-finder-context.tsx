"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import {
  useChurchFinderData,
  type ChurchFinderFiltersState,
  type ChurchFinderStatusMessages,
} from "@/hooks/useChurchFinderData";
import { formatTradition } from "@/lib/public-church-utils";
import { GOIANIA_CENTER } from "@/lib/site-config";
import type { Coordinates, PublicChurchListItem } from "@/types/public";

type ChurchFinderData = ReturnType<typeof useChurchFinderData>;

type ChurchFinderContextValue = ChurchFinderData & {
  search: string;
  setSearch: (value: string) => void;
  hasLive: boolean;
  setHasLive: (value: boolean) => void;
};

const ChurchFinderContext = createContext<ChurchFinderContextValue | null>(null);

type ChurchFinderProviderProps = {
  initialChurches: PublicChurchListItem[];
  initialCenter?: Coordinates;
  initialLoadError?: string | null;
  children: ReactNode;
};

/**
 * Estado da Busca compartilhado entre o campo do cabeçalho (slot `search` do SiteHeader),
 * o campo da própria página (abaixo de lg) e o ChurchFinder (filtros, lista e mapa).
 */
export function ChurchFinderProvider({
  initialChurches,
  initialCenter = GOIANIA_CENTER,
  initialLoadError = null,
  children,
}: ChurchFinderProviderProps) {
  const t = useTranslations("finder");
  const [search, setSearch] = useState("");
  const [hasLive, setHasLive] = useState(false);
  // Cidade, bairro e denominação continuam aceitos pelo hook/BFF; a tela nova filtra
  // tradição localmente (várias de uma vez) e busca cidade/bairro pelo campo de texto.
  const filters: ChurchFinderFiltersState = {
    search,
    denomination: "",
    city: "",
    neighborhood: "",
    hasLive,
  };
  const messages: ChurchFinderStatusMessages = {
    initialLoadError: t("directory.loadError"),
    initialShowing: t("status.initialShowing"),
    initialEmpty: t("status.initialEmpty"),
    filtersClearedShowing: t("status.filtersClearedShowing"),
    filtersClearedEmpty: t("status.filtersClearedEmpty"),
    clearFailed: t("status.clearFailed"),
    searchUpdated: t("status.searchUpdated"),
    searchEmpty: t("status.searchEmpty"),
    filterFailed: t("status.filterFailed"),
    geoUnavailable: t("status.geoUnavailable"),
    recalculated: t("status.recalculated"),
    locationFailed: t("status.locationFailed"),
    permissionDenied: t("status.permissionDenied"),
  };
  const data = useChurchFinderData({
    initialChurches,
    initialCenter,
    initialLoadError,
    filters,
    messages,
  });

  return (
    <ChurchFinderContext.Provider value={{ ...data, search, setSearch, hasLive, setHasLive }}>
      {children}
    </ChurchFinderContext.Provider>
  );
}

export function useChurchFinder() {
  const value = useContext(ChurchFinderContext);
  if (!value) throw new Error("useChurchFinder precisa estar dentro de <ChurchFinderProvider>.");
  return value;
}

/** Rótulo traduzido da tradição (mapa por código em `finder.traditions`, com fallback). */
export function useTraditionLabel() {
  const t = useTranslations("finder");
  const labels = t.raw("traditions") as Record<string, string>;
  return (value: string) => formatTradition(value, labels);
}
