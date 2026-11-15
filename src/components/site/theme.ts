export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/**
 * Contorno de foco do projeto: sólido, 2 px, deslocado 2 px, na cor `--eg-action-focus`.
 * No Tailwind 4, `outline-none`/`outline-hidden` anulam estas classes; não os combine.
 */
export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-eg-focus";

/** Cookie com a escolha manual de tema. Lido no servidor (layout.tsx) para evitar flash. */
export const THEME_COOKIE = "eg-theme";

/**
 * Sem cookie, o tema segue o sistema (`prefers-color-scheme`). O servidor não conhece a
 * preferência, então não escreve `data-theme`; o script de THEME_INIT_SCRIPT, inline no <head>,
 * aplica o tema antes da primeira pintura. Sem JavaScript, tokens.css cai no escuro.
 */
export const DEFAULT_THEME = "system";
export type ThemePreference = Theme | typeof DEFAULT_THEME;

export function isTheme(value: string | undefined): value is Theme {
  return value === "light" || value === "dark";
}

export function resolveTheme(value: string | undefined): ThemePreference {
  return isTheme(value) ? value : DEFAULT_THEME;
}

/**
 * Executa no <head>, antes da pintura. Só age quando o servidor não gravou `data-theme`
 * (sem cookie `eg-theme`). Inline: a CSP atual (report-only) já permite `'unsafe-inline'`;
 * se ela endurecer, passe a um hash ou nonce.
 */
export const THEME_INIT_SCRIPT =
  '(function(){try{var d=document.documentElement;if(d.dataset.theme)return;' +
  'd.dataset.theme=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}catch(e){}})()';
