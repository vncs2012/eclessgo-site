# R24 Tasks

## Execution Protocol

Skill tlc-spec-driven local ativa. Main planeja/revisa/documenta/executa gates/commita. Único executor Luna/max/fork none escreve todo produto/testes/helpers/configs/variantes, sequencialmente sem testes/gates/Git. QA novo Sol6.1/medium/fork none após último commit fonte. Nenhuma instalação/rede/serviço. Reservas nominais owner antes de escrita e janela exata antes de cada commit.

**Status:** Done

## Test Coverage Matrix

Guidelines: eclessGO/AGENTS.md, skill local, protocolo humano. Testes históricos não importados nem copiados; harness próprio restrito com dependências instaladas. APIs de teste disponíveis: node:test, TypeScript, React/ReactDOM e JSDOM já instalados, sem scripts/configs raiz.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Handler/projeção/adaptador | unit | INFO-02..08, branches e limites | tests/r24/core.test.cjs | node tests/r24/core.test.cjs |
| Rota | integration | INFO-01/09/10, sucesso e erros | tests/r24/route.test.cjs | node tests/r24/route.test.cjs |
| Componente/página/locales | integration | INFO-11..15 e todos estados/contexto | tests/r24/ui.test.cjs | node tests/r24/ui.test.cjs |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | T1 | node tests/r24/core.test.cjs |
| Full | T2 | node tests/r24/core.test.cjs e node tests/r24/route.test.cjs, exits separados |
| Build | T3 e fechamento | node tests/r24/core.test.cjs, node tests/r24/route.test.cjs e node tests/r24/ui.test.cjs, exits separados; tipagem dirigida; guard e sintaxe dos helpers revisados |

## Execution Plan

### Phase 1: Public assistant

```
T1 → T2 → T3
```

## Task Breakdown

### T1: Handler público ancorado por adaptador

**What**: Entregar um handler verificável com projeção mínima, validação e erros precisos.
**Where**: `src/lib/public-information-assistant.ts`
**Depends on**: None
**Reuses**: Tipos públicos somente como referência, sem imports de runtime real.
**Requirement**: INFO-02, INFO-03, INFO-04, INFO-05, INFO-06, INFO-07, INFO-08
**Tools**: terminal e apply_patch; skill tlc-spec-driven; suporte provider e harness/testes próprios na mesma entrega.
**Done when**:
- [x] INFO-02..08 comprovados com assertions de payload/resultado e limites; Quick direto 26/26 verde, zero skips.
- [x] Guard/import graph revisados e pinados antes da primeira execução; tipagem dirigida exit 0. Recibos em t1-evidence.md.
**Tests**: unit
**Gate**: Quick
**Commit**: feat(assistant): add grounded public information handler

### T2: Compor endpoint público desativado por padrão

**What**: Integrar handler ao leitor público existente e ao padrão sem provedor.
**Where**: `src/app/api/public/churches/slug/[slug]/assistant/route.ts`
**Depends on**: T1
**Requirement**: INFO-01, INFO-09, INFO-10
**Tools**: terminal e apply_patch; skill tlc-spec-driven; teste da rota com leitor sintético no mesmo commit.
**Done when**:
- [x] Leitura no-store sem headers de identidade, 404/503, padrão desativado e respostas no-store comprovados; Full 26 core + 5 rota PASS, tipos/sintaxe/pins exit 0.
**Tests**: integration
**Gate**: Full
**Commit**: feat(assistant): wire public assistant endpoint

### T3: Conversa acessível no perfil público

**What**: Entregar formulário integrado e localizado com cancelamento, respostas/falhas e histórico limitado.
**Where**: `src/components/site/public-information-assistant.tsx`
**Depends on**: T2
**Requirement**: INFO-11, INFO-12, INFO-13, INFO-14, INFO-15
**Tools**: terminal e apply_patch; skill tlc-spec-driven; integração mínima na página e locales e testes próprios no mesmo commit.
**Done when**:
- [x] Estados e limites INFO-11..15 exercitados no DOM sintético e traduções completas nos dois idiomas; Build dirigido 26 core + 5 rota + 16 UI PASS, tipos e sintaxe exit 0.
- [x] Cópia HEAD+OWN dos três mistos passou a mesma seleção 47/47; reversos derivados do WT coincidiram com snapshots prévios, e deltas OWN HEAD/WT coincidiram. Stage final somente após janela.
**Tests**: integration
**Gate**: Build
**Commit**: feat(assistant): add localized public conversation

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram Shows | Status |
| --- | --- | --- | --- |
| T1 | None | None | Match |
| T2 | T1 | T1 → T2 | Match |
| T3 | T2 | T2 → T3 | Match |

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | Handler | unit | unit | Match |
| T2 | Rota | integration | integration | Match |
| T3 | UI/página/locales | integration | integration | Match |

## Closure

- [x] QA independente rederivou 15/15 critérios e reverso de 47 testes, sem gaps substantivos; validation.md PASS local.
- [x] Oito faults comportamentais válidos detectados em cópias isoladas, controles antes/depois 47 PASS; Q7 incompleta excluída e Q7b documentada, sem alterar assertions.
- [x] Preservação selecionada e descarte de scratch ativo concluídos; arquivo inerte e recibos persistentes. Tipagem dirigida final exit 0.

Main executa gate documental isolado e commita aceite após janela própria. Nenhuma UAT humana, provedor/produção/fullapp alegados. Não há sinal novo de lesson ou fix task no PASS independente.
