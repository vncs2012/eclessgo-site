# R29a — Cinco entregas finitas


## Checkpoint T3 WEB — 2026-10-25 America/Sao_Paulo

T3 implementada localmente em 18 paths WEB e cinco mirrors ROOT, sem índice ou commit. T2 API 4fc63f800271b470d22902870c5cb3ae7014aa74 é dependência concluída; snapshot API/T1/T2 intacto. Os checkpoints anteriores abaixo conservam o histórico. R29a continua em andamento, sem Verified.

A rota /atividades faz GET no-store ao catálogo T2, autoridade de publicação/elegibilidade. Valida página, limite e filtro Church; parâmetros inválidos não viram consulta global. Decoder projeta somente os seis campos públicos e quatro metadados previstos, valida UTCZ/endnull e omite extras/erros brutos. Perfil recebe somente link estável /atividades?church_id=UUID, sem fetch novo ou mudança de cache.

CTA lê NEXT_PUBLIC_PANEL_URL explicitamente, sem fallback PANEL_URL. Exige origem absoluta sem credenciais/path além de barra/query/hash; HTTPS ou HTTP apenas em localhost/127.0.0.1/[::1] explícitos. Origem/UUID inválidos geram texto traduzido sem href. Válida produz exatamente /interesses/atividades/UUID sem query/returnTo/token/contato. Nenhuma sessão, POST, envio ou analytics individual R29 no web. T4 futura implementará acesso protegido/retomada sem envio ao login.

Cancelamento anterior impede GET. Abort durante response.json(), mesmo com corpo que ainda resolve, nunca promove ready nem devolve dados. O caminho real public-api passa PUBLIC_UPSTREAM_TIMEOUT_MS, binding público existente de8.000ms, ao helper OWN; somente sua declaração foi conferida. Prazo cancela I/O e libera timer/listener em finally; não é TTL/retenção. Teste usa5ms apenas na injeção. Novo loading.tsx e view OWN apresentam loading PT/EN com status/busy, sem CTA.

Provas finais de fonte: TSC021 PASS e Node021 TAP29/29,0falhas/erros/skips/cancelled. Sintaxe010 cobre Page HEAD+OWN e request inalterados;022 cobre public-api final. Gates verdes anteriores006/010/015 e24/24 são versões históricas preservadas. Novo caso019 registrou falha comportamental prospectiva real: body cancelado retornava ready, depois corrigido; não é setup ou sensorQA. Node final usa --test-isolation=none autorizado, com os mesmos casos/assertions e TAP individual.007/008 só falharam no arquivo;009 diagnóstico executou23casos21PASS/2FAIL;013 padrão reportou1arquivoPASS. Duas assertions de serialização foram corrigidas com ACK ROOT mantendo valorUTCZ e textoEN codificado exatos.

SSR real verifica views puros/wrapper/loading e GET/decoder/CTAOWN reais; composição i18n real usa recursosPTEN OWN e mensagens antigas sintéticas. Não prova navegador/DOM/hidratação/eventos, transição visual de loading, JWT/login/fullapp, rede/produção ou configuração real. Abort é provado apenas no transporte executado; não há controlador de stale UI em uma rota SSR. DEFAULT_API_BASE_URL é raizAPI versionada preservada; operação deve corresponder ao mount CommunityRouter/settings.api_prefix, não atestado. Imports antigos de config/BFF/client e JSON antigos são stubs, sem substituir o OWN sob prova.

Evidência: ROOT/.specs/evidence/r29a-activity-interest-crm/t3-web-20261025/implementation-v2-sol/. Cinco gates estruturais são registrados após estes docs; manifesto final traz os resultados e todas invocações. QA independente/validate_state ainda não executados; T4/T5 pendentes. R26externa, R24provedor/ativação PAUSADOS, R16a sem expansão, reservasR22b e fechamentos intactos; sem serviço/rede/install/push/deploy/envio.

## Checkpoint atual T2 — 2026-10-25 America/Sao_Paulo

T1 foi commitada em API 2b30d19b6e025e8805907d23b88e83d52931a8e5, parent 5f06b46b7cc66f0b3bfe16eee14a394811e441a5. Seu núcleo/portas/testes permanecem intactos; os trechos T1 abaixo conservam a prova e limitações históricas daquele checkpoint. T2 foi nominalmente liberada por ROOT em15paths API e5mirrors ROOT; índice/commit T2 ainda não autorizados.

P1 foi resolvida diretamente pelo humano: usar publicação atual, Event público/futuro/não excluído em Church PUBLISHED/ativa/não excluída; exclusão lógica remove do catálogo. Nenhum estado individual de aprovação/cancelamento foi criado. P2 autorizou somente cabeçalhos literais das42migrations, inclusive0042. Grafo estático:42nós, sem ciclos/ausentes, head único0042_person_relationships. Nova revision OWN r29a_activity_interests depende desse head; nenhum corpo ancestral foi lido/executado.

Prova atual: discover029 executou56testes (33T1+23T2),0falhas/erros/skips, em2,882s. SQL SQLite em arquivo UUID, NullPool e conexões/sessões independentes, R11 DTO/usecase/repository e AuditLogRepository reais. ASGI mínimo testa os endpoints OWN; identidade de entrada e factory/clock são overrides explícitos, não autenticação JWT/fullapp. Não há prova do driver asyncSQLite nativo nem execução PostgreSQL. PG possui somente SQL NOWAIT compilado e tradução de erro exercitada.

T3–T5 não iniciadas. Feature/requisitos integrados não Verified; QA independente e validate_state ainda não executados. Recibos próprios de T2: ROOT/.specs/evidence/r29a-activity-interest-crm/t2-api-20261025/implementation-v1/. Os resultados finais dos gates estruturais e manifesto são publicados ali depois destes documentos; não se presume um resultado futuro.


## Execution Protocol

Usar tlc-spec-driven e a liberação nominal ROOT. Somente T1 está autorizada. Contrato humano e restrições de ownership prevalecem sobre automatismos da skill. Sem índice/commit até janela explícita; QA independente somente após última fonte commitada. As cinco entregas são unidades de resultado; não representam autorização de executar etapas futuras.

## Test Coverage Matrix

Diretriz: eclessGO/AGENTS.md e tlc-spec-driven. Nenhum teste histórico foi usado como fonte.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
|---|---|---|---|---|
| Núcleo/portas T1 | unit | Invariantes R29A02–06; negação da porta R29A01; falhas/edges liberados | tests/r29a/test_core.py | /mnt/data/poetry/venv/bin/python3 -B -m unittest discover -s tests/r29a -p 'test_*.py' -v |
| Persistência/HTTP T2 | integration/unit próprios | SQL/rollback/serialização durável/tenant/R11 real | tests/r29a/ | Gate próprio depende de liberação nominal e runners isolados; não executar agora |
| Descoberta WEB T3 | unit/UI próprios | Catálogo elegível, CTA seguro e idiomas | tests/r29a/ | Vitest/tsconfig OWN a liberar nominalmente |
| Interesse PANEL T4 | unit/UI próprios | Consentimento, titular, retirada, late auth/landing sem envio automático | tests/r29a/ | Vitest/tsconfig OWN a liberar nominalmente |
| Fila PANEL T5 | unit/UI próprios | ADMIN vivo, tenant, escolha humana e respostas stale | tests/r29a/ | Vitest/tsconfig OWN a liberar nominalmente |

## Gate Check Commands

| Gate Level | When to Use | Command |
|---|---|---|
| T1 unit | Núcleo OWN | Comando unittest acima; sem conftest |
| T1 compile | Cinco arquivos OWN | compile(bytes,filename,'exec') em memória, sem exec/pyc |
| T1 lint | Ferramenta instalada | ruff check --isolated --no-cache seguido somente dos cinco paths OWN |
| T1 docs | ROOT e API | python -B SKILL/scripts/validate_spec.py r29a-activity-interest-crm --root ROOT_OU_API --strict; validate_tasks.py com feature posicional e --root explícito |
| T1 mensagem | Antes de eventual janela | check_commit.py --message 'feat(discovery): add consented interest core' |
| T2–T5 | Somente após liberação nominal | Definir comandos próprios por entrega sem configurações/imports opacos; nenhum gate futuro executado |

A invocação de lint executada antes do lembrete ROOT usou --isolated sem --no-cache e passou; não foi repetida. Esse detalhe e a possível escrita de cache ficam preservados, sem afirmar execução do comando idealizado acima.

## Execution Plan

### Phase 1: Entregas sequenciais

```
T1 -> T2 -> T3 -> T4 -> T5
```

## Task Breakdown

### T1: Núcleo de interesse consentido

**What**: Um núcleo com portas e testes prospectivos para invariantes liberados.
**Where**: API src/application/activity_interest/ e tests/r29a/; manifesto literal em preservation.
**Depends on**: None
**Requirement**: R29A02–06 e negação abstrata R29A01.
**Tests**: unit OWN, 33 testes, 0 falhas, 0 skips; assertivas de estado e falhas do double.
**Gate**: unittest OWN PASS; compilação em memória PASS; lint dirigido PASS com ressalva de cache; mensagem futura PASS; gates ROOT/API executados após documentos finais.
**Done when**:
- [x] Somente cinco fontes/testes novos, sem runtime de produto ou política concreta Event.
- [x] Critérios e edges T1 cobertos; loader isolado; unidade/compilação/lint verdes.
- [x] Núcleo T1 concluído localmente após gates de fonte; requisitos integrados não Verified.
- [x] Commit T1 local:2b30d19b6e025e8805907d23b88e83d52931a8e5; janela encerrada.

### T2: Persistência e API transacional

**What**: Adaptadores próprios e confirmação CRM atômica.
**Where**:15paths API e5docsROOT nominais do007-final-preparation.json; preservação lista literal.
**Depends on**: T1
**Requirement**: R29A01–06.
**Tests**: unit/integration OWN para SQL/tenant/rollback/serialização/R11 real.
**Gate**: OWN unittest029 PASS56/56; compile032 PASS; lint032 --isolated --no-cache PASS; spec/tasks strict ROOT/API e check_commit nominais executados após estes docs, resultados no manifesto final. validate_state/QA não executados.
**Done when**:
- [x] P1/P2 e grafo recebidos; head0042_person_relationships, sem inferir prefixo.
- [x] Adaptadores SQL/R11 e endpoints OWN implementados/testados nos limites SQLite/ASGI mínimo.
- [x] Commit T2 local4fc63f800271b470d22902870c5cb3ae7014aa74; janela encerrada.

### T3: Descoberta web pública

**What**: Catálogo Event e CTA para acesso autenticado.
**Where**:18pathsWEB e5mirrorsROOT nominais; PagealvoHEAD+OWN separado doWTHerdado; preservation lista paths.
**Depends on**: T2
**Requirement**: R29A01–02/06.
**Tests**: unit/UI OWN de elegibilidade, origem/destino seguros e PT/EN.
**Gate**: TSC021 OWN PASS; Node021 --test --test-isolation=none --test-reporter=tap PASS29/29; sintaxe010 PagealvoHEAD+OWN/request e022 public-api final PASS; specstrict/tasksROOT/WEB e check_commit registrados apósdocs.
**Done when**:
- [x] CatálogoGETno-store usaT2autoridade, valida parâmetros/projeção e estadosPTEN sem sessão própria/R24.
- [x] Origem explícita restrita e CTAexato; nenhum interesse enviado no web público.
- [x] Abort/body/deadline com cleanup e loadingPTEN próprios verificados; nenhum retorno cancelado promovido.
- [x] ImplementaçãoT3 e gates de fonte locais concluídos; Pagecommitadoalvo éHEAD+somenteOWN, sem i18nherdada.
- [ ] CommitT3 aguarda revisão e janela nominalWEBROOT, com stageparcialPage autorizado separadamente.

### T4: Interesse autenticado no painel

**What**: Formulário próprio, retomada segura, consulta e retirada pelo titular.
**Where**: PANEL src/features/activity-interest/; rotas/resources requerem ACK.
**Depends on**: T3
**Requirement**: R29A02–03/06.
**Tests**: unit/UI OWN com late auth, landing, destino malicioso, zero envio automático e retirada.
**Gate**: Bloqueado; Vitest/tipos OWN sem resolver client/store/config reais.
**Done when**:
- [ ] Retomada guarda apenas ID/path público e exige novo clique consentido.
- [ ] Troca de sessão/contexto não expõe interesse de outro titular.

### T5: Fila ADMIN e confirmação humana

**What**: Revisão administrativa e escolha LINK/CREATE pelo endpoint atômico.
**Where**: PANEL src/features/activity-interest/; navegação/rotas requerem ACK.
**Depends on**: T4
**Requirement**: R29A04–06.
**Tests**: unit/UI OWN para ADMIN local, tenant, escolha explícita, matches sem merge e stale responses.
**Gate**: Bloqueado; gate UI/tipos OWN a liberar; QA independente após última fonte commitada.
**Done when**:
- [ ] Confirmação revalida dados atuais e não usa criação Person separada no navegador.
- [ ] Nenhuma PersonPage/relationships reservada ou fluxo R15 alterado.

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | início | Match |
| T2 | T1 | T1 -> T2 | Match |
| T3 | T2 | T2 -> T3 | Match |
| T4 | T3 | T3 -> T4 | Match |
| T5 | T4 | T4 -> T5 | Match |

## Test Co-location Validation

| Task | Code Layer | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | Core/portas | unit | unit, 33 casos | Match |
| T2 | Adaptadores | integration/unit | integration/unit |56testesOWN verdes incluindo23T2 |
| T3 | WEB | unit/UI | unit/UI | Planejado; não executado |
| T4 | PANEL titular | unit/UI | unit/UI | Planejado; não executado |
| T5 | PANEL ADMIN | unit/UI | unit/UI | Planejado; não executado |

## Test Adequacy Review

As assertivas abaixo são evidência unitária prospectiva. O double confirma contrato/orquestração, não SQL, auth/JWT real ou atomicidade PostgreSQL. Helpers expect_code também verificam exception.code com assertEqual; referências abaixo apontam assertivas diretas por teste.

| Teste/ID | file:line + assertion expression | Resultado exigido |
|---|---|---|
| test_r29a02_explicit_consent_is_required_without_writes / R29A-02 | tests/r29a/test_core.py:174 — `self.assertEqual((self.w.interests, self.w.audit, self.w.boundaries), ({}, [], 0))` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a02_authentication_required_without_writes / R29A-02 | tests/r29a/test_core.py:179 — `self.assertEqual((self.w.interests, self.w.audit, self.w.boundaries), ({}, [], 0))` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a02_validation_port_rejection_has_no_writes / R29A-02 | tests/r29a/test_core.py:184 — `self.assertEqual((self.w.interests, self.w.audit, self.w.boundaries), ({}, [], 0))` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a02_one_contact_shape_rejects_both_contacts / R29A-02 | tests/r29a/test_core.py:194 — `self.assertEqual((self.w.interests, self.w.audit, self.w.boundaries), ({}, [], 0))` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a02_normalized_values_and_consent_proof_are_persisted / R29A-02 | tests/r29a/test_core.py:198 — `self.assertEqual(result, self.w.interests[result.interest_id])` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a02_phone_choice_is_preserved / R29A-02 | tests/r29a/test_core.py:213 — `self.assertEqual(self.w.interests[result.interest_id].contact, self.w.normalized)` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a02_replay_returns_stable_record_without_new_audit / R29A-02 | tests/r29a/test_core.py:218 — `self.assertEqual(first, second)` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a02_divergent_replay_rejected_without_contact_change / R29A-02 | tests/r29a/test_core.py:228 — `self.assertEqual(self.w.interests, {first.interest_id: first})` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a02_concurrent_replay_uses_shared_boundary / R29A-02 | tests/r29a/test_core.py:233 — `self.assertEqual(results[0], results[1])` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a02_registration_auth_is_rechecked_inside_boundary / R29A-02 | tests/r29a/test_core.py:239 — `self.assertEqual((self.w.interests, self.w.audit), ({}, []))` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a01_eligibility_port_denial_blocks_registration / R29A-01 | tests/r29a/test_core.py:245 — `self.assertEqual((self.w.interests, self.w.audit), ({}, []))` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a03_only_owner_can_read_or_withdraw / R29A-03 | tests/r29a/test_core.py:255 — `self.assertEqual(await self.core.get_own(OWNER, first.interest_id), first)` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a03_withdrawal_blocks_confirmation_and_reactivation / R29A-03 | tests/r29a/test_core.py:262 — `self.assertEqual((withdrawn.withdrawn_at, withdrawn.consent_granted), (NOW, False))` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a03_withdrawal_is_idempotent_and_works_after_event_ineligible / R29A-03 | tests/r29a/test_core.py:274 — `self.assertEqual(await self.core.withdraw(OWNER, first.interest_id), withdrawn)` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a03_withdrawal_auth_is_rechecked_inside_boundary / R29A-03 | tests/r29a/test_core.py:282 — `self.assertEqual(self.w.interests[first.interest_id], first)` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a04_link_uses_explicit_person_and_never_creates_or_edits / R29A-04 | tests/r29a/test_core.py:291 — `self.assertEqual(result.confirmation.person_id, 'person-existing')` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a04_create_requires_explicit_classification / R29A-04 | tests/r29a/test_core.py:307 — `self.assertEqual((self.w.created, self.w.interests[first.interest_id]), ([], first))` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a04_create_uses_r11_port_same_boundary_and_preserves_matches / R29A-04 | tests/r29a/test_core.py:315 — `self.assertEqual(self.w.created, [(person_id, NORMALIZED, 'VISITOR', 'admin')])` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a04_link_rejects_missing_inactive_or_other_tenant_person / R29A-04 | tests/r29a/test_core.py:330 — `self.assertEqual(self.w.interests[first.interest_id], first)` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a04_confirmation_replay_is_stable_and_divergence_is_rejected / R29A-04 | tests/r29a/test_core.py:336 — `self.assertEqual(await self.core.confirm(ADMIN, 'church-a', first.interest_id, CREATE), confirmed)` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a05_only_live_local_admin_can_confirm / R29A-05 | tests/r29a/test_core.py:353 — `self.assertEqual((self.w.created, self.w.interests[first.interest_id]), ([], first))` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a05_admin_grant_is_checked_after_boundary_entry / R29A-05 | tests/r29a/test_core.py:361 — `self.assertEqual((self.w.created, self.w.interests[first.interest_id]), ([], first))` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a05_admin_session_is_rechecked_after_boundary_entry / R29A-05 | tests/r29a/test_core.py:369 — `self.assertEqual((self.w.created, self.w.interests[first.interest_id]), ([], first))` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a05_tenant_of_interest_and_event_must_match_admin_context / R29A-05 | tests/r29a/test_core.py:381 — `self.assertEqual((self.w.created, self.w.interests[first.interest_id]), ([], first))` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a05_current_consent_and_eligibility_required_even_on_replay / R29A-05 | tests/r29a/test_core.py:395 — `self.assertEqual((self.w.interests[first.interest_id], len(self.w.created)), (confirmed, 1))` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a05_replayed_confirmation_rechecks_person / R29A-05 | tests/r29a/test_core.py:404 — `self.assertEqual(self.w.interests[first.interest_id], confirmed)` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a05_register_audit_or_save_failure_cannot_report_success / R29A-05 | tests/r29a/test_core.py:412 — `self.assertEqual((self.w.interests, self.w.audit), ({}, []))` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a05_confirmation_failure_rolls_back_double_unit_of_work / R29A-05 | tests/r29a/test_core.py:424 — `self.assertEqual((self.w.interests, self.w.persons, self.w.created, self.w.audit, self.w.r11_audit), baseline)` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a05_withdrawal_audit_or_exit_failure_preserves_previous_state / R29A-05 | tests/r29a/test_core.py:434 — `self.assertEqual(self.w.interests[first.interest_id], first)` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a05_withdrawal_wins_no_forwarding_occurs / R29A-05 | tests/r29a/test_core.py:444 — `self.assertEqual((self.w.created, self.w.r11_audit), ([], []))` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a05_confirmation_and_withdrawal_share_fake_serialization / R29A-05 | tests/r29a/test_core.py:457 — `self.assertEqual(withdrawn.confirmation, confirmed.confirmation)` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a05_audit_has_only_allowed_ids_action_version_and_references / R29A-05 | tests/r29a/test_core.py:469 — `self.assertEqual([asdict(entry) for entry in self.w.audit], [dict(action='INTEREST_REGISTERED', interest_id=first.interest_id, church_id='church-a', event_id='event-a', actor_user_id='owner', consent_version='R29A-INTEREST-CRM-V1', person_id=None), dict(action='INTEREST_CONFIRMED', interest_id=first.interest_id, church_id='church-a', event_id='event-a', actor_user_id='admin', consent_version='R29A-INTEREST-CRM-V1', person_id=confirmed.confirmation.person_id), dict(action='INTEREST_WITHDRAWN', interest_id=first.interest_id, church_id='church-a', event_id='event-a', actor_user_id='owner', consent_version='R29A-INTEREST-CRM-V1', person_id=confirmed.confirmation.person_id)])` | Valor/código/estado prospectivo assertado; sem sucesso parcial |
| test_r29a06_interest_person_and_account_remain_distinct_after_withdrawal / R29A-06 | tests/r29a/test_core.py:486 — `self.assertEqual(self.w.persons, {})` | Valor/código/estado prospectivo assertado; sem sucesso parcial |

**Suficiência:** R29A02–06 têm provas unitárias nos cenários liberados; R29A01 tem somente negação da porta, sem alegação de catálogo/política concreta. Contato/audit/consentimento e referências são assertados como valores, além das chamadas. **Necessidade:** cada um dos33 testes mapeia ao ID da tabela; nenhuma cobertura extrapola integrações futuras. **Conformidade:** biblioteca padrão, unittest, loader OWN, Python -B, nenhum histórico/conftest. Ausência de adapters reais é limite declarado, não critério considerado completo.

## Adequação T2

| Casos OWN | Assertivas de resultado | Critérios |
|---|---|---|
| test_migration | upgrade/drop só OWN; assinatura fixa/runtime igual; IntegrityError real em confirmação modoNULL/CREATEclasseNULL/LINKclasseindevida | R29A02/04/05 |
| test_persistence | valores R11 normalizados; stable retry/UNIQUE; zero gravação inválida; tenant/owner/grants atuais; LINK sem edição e CREATE sem merge | R29A01–05 |
| test_persistence rollback | Person/vínculo/audits ausentes em conexão nova após audit fault e constraint falhando no commit real | R29A04–05 |
| test_persistence concorrência | barreira após lock real, segunda conexão tentando BEGINIMMEDIATE; duplicata converge; duas ordens confirm/withdraw preservam bloqueio e Person já confirmada | R29A02/03/05/06 |
| test_routes | dados visíveis em conexão nova ao receber resposta HTTP; catálogo mínimo/UTC/página/invisibilidade; owner/ADMINcontext; erro sem contato | R29A01–06 |

56/56 no discover029. Depois do lint obrigatório (remove import unused e troca2lambdas por defs equivalentes), corrida afetada foi exercitada novamente032:1/1,0falhas/skips. Não repetir suite verde por cosmética. Compilação foi repetida por essa correção sintática; lint vermelho original permanece. Requisitos integrados continuam Implementing, dependentes da UI/QA, não Verified.

## Adequação T3 — resultados e necessidade

| Critério / casos | file:line + expressão | Resultado exigido / reverse mapping |
|---|---|---|
| R29A01 defaults/limites e10casos inválidos | tests/r29a/public-activities.test.cjs:78 — `assert.equal(result.status, "invalid");` | Estadoinvalid sem GET/globalfallback;defaults1/20,filtroUUID; manter |
| R29A01 URL/prefixo/página/filtro | tests/r29a/public-activities.test.cjs:92 — `assert.equal(seen.url, "https://api.example/custom/api/v1/public/activities?page=2&limit=1&church_id=" + CHURCH);` | URLexata com raizversionada preservada; manter |
| R29A01 transporte mínimo | tests/r29a/public-activities.test.cjs:95 — `assert.equal(seen.options.credentials, "omit");` | GET/no-store/omit/redirecterror/Acceptsomente;sem body; manter |
| R29A01 projeção eendnull | tests/r29a/public-activities.test.cjs:106 — `assert.deepEqual(plain(result.page), envelope());` | Objeto exato de seis campos públicos e quatrometa;semextras; manter |
| R29A01 shape/datas/meta/tenant inválidos | tests/r29a/public-activities.test.cjs:123 — `assert.deepEqual(Object.keys(result).sort(), ["query", "status"]);` | error genérico sempayload; manter |
| R29A01 emptyPTEN | tests/r29a/public-activities.test.cjs:132 — `assert.equal(result.status, "empty");` | Empty distinto deerror,traduzido; manter |
| R29A01 HTTP/network/JSON/abort | tests/r29a/public-activities.test.cjs:147 — `assert.ok(!JSON.stringify(result).includes("private-secret"));` | Estadoerror semerrobruto; manter |
| R29A02 CTArestrito | tests/r29a/public-activities.test.cjs:154 — `assert.equal(origin.panelActivityHref(base, EVENT), new URL(base).origin + "/interesses/atividades/" + EVENT);` | Origem válida+pathUUID exato;semquery/credenciais/path; manter |
| R29A02 origem/UUID inválidos | tests/r29a/public-activities.test.cjs:161 — `assert.equal(origin.panelActivityHref(base, EVENT), null);` | Hrefnull para inválidos/ausentes; manter |
| R29A01/02 SSR/UTC/XSS | tests/r29a/public-activities.test.cjs:176 — `assert.equal(time?.[2], "2050-01-01T12:00:00Z");` | ValorUTCZ exato;attributoHTMLsemcase,texto escapado; manter |
| R29A01 paginação | tests/r29a/public-activities.test.cjs:189 — `assert.ok(html.includes("/atividades?page=3&amp;limit=1&amp;church_id=" + CHURCH));` | Anterior/próxima preservamfiltro; manter |
| R29A01 perfil | tests/r29a/public-activities.test.cjs:79 — `assert.equal(calls, 0);` | ZeroGETnovo;linkpúblico estável e localepróprio; manter |
| R29A01/02 rota/APIentry reais | tests/r29a/public-activities.test.cjs:234 — `assert.equal(count, 1);` | GET/decoder/SSR OWN executados; manter |
| R29A01 budgetprodução | tests/r29a/public-activities.test.cjs:239 — `assert.deepEqual(delays, [8000]);` | Entryreal usa bindingpúblico8s ecleanup; manter |
| R29A01 i18nreal | tests/r29a/public-activities.test.cjs:257 — `assert.deepEqual(plain(result.messages.activityInterest), plain(lang === "en" ? en : pt));` | RecursosPTEN exatos elegadosintético preservado; manter |
| R29A01 endUTCZnão-null | tests/r29a/public-activities.test.cjs:267 — `assert.deepEqual(plain(result.page), envelope([{ ...item, end_at: end }]));` | Decoder eSSR preservamendUTCZexato; manter |
| R29A01 pré-abort | tests/r29a/public-activities.test.cjs:280 — `assert.equal(calls, 0);` | Casoalready-aborted abaixo exigezeroGET/error/sempage; manter |
| R29A01 abortdurantebody | tests/r29a/public-activities.test.cjs:300 — `assert.ok(!JSON.stringify(result).includes(EVENT));` | Bodyaindaresolve;resultadoerror,semdados/rows; manter |
| R29A01 deadlineI/O | tests/r29a/public-activities.test.cjs:317 — `assert.equal(requestSignal.aborted, true);` | Prazo5msinjetado cancelaJSONpendente/error/sempage/cleanup; manter |
| R29A01 cleanup | tests/r29a/public-activities.test.cjs:336 — `assert.equal(removes, 1);` | Listenerparentremovido emsucesso,falha,cancel; manter |
| R29A01 loadingSSR | tests/r29a/public-activities.test.cjs:346 — `assert.ok(html.includes('aria-busy="true"'));` | LoadingPTEN/status/busy,semCTA/form;semprova de transiçãoDOM; manter |

29casos (10parametrizaçõesinválidas inclusas) mapeados aR29A01/02/06 e critériosWEBT3. Comparação de payload/envelope e valores exatos, não só chamadas. Provas de markup/composição têm limites explícitos; nenhuma QA/sensor ainda. Local tests/r29a, configisolada, sem suite geral.
