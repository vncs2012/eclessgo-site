# R11 Tasks

## Execution Protocol

Usar tlc-spec-driven3.3.0 local imutável e Execute/adequacy review. Autorização AD-013 substitui pedidos rotineiros de aprovação de spec/design/tasks/tools. Principal faz planejamento/revisão/gates/commits; executor Luna/max/forknone um por vez, sem aninhar. Cada task fecha com status+spec espelhados no repo e commit próprio antes da próxima. Verifier novo Luna/max no fim. Preparação baseline não altera produto.

**Design**: `.specs/features/r11-people-crm/design.md`
**Status**: In Progress — T1–T4/T11 concluídas; T5 próxima

## Test Coverage Matrix

Guidelines: API pyproject.toml (pytest, coverage≥80%, Ruff E,F,I,B); CI e scripts/release-local-check.sh a reconferir; painel package.json (lint=tsc, unit Vitest, build Vite, contratos/schemas/tokens/assets); testes amostrados API test_account_export_projection.py, test_account_rights.py, test_membership_administration.py, postgres/test_migrations_and_constraints.py; painel permissions.test.ts, useMembersPage.delivery.test.tsx e FinanceiroPage.test.tsx. Defaults fortes para caminhos novos. Lições confirmadas L026 e L036 aplicadas a locales/erros de formulário.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
|---|---|---|---|---|
| DTO/normalização | unit | Campos/limites/E1–E4 e enums exatos | API tests/unit/test_person_dto.py | python -m pytest -q tests/unit/test_person_dto.py |
| Repository/use cases | integration | Todos ACs aplicáveis, tenant/dedupe/rollback/direitos | API tests/integration/test_people_*.py | python -m pytest -q tests/integration/test_people_*.py |
| Router | integration | Cinco operações, happy/validação/401/403/404/tenant para cada | API tests/integration/test_admin_people_api.py | python -m pytest -q tests/integration/test_admin_people_api.py |
| Model/migration | integration PostgreSQL | Upgrade/downgrade/reupgrade descartável, FK/check/index/persistência | API tests/postgres/test_people_migration.py | POSTGRES_TESTS=1 python -m pytest -q tests/postgres/test_people_migration.py |
| Client/hooks | unit | Payload, tenant em chave/operação, erro/resultados tardios | painel features/people/*.test.* | node node_modules/vitest/vitest.mjs run src/features/people |
| Páginas/form/navigation | unit + navegador real | Lista/form/detalhe estados completos, papéis, pt/en e E5 | painel features/people/**/*.test.tsx + QA roteiro | Vitest Full + browser contra PG R11 |
| Contratos/scripts | unit/integration | Generated check e tipos3clientes, guards do ambiente | API tests/unit/test_people_contracts.py e QA | generate_api_contracts.py --check + tsc |

## Gate Check Commands

Python API `/mnt/data/poetry/virtualenvs/eclessgo-api-gQym8Hwm-py3.14/bin/python`; Node `/mnt/data/npm-cache/node-v24.18.0-linux-x64/bin/node`. Usar PATH local, sem npx/download. Logs completos por task. Não usar helper api_gate como substituto de Ruff E,F,I,B. Executar com PYTHONDONTWRITEBYTECODE=1, pytest no cache em scratch.

| Gate Level | When to Use | Command |
|---|---|---|
| Quick | DTO/unidade | Testes da task + python -m ruff check src tests config scripts alembic (conjunto configurado integral) + git diff --check |
| Full | API integração/painel payload/texto | Quick + testes integração afetados; painel node node_modules/vitest/vitest.mjs run + node node_modules/typescript/bin/tsc --noEmit + contratos --check |
| Build | Fim fase/config/schema | API pytest --cov=src --cov-report=term-missing + Ruff integral + contratos --check + renderer dicionário --check; painel Full + Vite build outDir scratch + checks tokens/form-schemas/assets; web/mobile tsc + consumidores relevantes; PG migration suite somente banco isolado R11 |

Baseline identifica falhas herdadas por nome/log/hash. Nova falha/regressão bloqueia; não enfraquecer checks. Se gate herdado falha, comparar real baseline e HEAD+OWN isolado e registrar limite específico, sem chamar conjunto vermelho de PASS. PostgreSQL não pode ficar como mock/skip no R11.

## Execution Plan

### Phase 1: API

```text
T1 → T2 → T3 → T11 → T4 → T5
```

### Phase 2: Painel

```text
T6 → T7 → T8 → T9
```

### Phase 3: Integração demonstrável

```text
T10
```

## Task Breakdown

### Phase 1: API tasks

### T1: Armazenamento Person
**What**: Criar schema Person e migration verificável PostgreSQL.
**Where**: API `src/infrastructure/persistence/models/person_model.py` (registro ORM/Alembic indispensável incluído).
**Depends on**: None
**Reuses**: BaseModel e Alembic atual.
**Requirement**: CRM-01, CRM-09, CRM-11
**Done when**:
- [x] Person tem schema do design sem FK User e migration reversível só PG R11; constraints/FK/índices assertados; registros preexistentes preservados.
- [x] Build gate e provas de preservação disponíveis.
**Tests**: integration PostgreSQL
**Gate**: Build
**Commit**: feat(people): persist organization scoped people without accounts

**Resultado T1**: PostgreSQL real 1 passed; suíte API 2501 passed/30 skipped, cobertura 86,02%. Ruff focado passa; Ruff integral e seleção CI reproduzem exatamente as falhas herdadas do baseline (85/1), sem novos achados. Isso não constitui gate integral verde nem validação final do R11. Adequação A/C e patch próprio em API `.specs/evidence/r11-t1/`; logs e comparação de preservação também na evidência canônica da raiz.

### T2: Contrato e normalização
**What**: Definir DTOs/normalização determinística de pessoa e duplicidade.
**Where**: API `src/application/people/dtos/person_dto.py`
**Depends on**: T1
**Reuses**: Pydantic DTOs/enums existentes.
**Requirement**: CRM-01, CRM-02, CRM-03, CRM-06, E1–E4
**Done when**:
- [x] DTOs rejeitam extras/invalidos; todos limites/enums e normalização/limpeza opcionais testados com valores exatos.
- [x] Quick gate e adequação passam.
**Tests**: unit
**Gate**: Quick
**Commit**: feat(people): define minimal person contracts and normalization

**Resultado T2**: 62 testes unitários passam na conferência do principal. Ruff focado passa; os conjuntos integrais/CI mantêm exatamente os achados herdados, sem novos achados. Contratos incluem timestamps obrigatórios não nulos UTC-Z, pesquisa com chaves por campo e PUT completo com contatos nullable. Adequação A/C e patch próprio em API `.specs/evidence/r11-t2/`. Matching SQL, isolamento HTTP, direitos e telas ainda pendentes.

### T3: Persistência autorizada e auditoria
**What**: Entregar caso de uso CRM apoiado por queries locais e auditoria atômica.
**Where**: API `src/application/people/use_cases/person_use_cases.py` (repository dependente incluído para tornar comportamento testável).
**Depends on**: T2
**Reuses**: AuditLogRepository e envelopes.
**Requirement**: CRM-01, CRM-02, CRM-04, CRM-05, CRM-06, CRM-07, CRM-09, CRM-10, CRM-11, E2–E4/E6
**Done when**:
- [x] List/get/create/update/duplicates persistem resultados exatos com isolamento; queries iguais no count; auditoria mínima/rollback/direitos comprovados.
- [x] Full gate e adequação passam; 21+ locais e estrangeiros exercitam paginação.
**Tests**: integration
**Gate**: Full
**Commit**: feat(people): add tenant queries and transactional person audit

**Resultado T3**: conferência principal103 testes API (DTO/People/direitos), painel1239/68 e tipos0, contracts3clientes --check0, renderer métricas0. Testes executam SQLite real, triggers de rollback e rotas existentes de direitos; SQL PostgreSQL é compilado, não apresentado como execução PG CRUD. UPDATE scoped e 23 fichas locais com estrangeiras/apagadas; alerta OR/limite10, campos auditados exatos (quatro alterações isoladas/sem alteração), contas/tokens/transportes preservados. Ruff próprio0; conjuntos integral/CI continuam byte-idênticos ao baseline vermelho. HTTP Pessoas/autorizações e integração PG/navegador continuam pendentes T4/T10. Evidência A/C e patch API `.specs/evidence/r11-t3/`.

### T11: Fechar Ruff integral herdado
**What**: Corrigir exclusivamente formatação de linhas e imports que bloqueiam os gates integrais, incluindo somente os dois hunks preexistentes autorizados AD-014/015.
**Where**: API arquivos identificados pelo Ruff integral E,F,I,B (sem alteração de configuração ou supressão).
**Depends on**: T3
**Reuses**: Ruff local configurado e baseline congelado.
**Requirement**: Gates obrigatórios de R11; preservação AD-003/014/015.
**Done when**:
- [x] Ruff integral e seleção CI passam no checkout; HEAD+OWN passa com o import autorizado e sem demais hunks alheios.
- [x] Equivalência de AST/comportamento, testes afetados e reversão apenas em scratch comprovam preservação; diferenças de imports são enumeradas.
**Tests**: integration + equivalência de AST
**Gate**: Full
**Commit**: style(api): close inherited ruff findings for the person crm gate

**Justificativa antes da execução**: T4 reproduziu os85 achados do baseline. O usuário exige o conjunto integral e proíbe Verified com gate vermelho; corrigir formatação é dependência da entrega. AD-014 autoriza somente o import já correto no checkout. O Ruff integral de HEAD+OWN revelou ainda uma linha em branco excedente na migration0029, já removida no checkout; AD-015 autoriza somente esse hunk adicional. No teste PG já sujo, ordenar imports adicionados pelo usuário é mudança própria de layout no checkout, sem incluir o helper ou sua assertion no commit. Manter backup/patch dessa composição e comprovar que desfazer apenas o layout próprio recupera bytes do baseline.

**Resultado T11**: Ruff integral E/F/I/B e seleção CI0 no checkout, HEAD+OWN e HEAD+OWN+T4. Nove arquivos de layout têm AST exata,207 nomes de testes/1376 assertions preservados; registry tem só ordem de imports e0029 AST exata, conforme AD-014/015. Teste PG sujo: somente ordem de imports no checkout, foraOWN, reversão em scratch recupera bytes anteriores. Depois do layout:500 testes afetados em scratch e81 People/HTTP/DTO no checkout passam. Principal reconferiu Ruff integral/CI, contracts3 e migration People PostgreSQL real1passed. Build API anterior2582/30skips/86,38% é apoio com equivalência, não uma nova execução pós-layout. Provas e hashes em API `.specs/evidence/r11-t11/`. R11 ainda depende de telas, integração e Verifier.

### T4: Rotas CRM protegidas
**What**: Expor controller CRM completo com dependency/wiring e contratos gerados necessários à integração real.
**Where**: API `src/infrastructure/api/routers/v1/admin_people_router.py`
**Depends on**: T11
**Reuses**: require_church_roles, response/errors e session.
**Requirement**: CRM-01–CRM-11
**Done when**:
- [x] Todas cinco operações têm prova HTTP201/200/422/401/403/404 aplicável, quatro papéis, global sem bypass, tenant e igreja/vínculos apagados/inativos.
- [x] Build gate passa, OpenAPI e contratos gerados dos três consumidores coerentes, tipos3clientes passam e nenhum transporte/identidade criado.
**Tests**: integration
**Gate**: Build
**Commit**: feat(people): expose authorized person crm endpoints

**Ajuste de dependência antes de T4**: publicar os três contratos gerados junto das rotas, pois Build exige contracts --check e deixá-los para T5 criaria falha nova previsível no gate T4. T5 mantém a validação regressiva específica dos consumidores e inventário/política. Nos repositórios separados, commits associados à mesma tarefa são pequenos e listados no resultado; mobile continua sem Git, com patch/manifesto próprio.

**Resultado T4**: API HTTP8 testes, cada estado de sessão/vínculo/igreja/contexto exercita cinco operações; foreign/deleted/missing404 preservam snapshots integrais. Build principal2582passed/30PGskips/86,38%; Ruff integral/CI verde pela dependênciaT11, com AST e testes afetados pós-layout. Painel1239/68, build/checks/tipos3clientes passam. Geração archive95aad13+OWN produz bytes exatos dos três contratos, SHA `b53a94220d0c78cbeae99f659ef335314ce796a1fbf2fcc05a997eb2eabd2773`; mobile tem patch/manifesto, semGit. Logs/adequação API `.specs/evidence/r11-t4/`; commits dos três repositórios associados a esta tarefa são registrados pelo principal. Esta prova HTTP usa ASGI/SQLite, não rede/PG CRUD; T10 e Verifier continuam necessários.

### T5: Contratos dos consumidores
**What**: Provar contratos OpenAPI publicados em T4 e registrar impacto de dados/direitos.
**Where**: API `tests/unit/test_people_contracts.py` (executar gerador existente --check; não alterar sem necessidade).
**Depends on**: T4
**Reuses**: generator e tsc locais.
**Requirement**: CRM-01–CRM-06, CRM-11
**Done when**:
- [ ] Contratos --check e tsc3clientes passam; apenas mudança gerada própria, mobile backup/patch/manifesto exatos.
- [ ] Atualização inventário/retention registra Person/direitos sem aprovar política.
**Tests**: unit/integration contracts
**Gate**: Build
**Commit**: feat(api): publish person crm consumer contracts

### Phase 2: Painel tasks

### T6: Cliente e hooks Pessoas
**What**: Conectar API CRM ao React Query com tenant capturado.
**Where**: painel `src/features/people/hooks.ts` (API/types incluídos como dependência mínima testável).
**Depends on**: T5
**Reuses**: apiClient e auth store/query patterns.
**Requirement**: CRM-13, CRM-15, E5
**Done when**:
- [ ] Queries/mutations usam payload exato, chave tenant e contexto capturado; retorno tardio não muda novo contexto; erro propagado sem retry POST.
- [ ] Full real e HEAD+OWN isolado passam.
**Tests**: unit
**Gate**: Full
**Commit**: feat(people): connect panel queries to the person crm

### T7: Formulário pessoa/visitante
**What**: Entregar formulário reutilizável com duplicidade e validação.
**Where**: painel `src/features/people/components/PersonForm.tsx`
**Depends on**: T6
**Reuses**: UI fields/button/toast e i18n; locales próprios necessários incluídos.
**Requirement**: CRM-03, CRM-07, CRM-14, CRM-15, CRM-16, E1/E2/E4/E5
**Done when**:
- [ ] Campos/erro/carregamento/sucesso e alerta com confirmação explícita; alterar rascunho invalida confirmação; falha duplicates bloqueia e oferece retry.
- [ ] Textos pt/en assertados; Full real/HEAD+OWN passam.
**Tests**: unit
**Gate**: Full
**Commit**: feat(people): add person form with duplicate warnings

### T8: Lista Pessoas
**What**: Entregar página de lista paginada com busca/filtro/estados.
**Where**: painel `src/features/people/pages/PeoplePage.tsx`
**Depends on**: T7
**Reuses**: UI table/loading e hooks T6.
**Requirement**: CRM-04, CRM-12, CRM-13, CRM-15, CRM-16
**Done when**:
- [ ] Paginação20, total/filtros e reset página1 testados; links cadastro/detalhe; vazio/error/retry/loading i18n.
- [ ] Full real/HEAD+OWN passam.
**Tests**: unit
**Gate**: Full
**Commit**: feat(people): add paginated people search and classification filters

### T9: Detalhe e navegação protegida
**What**: Integrar página detalhe/form e rotas/menu com guard ADMIN.
**Where**: painel `src/features/people/pages/PersonPage.tsx` (wiring App/navigation e wrapper form indispensáveis incluídos).
**Depends on**: T8
**Reuses**: ProtectedRoute/navigation/PersonForm e componentes do painel.
**Requirement**: CRM-05, CRM-12, CRM-14, CRM-15, CRM-16, E5
**Done when**:
- [ ] Rotas CRUD navegáveis guardadas, Membros preservado com propósito explícito; troca de tenant zera formulário/ficha e descarta resultado anterior.
- [ ] Build real e HEAD+OWN passam; links/breadcrumbs/idioma verificados.
**Tests**: unit + integration browser
**Gate**: Build
**Commit**: feat(people): wire protected person detail and editing navigation

### Phase 3: Integração tasks

### T10: Ambiente e demonstração real
**What**: Criar runner QA R11 guardado, fixtures sintéticas e roteiro de integração real.
**Where**: `eclessGO/qa/r11-people-crm/` (scripts/configuração isolada e evidências).
**Depends on**: T9
**Reuses**: Venv/Node/imagem PG local, nenhuma instalação/worker.
**Requirement**: CRM-01–CRM-16, E1–E6
**Done when**:
- [ ] API/painel em novas portas ligados PG R11; migrations/fixtures somente volume descartável novo; smoke HTTP+browser cadastro/edição/reload/busca/paginação/duplicidade/restrição com capturas.
- [ ] Build final, preservação baseline e endereços/logs/documentação de parada seletiva disponíveis; antiga demo preservada.
**Tests**: integration + navegador real
**Gate**: Build
**Commit**: test(people): demonstrate isolated person crm integration

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | início | Match |
| T2 | T1 | T1→T2 | Match |
| T3 | T2 | T2→T3 | Match |
| T11 | T3 | T3→T11 | Match |
| T4 | T11 | T11→T4 | Match |
| T5 | T4 | T4→T5 | Match |
| T6 | T5 | fase1→fase2 | Match |
| T7 | T6 | T6→T7 | Match |
| T8 | T7 | T7→T8 | Match |
| T9 | T8 | T8→T9 | Match |
| T10 | T9 | fase2→fase3 | Match |

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | Schema/migration | PostgreSQL integration | integration PostgreSQL | OK |
| T2 | DTO | unit | unit | OK |
| T3 | usecase/repository | integration | integration | OK |
| T11 | lint heredado | integration + equivalência | integration + equivalência de AST | OK |
| T4 | router/wiring | integration | integration | OK |
| T5 | contracts | contracts/tsc | unit/integration | OK |
| T6 | client/hooks | unit | unit Full | OK |
| T7 | form/locales | unit | unit Full | OK |
| T8 | list | unit | unit Full | OK |
| T9 | detail/nav | unit + browser | unit/integration | OK |
| T10 | QA runner | integration + real browser | integration + browser | OK |

## Task Granularity Check

Cada task entrega um componente/contrato coerente; dependências indispensáveis e testes co-localizados entram junto para que nenhum módulo fique sem prova. Sequência3fases, batch API agora6 tarefas pela dependência de lint T11 e batch painel/QA5, delegação já autorizada; principal pede apenas uma task de cada vez e faz commit antes de prosseguir. Fix tasks serão acrescentadas se Verifier falhar.
