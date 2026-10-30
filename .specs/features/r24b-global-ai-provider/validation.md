# R24b Validation — QA2, AD-007 segunda rodada aberta

**Verdict**: PASS

**Result**: PASS

## Aceitação humana e estado atual de fechamento

**Estado atual: PASS com ressalvas processuais expressamente aceitas.** O resultado técnico continua PASS. Esta é continuação da QA2 para resolver a pendência humana e executar gates documentais; não é nova rodada e não reinicia AD-007.

Pergunta apresentada neste chat:

> Você aprova concluir o R24b localmente com as ressalvas processuais documentadas — incluindo a perda dos nove pares de logs iniciais, permissões corrigidas posteriormente e registros tardios de índices — preservando o histórico de FAIL e sem alegar preservação integral? Isso permite finalizar os gates e seguir para R26; os provedores continuam desativados.

Resposta humana literal:

> Aprovar fechamento com ressalvas

Proveniência: resposta humana neste chat, transmitida explicitamente pelo ROOT à QA2 nesta continuação de fechamento. A decisão autoriza concluir R24b localmente com as ressalvas descritas e seguir para R26; provedores permanecem desativados. Não autoriza chamadas reais, credenciais reais, gastos, ativação, deploy, push, mudanças de produto ou Git.

A aprovação aceita as ressalvas documentadas QA1/C1/QA2, sem reparar perdas, recuperar raws ou afirmar preservação integral. Os quatro relatórios QA2 prévios, SHA af526e0cb4743e2b7fcb6a09405f1516ebcabbdff2334184f28e16189cb21936, foram preservados fisicamente com metadata em before/ antes de alterar o veredito. Os quatro históricos QA1 f74dab5a3e2a25c24a9d3691ab33040e4cf088d317d35f7780d9a74b4917b8a9 continuam intactos. A ausência dos nove pares de logs, as permissões corrigidas posteriormente e os registros tardios de índices permanecem fatos históricos.

As 53 fontes nominais, os dez dirty herdados, índices raw/metadata e HEADs foram reconferidos contra os pins finais QA2 sem divergência. Nenhum teste ou sensor de produto foi reexecutado. Os novos gates são somente validate_state nos quatro roots e validate_spec/validate_tasks strict nos quatro roots. Raws exclusivos, helpers físicos pinned 0600 e diretórios 0700 desde a criação. Artefatos desta continuação: .specs/evidence/r24b-global-ai-provider/qa2-acceptance-12eb2221-8c00-4ac6-8b13-dbb42f82bca2/.

## Registro QA2 anterior preservado (2026-10-29, anterior à aceitação)

Os parágrafos abaixo registram a situação ANTERIOR à aprovação humana, inclusive o FAIL processual e os quatro validate_state exit1 daquele instante. Essas pendências foram resolvidas exclusivamente pela aceitação acima; as perdas, incidentes e limites de certificação descritos continuam vigentes. O único veredito global atual é o PASS com ressalvas aceitas no cabeçalho. Nenhum parágrafo histórico foi reescrito como se os incidentes não tivessem ocorrido.

Resultado técnico: **PASS**. Fechamento global/processual: **FAIL**, pendente de decisão humana sobre ressalvas históricas e desta QA2. R24b não está Verified e R26 permanece bloqueada. O contador AD-007 não foi reiniciado; eventual terceira rodada será restrita a pendentes, sobreviventes, regressões e gates.

Data: 2026-10-29. QA2 independente, distinta de autores, corretor C1 e QA1. Contrato ROOT spec/context/design/tasks R24b, INFO-01..15 da spec histórica WEB R24, AGENTS, skill local tlc-spec-driven e referências QA, últimos checkpoints R24b lidos. Nenhuma harmonização de docs ou traceability antecipada.

## Escopo e pins

- API: 3e37187c63d421ac23daf79389bc9b89d358061b..d0bfde6f062cb8c894b9a4230b3c297c8f44006e.
- PANEL: 64e2202754f0f35d8a3f36b57621fc1ff8f99627..e756b449e15380dd98aff33986ed8d3f4df3d1c1.
- WEB: dba2d06a93d6fef0a512299ba265f28ef31ea7dd..d1f3146466a16259d3d82afba62c145de3fd8577; C1 pai 3ca98698c7f647fc515362553ce35801153ef805.
- MOBILE sem Git, nenhum init. Somente gerado nominal conferido.

C1 altera três paths OWN, confirmados pelo receipt congelado e diff nominal: teste handler, tasks.md e validation-iteration-1.md WEB. Produto permanece byteigual aos pins QA1; só handler.test.cjs mudou entre as 53 fontes nominais de baseline. Dois inputs suplementares de cobertura foram copiados do HEAD, sem execução. T1–T5 e C1 têm seus Done when registrados; spec permanece Implementing por reserva restrita.

Evidências: .specs/evidence/r24b-global-ai-provider/qa2-608b0124-2125-4741-bc93-7d28ebedd2c7/. Os quatro relatórios FAIL anteriores foram copiados fisicamente em reports-before/. Os quatro históricos validation-iteration-1.md continuam SHA f74dab5a3e2a25c24a9d3691ab33040e4cf088d317d35f7780d9a74b4917b8a9.

## Gates e contagem deduplicada

| Prova | Reexecutado QA2 | Conservado após pins/recibos | Resultado |
| --- | --- | --- | --- |
| WEB backend C1 | Provider6, resolver5, handler13, route6 = 30 métodos | Nenhum desses contado outra vez | 30/30; zero falhas, skips, todo, cancelamentos, warnings e stderr |
| API | Não | 30, incluindo 4 CAS PostgreSQL | Verdes conservados |
| PANEL | Não | 8 Node + 2 backend direto = 10 | Verdes conservados |
| WEB UI/página | Não | 7 UI + 4 página/alias = 11, ambos idiomas | Verdes conservados |
| Total distinto atual | 30 | 51 | 81; controles/subtests/repetições não inflam contagem |
| Typecheck WEB backend strict | TS5.9.3, 6 entradas, zero diagnósticos | Outros programas PANEL/WEB UI e variantes WT QA1 | Dirigido, não full app |
| Spec/tasks strict | ROOT/API/PANEL/WEB, 8 gates | Não contados outra vez | 8 exit0, zero erros/warnings |
| validate_state após este relatório | ROOT/API/PANEL/WEB | Não | 4 exit1 por Verdict FAIL processual |
| Lint API, carrier/gerados, reversão cinco mistos | Só hashes/pins/recibos conferidos | QA1 | Conservados, não reexecutados |

Node24.18.0 em sete diretórios novos com UUID, cópias físicas HEAD e launcher próprio pinned antes de run, env PATH-only. node:test isolation none/concurrency1; somente NODE_TEST_* são filtradas durante require do helper e restauradas depois. Inputs iguais antes/depois, raws exclusivos, sem overwrite. node-gates-results.json, node-post-run-pins.json, typecheck-result.json, structural-results.json e state-results.json guardam resultados reais. Não houve .env/config/autoload/credenciais. Dependências existentes foram insumos somente leitura.

Manifesto QA1 SHA381e7dda0a58b9fb69a29b03d805a65ec4012b4c59666e5fbb29b9c9b00703b9: 918 arquivos conferidos, zero mismatch. Manifesto C1 SHA7f8b50dfd7b24361496d721e7253d4b775d91f2aae2f3c69243ab91fc8a9673e e receipt commit SHA07d83c02becf932bb188385ae66cd253593c35313e64c177571dbf398c3ba9d0 conferem. Isso não repara a perda histórica dos raws QA1.

## AC → assertion/valor

A tabela conserva prova técnica QA1 somente onde fontes e recibos são idênticos, atualiza linhas do handler e substitui a lacuna INFO-05 pela prova independente atual. Valores permanecem alinhados ao contrato; nenhum requisito foi relaxado.

| AC | Resultado definido pela spec | File:line + assertion/valor | Resultado |
| --- | --- | --- | --- |
| AI-01 | null/0 e nenhuma inserção | `eclessGO/eclessgo-api/tests/r24b/test_persistence.py:67` — `self.assertEqual(await self.core.read(self.actor), Snapshot(None, 0))`; `eclessGO/eclessgo-api/tests/r24b/test_persistence.py:70` — `self.assertEqual(await self.rows(), ([], []))` | Adequado |
| AI-02 | enum exato; versão int>=0 sem bool | `eclessGO/eclessgo-api/tests/r24b/test_core.py:12` — `self.assertEqual(validate_update(provider, version), (provider, version))`; testes negativos nas linhas14..27, INVALID_SELECTION | Adequado |
| AI-03 | identidade/sessão/role atuais; comunidade não concede acesso | `eclessGO/eclessgo-api/tests/r24b/test_persistence.py:109` — `self.assert_error("FORBIDDEN", self.core.save(Actor("community_admin", 2), "openai", 0))`; `eclessGO/eclessgo-api/tests/r24b/test_persistence.py:108` — `self.assert_error("UNAUTHENTICATED", self.core.read(Actor("administrator", 3)))`; HTTP401/403 e backend MEMBER/CHURCH_ADMIN | Adequado |
| AI-04 | stale igual ou diferente gera VERSION_CONFLICT sem efeito | `eclessGO/eclessgo-api/tests/r24b/test_persistence.py:103` — `self.assert_error("VERSION_CONFLICT", self.core.save(self.actor, "openai", 0))`; `eclessGO/eclessgo-api/tests/r24b/test_persistence.py:102` — `self.assertEqual(await self.rows(), before)` | Adequado |
| AI-05 | dois escritores: uma revisão/audit/ator vencedor | `eclessGO/eclessgo-api/tests/r24b/test_postgres.py:95` — `self.assertEqual(len(winners), 1)`; `eclessGO/eclessgo-api/tests/r24b/test_postgres.py:110` — `self.assertEqual(audits[0]["actor_user_id"],                          self.actor1.user_id if winner.provider == "openai" else self.actor2.user_id)` | Adequado |
| AI-06 | seleção+revisão+audit confirmados juntos | `eclessGO/eclessgo-api/tests/r24b/test_persistence.py:73` — `self.assertEqual(await self.core.save(self.actor, "openai", 0), Snapshot("openai", 1))`; rows/audit nos valores1,2; rollback e PG CAS | Adequado |
| AI-07 | igual atual não muda versão/audit; inicial permanece ausente | `eclessGO/eclessgo-api/tests/r24b/test_persistence.py:101` — `self.assertEqual(await self.core.save(self.actor, "openai", 1), Snapshot("openai", 1))`; `eclessGO/eclessgo-api/tests/r24b/test_persistence.py:102` — `self.assertEqual(await self.rows(), before)` | Adequado |
| AI-08 | audit/precommit falham sem sucesso nem alterações parciais | `eclessGO/eclessgo-api/tests/r24b/test_persistence.py:146` — `self.assert_error("PERSISTENCE_UNAVAILABLE", failing.save(self.actor, "anthropic", 1))`; `eclessGO/eclessgo-api/tests/r24b/test_persistence.py:102` — `self.assertEqual(await self.rows(), before)`; PG duas falhas e HTTP503 | Adequado |
| AI-09 | audit apenas seis campos definidos, ator/revisão/ação/instante/enum exatos | `eclessGO/eclessgo-api/tests/r24b/test_persistence.py:82` — `self.assertEqual(set(row), {"id", "actor_user_id", "row_version", "action", "occurred_at", "provider"})`; `eclessGO/eclessgo-api/tests/r24b/test_persistence.py:86` — `self.assertEqual(row["action"], "PROVIDER_SELECTED")`; ator administrator, versões1/2, instante2026-01-02T03:04:05 | Adequado |
| AI-10 | reabertura/nova leitura vê anthropic/2 | `eclessGO/eclessgo-api/tests/r24b/test_persistence.py:93` — `self.assertEqual(await reopened.read(self.actor), Snapshot("anthropic", 2))`; `eclessGO/eclessgo-api/tests/r24b/test_persistence.py:94` — `self.assertEqual(await reopened.read_public(), "anthropic")` | Adequado |
| AI-11 | projeção pública somente provider e no-store | `eclessGO/eclessgo-api/tests/r24b/test_routes.py:97` — `self.assert_response(await self.client.get(self.public, params={"provider": "anthropic"}), 200, {"provider": "openai"})`; helper assert_response confere status/body/cache no-store | Adequado |
| AI-12 | OFF/config ausente:503 NOT_CONFIGURED antes do leitor | `eclessGO/eclessgo-web/tests/r24b/resolver.test.cjs:12` — `assert.equal(result.kind, 'not-configured');`; `eclessGO/eclessgo-web/tests/r24b/resolver.test.cjs:13` — `assert.equal(calls, 0);`; handler45/route59 | Adequado |
| AI-13 | 400/413 antes de resolver/leitor, inclusive OFF | `eclessGO/eclessgo-web/tests/r24b/handler.test.cjs:29` — `assert.equal(resolutions, 0);`; `eclessGO/eclessgo-web/tests/r24b/handler.test.cjs:27` — `assert.deepEqual(await result(await handle(req, slug)), { status, body: { code }, cache: 'no-store' });`; matriz400 INVALID_REQUEST/413 REQUEST_TOO_LARGE | Adequado |
| AI-14 | resolver inválido/falho:503 UNAVAILABLE antes do leitor | `eclessGO/eclessgo-web/tests/r24b/handler.test.cjs:60` — `assert.deepEqual(await result(await handle(request(), 'test-church')),     { status: 503, body: { code: 'ASSISTANT_UNAVAILABLE' }, cache: 'no-store' });`; reads0; getters228, stall190 | Adequado |
| AI-15 | nova seleção por pedido sem headers visitante; snapshot em voo permanece | `eclessGO/eclessgo-web/tests/r24b/handler.test.cjs:41` — `assert.equal(resolutions, 2);`; `eclessGO/eclessgo-web/tests/r24b/handler.test.cjs:182` — `assert.deepEqual(previous.body.answer, ['Community name: Community']);`; resolver42 headers ausentes/cache no-store | Adequado |
| AI-16 | somente fornecedor selecionado; erro não tenta outro | `eclessGO/eclessgo-web/tests/r24b/route.test.cjs:55` — `assert.equal(calls[1], provider === 'openai' ? 'https://api.openai.com/v1/responses' : 'https://api.anthropic.com/v1/messages');`; route76 e143 ausência do endpoint alternativo/calls2 | Adequado |
| AI-17 | contrato factIds exato; recusa/truncamento/extra/ID inválido não vira prosa | `eclessGO/eclessgo-web/tests/r24b/route.test.cjs:135` — `assert.deepEqual(await output(await POST(request(), context())),         { status: 502, body: { code: 'INVALID_PROVIDER_RESPONSE' }, cache: 'no-store' });`; provider93/113 inclui duplicatas e unicode | GAP: limite>8 não discriminado pela suite autoral |
| AI-18 | preservar integralmente INFO01..15 e UI manual nos dois idiomas | Matriz INFO abaixo; 29 métodos backend WEB e11 UI/página; PG não substitui browser | GAP derivado de INFO05 |
| INFO-01 | leitor somente slug atual, no-store, sem headers visitante | `eclessGO/eclessgo-web/tests/r24b/route.test.cjs:24` — `assert.equal(slug, 'test-church');`; `eclessGO/eclessgo-web/tests/r24b/route.test.cjs:25` — `assert.equal(options.cache, 'no-store');`; rota real passa só slug/options, leitura estática public-api214/fetchApi105 | Adequado; transporte do leitor é stub |
| INFO-02 | somente slug/locale/pergunta/fatos públicos; até30 agenda/campo2000; omitir inválidos | `eclessGO/eclessgo-web/tests/r24b/handler.test.cjs:82` — `assert.deepEqual(input.facts.map((fact) => fact.id), ['church-name', 'description', 'city', 'schedule-1']);`; `eclessGO/eclessgo-web/tests/r24b/handler.test.cjs:201` — `assert.equal(facts.some((fact) => fact.id === 'schedule-31'), false);`; private- ausente | Adequado |
| INFO-03 | 1..8 IDs únicos conhecidos =>200 answered, textos e fontes locais exatos | `eclessGO/eclessgo-web/tests/r24b/handler.test.cjs:181` — `assert.deepEqual(current.body.answer, ['Public description: Open to visitors']);`; handler65 e245 compara resposta inteira e8 IDs/labels pt-BR | Adequado |
| INFO-04 | seleção vazia =>200 no_information/arrays vazios, sem inferência | `eclessGO/eclessgo-web/tests/r24b/handler.test.cjs:89` — `assert.deepEqual(await result(await empty(request(), 'test-church')), {     status: 200, cache: 'no-store', body: { slug: 'test-church', status: 'no_information', answer: [], sources: [] },   });`; projeção vazia171 | Adequado |
| INFO-05 | Formato inválido, desconhecidos, duplicados ou >8 IDs exigem 502 INVALID_PROVIDER_RESPONSE sem eco | eclessGO/eclessgo-web/tests/r24b/handler.test.cjs:122-123 exige igualdade exata de status 502, body somente code INVALID_PROVIDER_RESPONSE e cache no-store; :124 assert.deepEqual(availableFactIds, factIds), nove distintos conhecidos de :111/:120 | Adequado; QA2 e sensor independente |
| INFO-06 | adaptador ausente=>503 NOT_CONFIGURED sem leitor/provedor | `eclessGO/eclessgo-web/tests/r24b/handler.test.cjs:51` — `assert.deepEqual(await result(await handle(request(), 'test-church')),       { status: 503, body: { code }, cache: 'no-store' });`; reads0 na matriz kind not-configured | Adequado |
| INFO-07 | erro=>503; timeout5000=>504 e signal aborted, sem detalhes | `eclessGO/eclessgo-web/tests/r24b/handler.test.cjs:156` — `assert.equal(clock.delay, 5000);`; `eclessGO/eclessgo-web/tests/r24b/handler.test.cjs:160` — `assert.equal(signal.aborted, true);`; provider fail109 e no logs211 | Adequado |
| INFO-08 | slug120/body4096/pergunta500 codepoints; inválidos400, tamanho413 antes deps | `eclessGO/eclessgo-web/tests/r24b/handler.test.cjs:29` — `assert.equal(resolutions, 0);`; handler11 matriz e bordas120/121,4096/4097,500/501; UI55 usaemoji500/501 | Adequado, backend unicode por inspeção Array spread |
| INFO-09 | leitor404=>404 COMMUNITY_NOT_FOUND; falha=>503 PUBLIC_INFORMATION_UNAVAILABLE sem adaptador | `eclessGO/eclessgo-web/tests/r24b/handler.test.cjs:137` — `assert.equal(calls, 0);`; handler109 matriz status/code exata | Adequado |
| INFO-10 | no-store, sem conteúdo em logs/persistência/ações/bootstrap | helper result cache nas respostas; `eclessGO/eclessgo-web/tests/r24b/handler.test.cjs:239` — `assert.equal(logged, 0);`; fontes próprias sem ferramentas/persistência; guards bloqueiam config/rede | Adequado local |
| INFO-11 | label/500/privacy/unavailable honesto; nenhum pedido automático | `eclessGO/eclessgo-web/tests/r24b/ui.test.cjs:35` — `assert.equal(calls, 0);`; `eclessGO/eclessgo-web/tests/r24b/ui.test.cjs:37` — `assert.ok(view.node.querySelector('label[for="public-information-assistant-question"]'));`; ambos idiomas/available truefalse/manual | Adequado |
| INFO-12 | single-flight/loading; fatos escapados/fontes locais; vazio explícito | `eclessGO/eclessgo-web/tests/r24b/ui.test.cjs:46` — `assert.equal(calls, 1);`; `eclessGO/eclessgo-web/tests/r24b/ui.test.cjs:85` — `assert.equal(view.node.querySelector('img'), null);`; UI55 role status/disabled | Adequado |
| INFO-13 | erro localizado+retry, não exibir shape/slug/fontes inválidos; NOT_CONFIGURED distinto | `eclessGO/eclessgo-web/tests/r24b/ui.test.cjs:115` — `assert.equal(view.node.querySelector('ol'), null);`; UI93 esperado por idioma e sucesso posterior | Adequado |
| INFO-14 | mudança slug/locale/unmount aborta e descarta, limpa pergunta/conversa, máximo10 sem enviar histórico | `eclessGO/eclessgo-web/tests/r24b/ui.test.cjs:138` — `assert.equal(requests[0].signal.aborted, true);`; `eclessGO/eclessgo-web/tests/r24b/ui.test.cjs:178` — `assert.equal(turns.length, 10);`; UI126/184 OLD/STALE ausentes | Adequado |
| INFO-15 | chaves pt-BR/en; canônica+alias; hunks herdados preservados | `eclessGO/eclessgo-web/tests/r24b/page.test.cjs:74` — `assert.equal(alias.type, ChurchDetailPage);`; `eclessGO/eclessgo-web/tests/r24b/page.test.cjs:33` — `assert.deepEqual(assistant.props, { slug: 'test-church', available: true });`; WT8+11 e reverse preimages5/5 | Adequado |

INFO-05 exige rejeitar >8 IDs mesmo conhecidos e únicos; AI-17 mantém o contrato factIds do handler; AI-18 preserva status/código/no-store sanitizados. C1 handler.test.cjs:110-124 gera schedule-1..9 distintos, publica exatamente esses nove fatos, exige igualdade da lista publicada e envelope 502 sem eco. Duas assertions novas: :122-123 e :124. Produto src/lib/public-information-assistant.ts:219 impõe limite e :353 devolve 502. O mesmo validador cobre adaptador resolvido e injetado. Casos anteriores de nove duplicados e oito válidos estão preservados.

Mapas completos atuais: assertion-reverse-current-v2.json/.md contém 454 callsites (452 preservados +2); method-requirements-current-v2.json contém 81 métodos (80+1); requirement-assertions-current-v2.md dá AC→file:line/expressão. map-reconciliation-v2.json tem zero erro. Expressions anteriores foram conferidas no trecho atual, inclusive multiline/with. Igualdades de headers são descritas sem literal, citadas na fonte, por instrução. Não se removeram casos/skips ou enfraqueceram assertions.

## Sensores

| Faults | Execução usada | Controles | Resultado |
| --- | --- | --- | --- |
| auth-role, auth-session, stale-cas, audit-actor, rollback | QA1 conservada | 10 históricos | 5 mortos |
| openai-envelope, anthropic-envelope, duplicate-json, public-data, timeout-abort, global-selected, history-limit | QA1 conservada | 14 históricos | 7 mortos |
| max-eight-unique, remover SOMENTE upperbound descriptor.value.length >8 | QA2 independente | 13/13 antes e 13/13 depois | Mutante12/13, único FAIL caso novo, esperado502 observado200, ERR_ASSERTION; zero setupfailure |

Consolidado13 faults distintos,13 mortos,0 sobreviventes;24 controles QA1 conservados+2 novos=26. Não são 26 métodos novos. Survivor QA1 permanece histórico; agora é morto por suíte C1 nesta QA2. Probe QA1 e sensor autoral C1 não contam como QA2. Cada um dos12 patches conservados teve source atual comparado ao pin e apply/reverse fuzz0 em cópia nova. Isso verifica patch, não reexecuta sensor/controle. retained-sensors.json identifica raws históricos.

Sensor novo: runs/max-eight-fault-724d69e4-1e61-4984-b6d6-ba2ec2b8fae6; controles max-eight-before-da552ec9-1565-4f62-b8f1-8757c9ca0ebe e max-eight-after-bdb02ba6-c1ba-4145-a493-08a9c5b1b52e. Todos têm raws stdout/stderr e pins pré-run.

## PostgreSQL e preservação conservados

Nenhum PG novo QA2. API/DDL/tests/HEAD imutáveis e recibos íntegros permitem conservar prova QA1 OWN up/down, tipos/PK/FK/CHECK/UNIQUE, users e sentinela extra, e4 CAS PostgreSQL17.11 sintético. pg-own-results.json/raws/identidade/imagem/container parado conferidos no manifesto QA1. Nenhum container/DB/env antigo foi reutilizado. Não se certifica cadeia migrada/ancestrais/env.py.

Cinco WTs mistos atuais iguais hashes finais QA1; reversão OWN e recuperação dos cinco preimages conservadas, não reexecutadas (retained-mixed.json). Gerados PANEL/WEB/MOBILE SHA98cf930dd996d8344f941b47b4206b6f7025281ba013945b30c0891e1d7d4ae0,55719bytes,0664; carrier SHAa52c119215b24311f10a457a53389df3fbe1335d380667059efa9774075469a9. Prefixo baseline079b63e81940b2ed253c1e6033414926d6e6a236d8c61c5875c1c98b0aabc980 e apply/reverse fuzz0 conservados. São13tipos OWN de OAS mínima3operações, não full app. Consterror→string é limitação conhecida do renderer; runtime/OAS mantêm códigos estritos.

## Preservação QA2 e ressalvas processuais

Snapshot real dos3índices raw+metadata/HEAD antes dos gates;53fontes nominais WT/HEAD e10dirty herdados preservados. Finais mantêm bytes/modos de fontes/dirty e bytes+metadata de índices/HEAD. Somente privados novos e4validation.md escritos; zero produto/testes/tasks/spec/context/design/STATE/ROADMAP/LESSONS/índices/refs/commits.

Dirty herdados API: poetry.lock,pyproject.toml,src/application/church/dtos/church_dto.py,src/application/identity/dtos/auth_dto.py,src/infrastructure/api/routers/v1/church_router.py. PANEL:src/locales/en.json,pt-BR.json. WEB:src/app/igrejas/[slug]/page.tsx,src/messages/en.json,pt-BR.json.

Índices inicial=final QA2: API270dffecc947dbca5ab83448ddcc079d8ec38d8f95db2affea1ea4d51d49809f; PANELfa9da215e221a2146aeb3af11908d11209d0e5b62214a70ca7f3049068965f96; WEBcc843338fbedb3f1489672e194108b8b150f8822d3c3fcc13ac60e74ff2ad9b8. WEB difere do pósC1 receipt7692c29a02ae4d77c1d2eacb3c0216a08690220c20a77efa43677a67396ce175. As241entradas comparadas com raw real préC1 10da42fab0865ed20ffc71bc2ae30bb41c27fdac30d46e8c60c6a7f6e1c7ab3d mais3blobs OWN commitados têm zero divergência semântica path/OID/mode/stage/flags, zero statcache NÃOOWN e extensões iguais préC1. Diferença raw localizada em metadata OWN; causa desconhecida. Visão lógica esperada não é snapshot original; baseline atual real mantida separada.

Ressalvas históricas bloqueiam fechamento até decisão humana: QA1 sobrescreveu9pares rawsNodeiniciais+node-results.json (3setupsPANEL MODULE_NOT_FOUND,6WEBverdes; apenas resumo/stderrparcial no registro tool, sem raws íntegros). Não reconstruídos. Dois helpersQA1 nasceram0664 sobpai0700/corrigidos depois; índicesQA1 somente durante/final, sem prova retroativa inicial. Leitura expôs literais sintéticos de headers, sem segredo real. C1 preservou drift anterior WEB statcache-only18entradas sem causa atribuída, preflights rejeitados antesrefupdate e objeto commit sem referência/hash nãoobservado, sem census/gc.

Ressalvas QA2:

1. Inspeção integral inicial de isolation.cjs exibiu no stdout literais sintéticos de headers/fixture. Nenhum segredo/credencial real. Instrução proibia até sintéticos; ROOT comunicado, sem apagar evidência. Relatório/mapas não reproduzem valores.
2. Quatro outputs de DADOS iniciais nasceram0664 sobpai0700: initial-index-snapshot.json,eclessgo-api-initial.index,eclessgo-painel-initial.index,eclessgo-web-initial.index. Corrigidos0600 sem alterar bytes; tamanhos finais certificados abaixo e no manifesto. Nenhum helper afetado; todos helpers físicos pinned0600 antesrun. Não se alega0600retroativo aos outputs. private-data-mode-corrections.json preserva observação.
3. Instrumentação privada preservada: mapa faltava2inputsnominais; tentativa seguinte comparou incorretamente linha única a expression multiline/with; v2reconciliou454sem erro. Primeiro checkpatch supôs source mutante, mas QA1conservou source intacto final; v2 fez pristine→apply→reverse. Não contam como falhas produto/sensores/controles. Inspeção Python teve SyntaxWarning por escape inválido fora dos gates; gates finais zero warnings. Uma tentativa de criar helper close.py falhou no parser antes de escrever qualquer arquivo/relatório; helper final foi criado e pinned separadamente.

## Limites e próxima ação

Transportes/config/auth/identidades/DOM sintéticos. Não se certificam JWT/navegadorreal,pool sobcarga,appcompleto,ancestrais,retençãozero,serviçooperacional,modelos/limitesmonetários,produção/UAT. Nenhum request/credencialreal,gasto,ativação,deploy,push autorizado ou executado. Quatro exclusõeslexicais respeitadas; nenhum corpo de migration ancestral/env.pyexecutado. Negócio não flexibilizado.

Nenhum defeito novo de produto. ROOT deve apresentar prova técnica completa e pedir decisão humana concreta sobre ressalvas processuais. Até decisão: globalFAIL,validate_state não fecha,R26bloqueada. Não escrevi LESSONS: reserva exclui esse arquivo e não há sinal técnico novo; ressalvas são processuais. Reserva QA2 encerrada após relatório,manifesto e gates de fechamento.

Outputs de dados corrigidos (bytes finais, modo atual0600; modo inicial0664 sobpai0700):

- initial-index-snapshot.json: 1187 bytes.

- eclessgo-api-initial.index: 350890 bytes.

- eclessgo-painel-initial.index: 247387 bytes.

- eclessgo-web-initial.index: 27365 bytes.
