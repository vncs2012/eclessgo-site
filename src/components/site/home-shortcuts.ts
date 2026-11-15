type ShortcutChurch = { denomination: string };

export type TraditionShortcut = {
  /** Rótulo já traduzido (várias denominações do banco podem cair no mesmo rótulo). */
  label: string;
  count: number;
  /** Valores de `denomination` agrupados; vão no filtro de /comunidades. */
  values: string[];
};

export type TraditionShortcuts = {
  items: TraditionShortcut[];
  /** Soma do que não coube nos atalhos principais; null quando tudo coube. */
  others: Omit<TraditionShortcut, "label"> | null;
};

/**
 * Atalhos por tradição com a contagem real dos dados carregados. Tradições sem comunidade
 * nunca aparecem. Mostra até `max` rótulos; o resto vira "Outras" (exceto quando sobraria
 * um só, que entra como atalho próprio).
 */
export function buildTraditionShortcuts(
  churches: readonly ShortcutChurch[],
  labelOf: (denomination: string) => string,
  max = 5,
): TraditionShortcuts {
  const groups = new Map<string, { count: number; values: Set<string> }>();
  for (const church of churches) {
    const label = labelOf(church.denomination);
    const group = groups.get(label) ?? { count: 0, values: new Set<string>() };
    group.count += 1;
    group.values.add(church.denomination);
    groups.set(label, group);
  }

  const sorted = Array.from(groups, ([label, group]) => ({
    label,
    count: group.count,
    values: Array.from(group.values).sort(),
  })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));

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
