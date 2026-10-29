# R24b Tasks

## Execution Protocol

Ativar tlc-spec-driven; cada entrega contém código e seus testes, validação dirigida e um commit local após janela ROOT. Não usar testes, helpers ou fixtures arquivados. Não abrir serviços nem usar credenciais reais. Testes e guards são novos, allowlistados e executados em cópias isoladas com env limpo. O owner preserva hunks herdados e índices; nenhuma árvore é declarada limpa. T1 e T2 foram concluídas; T3 está na reserva nominal aprovada. T4 e T5 dependem de reserva própria.

## Test Coverage Matrix

Guidelines: `eclessGO/AGENTS.md`, skill local, INFO-01..15 e instruções humanas. Testes próprios não dependem de bootstrap. A matriz é por comportamento, sem afirmar que SQLite prova PostgreSQL.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Core e persistência | unit + integration | AI-01..10, corrida, rollback, revogação, reabertura | API tests/r24b | Python isolado tests/r24b/isolation.py e PostgreSQL sintético novo |
| Rotas API | integration | AI-03/04/08/11, inputs e erros | API tests/r24b | Harness próprio T2 |
| PANEL | integration | acesso global, save, conflito, erros, ambos idiomas | PANEL tests/r24b | Harness próprio T3 |
| WEB | integration | AI-12..18 e INFO-01..15, ambos provedores e UI | WEB tests/r24b | Harness próprio T4/T5 |

## Gate Check Commands

| Gate Level | When to Use | Command |
| --- | --- | --- |
| T1 | Núcleo API | Runtime Python autorizado em env limpo, `-I tests/r24b/isolation.py --workspace-root ROOT --api-root API --evidence-dir EVIDENCE` com cópia nominal; `postgres_runner.py` recebe os mesmos três flags e cria somente container/DB novos sem rede; lint isolado sem config raiz |
| T2 | Rotas API | Gate T1 mais testes ASGI novos e teste isolado somente da revisão OWN; conferência do head por metadata antes de escrever |
| T3 | PANEL | Testes novos com transporte/sessão sintéticos, tipagem dirigida e geração coordenada reservada |
| T4 | WEB adapters | Testes novos Node com transportes falsos, ordenação, envelopes, validação e tipagem dirigida |
| T5 | WEB UI | Gates T4 e DOM novo em pt-BR/en, page/locale preservation e tipagem dirigida |

## Execution Plan

### Phase 1: Entregas sequenciais

```
T1 → T2 → T3 → T4 → T5
```

## Task Breakdown

### T1: Seleção global transacional

**What**: Núcleo e persistência verificáveis independentemente da aplicação.
**Where**: `src/application/global_ai_provider/use_cases.py`
**Depends on**: None
**Requirement**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, AI-08, AI-09, AI-10
**Nominal paths**: API `src/application/global_ai_provider/{__init__,contracts,use_cases}.py`; `src/infrastructure/persistence/global_ai_provider_{schema,adapters}.py`; `src/infrastructure/persistence/repositories/global_ai_provider_repository.py`; `tests/r24b/{isolation,test_core,test_persistence,test_postgres,postgres_runner}.py`. Docs R24b ROOT/API e evidências próprias. Nenhuma migration ou router nesta entrega.
**Done when**:
- [x] Estado ausente, entrada fechada, SUPER_ADMIN/sessão vivos, stale, no-op, CAS e leitura fresca correspondem à spec.
- [x] Schema OWN e audit mínimo são inspecionados; mudança e audit revertem juntos em falhas antes da durabilidade; confirmação perdida após commit é indeterminada, sem bootstrap nem bases anteriores.
- [x] Gate T1 SQLite e PostgreSQL com dois administradores passa junto à adequação AC↔assertions, contagem/avisos/skips e limites registrados.
**Tests**: unit + integration
**Gate**: T1
**Commit**: feat(assistant): persist global provider selection

### T2: Fronteira HTTP e instalação explícita

**What**: API global administrativa e projeção pública mínima, com revisão de schema própria.
**Where**: `src/infrastructure/api/routers/v1/global_ai_provider_router.py`
**Depends on**: T1
**Requirement**: AI-03, AI-04, AI-08, AI-11
**Nominal paths proposed**: API router acima, `src/infrastructure/api/main.py`, `alembic/versions/r24b_global_ai_provider.py`, `tests/r24b/test_routes.py` e suporte de harness próprio. Confirmar head por metadados nominados, sem importar/executar revisão anterior. Reservar cada caminho antes de alterar.
**Done when**:
- [x] Auth vigente, leitura pública mínima e erros/no-store passam em ASGI isolado; revisão OWN compatível com metadata T1 passa up/down somente em SQLite novo.
- [x] Gate T2 passa com contagens; geração de contratos fica coordenada para T3/T4, sem modificação herdada.
**Tests**: integration
**Gate**: T2
**Commit**: feat(assistant): expose global provider selection

### T3: Seleção no painel

**What**: Editor manual SUPER_ADMIN sem Church e sem credenciais.
**Where**: `src/features/global-ai-provider/GlobalAiProviderPage.tsx`
**Depends on**: T2
**Requirement**: AI-02, AI-03, AI-04, AI-06
**Nominal paths proposed**: PANEL feature `src/features/global-ai-provider/`, `src/App.tsx`, `src/layouts/painel/navigation.ts`, `src/locales/{pt-BR,en}.json`, `src/api/generated.ts`, testes próprios; carrier MOBILE e comparação gerados sob reserva explícita. Baselines para arquivos mistos antes de escrita.
**Done when**:
- [x] SUPER_ADMIN seleciona enum ou nenhum, lida com conflito/falha e não ativa runtime; não SUPER_ADMIN não acessa.
- [x] Gate T3, ambos locales e preservação dos hunks passam; geração coordenada não altera dados herdados.
**Tests**: integration
**Gate**: T3
**Commit**: feat(assistant): manage global provider in panel

### T4: Adaptadores e resolução no servidor web

**What**: Resolver por pedido e implementar ambos adaptadores sem fallback.
**Where**: `src/lib/public-information-assistant-provider.ts`
**Depends on**: T3
**Requirement**: AI-12, AI-13, AI-14, AI-15, AI-16, AI-17, AI-18
**Nominal paths proposed**: WEB provider acima, `src/lib/public-information-assistant.ts`, `src/app/api/public/churches/slug/[slug]/assistant/route.ts`, `src/lib/generated-api.ts`, testes próprios e helpers allowlistados. Reserva detalhada antes de alterar.
**Done when**:
- [x] Ordem validação/resolver/leitor e OFF/default, seleção fresca, transportes OpenAI/Anthropic fake, refusals/truncamentos e validação INFO passam.
- [x] Sem credenciais reais, fallback, retry automático, conteúdo em logs ou request externo; Gate T4 passa.
**Tests**: integration
**Gate**: T4
**Commit**: feat(assistant): connect selected ai provider

### T5: Disponibilidade honesta na conversa

**What**: Exibir prontidão mínima e manter interação manual localizada.
**Where**: `src/components/site/public-information-assistant.tsx`
**Depends on**: T4
**Requirement**: AI-18 e INFO-11..15
**Nominal paths proposed**: WEB componente acima, `src/app/igrejas/[slug]/page.tsx`, `src/messages/{pt-BR,en}.json` e testes próprios. Baseline dos três mistos antes de escrita.
**Done when**:
- [x] Estados configured/unavailable são honestos, sem segredo e sem pergunta automática; mudança/contexto mantém abort e INFO-11..15.
- [x] Gate T5 e comparação de hunks OWN nos três mistos passam. QA independente segue após última fonte e commit.
**Tests**: integration
**Gate**: T5
**Commit**: feat(assistant): show public assistant availability

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram | Status |
| --- | --- | --- | --- |
| T1 | None | início | Match |
| T2 | T1 | T1 → T2 | Match |
| T3 | T2 | T2 → T3 | Match |
| T4 | T3 | T3 → T4 | Match |
| T5 | T4 | T4 → T5 | Match |

## Test Co-location Validation

| Task | Layer | Matrix Requires | Task Says | Status |
| --- | --- | --- | --- | --- |
| T1 | core/persistência | unit + integration | unit + integration | Match |
| T2 | API | integration | integration | Match |
| T3 | PANEL | integration | integration | Match |
| T4 | WEB adapter | integration | integration | Match |
| T5 | WEB UI | integration | integration | Match |

## T1 checkpoint

T1 pronto para revisão e janela de commit; nenhum commit foi criado. SQLite novo: 11 testes distintos, zero falhas, erros, skips ou avisos. PostgreSQL 17.11 sintético novo: quatro testes distintos, zero falhas, erros, skips ou avisos; dois SUPER_ADMINs distintos e barreiras exercitaram criação e atualização concorrentes, correlacionando o ator auditado ao vencedor. Controles e assinaturas estão na evidência privada. As tabelas users e church_members da fixture SQLite são sintéticas e mínimas; users no PostgreSQL também é sintético; não se alegam JWT, app completo, migrations, produção ou capacidade de recuperar uma confirmação perdida após commit.

O primeiro ambiente de teste SQLite bloqueou o socketpair local do asyncio; o gate aceito executou isolado, fora do sandbox, sem alteração de agendamento e com rede bloqueada pelo guard. As tentativas instrumentais anteriores são preservadas. A imagem PostgreSQL alterou o modo do diretório do socket para 3775 sob pai 0700; o runner corrigiu para 0700 antes dos testes. Os três containers sintéticos foram parados e preservados.

## T2 checkpoint

T2 está pronta para revisão e janela de commit; ainda não foi commitada. A API expõe GET público mínimo e GET/PUT administrativos sem Church; a identidade e a sessão são revalidadas no boundary T1. OpenAPI descreve request tipado fechado, sucesso e códigos de erro específicos; duplicatas e exceções são tratadas sem eco do body e todas as respostas testadas usam no-store.

Passaram 15 métodos novos distintos (12 HTTP/OpenAPI/factory e três DDL), zero falhas, erros, skips e avisos. O runner usa cópias e SQLite novos; autenticação e factory HTTP são doubles declarados. O teste direto da factory confirma sessão de UoW distinta enquanto a sessão de autenticação permanece aberta. Isso pode ocupar duas conexões; contenção do pool sob carga não foi certificada.

A revisão OWN tem parent `r28b_participation_review` e foi exercitada isoladamente, sem corpos de revisões antigas. SQLite confirma colunas, PK, FK, CHECK e UNIQUE da metadata T1 e preserva tabelas/dados sentinela em upgrade/downgrade. A QA independente deve executar upgrade e downgrade somente da revisão OWN em PostgreSQL novo, comparar tipos e invariantes FK/CHECK/UNIQUE com a metadata T1 e preservar users sentinela, sem executar ancestrais. PostgreSQL para a revisão nova, JWT real, bootstrap/app completo, migrations ancestrais, schema migrado completo, operação real e produção ainda não foram certificados. T1 permanece sem alterações; seus 11 caminhos coincidem com os pins dos gates SQLite/PG anteriores.

## T3 checkpoint

T3 passou os gates dirigidos e aguarda janela de commit PANEL. Foram oito métodos Node distintos, executados em WT e HEAD+OWN, e dois métodos backend diretos em SQLite novo; nenhum falhou ou foi ignorado e não houve warnings. A tipagem dirigida passou nas duas variantes. A sessão e a autenticação do backend direto são sintéticas; não se alegam JWT ou app integral.

Os hunks de ambos locales são idênticos em WT e HEAD+OWN e sua remoção recupera as preimagens em bytes. A projeção incremental da OpenAPI mínima validou três operações, seus status, envelopes e códigos, fechamento de referências e 13 tipos novos sem colisão. O renderer existente amplia os const de erro para string; os códigos exatos permanecem no OpenAPI/runtime. PANEL e MOBILE são idênticos; o patch MOBILE foi aplicado e revertido em cópia com fuzz zero. O candidato WEB permanece privado para T4. A QA independente continua obrigatória após T5, incluindo PostgreSQL somente da revisão OWN.

## T4 checkpoint

T4 passou o gate dirigido e aguarda janela de commit WEB. São 29 métodos Node distintos: seis provider, cinco resolver, doze handler e seis route; zero falhas, skips ou warnings no gate final. O typecheck isolado usou TypeScript 5.9.3. Transportes e configuração são sintéticos; não houve chamada de fornecedor, credencial real ou ativação.

A seleção é consultada por pedido após validação, com timeout de 8000 ms e abort antes do leitor. OFF, nenhuma seleção e configuração ausente do selecionado retornam 503 NOT_CONFIGURED; resolução indisponível retorna 503 UNAVAILABLE. Timeout de adaptador continua 5000 ms/504; transporte/HTTP falho dá 503 e recusa, truncamento ou seleção inválida dá 502. Chave JSON duplicada, inclusive escapada, foi um defeito do draft reproduzido e corrigido antes do commit; o RED e o patch estão preservados, sem contá-los como QA ou sensores independentes.

A saída OpenAI aceita reasoning documentado com uma mensagem final; Anthropic usa Bearer e versão 2026-10-21, com workspace opcional para chave não vinculada. Nenhum modelo ou limite financeiro padrão foi escolhido. O candidato gerado incremental de T3 foi aplicado e os três clientes coincidem. T5 e QA independente após a última fonte seguem obrigatórios, incluindo PostgreSQL novo somente da revisão OWN e os sensores comportamentais.


## T5 checkpoint

T5 passou os gates dirigidos e aguarda janela de commit WEB. Foram 11 métodos distintos: sete de componente e quatro de página/alias, executados em WT+OWN e HEAD+OWN; nenhum falhou ou foi ignorado e não houve warnings. A tipagem isolada passou nas duas variantes. React, NextIntl, componente, página e alias são reais; fetch, resolver e outras fronteiras da página são sintéticos.

O resultado de prontidão é apenas booleano e momentâneo. Não há chamada de fornecedor ao renderizar, sondagem ou pergunta automática; o formulário permite tentativa manual e o POST reavalia a seleção. Histórico de dez pares, fontes locais, escape, erros, abort e descarte por mudança de contexto continuam exercitados nos dois idiomas. Os hunks próprios da página e dos dois locales são idênticos em WT e HEAD, e sua reversão recupera cada preimagem em bytes.

O commit T5 não encerra a feature. Seguem QA independente nova, pelo menos cinco faults comportamentais com controles antes/depois e PostgreSQL novo somente da revisão OWN com tipos/FK/CHECK/UNIQUE e users sentinela, sem ancestrais. Não se declara Verified, operação real ou UAT.
