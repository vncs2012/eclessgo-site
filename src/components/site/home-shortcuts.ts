import { buildTraditionOptions } from "../../lib/public-church-utils.ts";

type ShortcutChurch = { denomination: string };

export type TraditionShortcut = {
  /** Rótulo já traduzido da opção (grupo de tradições afins ou a denominação). */
  label: string;
  count: number;
  /** Valores das opções do filtro da Busca (`buildTraditionOptions`); vão em `?tradicao=`. */
  values: string[];
};

export type TraditionShortcuts = {
  items: TraditionShortcut[];
  /** Soma do que não coube nos atalhos principais; null quando tudo coube. */
  others: Omit<TraditionShortcut, "label"> | null;
};

/**
 * Atalhos por tradição com a contagem real dos dados carregados, com o mesmo agrupamento e
 * a mesma contagem do filtro da Busca (`buildTraditionOptions`): o número do atalho é o que
 * a Busca mostra depois do clique. Opção sem comunidade (0) nunca aparece. Mostra até `max`
 * opções, da maior para a menor contagem; o resto vira "Outras" (exceto quando sobraria uma
 * só, que entra como atalho próprio).
 */
export function buildTraditionShortcuts(
  churches: readonly ShortcutChurch[],
  labelOf: (value: string) => string,
  max = 5,
): TraditionShortcuts {
  const sorted = buildTraditionOptions(churches)
    .filter((option) => option.count > 0)
    .map((option) => ({ label: labelOf(option.value), count: option.count, values: [option.value] }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));

  const keep = sorted.length === max + 1 ? sorted.length : max;
  const items = sorted.slice(0, keep);
  const rest = sorted.slice(keep);
  const others =
    rest.length > 0
      ? {
          count: rest.reduce((sum, group) => sum + group.count, 0),
          values: rest.flatMap((group) => group.values),
        }
      : null;

  return { items, others };
}

/** Link de /comunidades filtrado por tradição (`tradicao` repetível). */
export function traditionHref(values: readonly string[]): string {
  const params = new URLSearchParams();
  for (const value of values) params.append("tradicao", value);
  return `/comunidades?${params.toString()}`;
}
