# R35b Permitted Attribution Tasks

**Design**: .specs/features/r35b-permitted-attribution/design.md
**Status**: T1–T3 concluídas; pronta para T4

## Execution Plan

AD-002/003/007/008: execução e commits locais autorizados, um implementador gpt-6-luna / reasoning_effort=max / fork_turns=none por vez, sem aninhar. Principal planeja/revisa/gates/commits; Verifier novo independente no fim. Iterações 1/2 abertas; 3 restrita. Não alegar esforço efetivo. Um commit por tarefa, marque Done antes e espelhe tasks na API. Commits por repo se a tarefa cruza repos; mobile sem Git com manifesto/patch por tarefa.

Sem rede/install/serviços/PG/Redis real/E2E/Expo/dev server/push/deploy; jamais worker/CLI/Compose de retenção. Preservar baseline /tmp/eclessgo-r35b-baseline (API 11, painel 58, web 17, mobile 3408). Não tocar arquivos sujos salvo hunks necessários próprios; nunca stash/reset/checkout/restore/broadstage. Arquivos existentes editados por Python via shell. Somente principal commita. Não mudar API executável, métricas, enums/contratos nem App.tsx.

## Test Coverage Matrix

| Layer | Tests | Gate |
|---|---|---|
| Política documental | N/A porque não cria comportamento executável; revisão de fontes | Document/Contract Quick |
| Painel administrativo | unit, resultados literais | Painel Full + clean HEAD com overlay próprio |
| Web opt-in | unit executando módulos reais | Web node Full + tsc |
| App opt-in/paz | unit, matriz de 19 tipos/7 paz | Mobile Full + tsc/theme/a11y/assets |

## Gate Check Commands

Node offline /mnt/data/npm-cache/node-v24.18.0-linux-x64/bin, usar binários locais diretos; nunca npx. Python API /mnt/data/poetry/virtualenvs/eclessgo-api-gQym8Hwm-py3.14/bin/python, PYTHONDONTWRITEBYTECODE=1, POSTGRES_TESTS=0.

- Document/Contract Quick: API unit registry/renderer (pytest -q -p no:cacheprovider), renderer --check, generate_api_contracts --check, check_consumer_contract, diff --check; revisão literal do documento contra fontes.
- Painel Full: node node_modules/vitest/vitest.mjs run --maxWorkers=1, node node_modules/typescript/bin/tsc --noEmit, node scripts/check-generated-api-contracts.mjs; repetir em git archive HEAD com node_modules symlink e somente arquivos próprios da tarefa sobrepostos. Sem servir/build web.
- Web node Full: node --experimental-strip-types --test --test-isolation=none scripts/*.test.ts scripts/analytics-permission.test.mjs; node node_modules/typescript/bin/tsc --noEmit --incremental false; contratos --check e diff --check.
- Mobile Full: node node_modules/vitest/vitest.mjs run --maxWorkers=1, node node_modules/typescript/bin/tsc --noEmit, node scripts/check-theme-tokens.js, node scripts/check-mobile-accessibility.mjs, node scripts/check-asset-budgets.mjs; mobile_manifest/mobile_pack antes/depois com somente backup do arquivo alterado (novo arquivo não exige copiar mobile).
- Fechamento: validate_spec/tasks --strict, preservação de todos os diffs preexistentes, Verifier novo + sensores em cópias isoladas, validate_state antes/depois, espelho spec/design/tasks/validation* + commit docs API.

## Task Breakdown

## Phase 1: Limites e provas de permissão

### T1: Document the allowed interpretation and blocked purposes

**What**: Criar política técnica docs/ATTRIBUTION_POLICY.md na API, vinculada a R35a 1.0.1, com interpretação descritiva, proibições de inferência, garantias/limites do opt-in de cliente, contrato sem prova por evento e finalidades novas bloqueadas até decisão própria. Registrar a tentativa administrativa não permitida/fora do enum e seu bloqueio em T2.
**Where**: API docs/ATTRIBUTION_POLICY.md
**Depends on**: None
**Reuses**: R35a, REVALIDATION R35, DATA_INVENTORY, DTO/router/use case e módulos de cliente atuais.
**Requirement**: R35B-01, R35B-02
**Tools**: arquivos locais / executor Luna max; sem rede.
**Done when**:
- [x] Documento verdadeiro sem promessa de consentimento por evento, sem atribuição individual e sem novas finalidades; Document/Contract Quick verde.
**Tests**: N/A porque tarefa documental; fontes revisadas pelo principal/Verifier.
**Gate**: Document/Contract Quick
**Commit**: docs(analytics): define permitted attribution boundaries

### T2: Block the unpermitted administrative analytics attempt

**What**: Tornar product-analytics.ts operação sem efeitos, com exports e assinatura preservados, isProductAnalyticsEnabled false para qualquer flag; não ler/criar ID nem acessar storage/API. Criar teste novo com matriz de flags incluindo true/1/yes/on, chamadas com e sem contexto, storage que lança; toda chamada resolve e spies permanecem zero. Atualizar apenas o parágrafo administrativo de API docs/ATTRIBUTION_POLICY.md de T2 planejada para comportamento implementado, com referência à prova.
**Where**: Painel src/lib/product-analytics.ts
**Depends on**: T1
**Reuses**: assinatura atual chamada por ProductAnalyticsRouteTracker; fixtures vi mock/spies do painel.
**Requirement**: R35B-03
**Tools**: arquivos/Node locais; executor Luna max; sem npx.
**Done when**:
- [x] Zero POST/ID/storage independentemente de flag/contexto; Painel Full verde no real e no estado commitável limpo; diff próprio revisado.
**Tests**: unit em src/lib/product-analytics.permission.test.ts
**Gate**: Painel Full + clean HEAD overlay
**Commit**: fix(analytics): block unpermitted administrative tracking

### T3: Prove the web opt-in boundary without E2E

**What**: Teste node novo executando consent.ts e public-analytics.ts reais via TypeScript instalado/VM local (aliases resolvidos; transporte mockado, consentimento/sessão reais). Provar os cinco tipos públicos sem POST/ID em estados unknown/denied/inválido; granted persistido envia um evento literal, revogação remove sessão e bloqueia o próximo; falhas de storage/read/grant e churchId vazio falham fechado. Sem modificar os módulos atuais nem E2E/config.
**Where**: Web scripts/analytics-permission.test.mjs
**Depends on**: T2
**Reuses**: módulos atuais e convenção scripts/*.test.ts/node:test; TypeScript já instalado.
**Requirement**: R35B-04
**Tools**: Node local; executor Luna max; sem instalação/serviço.
**Done when**:
- [x] Casos reais de permissão/erro assertam POSTs/IDs e payload literal, sem mock do gate; Web node Full/tsc verde.
**Tests**: unit comportamento
**Gate**: Web node Full + tsc
**Commit**: test(analytics): prove web opt-in and revocation boundaries

### T4: Prove mobile permission and the personal peace boundary

**What**: Novo teste Vitest no padrão de analyticsConsent.test.ts: todos os 19 tipos bloqueados em unknown/denied sem criar sessão/POST; granted persistido e revogação com payload literal; erro de persistência reutiliza a prova existente; igreja ausente em evento comum bloqueia. Os sete trackPeaceEvent permitidos enviam churchId ausente, metadata vazia, source/path exatos, sem contexto da organização/conteúdo pessoal. Não editar service/config/testes existentes.
**Where**: Mobile tests/analyticsAttributionPermission.test.ts; evidência root .specs/evidence/r35b-mobile-t4/
**Depends on**: T3
**Reuses**: serviços reais e mocks AsyncStorage/apiClient; ferramentas de manifesto/patch sem Git.
**Requirement**: R35B-05, R35B-06
**Tools**: Node local / manifest/mobile_pack; executor Luna max.
**Done when**:
- [ ] Matriz 19 tipos/7 paz e transições literais verdes; Mobile Full/tsc/theme/a11y/assets; patch/manifestações próprios e preservação dos 3408 caminhos anteriores.
**Tests**: unit comportamento
**Gate**: Mobile Full + patch manifest
**Commit**: test(analytics): prove mobile permission and peace boundaries

## Phase Execution Map

```
Phase 1: T1 --> T2 --> T3 --> T4
```

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1 | 1 documento | Granular |
| T2 | 1 módulo + 1 teste | Granular |
| T3 | 1 teste novo | Granular |
| T4 | 1 teste novo + pacote documental | Granular |

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | início | Match |
| T2 | T1 | T1 --> T2 | Match |
| T3 | T2 | T2 --> T3 | Match |
| T4 | T3 | T3 --> T4 | Match |

## Test Co-location Validation

| Task | Layer | Required | Task Says | Status |
|---|---|---|---|---|
| T1 | Documento | N/A com motivo | N/A documental | OK |
| T2 | Cliente | unit | unit | OK |
| T3 | Cliente | unit | unit comportamento | OK |
| T4 | Cliente | unit | unit comportamento | OK |
