# R26a — tarefas e rastreabilidade

Status: Verified LOCAL após QA2 independente PASS e quatro validate_state exit 0; commits documentais de fechamento aguardam janelas ROOT. T1/T2 API, T3 PANEL/WEB e C1 de teste estão commitados localmente. A V1 completa permanece pendente. Os três commits documentais serão separados dos commits de fonte e somente ocorrerão após janelas ROOT.

## Test Coverage Matrix

Proveniência: `eclessGO/AGENTS.md`, `eclessgo-api/pyproject.toml`, `eclessgo-painel/package.json`, padrões lidos de R24b e testes de interface existentes; nenhuma fixture, helper ou teste antigo foi executado como prova R26a. L-026 exige verificar novas chaves em ambos idiomas; L-036 exige limpar erros após cada edição relevante. Cobertura e comandos ainda sujeitos à revisão do ROOT.

| Camada | Teste exigido | Cobertura | Local | Comando |
|---|---|---|---|---|
| Domínio, autorização, persistência | unitário e integração | Cada AC pertinente, transições, revogações, rollback, replay e corrida de duas redes | `tests/r26a/test_core.py`, `test_persistence.py`, `test_postgres.py` | Quick + PG próprios |
| Router, schema e migração OWN | HTTP sintético, OpenAPI e banco | Todos os métodos e status, corpo fechado, no-store, isolamento, upgrade/downgrade somente OWN | `tests/r26a/test_http.py`, `test_openapi.py`, `test_migration.py` | HTTP + migration próprias |
| Painel e acesso | unitário e integração de componentes | Ambos idiomas, ações, navegação, login/bootstrap sem Church, MEMBER responsável, negação anterior, revogação e respostas obsoletas | `src/features/network-membership/*.test.*` | UI próprio + tipagem isolada |
| Contratos gerados | comparação e tipagem isoladas | OpenAPI das operações novas; três consumidores; MOBILE igual e carrier reversível se houver alteração | PANEL, WEB e MOBILE gerados no manifesto | contratos + tipagem isolada |

## Gate Check Commands

Os comandos abaixo são os pontos de entrada propostos, não resultados. Executar em cópias/ambientes novos e guardados, com dependências preexistentes somente como insumo read-only; nenhum comando pode ler/importar/hash/stat os quatro caminhos proibidos. Antes de cada execução, conferir fechamento de imports e proteger os caminhos; se a ferramenta não puder garantir isso, bloquear em vez de executar. Não usar bootstrap da aplicação integral nem testes/helpers/fixtures históricos como evidência nova.

| Gate | Comando e critério |
|---|---|
| Quick | No clone isolado API: `python3 -m unittest discover -s tests/r26a -p 'test_core.py'` e o mesmo com `test_persistence.py`; SQLite novo. |
| PG | Runner privado novo, criado com modo 600 e pin antes de execução, chama `python3 -m unittest discover -s tests/r26a -p 'test_postgres.py'` em PostgreSQL sintético novo; sem imprimir conexões, headers ou segredos. |
| HTTP | `python3 -m unittest discover -s tests/r26a -p 'test_http.py'` e o mesmo com `test_openapi.py`; router e dependências recortados com doubles explicitados, distinguindo rotas relativas e montagem padrão `/api/v1`. |
| Migration | `python3 -m unittest discover -s tests/r26a -p 'test_migration.py'` em SQLite e PostgreSQL novos; apenas revisão OWN, sem ancestrais. |
| UI | Runner privado T3 chama launch-ui-wt-v4.py e launch-ui-head-v4.py em cópias allowlistadas, com dependências locais read-only e rede bloqueada; 34 métodos distintos por variante. |
| Build | TypeScript local sobre projetos temporários allowlistados de PANEL, WEB e MOBILE; comparação da projeção OpenAPI e dos três gerados, mais formatter/linter cirúrgico sobre OWN. Não executar lint global que possa ler arquivo proibido. |

Todos os gates exigem exit 0, zero falhas, erros e skips, contagem explícita de testes/métodos distintos e logs exclusivos 600. Falha ou output inseguro é preservado; correção e repetição recebem novos caminhos. Nenhum hash, import ou setup substitui teste comportamental.

## Execution Plan

```text
T1 -> T2 -> T3
```

As entregas são sequenciais. Um teste de comportamento acompanha o código que o habilita; não existem tarefas de teste adiadas. O manifesto privado lista todos os caminhos futuros, pré-imagens, propostas de espelho e reservas necessárias. T1 usa runner e guarda novos privados, não helpers de teste no produto; a receita reproduzível está no manifesto.

## Task Breakdown

### T1: Núcleo e persistência

**What**: Criar rede, solicitações, transições, projeções autorizadas, histórico e garantias transacionais em código próprio, com testes novos SQLite/PG.
**Where**: `src/application/network_membership/use_cases.py`
**Depends on**: None
**Requirement**: NET-01–26, NET-32–33 nas fronteiras aplicáveis.
**Tests**: unitário e integração SQLite e PostgreSQL próprios, sem HTTP ou migração.
**Gate**: Quick + PG, incluindo duas aprovações simultâneas para a mesma comunidade em redes distintas, só uma vencedora; revogar conta/sessão/Membership entre autenticação e ação; reabrir conexões; conferir rollback, unicidade, atores e ausência de Membership criada.

**Done when**:
- [x] Cada resultado de domínio/autorização aplicável tem teste novo derivado da spec; relatório lista contagem, exits e cobertura NET, sem skips.
- [x] Novos arquivos e pré-imagens coincidem com manifesto e reserva explícita; transação preserva dados e eventos sob concorrência.
- [x] Fonte e documentação OWN foram commitadas em janela API liberada; HEAD+OWN e WT+OWN passaram os gates necessários sem absorver hunks alheios.

### T2: API, OpenAPI e migração própria

**What**: Expor o core em router autenticado, com `is_responsible` por NetworkSummary, contratos fechados, migração OWN e testes novos de HTTP/OpenAPI/DDL.
**Where**: `src/infrastructure/api/routers/v1/network_membership_router.py`
**Depends on**: T1
**Requirement**: NET-01–26 e NET-32–33.
**Tests**: HTTP sintético, OpenAPI e integração de migration OWN em SQLite e PostgreSQL novos.
**Gate**: HTTP + Migration + Build aplicável; cobrir todos os status, papéis, projeções, replay, conflitos, sanitização, no-store, rollback e acesso revogado; provar mount padrão `/api/v1` sem prefixo duplicado.

**Done when**:
- [x] Receber autorização nominal para ler apenas revision, down_revision, branch_labels e depends_on dos cabeçalhos necessários; confirmar head antes de escrever a revisão própria, sem executar ou ler corpos ancestrais.
- [x] Upgrade/downgrade da revisão OWN passa nos bancos novos, conserva sentinelas e confere tipos, FKs, CHECKs e índices UNIQUE com a metadata T1.
- [x] `NetworkSummary.is_responsible` é true para o responsável e false para SUPER_ADMIN de outra rede e ADMIN vinculado não responsável; não revela outro usuário, não adiciona consulta por rede e não altera os três booleanos globais ou a resposta de criação. Estender a assertion T1 de objeto exato acrescentando false preserva suas verificações de id/nome.
- [x] Cada operação, schema e status HTTP tem assertion; relatório lista contagem/exits e limites de autenticação sintética. Commit API em janela própria.

### T3: Painel e contratos dos clientes

**What**: Implementar a interface e acesso da rede em pt-BR/en, preservar guards e projetar os tipos coordenados de PANEL, WEB e MOBILE.
**Where**: `src/features/network-membership/NetworkMembershipPage.tsx`
**Depends on**: T2
**Requirement**: NET-17–33 e fluxos NET-01–16 consumidos pela interface.
**Tests**: integração de componentes, autenticação/bootstrap/navegação, i18n e contratos/tipagem isolados próprios.
**Gate**: UI + Build; login e bootstrap do responsável sem Church, inclusive MEMBER; negação do USER sem rede, matriz local antiga, ambos idiomas, ações/paginação, 409/erros, descartes e três gerados.

**Done when**:
- [x] Formulários usam conta por e-mail exato e comunidade por slug ou URL http/https dos dois caminhos existentes; sem userinfo ou request externo. Testes provam descarte de query/fragmento, persistência só do slug canônico e rejeição dos demais formatos; nenhum catálogo novo ou dado não autorizado.
- [x] Novas traduções usam arquivos próprios; JSONs de locale herdados não são alterados. Testes verificam as chaves em pt-BR e en.
- [x] Comparar e tipar os três gerados; se MOBILE mudar, produzir carrier PANEL, aplicar/reverter em cópia com fuzz zero e comparar bytes. MOBILE permanece sem Git.
- [x] Preservar pré-imagens e qualquer hunk misto; commits PANEL `43fb5055cab6225b9944125d65055b6464153eb3` e WEB `90a12a20f4212e30ddec3cdcdf8618ffa9eadd22` feitos em janelas separadas; MOBILE permanece sem Git.

## Diagram-Definition Cross-Check

| Tarefa | Depends on | Diagrama | Resultado |
|---|---|---|---|
| T1 | None | início | OK |
| T2 | T1 | T1 -> T2 | OK |
| T3 | T2 | T2 -> T3 | OK |

## Test Co-location Validation

| Tarefa | Camadas | Exigido | Na tarefa |
|---|---|---|---|
| T1 | Core e banco | Unitário + integração SQLite/PG | Sim |
| T2 | Router, OpenAPI, migração | HTTP + DDL/PG OWN | Sim |
| T3 | UI, navegação, tipos | Componentes + acesso + contratos | Sim |

## QA e fechamento

- [x] QA1 independente: FAIL histórico por lacuna NET-15; `validation-iteration-1.md` preserva o relatório original nos quatro espelhos.
- [x] C1 adicionou um teste de rollback não-DBAPI sem alteração de produto e foi commitado na API em `0f382277f19ab011568b41287dffb0850cf7c661` (pai `0fd9a503db99087f0fad6123b2f2c44263930cd6`).
- [x] QA2 independente posterior: PASS em NET-01–33; 49 métodos API e 34 UI distintos, 342 sites API (235 assertions e 107 helpers) e 114 expect UI. WT e HEAD executaram os mesmos 34 métodos UI; não são 68 distintos.
- [x] Oito faults mortos, 16 controles verdes e zero survivors, erros, skips ou avisos nos gates aceitos. O S4 exato SHA-256 `6bd9c0453a933cebd9c908a18ce491cb0d5f68158df6400a78b9930984c9d7c1` foi morto pelo teste C1: `test_persistence.py:396` esperou `PENDING v1` e observou `APPROVED v2` na cópia mutante.
- [x] Os quatro `validate_state` da QA2 retornaram exit 0. O relatório canônico `validation.md` é PASS e imutável, SHA-256 `198df34e22aea7ff4b4a67a1a56abd506604ad324b584e903f417ff192125794`; o histórico QA1 imutável tem SHA-256 `39de97078f771d632ea9a1808016a831984a4b64c5e378698534007c419a2192`.
- [x] O conteúdo de fechamento está preparado; os commits documentais aguardam janelas ROOT separadas e não são fontes cobertas pela QA2.

QA2 tipou 13 raízes de fonte e três gerados com versões próprias; projeção incremental: oito operações, 29 schemas e quatro renomes; carrier MOBILE com aplicação/reversão fuzz 0. Lint PANEL: zero achados novos, dois preexistentes em App/client; Ruff: sete fontes limpas, um I001 em main igual ao parent e teste C1 limpo. Evidência: `.specs/evidence/r26a-network-membership/qa2-af09c298-fbe1-4f9d-964d-de6e3cbd07cb/manifest-qa2.md`, SHA-256 `d2209a7612eafe0ed0ab43eeee3a0b30e45c5acdf78429225eea27b9924b092e`.

A prova usa esquemas mínimos SQLite/PG, migration OWN, autenticação/factory HTTP sintéticas e UI JSDOM com recortes reais e apoio sintético. Não certifica JWT real, navegador ou aplicação integral, native, UAT ou produção; providers permaneceram OFF. Incidentes e ressalvas processuais seguem em `preservation.md`, sem inferir novo aceite humano.

## T1 — preparação local para revisão

Os testes novos passaram: 6 unitários, 23 SQLite e 2 PostgreSQL, 31 métodos distintos; zero falhas, erros, skips ou avisos. Ruff isolado retornou zero achados. A corrida PG usou duas conexões e dois ADMINs distintos, com uma aprovação/evento e o perdedor PENDING/CONFLICT. Os ambientes, pinos e mapa por assertion estão em `.specs/evidence/r26a-network-membership/t1-d72301f3-873b-4d39-9fae-5dddfeaa7ac9/`. A execução inicial SQLite interrompida por restrição de socketpair e o RED de URL são histórico, não gates aceitos ou sensores de QA. Testes são isolados; não certificam JWT, rotas, app integral ou produção.

T1 foi commitada em `9a00b81dbce306972fd0408002bd522b3432e7c4`; T2 foi concluída em janela própria.

## T2 — pré-reserva documental

T1 foi commitada em `9a00b81dbce306972fd0408002bd522b3432e7c4`. O ajuste por rede acima altera apenas a projeção técnica e seus testes, sem ampliar papéis; os oito caminhos propostos, inclusive as duas pré-imagens T1, constam no manifesto privado T2. Nenhum código ou teste T2 foi alterado nesta preparação.


## T2 — verificação local para revisão

Nos pins finais: 6 métodos unitários, 24 SQLite e 2 PostgreSQL de núcleo; 12 HTTP sintéticos, 2 OpenAPI e 2 de migration OWN, um em SQLite e outro em PostgreSQL. São 48 métodos distintos, sem somar repetições; zero falhas, erros, skips ou avisos de teste. A corrida PG usou duas conexões e dois ADMINs. O teste HTTP de falha no evento confirma 503 e rollback de estado e histórico em conexão física nova. O mapa direto/reverso e os recibos privados estão em `.specs/evidence/r26a-network-membership/t2-9484e5bd-49cc-4763-b1e8-16fe5d280938/`.

Ruff isolado E/F/I/B em contexto de pacote e `src` first-party: sete caminhos sem achados; `main.py` mantém um I001 também presente na pré-imagem sob o mesmo contexto, sem achado novo. Os resultados de HTTP usam autenticação e factory sintéticas; o guard comunitário é código real recortado com dependências sintéticas. OpenAPI verifica as oito operações e o esquema sintético equivalente, não prova JWT real ou bootstrap integral. Migration executa apenas a revisão OWN; nenhuma cadeia ancestral foi executada.

Os gates locais não são QA independente nem Verified. T2 foi commitada em `0fd9a503db99087f0fad6123b2f2c44263930cd6`; à época T3 estava em preparação; QA independente ocorrerá após a última fonte commitada.


## T3 — pré-reserva para revisão ROOT

A lista nominal completa, pré-imagens HEAD/WT e modos, ausências, claims, caminhos readonly e gates estão no manifesto privado `.specs/evidence/r26a-network-membership/t3-preflight-105ec71b-9ab9-4377-a4b9-06c747bd6a11/manifest-t3.md`. Além dos caminhos T0, propor `src/api/client.ts` e `src/pages/Login.tsx`; os dois estão limpos. `useLoginPageState.ts`, `Sidebar.tsx` e `ChurchSwitcher.tsx` são mistos, foram preservados e não precisam de escrita prevista.

Testes novos devem cobrir login e bootstrap do responsável sem Church, MEMBER responsável com e sem acesso anterior a equipes, USER sem rede negado, SUPER_ADMIN e ADMIN local; visita a `/login`, fallback e entrada na rota sem ciclos; visibilidade e ações por rede/comunidade; pedidos pendentes, encerrados e histórico; paginação, 409 e erros sem eco; mudança de sessão/comunidade, abort e resposta tardia. Exercitar equivalência de caminhos relativos/versionados e a matriz anterior do cliente, refresh e logout com identidades sintéticas. Locales próprios pt-BR/en e contratos/tipagem dos três clientes são obrigatórios.

Execução futura usa runtime novo, arquivos, aliases e configuração privados allowlistados, com guard antes de qualquer leitura/stat/import/realpath dos quatro sufixos proibidos. Nada de config padrão Vitest/tsc que percorra a árvore. Resolver fechamento de imports antes de executar; se não for possível, parar e informar. Nenhum gerado ou código T3 foi escrito nesta pré-reserva.


O gate do cliente também deve simular credenciais de duas sessões distintas sem imprimir seus valores: a capacidade de login é consultada pela sessão em negociação, nunca pela conta anterior; troca de geração antes da resposta impede aceitação ou navegação. O override, se necessário, é limitado à consulta R26 e não muda endpoints antigos.


Os testes devem provar a rota e o fallback também após reload/bootstrap, carregamento e indisponibilidade da capacidade, sem armazenar autorização em cache que atravesse sessões. Exercitar MEMBER com capacidade de rede e MEMBER sem ela, mantendo o caminho anterior para quem tem acesso de equipes; testar também que o ChurchSwitcher readonly não é necessário quando não há comunidade.


## T3 — verificação local para revisão

A interface, o cliente compartilhado e os contratos foram preparados nos caminhos reservados. A suíte tem 34 métodos distintos e 114 assertions literais em 31 declarações: WT+OWN e HEAD+OWN passaram, cada um com exit 0, zero falhas, skips ou avisos. Login/formulário e Sidebar reais foram recortados com dependências sintéticas; não há teste de navegador, JWT real ou aplicação integral.

TypeScript isolado passou nas 13 raízes PANEL com TS 5.8.3 e nos três contratos gerados com TS 5.8.3, 5.9.3 e 6.0.3, sem duplicatas. O lint isolado de 15 fontes teve zero achados novos; dois achados anteriores em App.tsx e client.ts foram conservados. O carrier MOBILE aplicou e reverteu com fuzz zero e bytes exatos. Os detalhes, limites e mapa direto/reverso estão em .specs/evidence/r26a-network-membership/t3-b16b919b-a63c-4f71-9acb-946201141845/.

Os commits PANEL e WEB foram feitos em janelas separadas: `43fb5055cab6225b9944125d65055b6464153eb3` e `90a12a20f4212e30ddec3cdcdf8618ffa9eadd22`. MOBILE permanece sem Git. Naquele checkpoint, a QA independente permanecia pendente; seu resultado posterior consta em QA e fechamento.


## C1 — regressão não-DBAPI para NET-15

C1 adiciona somente `test_non_dbapi_audit_failure_rolls_back_state_and_history_on_new_connection` em `eclessGO/eclessgo-api/tests/r26a/test_persistence.py`. O teste injeta `RuntimeError` em `SqlNetworkUnit.append_event` durante uma transição `approve` real, depois da atualização do vínculo. Ele exige `UNAVAILABLE` e confere o estado persistido por uma engine nova com `NullPool`; Memberships e o histórico anterior também permanecem iguais. Nenhuma fonte de produto ou outro teste foi alterado.

| NET-15 — resultado esperado | Assertion nova | Valor conferido |
|---|---|---|
| A falha é devolvida como indisponibilidade, mapeada pelo endpoint para 503. | `eclessGO/eclessgo-api/tests/r26a/test_persistence.py:377` — `self.assertEqual(caught.exception.code, "UNAVAILABLE")` | `UNAVAILABLE` |
| A atualização parcial do vínculo é revertida em conexão física nova. | `eclessGO/eclessgo-api/tests/r26a/test_persistence.py:396` — `self.assertEqual([(row["id"], row["status"], row["version"]) for row in links], [(LINK1, "PENDING", 1)])` | `PENDING`, versão `1` |
| A operação não acrescenta evento de aprovação e conserva o histórico. | `eclessGO/eclessgo-api/tests/r26a/test_persistence.py:401` — `self.assertEqual([(row["link_id"], row["action"], row["version"]) for row in events], [(None, "NETWORK_CREATED", 1), (LINK1, "REQUESTED", 1)])` | `NETWORK_CREATED`, `REQUESTED` |
| Membership e seus dados não mudam. | `eclessGO/eclessgo-api/tests/r26a/test_persistence.py:418` — `self.assertEqual(member_snapshot(members), member_snapshot(members_before))` | snapshot integral igual |

| Assertion C1 | Requisito coberto |
|---|---|
| `test_persistence.py:377` — `caught.exception.code == "UNAVAILABLE"` | NET-15: falha anterior ao commit retorna 503 pela camada HTTP. |
| `test_persistence.py:396` — vínculo `PENDING v1` em engine nova | NET-15: reverte o estado parcial. |
| `test_persistence.py:401` — somente `NETWORK_CREATED` e `REQUESTED` | NET-15: não acrescenta evento da transição falha. |
| `test_persistence.py:418` — snapshot de Membership idêntico | NET-15: preserva Membership e demais dados da operação. |

O gate local executado em cópia allowlisted teve 25 testes de persistência SQLite, 6 unitários e 12 HTTP: 43 métodos distintos, zero falhas, erros, skips ou avisos. Ruff E/F/I/B passou no teste OWN. No sensor C1, o controle intacto passou antes e depois (1 teste cada); o S4 exato, que troca rollback por commit para exceção não-DBAPI, falhou na assertion de estado com `APPROVED v2` em vez de `PENDING v1`, sem erro de setup ou timeout. Os outputs, pins, pre-imagens e mapas estão em `.specs/evidence/r26a-network-membership/c1-3afa0eec-7963-4684-ab84-676a357f6ad2/`.

No momento de C1, o `validation.md` então vigente era FAIL, SHA-256 `39de97078f771d632ea9a1808016a831984a4b64c5e378698534007c419a2192`; `validation-iteration-1.md` preserva essa cópia byte a byte. C1 foi cobertura local, não QA independente; a QA2 posterior passou após o commit API C1.
