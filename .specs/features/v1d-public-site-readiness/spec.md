# V1d public site readiness

## Problem Statement
O site público final precisa de uma prova local reproduzível usando Next real e fixture HTTP sintética. T1 não é QA independente nem certificação V1 global.

## Out of Scope
API/DB reais, envio, provedores, credenciais, iOS, EAS, cloud, upload, gasto, push, publicação, produção e UAT formal. Produto herdado permanece somente leitura, exceto o único hunk OWN aprovado de normalizeAddress em src/lib/public-church-utils.ts para exibir o endereço completo.

## Assumptions & Open Questions
| Assumption | Chosen default | Rationale |
|---|---|---|
| Origem | fixture HTTP loopback nova | recorte humano autorizado |
| Versões | Next 16.2.6, React 19.2.4 do lock | fontes finais nominais |
| Indisponibilidade detalhe | UI informativa SSR200 | contrato existente confirmado pelo ROOT |
Open questions: none.

## User Stories
Como visitante, quero navegar da home ao diretório e ao detalhe de uma comunidade pública, com estados distinguíveis e layout utilizável no celular.

Acceptance Criteria:
1. WHEN uma fonte for capturada, o harness SHALL rejeitar lexicalmente os quatro sufixos protegidos e traversal antes de IO, abrir cada componente com O_NOFOLLOW, conferir HEAD/blob/mode, preservar fontes e índices antes/depois e registrar origem/versões nominais. V1D-01.
2. WHEN o harness iniciar, ele SHALL usar reserva, fixture HTTP, Next real e contexto Chrome novos, credenciais ausentes e providers OFF; bloquear/contabilizar requests externos sem efetivá-los. V1D-02.
3. WHEN o visitante abrir home e os aliases /comunidades e /igrejas, a UI SHALL exibir Comunidade Alfa e Comunidade Beta sintéticas; a busca por Alfa SHALL excluir Beta e a busca SemResultado SHALL mostrar exatamente “Nenhuma comunidade encontrada para os filtros informados.”. V1D-03.
4. WHEN o visitante seguir links reais para Alfa, o detalhe SHALL mostrar nome, descrição “Descrição pública sintética Alfa.”, endereço “Rua Sintética Alfa, 10, Centro, Goiânia, GO” e programação “Encontro sintético Alfa”; slug ausente SHALL responder404 e “Esta página não foi encontrada”; upstream503 SHALL mostrar “Esta página está temporariamente indisponível” com SSR200 e sem identidade Alfa. V1D-04.
5. WHEN a fixture inicial estiver vazia ou indisponível, a home e diretório SHALL distinguir vazio e erro pelos textos pt-BR existentes, e uma busca cujo upstream sintético responda HTTP 503 SHALL receber HTTP 502 do BFF e mostrar “Não foi possível aplicar os filtros agora.” sem afirmar resultado vazio. V1D-05.
6. WHEN as jornadas rodarem em desktop1440x1000 e viewport móvel390x844, o harness SHALL verificar identidade, links internos e ausência de overflow horizontal nas telas home/diretório/detalhe/404/indisponível, com screenshots/traces, recibos file:line/matriz/reverso/gates/skips e navegador visível separado explicitamente se houver. V1D-06.

## Edge Cases
Busca vazia não é falha; slug ausente não é503; viewport móvel não é emulador nativo; tiles/CDN abortados limitam prova cartográfica. Setup não é sensor comportamental.

## Requirement Traceability
| ID | Task | Status |
|---|---|---|
| V1D-01 | T1 | implemented locally; T2 pending |
| V1D-02 | T1 | implemented locally; T2 pending |
| V1D-03 | T1 | implemented locally; T2 pending |
| V1D-04 | T1 | implemented locally; T2 pending |
| V1D-05 | T1 | implemented locally; T2 pending |
| V1D-06 | T1 | implemented locally; T2 pending |

## T1 local evidence
O gate autoral C1 passou110assertions, com42checks como subconjunto,6jornadas e0skips. O candidato é105fontes BASE+1OWN normalizeAddress. Matriz/reverso: ROOT/.specs/evidence/v1d-public-site-readiness/t1-integration-bfb1a512-935b-4779-aeb7-ac6573a30198/final-functional-matrix.md. A preparação e clone novos conferiram paridade dos106arquivos e16828dependências ao Full verde; não houve nova execução Full após mudanças exclusivas de metadata/docs. T2 independente e T3 continuam pendentes; nenhum Verified/UAT/produção é declarado.
