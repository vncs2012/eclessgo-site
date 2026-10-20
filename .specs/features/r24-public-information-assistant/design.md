# R24 Design

**Status:** Approved for local delivery by execution authorization

## Architecture Overview

Componente cliente envia question/locale para a rota POST do slug. Handler validado recebe leitor público e adaptador por injeção. A rota real usa getPublicChurchBySlug com no-store e adaptador desativado. Testes injetam leitor e seletor sintéticos.

Alternativas consideradas: prosa livre exigiria validação semântica de afirmações; consulta determinística mudaria a escolha humana de IA. Seleção estruturada de fatos mantém um contrato de IA independente de provedor e restringe a saída à evidência pública. Não envolve biblioteca nova.

## Components

- public-information-assistant.ts: tipos mínimos, projeção limitada, validação, timeout e handler HTTP com dependências explícitas. Sem imports de bootstrap ou aplicação real.
- public-information-assistant-provider.ts: adaptador ausente como padrão, nenhum client remoto ou credencial.
- assistant/route.ts: composição do handler, leitor público existente sem headers do visitante, cache no-store, tradução de 404.
- public-information-assistant.tsx: formulário acessível, estado pendente, fatos/fontes, falhas e cancelamento por contexto; textos por next-intl.
- Página atual e locales: integração mínima. Fontes locais apontam ao detalhe canônico da comunidade e, se houver âncora nova, somente à âncora existente/inserida nesse detalhe.

## Data Models

Request exato question/locale. Fato possui ID estável por projeção, texto publicado e fonte local fixa do slug. Adapter.select recebe question, locale, slug, facts e AbortSignal; devolve objeto exato factIds. Resposta possui slug, status answered/no_information, answer (lista de strings) e sources (lista de links locais correspondentes). Falhas possuem code sem payload interno.

## Error Handling Strategy

400/413 entrada antes das dependências; 404 comunidade ausente; 502 seleção inválida; 503 indisponibilidade; 504 timeout. Cliente distingue provedor ausente e valida shape/slug/fontes antes de renderizar. Pergunta e textos são renderizados como texto escapado.

## Risks & Concerns

| Concern | Location | Impact | Mitigation |
| --- | --- | --- | --- |
| Campos públicos amplos incluem dados fora do contrato do assistente | src/types/public.ts | Exposição desnecessária ao futuro provedor | Projeção por allowlist e assertion sobre payload completo |
| Página/locales têm deltas herdados | src/app/igrejas/[slug]/page.tsx; src/messages | Mistura indevida em commit | WT preservado; índice HEAD+OWN materializado pelo executor e revisado pelo Main |
| Provedor indefinido | provider novo | Não existe resposta de IA operacional | Padrão desativado; testes sintéticos explicitamente limitados |
| Bootstrap de teste amplo pode alcançar config protegida | Dependências existentes | Leitura indevida | Harness próprio por whitelist, mocks mínimos e guard revisado/pinado antes de execução |

## Tech Decisions

AD-003 preservação, AD-007 duas rodadas abertas/terceira restrita e política humana de modelos desta sessão aplicam. Lessons: L-026 exige conferir ambos locales, não apenas idioma renderizado. Root STATE/ROADMAP/lessons escritos somente pelo owner.
