export type ActivityMessages = {
  title: string; introduction: string; filtered: string; empty: string; error: string;
  invalid: string; retry: string; previous: string; next: string; page: string;
  starts: string; ends: string; signIn: string; panelUnavailable: string;
  profileLink: string; profileUnavailable: string; back: string; loading: string;
};
const messages: ActivityMessages = {
  title: "Atividades públicas",
  loading: "Carregando atividades públicas…",
  introduction: "Conheça as próximas atividades. Para registrar interesse, entre na sua conta e confirme seu consentimento no painel.",
  filtered: "Atividades desta comunidade",
  empty: "Nenhuma atividade pública futura encontrada nesta página.",
  error: "Não foi possível carregar as atividades. Tente novamente.",
  invalid: "Os filtros de atividades são inválidos. Revise o endereço.",
  retry: "Tentar novamente", previous: "Página anterior", next: "Próxima página", page: "Página",
  starts: "Início (UTC)", ends: "Fim (UTC)", signIn: "Entrar para registrar interesse",
  panelUnavailable: "O acesso para registrar interesse está indisponível.",
  profileLink: "Ver atividades públicas desta comunidade",
  profileUnavailable: "As atividades desta comunidade estão indisponíveis.",
  back: "Voltar às comunidades",
};
export default messages;
