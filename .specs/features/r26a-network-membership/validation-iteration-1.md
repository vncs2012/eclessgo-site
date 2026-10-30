# R26a QA1 independente

Result: FAIL

Data: 2026-10-30. Verificador: Sol 6.1 / medium, independente da autoria Terra. Rodada 1 aberta AD-007, após os commits finais. A implementação intacta passa os gates; a suíte versionada deixa sobreviver uma falha comportamental de rollback. R26a não está Verified e este relatório não substitui UAT real.

## Achado e correção mínima

**QA1-01, P2, cobertura/discriminação, NET-15.** Em `eclessGO/eclessgo-api/src/infrastructure/persistence/repositories/network_membership_repository.py:311`, o ramo `except BaseException` faz rollback na linha 312. S4 muda somente esse rollback para commit na cópia. Os 24 testes SQLite continuam verdes, inclusive `tests/r26a/test_persistence.py:345` e `:572`: suas falhas de auditoria usam triggers e passam pelo ramo DBAPIError das linhas 308–310. Os controles intactos antes e depois passam.

O probe privado injeta `RuntimeError` em append_event depois da atualização do vínculo. O código intacto retorna UNAVAILABLE e uma engine física nova lê PENDING v1 com NETWORK_CREATED/REQUESTED. A cópia mutada retorna o mesmo erro, mas a engine nova lê APPROVED v2 com os mesmos dois eventos, sem APPROVED. Isso confirma alcance e efeito persistente do fault. Não foi encontrado defeito atual de produto: o rollback intacto funciona. A falha é a incapacidade dos testes versionados de detectar essa regressão.

Prova: `probe/fault/tests/r26a/test_probe.py:14`, `:19`, `:26`, `:27`; `probe/{intact-before,fault,intact-after}/work/observed.json` e receipts. O probe não integra os 48 métodos versionados nem corrige a lacuna por existir na evidência. S4, seus controles verdes e o survivor ficam preservados. Patch e receita: `sensors/S4-rollback-state-event/mutation.json`, fonte anterior em `runs/persistence-S4-rollback-state-event-fault-ce8cd212-9bcd-43a7-ac17-bf5642210fb7/mutation-before/`, execução `prepare-probe.py` e `probe/bootstrap-probe.py` fixadas.

Correção sugerida C1: somente novo teste em `tests/r26a/test_persistence.py`, injetando exceção não-DBAPI na auditoria de uma transição após o update; exigir UNAVAILABLE, PENDING v1 e ausência de evento adicional em conexão física nova. Deve passar intacto e matar o S4 exato. Não alterar produto, enfraquecer asserts, remover casos ou adicionar skips. ROOT reserva e commita C1; QA2 deve ser nova. Aprendizado proposto: testar separadamente falhas DBAPI e exceções de aplicação após a primeira escrita quando há ramos diferentes de rollback. Nenhuma LESSON foi escrita sem reserva.

## Fontes e escopo

- API: d18935439f08e033b1cd8c6c926d029926fdf162 → T1 9a00b81dbce306972fd0408002bd522b3432e7c4 → T2 0fd9a503db99087f0fad6123b2f2c44263930cd6.
- PANEL: b4736fc058323af6dba367ea4e9fb83d4b8bbd6d → 43fb5055cab6225b9944125d65055b6464153eb3; 24 OWN nominais.
- WEB: 77b9d5c20a1ea4b0452a3cf82977338add957d7f → 90a12a20f4212e30ddec3cdcdf8618ffa9eadd22; 6 OWN nominais.
- MOBILE sem Git: três gerados iguais, 58.806 bytes, SHA-256 abda26a67520f47efce1f3bb873ec9117e77f66d72646239f6f951ba984d77f8. Prefixo 55.719 bytes preservado, SHA-256 98cf930dd996d8344f941b47b4206b6f7025281ba013945b30c0891e1d7d4ae0.

Contrato canônico ROOT spec/context/design/tasks/preservation lido completo. R26 histórico e R24b fechado não foram reabertos. R30/R34 futuros, R16a sem ampliação e R22b reservado. T1/T2/T3 fontes estão commitadas. O checkbox documental final T3 e textos que ainda dizem commits pendentes são anteriores às janelas confirmadas; ROOT faz reconciliação documental após o ciclo de QA, sem tornar este FAIL em aceite.

Evidência privada raiz: `.specs/evidence/r26a-network-membership/qa1-ad7d7a6e-17b8-4217-8671-ec0e7eef2dbc/`. Caminhos curtos de evidência abaixo são relativos a essa raiz ROOT; citações API e PANEL são relativas aos respectivos repositórios.

## Verificação independente por requisito

Resultados em conjunção: status/código/estado/versão/payload/histórico indicados pertencem ao mesmo cenário ou aos controles discriminados abaixo. Gate verde é a observação do teste; não amplia a fronteira sintética. O inventário reverso registra as expressões completas, inclusive helpers e seus valores concretos, sem expor identidades no relatório público.

| AC | Resultado exigido | Assertion e valor esperado/observado | Parecer |
|---|---|---|---|
| NET-01 | SUPER_ADMIN cria rede+evento atomicamente, 201 id/nome | HTTP `tests/r26a/test_http.py:102`: checked(response,201)=={id:NETWORK,name:Rede}; persistência `:207`, `:209`, `:542`, `:546`: 1 rede e NETWORK_CREATED/ator/versão1 corretos | atendido |
| NET-02 | Outros atores:403 sem criação | HTTP `test_http.py:137` checked(...,403), `:238`; `test_persistence.py:189` error(FORBIDDEN) e `:207` somente uma rede autorizada | atendido |
| NET-03 | Input fechado/limites/exatidão; inválidos sem gravação | `test_core.py:15` assert_invalid→INVALID_INPUT, `:23–89` nomes/UUID/e-mail/URLs/cursor; HTTP `:143–157`, `:347` e checked `:92–93` conferem 404/422/413/409+no-store; persistência `:536–539` NOT_FOUND e tabelas vazias | atendido |
| NET-04 | PENDING v1, só slug canônico, sem Membership | `test_persistence.py:179–181` created/PENDING/1, `:220–240` slug centro, church_name null, MEMBERS invariantes, REQUESTED único e replay | atendido |
| NET-05 | Duplicidade PENDING/APPROVED:409 e vínculo intacto | `test_persistence.py:315`, `:317` error(CONFLICT); `:318` len(LINKS)==1 | atendido |
| NET-06 | Novo UUID após terminal mantém trilha | `test_persistence.py:563`, `:567` CANCELLED antigo/APPROVED novo e sequência de cinco eventos; HTTP `:203` fluxos recusa/cancelamento/reabertura | atendido |
| NET-07 | ADMIN alvo aprova PENDING | `test_persistence.py:256` (APPROVED,2); HTTP `:175` mesmo par | atendido |
| NET-08 | ADMIN alvo recusa PENDING | `test_persistence.py:274` (REJECTED,2); HTTP `:206` REJECTED | atendido |
| NET-09 | Responsável cancela PENDING | `test_persistence.py:279` (CANCELLED,2); HTTP `:212` CANCELLED | atendido |
| NET-10 | Responsável/ADMIN encerram; dados ficam | `test_persistence.py:293`, `:300` ENDED por ambos; `:301` quatro Memberships preservadas; UI `NetworkMembershipPage.test.tsx:152–169` ações/versões corretas | atendido |
| NET-11 | SUPER_ADMIN sem papel específico não age | `test_persistence.py:307–310` NOT_FOUND nas quatro ações, PENDING v1/dois eventos; S1 morto por NetworkError não levantado na cópia | atendido |
| NET-12 | Corrida PG: uma aprovação, perdedor409/PENDING | `test_postgres.py:168–186`: dois PIDs, uma vitória, uma perda CONFLICT, estados APPROVED/PENDING, único evento com ator/link do vencedor; S3 perde CONFLICT e é morto | atendido |
| NET-13 | Estado/versão/replay inválidos:409, sem evento | `test_persistence.py:337`, `:339`, `:340` erros CONFLICT e sequência sem duplicata; `:551` versões/papéis; UI `:123–124` conflito recarrega | atendido |
| NET-14 | Replay mesma identidade/dados:200 sem duplicar | HTTP `:128`, `:176`, `:280`; persistência `:237–240`, `:336–340`: id/resultado idênticos e eventos únicos; S5 morto ao dispensar ator | atendido |
| NET-15 | Toda falha antes do commit reverte estado+evento e retorna503 | DBAPI coberto: `test_persistence.py:358–359`, `:585–602`; HTTP `:393`, `:406`, `:412–413` 503, PENDING v1, REQUESTED único, nova conexão. **S4 sobrevive** para exceção não-DBAPI; probe `test_probe.py:26–27` distingue intacto/mutado em engine nova | **lacuna, FAIL** |
| NET-16 | Evento mínimo único por transição, versão/ator/tempo corretos | `test_persistence.py:229–233`, `:434–444`, `:546`; PG `:184–186` único evento do vencedor; HTTP `:199` sequência REQUESTED/APPROVED/ENDED | atendido, limitado por QA1-01 |
| NET-17 | ADMIN pendente vê somente rede solicitante | `test_persistence.py:246–250` uma rede, sem church_name, outra comunidade sem rede; HTTP `:168–169`; UI `:94–101` própria comunidade/versão | atendido |
| NET-18 | Nomes só APPROVED e is_responsible por rede/ator | `test_persistence.py:259–266` PeerLink exato e pending sem nome; `:478`, `:493`, `:496–507` objetos exatos true/false e SELECTs constantes; HTTP `:180–187` | atendido |
| NET-19 | Terminal sem nomes/ref | `test_persistence.py:276`, `:281`, `:296`, `:436`; HTTP `:195`, `:306–307`; S2 morto ao revelar slug terminal | atendido |
| NET-20 | Eventos só da própria comunidade | `test_persistence.py:428–444` erro no alheio e eventos mínimos exatos; UI `:224–227` cursor somente church-a | atendido |
| NET-21 | Listas/eventos restritos, sem catálogo público | `test_persistence.py:250`, `:420` items==[] para não autorizados; HTTP `:249–265` todas operações exigem401; OpenAPI `:61`, `:66` caminhos/segurança fechados | atendido |
| NET-22 | História durável, sem TTL novo | `test_persistence.py:434`, `:453–456`, `:510–525`, `:665–667`; migration `:269`, `:274–278` referências nulas, dados/eventos/sentinela preservados; revisão/schema próprios sem TTL, não prova retenção temporal futura | atendido no recorte |
| NET-23 | Sem Membership/grant automático | `test_persistence.py:224` igualdade integral MEMBERS antes/depois pedido, `:301`, `:456`; migration `:278` sentinela Membership m2 preservada; guards readonly | atendido |
| NET-24 | Guard local anterior continua negando owner sem Membership | HTTP `test_http.py:462`, `:472`, `:479` Denied sem Membership/como MEMBER e aceite ADMIN alvo; Auth `auth-integration.test.tsx:159–160`; recorte real require_church_roles, sem rota/JWT integral | atendido na fronteira declarada |
| NET-25 | Sessão/conta/Church/Membership revogadas negam sem mudança | `test_persistence.py:363–399`, `:604–616` PENDING/dois eventos ou APPROVED/três invariantes; PG `:198`, `:209–210`; HTTP `:225`, `:234`, `:324` 401/404/items vazio | atendido |
| NET-26 | Capacidade só três booleanos próprios | `test_persistence.py:403–423` objetos exatos por papéis; HTTP `:121–135`; OpenAPI `:83–86` chaves exatas | atendido |
| NET-27 | Responsável sem Church entra login/bootstrap/redes | `auth-integration.test.tsx:73–77`, `:92–95`, `:144–153`, `:188–191`: sessão em negociação, Church null, /redes, bootstrap e retry; S6 morto no transporte real com identidade errada | atendido |
| NET-28 | USER sem elegibilidade/capacidade negado | `auth-integration.test.tsx:115–116`, `:167–168`, `:153`; navigation `:27`; falha de capacidade não autentica | atendido |
| NET-29 | MEMBER só recebe redes; equipes antigas ficam | `auth-integration.test.tsx:102–109`, `:159–160`; `navigation.test.ts:9–18` arrays de destinos exatos; ausência de Church não depende de ChurchSwitcher | atendido |
| NET-30 | Contexto novo descarta respostas antigas | `NetworkMembershipPage.test.tsx:190–193`, `:242–245`, `:257–261`; auth `:129–136`, `:246–247`; S8 morto por Network A antiga reaparecer, S6 prova sessão em negociação | atendido |
| NET-31 | Ações por rede/própria comunidade, pt-BR/en, reload409 | UI `:76–81`, `:94–101`, `:123–124`, `:152–169`; `i18n.test.ts:15–33` todas chaves não vazias e Aprovar/Pendente vs Approve/Pending; S7 morto por cancel indevido na rede apenas legível | atendido |
| NET-32 | Até100, ordenação/cursor estáveis | `test_core.py:77–89`; `test_persistence.py:623–633`, `:652–656` ids[:100],cursor ids[99], restante,null; UI `:202–213`, `:224–227` append/cursor | atendido |
| NET-33 | Auth, envelopes fechados tipados/no-store/sem eco | HTTP checked `:92–93` status/no-store em63 chamadas; `:143–157`, `:249–265`, `:393`; OpenAPI `:61–97` oito operações+security+additionalProperties false+refs; UI `:175–176` não ecoa detalhe | atendido |

O inventário reverso exaustivo independente é `assertions-reverse-v3.json` e `.md`: 230 chamadas literais unittest assert + 107 invocações dos helpers assert_invalid/error/checked = 337 sites API, e 114 expect UI; 48 métodos API, 31 declarações UI/34 instâncias. Expressão, file:line, owner e requisitos constam de cada entrada. As definições compartilhadas também são mapeadas; o inventário não infla loops, parâmetros ou repetições de gates. As 291 chamadas alegadas na autoria não foram assumidas como o mesmo universo do inventário desta QA.

## Edges e integridade

Replay usa UUID/versão originais e último evento/ator: `test_persistence.py:331–343`, `test_http.py:267–307` e UI `:112–114`, `:141–144`. Referências http/https dos dois caminhos, Unicode/UTF-8 estrito, userinfo/barra/controle/limites e query/fragmento descartados: `test_core.py:23–89` e `test_persistence.py:220–240`; parser local não faz fetch. Remoções físicas SET NULL sem transferência: `test_persistence.py:446–461`, `:658–669`, migration `:261–278`. Falha/409/cancelamento/erro e contexto não reutilizam nomes anteriores: UI `:118–131`, `:172–193`, `:230–261` e S8. Esses edges estão mapeados ao inventário reverso.

Os seis arquivos de teste API e quatro UI são próprios deste recorte; não foram executados testes/helpers históricos de produto. Não foi removido ou enfraquecido teste pela QA. O teste T1 de NetworkSummary continua comparando objeto exato com id/nome e acrescenta o booleano; nenhuma suíte global ou total de testes históricos foi alegado. Código lido combina core/SQL transacional/router/página/client/autenticação/guard/navegação. Mudanças de produto permanecem dentro dos três tasks; nenhuma abstração/funcionalidade nova foi acrescentada pela QA. Guia: eclessGO/AGENTS.md e coding-principles da skill tlc-spec-driven.

## Gates reexecutados

| Gate | Métodos distintos / saída | Evidência |
|---|---|---|
| Unitário | 6, exit0, failures/errors/skips0 | runs/core-gate-aec80732-1866-4bc8-8d02-9cf72ae6e541 |
| SQLite | 24, exit0, failures/errors/skips0 | runs/persistence-gate-de798776-b1b9-4431-920d-12ac3b10de2b |
| PG novo, dois ADMINs/conexões | 2, exit0, failures/errors/skips0 | runs/postgres-pg-proc-d87da1c2-340d-4b84-978a-bba722775e73 |
| HTTP sintético | 12, exit0, failures/errors/skips0 | runs/http-gate-9a5826d3-477b-4bf3-8302-fa1230c1d8d0 |
| OpenAPI | 2, exit0, failures/errors/skips0 | runs/openapi-gate-074ca5a5-a12a-4c0c-8243-8327b1cfa7ae |
| Migration OWN SQLite+PG novos | 2, exit0, failures/errors/skips0 | runs/migration-pg-proc-6bf916cb-5b3d-4dab-b390-95404ce79311 |
| UI WT+OWN | 34, quatro arquivos, exit0, failures/skips0 | runs/ui-wt-gate-e6005e9e-9c94-47e3-a15f-f3d1071ffee3 |
| UI HEAD+OWN | mesmos34, quatro arquivos, exit0, failures/skips0 | runs/ui-head-gate-3af2399f-3d1e-4cea-b457-43f39e25157a |
| Build PANEL | 13 raízes, TS5.8.3, zero erros, exit0 | build-runs/check-panel-source-v2-4ec5a85e-b0eb-4bfe-b04b-49ad02fc1bdb |
| Três contratos | TS5.8.3/5.9.3/6.0.3, zero erros/duplicatas, exit0 | build-runs/check-generated-v3-3f28aa7f-b818-4c91-b5e7-92dc82249a45 |
| Lint PANEL | 15 fontes, zero novos, dois anteriores, zero warnings; exit0 | build-runs/lint-panel-v2-99f05a14-5bc1-4858-8221-bbf222b9e39b |
| Ruff OWN | sete fontes limpas; main I001 anterior idêntico em código/regra/contexto; ambos exit1 por I001 | ruff/{current,parent}.* e result.json |
| Projeção/gerados | oito caminhos,29 schemas,quatro colisões novas renomeadas; sufixo renderizado coincide, três arquivos/prefixo iguais; exit0 | projection/{result.json,stdout,stderr,receipt.json} |
| Carrier MOBILE | apply e reverse exit0, fuzz0 e bytes exatos | carrier/* |
| Spec/tasks strict | ROOT dois exits0, sem erros/avisos | build-runs/spec-341396bc-9e90-4061-9828-05e80e2a7fe2 e tasks-3c3df3d5-3aba-4c87-ae83-6cb64275a340 |

48 API +34 UI =82 métodos distintos; UI WT e HEAD não são68 distintos. Os runners Python tratam warnings como erro; gates aceitos sem warnings. Não há skips. Repetições de controles não aumentam cobertura. Os REDs instrumentais PG com AF_UNIX longo e host relativo inválido ficam nos runs anteriores; foram corrigidos somente na URL privada para /proc/self/cwd, com mesmo container novo sem rede. Preparação Build parou num teste antigo da fixture de tipos, fora das13 raízes; V2 copiou a fonte atual e manteve versão anterior. Lint inicial apontou caminho de baseline de autoria; recibo ENOENT conservado e execução final usa parent próprio. Esses fatos não são kills ou defeitos de produto.

## Sensores, oito focos

Cada fault roda entre controle intacto antes e depois, ambos exit0. `sensors/result.json` contém receipts completos; cada pasta guarda preservação antes/depois. Testes realmente falham por resultado de negócio, não por import/setup/tipo/timeout.

| ID | Fault isolado | Teste e observação discriminante | Desfecho |
|---|---|---|---|
| S1 | SUPER_ADMIN recebe transição sem papel específico | persistence: três assertions NetworkError não levantado | morto |
| S2 | Terminal conserva requested_ref | persistence: all(church_name is None and requested_ref is None)==False | morto |
| S3 | Perdedor PG vira UNAVAILABLE em vez de CONFLICT | postgres: UNAVAILABLE != CONFLICT, corrida ainda executada | morto |
| S4 | Commit no lugar do rollback no ramo BaseException | persistence:24 verdes; probe revela APPROVED v2 sem evento | **sobrevivente** |
| S5 | Replay dispensa mesmo ator | persistence: NetworkError não levantado para outro ADMIN | morto |
| S6 | Transporte usa identidade anterior na capacidade negociada | UI: array de quatro observações de credencial/contexto difere;1/34 falha | morto |
| S7 | Ação owner usa capacidade global em vez do booleano da rede | UI: cancel indevido na rede apenas legível;1/34 falha | morto |
| S8 | Provider ignora identidade/generation/contexto | UI: Network A anterior reaparece;1/34 falha | morto |

Total:8 faults válidos,7 mortos,1 sobrevivente;16 controles verdes. A canonicalização tem gates unitários/persistência/HTTP concretos, e o foco de replay recebeu S5; S3 prioriza o status do perdedor numa corrida real, sem alegar que remover isoladamente um dos dois mecanismos de exclusividade deva sempre matar o teste. Nenhum sensor novo foi criado depois dos oito focos; o probe confirmou o único sobrevivente.

## Preservação, limites e fechamento

Baseline selecionada antes dos gates:50 registros OWN/documentos,36 registros readonly complementares,79 caminhos únicos no conjunto. Pré-imagens WT/HEAD, modos, dirty hunks e índices brutos originais estão em baseline/ e readonly-baseline/. Não é captura integral das árvores. Os dez herdados e useLoginPageState/Sidebar/ChurchSwitcher mistos permaneceram readonly. Ausências dos quatro validation.md foram conferidas nos caminhos corretos antes de criação; uma consulta inicial PANEL/WEB sem eclessGO foi corrigida sem escrita.

Os três HEADs permaneceram nos pins. O primeiro controle de preservação encontrou raw de índice distinto: reconciliação DIRC/checksum provou zero diferenças em path/OID/mode/stage/flags, extensões byteiguais, apenas statcache/checksum (API26/PANEL30/WEB12). Original e observação atual separados foram preservados; ROOT aceitou a observação para a fase dos sensores. Causa não atribuída e nenhuma tentativa de igualar ou corrigir índice. Controles comparam semântica contra original e observação de fase; final-preservation.json registra fontes/modos/status iguais e índices, sem substituir baseline original. MOBILE foi comparado à fonte congelada e ao prefixo no gate de projeção; não se alega preimagem QA anterior ao primeiro gate para esse arquivo.

Sem stage/ref/commit/stash/reset/restore/clean/push por QA. Git status/diff nominais recebem primeiro as quatro exclusões literais; ls-tree somente positivos. Quatro sufixos protegidos não são lidos/copied/importados/hash/stat/realpath em fontes ou cópias; guards e aliases/imports foram fechados antes de execução. Helpers/inputs novos foram fixados; dependências locais foram insumos readonly. Compiladores JS e bibliotecas Python não são bootstrap de aplicação. Não foi executado runtime histórico como suíte de produto. Arquivos privados criados com umask077; validation público664. O container PG próprio está parado, retido com dados e logs; scratch/probe/REDs mantidos.

Fronteiras: SQLite/PG com tabelas mínimas próprias; HTTP usa autenticação/factory sintéticas e guard real recortado; OpenAPI só router/segurança equivalente; UI usa JSDOM/backend e elementos sintéticos com Login/formulário/Sidebar/store/guards reais selecionados. Não certifica JWT integral, navegador real, fullapp, ancestrais/env.py, pool sob carga, UAT, operação real ou V1 inteira. Providers Resend/IA/WAHA/push OFF; sem credencial/dado real, request externo, cloud/EAS/gasto/upload/assinatura/deploy.

validate_state é executado após a gravação e deve retornar1 por este FAIL. Não há fechamento PASS/Verified nem aceite humano novo solicitado. ROOT coordena C1 e a próxima rodada independente; este relatório e toda evidência QA1 permanecem históricos.
