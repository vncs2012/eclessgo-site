export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/** Cookie com a escolha manual de tema. Lido no servidor (layout.tsx) para evitar flash. */
export const THEME_COOKIE = "eg-theme";

/** Tema quando ainda não há escolha. Hoje o site segue escuro; trocar aqui quando as páginas migrarem. */
export const DEFAULT_THEME: Theme = "dark";

export function isTheme(value: string | undefined): value is Theme {
  return value === "light" || value === "dark";
}

export function resolveTheme(value: string | undefined): Theme {
  return isTheme(value) ? value : DEFAULT_THEME;
}
