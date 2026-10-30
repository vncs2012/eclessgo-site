# R26a QA2 independente

Result: PASS

Data: 2026-10-30. Verificador Sol6.1/medium, contexto novo e independente dos autores Terra e corretor de testes Luna. Segunda rodada aberta AD-007. Esta rodada fecha QA1-01 por cobertura C1 e regressão S4 exata; qualquer terceira rodada fica restrita a pendências/survivors/regressões/gates, sem reiniciar a contagem.

49 métodos API e 34 instâncias UI distintos passaram, total83. WT+OWN e HEAD+OWN repetem os mesmos34 UI. Oito faults válidos mortos,16 controles intactos verdes, zero survivors pendentes e zero falhas/erros/skips/warnings nos gates aceitos. PASS LOCAL neste contrato, sem concluir toda a V1.

## Fontes e histórico

API T1 `9a00b81dbce306972fd0408002bd522b3432e7c4`, T2 `0fd9a503db99087f0fad6123b2f2c44263930cd6`, C1 `0f382277f19ab011568b41287dffb0850cf7c661` (pai T2). PANEL `43fb5055cab6225b9944125d65055b6464153eb3`, pai `b4736fc058323af6dba367ea4e9fb83d4b8bbd6d`. WEB `90a12a20f4212e30ddec3cdcdf8618ffa9eadd22`, pai `77b9d5c20a1ea4b0452a3cf82977338add957d7f`. MOBILE sem Git.

O QA1 FAIL, SHA256 `39de97078f771d632ea9a1808016a831984a4b64c5e378698534007c419a2192`, foi preservado fisicamente dos quatro espelhos e em validation-iteration-1.md. API iteration1 já existia; ROOT/PANEL/WEB foram criados nesta QA2 quando ausentes, sem alegar preexistência. O histórico de S4 sobrevivente e probe QA1 permanece. C1 não muda produto nem testes anteriores: acrescenta um método, quatro assertions de resultado e o contexto assertRaises. A comparação AST confirma todas as funções anteriores intactas, apesar dos offsets de import/novo método. O novo inventário conta235 asserts unittest +107 helpers=342 sites API,114 expect UI,31 declarações/34 instâncias UI. A linha do histórico C1 citada como401 corresponde à chamada assertEqual iniciada em400 no fonte atual.

Contrato ROOT spec/context/design/tasks/preservation completo e fechamentos mais recentes STATE/ROADMAP conferidos. Checkpoints que ainda dizem QA/commit pendente são históricos pré-commit; fechamento documental posterior pertence ao ROOT. R26 histórico imutável, R24b fechado com ressalvas humanas anteriores, R30/R34 futuros, R16a sem ampliação e R22b reservado.

Evidências abaixo são relativas a `.specs/evidence/r26a-network-membership/qa2-af09c298-fbe1-4f9d-964d-de6e3cbd07cb/` no ROOT. Citações `test_*.py` são `eclessGO/eclessgo-api/tests/r26a/`; demais testes são `eclessGO/eclessgo-painel/src/features/network-membership/`.

## Resultado por requisito

Cada linha conjuga status, payload, estado e histórico do cenário indicado. Valores foram reavaliados contra a spec; nenhuma assertion de chamada isolada substitui os campos do payload. O gate é a observação executada, dentro dos limites sintéticos declarados.

| AC | Resultado definido na spec | Assertion file:line e esperado/observado | Resultado |
|---|---|---|---|
| NET-01 | SUPER_ADMIN cria rede e evento na mesma operação; 201 id/nome | test_http.py:102 checked(...,201)=={id:NETWORK,name:Rede}; test_persistence.py:210,212,215–217: uma rede, NETWORK_CREATED/ator/instante/correlação | PASS |
| NET-02 | Outros atores recebem403 e nenhuma criação adicional | test_http.py:137,238 checked(...,403); test_persistence.py:192 error(FORBIDDEN),210 len(networks)==1 | PASS |
| NET-03 | Entradas fechadas, limites/exatidão; inválidos sem gravação | test_core.py:16,18,21–75 INVALID_INPUT e valores normalizados; test_http.py:143–159,351–374 404/422/413/409; test_persistence.py:593–596 NOT_FOUND e tabelas vazias | PASS |
| NET-04 | PENDING v1, slug canônico; nenhuma Membership | test_persistence.py:182–184 created/PENDING/1;223–243 centro, nome null, MEMBERS igual, REQUESTED único, replay sem duplicata | PASS |
| NET-05 | Pedido PENDING/APPROVED duplicado:409 e estado intacto | test_persistence.py:318,320 error(CONFLICT);321 len(links)==1 | PASS |
| NET-06 | Novo UUID depois de terminal preserva histórico | test_persistence.py:620,624 CANCELLED antigo/APPROVED novo e sequência exata de cinco eventos; HTTP:206–215 | PASS |
| NET-07 | ADMIN alvo aprova PENDING | test_persistence.py:259 (APPROVED,2); test_http.py:175 mesmo par | PASS |
| NET-08 | ADMIN alvo recusa PENDING | test_persistence.py:277 (REJECTED,2); test_http.py:206 REJECTED | PASS |
| NET-09 | Responsável cancela PENDING | test_persistence.py:282 (CANCELLED,2); test_http.py:212 CANCELLED | PASS |
| NET-10 | Owner ou ADMIN alvo encerra APPROVED; dados ficam | test_persistence.py:296,303 ENDED;304 quatro Memberships; NetworkMembershipPage.test.tsx:152–169 payloads cancel/end/reject e versões | PASS |
| NET-11 | SUPER_ADMIN sem papel específico não age | test_persistence.py:310–313 quatro NOT_FOUND, PENDING v1 e dois eventos; HTTP:314,316; S1 morto por NetworkError não levantado | PASS |
| NET-12 | PG duas conexões/dois ADMINs: um vencedor e perdedor409/PENDING | test_postgres.py:168–186 dois PIDs, um win, um CONFLICT, APPROVED/PENDING, um evento do vencedor; S3 morto por UNAVAILABLE≠CONFLICT | PASS |
| NET-13 | Transição/versão inválida:409 sem evento | test_persistence.py:340,342–343 CONFLICT e sequência exata sem duplicata; HTTP:177; UI:123–124 reload após conflito | PASS |
| NET-14 | Replay mesma identidade/dados:200 sem duplicação | test_http.py:128,176,280 objetos exatos; test_persistence.py:240–243,339–343; S5 morto ao dispensar ator | PASS |
| NET-15 | Falha antes do commit reverte estado+evento e retorna503 | test_persistence.py:359–362 DBAPI; C1:375,377 NetworkError/UNAVAILABLE;396 PENDING v1 em engine nova NullPool;400 só NETWORK_CREATED/REQUESTED;418 Membership snapshot igual; HTTP:393,406,412–413 503, rollback em nova conexão; S4 exato morto em396 | PASS |
| NET-16 | Cada transição: exatamente um evento mínimo, ator/versão/tempo corretos | test_persistence.py:228,232,236,491–501,603; test_postgres.py:184–186; test_http.py:199 sequência REQUESTED/APPROVED/ENDED | PASS |
| NET-17 | ADMIN pendente vê nome solicitante só no próprio pedido | test_persistence.py:249–253 uma rede, nome, sem church_name e rede alheia vazia/404; HTTP:168–171; UI:94–101 própria comunidade | PASS |
| NET-18 | Nomes APPROVED autorizados; is_responsible por rede/ator | test_persistence.py:262–269 PeerLink exato, pendente sem nome;515,535,550,553,561,563 flags false/true e SELECTs constantes; HTTP:180–187 | PASS |
| NET-19 | Terminal sem nomes e sem referência | test_persistence.py:279,284,299; HTTP:195,306–307 null; S2 morto por all(church_name is None and requested_ref is None)==False | PASS |
| NET-20 | ADMIN vê eventos somente da própria comunidade | test_persistence.py:491–499 sequência e campos exatos, NOT_FOUND alheios; UI:224–227 cursor e church própria | PASS |
| NET-21 | Listas e eventos restritos, sem catálogo público | test_persistence.py:253,477 items==[];482–483 NOT_FOUND; HTTP:263–264 todas operações401; OpenAPI:61,66 caminhos/security | PASS |
| NET-22 | Trilha durável e sem TTL novo | test_persistence.py:491–513,579–582,722–726; test_migration.py:261,268–278 SET NULL, sentinelas e histórico preservados; inspeção revisão/schema sem TTL, sem prova temporal futura | PASS |
| NET-23 | Membership, papéis e grants não mudam | test_persistence.py:227 snapshot antes/depois;304,513 quatro Memberships; C1:418 snapshot integral; migration:278 m2; guards locais readonly | PASS |
| NET-24 | Guard comunitário anterior nega owner sem Membership | test_http.py:462,472 assertRaises(Denied);479 ADMIN alvo autorizado; auth-integration.test.tsx:159–160 sem Dashboard; guard real recortado, sem JWT/rota integral | PASS |
| NET-25 | Revogação de sessão/conta/Church/Membership nega sem mudança | test_persistence.py:425–456 códigos exatos, PENDING/dois eventos;669–673 APPROVED/três preservados; PG:198,209–210; HTTP:225,234,333–345 | PASS |
| NET-26 | Capacidade retorna exatamente três booleanos próprios | test_persistence.py:460–478 objetos exatos para owner/SA/MEMBER/ADMIN; HTTP:121,133; OpenAPI:83–86 chaves exatas | PASS |
| NET-27 | Owner sem Church entra login/bootstrap e redes | auth-integration.test.tsx:73–77,92–95,144–153,188–191: sessão negociada, Church null, /redes, bootstrap e retry; S6 morto ao usar identidade anterior | PASS |
| NET-28 | USER inelegível sem capacidade continua negado | auth-integration.test.tsx:115–116,153,167–168 isAuthenticated false e /login; navigation.test.ts:27 sem /redes | PASS |
| NET-29 | MEMBER recebe só rede adicional; acesso TEAM anterior preservado | auth-integration.test.tsx:102–109 /equipes-e-escalas ou /redes, Church null;159–160 sem Dashboard; navigation.test.ts:9–18 arrays exatos | PASS |
| NET-30 | Sessão/comunidade nova descarta respostas anteriores | NetworkMembershipPage.test.tsx:190–193,242–245,257–261 abort, Current network e ausência Old/Late; auth:129–136,178–181,246–247; S8 morto por Network A anterior reaparecer | PASS |
| NET-31 | Ações por rede/própria comunidade, pt-BR/en e reload409 | NetworkMembershipPage.test.tsx:76–81,94–101,123–124,152–169 controles e payloads; i18n.test.ts:15–33 keys não vazias, Aprovar/Pendente e Approve/Pending; S7 morto por cancel indevido | PASS |
| NET-32 | Listas até100, ordenação e cursor estáveis | test_core.py:69–75 defaults/limites/cursor; test_persistence.py:680–690 eventos/cursor,709–713 ids[:100],ids[99],restante,null; UI:202–213,224–227 append/cursor | PASS |
| NET-33 | Auth em todas rotas, envelopes fechados/no-store/sem eco | test_http.py:92–93 checked(status,no-store) em63 invocações,143–159,263–264,393; OpenAPI:61–97 oito operações e additionalProperties false; UI:175–176 erro sem detalhe bruto | PASS |

O reverso exaustivo em `assertions-reverse.json` e `.md` foi reextraído por AST dos seis arquivos API e quatro UI atuais. Cada site tem file:line, expressão inteira, operandos esperados, dono e requisito; contém inclusive assertRaises e os quatro resultados C1. As associações foram confrontadas com os resultados canônicos, não presumidas a partir das contagens autorais291. `source-provenance.json` confere a igualdade das fontes selecionadas anteriores e a adição C1. A UI foi reextraída com TypeScript e produz inventários idênticos antes/depois da pinagem prospectiva complementar. Métodos, sites, chamadas de helper e repetições são universos distintos.

## Edges e qualidade

Replay conserva UUID/versão/dados/ator e último evento: persistence:339–343, HTTP:267–307, UI:112–114,141–144 e S5. URL http/https canônica /comunidades e alias /igrejas, UTF-8 estrito/decode único, sem userinfo/barra/controles, query/fragment descartados: core:41–65 e persistence:223–243; parser local sem fetch. Remoções físicas mantêm histórico/SET NULL sem transferir responsabilidade: persistence:509–515,722–727 e migration:261–278. Erros,409,abort e mudança de contexto não promovem dados antigos: UI:118–131,172–193,230–261, S6/S8. Todos constam do reverso.

A implementação lida mantém autorização dentro da transação, revalidação de ator e alvo, locks/índices parciais, replay por ator/último evento e projeções mínimas. Os guards locais anteriores e os dez herdados permanecem readonly. Os testes de NetworkSummary continuam exigindo id/nome e booleano por rede; C1 não enfraquece nenhum caso anterior. Sem novo grant, Membership, catálogo, papel, árvore de redes, provider ou função fora de T1/T2/T3. Guia aplicado: eclessGO/AGENTS.md e coding-principles de tlc-spec-driven. Não houve correção de fonte ou teste pela QA2.

## Gates aceitos

`gate-accepted.json` aponta os oito diretórios nominais e contagens. Cada run guarda stdout/stderr/receipt integrais. Python trata warnings como erro. Todos os83 métodos distintos têm zero falhas, erros e skips; nenhuma repetição de controle amplia o total.

| Gate | Resultado | Recibo/diretório |
|---|---|---|
| Domínio |6/6|runs/core-gate-67d4a565-905e-4507-a5de-4365ce6a968c|
| SQLite novo |25/25|runs/persistence-gate-4f8696cd-d048-41ea-b335-63fdffade79c|
| PG novo, duas conexões/dois ADMINs |2/2|runs/postgres-gate-35223b1e-5384-4e5e-b690-3c689b3216eb|
| HTTP sintético |12/12|runs/http-gate-4418c7df-ceb3-4e35-ae90-4981020ea4fd|
| OpenAPI |2/2|runs/openapi-gate-ed5860d2-1c5f-4e5e-829f-d5c0f60553df|
| Migration OWN SQLite+PG novos |2/2|runs/migration-gate-2f7dde1b-3966-4b0a-886f-d1050d67995c|
| UI WT+OWN |34/34|runs/ui-wt-gate-3ad6165b-28cd-459e-80bd-d164e7a6e7a9|
| UI HEAD+OWN |mesmos34/34|runs/ui-head-gate-db9a3c43-a640-43ac-ad6f-666c55d2ea3c|
| PANEL TypeScript5.8.3 |13 roots,0 erros,exit0|build-runs/check-panel-source-v2-848470f7-1eae-4b67-afb5-ededbbecfffb|
| Três contratos TS5.8.3/5.9.3/6.0.3 |0 erros/duplicatas,exit0|build-runs/check-generated-v3-0ba1f459-a2b3-4d1f-9224-ebcad40428ac|
| PANEL lint |15 fontes,0 novos,2 anteriores,0 warnings,exit0|lint-panel-repeat/receipt.json e lint-panel-repeat.json|
| API Ruff E/F/I/B |7 fontes limpas; main1 I001 anterior igual parent sob mesmo contexto, ambos exit1;0 novos|ruff-v2/result.json|
| C1 Ruff |teste OWN sem achados,exit0|ruff-c1/receipt.json|
| Projeção |8 operações,29 schemas,4 colisões novas renomeadas; três arquivos iguais, prefixo e sufixo renderizado exatos,exit0|repeat-projection-v2/receipt.json e projection-v2/result.json|
| Carrier MOBILE |apply/reverse exit0,fuzz0,bytes exatos|carrier-v2/*|
| Spec/tasks strict ROOT |exits0,0 erros/avisos|build-runs/spec-2d93177b-c2d4-43e3-ba8a-68b1c9feaec6 e tasks-ad4956dd-d656-4cbf-ba87-ad02ed744b92|

Os três gerados têm58.806 bytes e SHA256 `abda26a67520f47efce1f3bb873ec9117e77f66d72646239f6f951ba984d77f8`. Prefixo55.719 bytes com SHA256 `98cf930dd996d8344f941b47b4206b6f7025281ba013945b30c0891e1d7d4ae0`. Os nomes de arquivos anteriores e versões substituídas ficam retidos; não são novos testes distintos.

## Discriminação, oito focos

Cada fault foi aplicado somente em cópia e executado entre controles intactos antes/depois. Todos os16 controles verdes. Cada sensor guarda mutation.json, patch/before/after ou patch no run, stdout/stderr/receipts e preservação antes/depois. `sensors/result.json` registra o conjunto. Falhas são de negócio, zero erros de setup/import/tipo/timeout nos faults aceitos.

|Sensor|Risco/alteração|Esperado versus observado no fault|Resultado|
|---|---|---|---|
|S1|SA dispensa papel específico|NetworkError esperado, não levantado em3 testes SQLite|morto|
|S2|Terminal mantém referência|all(church_name is None and requested_ref is None) viraFalse|morto|
|S3|Perdedor PG vira503|CONFLICT esperado, UNAVAILABLE observado; corrida real executada|morto|
|S4|rollback→commit em BaseException|C1:396 exige PENDINGv1 em engine nova, recebe APPROVEDv2;1 falha/25,0 erros|morto|
|S5|Replay dispensa mesmo ator|NetworkError esperado para outro ADMIN, não levantado|morto|
|S6|Capacidade negociada usa sessão anterior|conjunção de quatro observações do transporte difere;1 falha/34|morto|
|S7|Owner usa capacidade global em rede apenas legível|cancel indevido aparece;1 falha/34|morto|
|S8|Provider ignora geração/contexto|Network A anterior reaparece;1 falha/34|morto|

S4 usa exatamente o patch histórico SHA256 `6bd9c0453a933cebd9c908a18ce491cb0d5f68158df6400a78b9930984c9d7c1`, conservado em sensors/S4-rollback-state-event/mutation.patch e no run. Controles S4 completos25/25 antes/depois. O novo teste versionado mata o mutante; o probe antigo não é usado para sanar cobertura. O status do perdedor da corrida é o foco S3; não se afirma que remover um só mecanismo redundante de exclusividade seria necessariamente discriminado. Nenhum nonzero instrumental é contado como kill. São8 faults atuais mortos; o survivor QA1 continua histórico, sem reset AD-007.

## Preservação e ressalvas processuais

Baseline QA2 antes de gates:92 registros selecionados, incluindo documentos ROOT, relatórios físicos QA1, fontes OWN/readonly e MOBILE. Contém WT/HEAD/modos quando aplicável, hunks nominais, pais/HEADs e índices brutos originais. Isso é captura selecionada, não árvore integral. Os36 readonly QA1 foram incorporados nominalmente; dez herdados e três mistos useLoginPageState/Sidebar/ChurchSwitcher conservados. O MOBILE agora tem pré-imagem QA2 anterior aos gates; a limitação histórica QA1 de captura MOBILE posterior não é apagada.

Índices brutos dos três repos e refs ficaram byteiguais na reconciliação e nos16 snapshots antes/depois dos sensores. Sem ajuste de índice para satisfazer hash. QA1 teve statcache-only anterior com causa não atribuída, registro preservado. A passagem Git ampla C1 foi um desvio de seleção de comando registrado pelo autor; não há prova de IO protegido ou de ausência de IO por esse comando. O comparativo C1 documenta2643 entradas NÃOOWN brutas e TREE iguais antes/depois; a QA2 não converte esse desvio em violação de arquivo presumida nem exige aceite humano por metadados preservados.

Ressalvas próprias QA2, com histórico bruto retido: primeiro lint tentou caminho antigo ausente e falhou ENOENT; recipe foi remapeada. A primeira tipagem dos gerados usou o compilador TS6 autoral como insumo readonly; passou novamente com cópia nova. Alguns helpers derivados de build/projeção/inventário/extra-gates tinham receitas/inputs verificados, mas sem hash QA2 específico pré-primeira execução. A pinagem prospectiva complementar em derived-pins.json e final-gates-pins.json antecede os gates aceitos repetidos da tabela. O lint dessa repetição encontrou EEXIST no output anterior; a nova versão usa output exclusivo e passou. Nenhum arquivo antigo foi sobrescrito para remover a evidência. Helpers principais de execução Python/UI e sensores estavam fixados antes dos gates e não foram afetados; não se repetiu funcionalidade sem motivo. Inspeções textuais imprimiram literais de identidades/headers sintéticos presentes no teste; sem request, conta ou credencial real observada; o relatório público omite esses valores. Não se alega conformidade retroativa dos pins nem zero exposição histórica universal.

Sem stage/ref/commit/stash/reset/restore/clean/push pela QA. Git status/diff nominais recebem primeiro quatro exclusões literais; ls-tree usa apenas positivos nominais. Guard lexical dos quatro sufixos proibidos antes de IO/import/realpath e fechamento de aliases/imports; nenhum bootstrap fullapp ou config default que percorra os proibidos foi executado. Scripts/configs/SQLite/PG/UI novos, dependências locais readonly. Evidência privada usa diretórios700/arquivos600 e relatórios públicos664, com uma exceção observada: write-report.py foi criado pelo heredoc com modo664, contém apenas texto e lógica do relatório e foi corrigido para600; helper-mode-observation.json preserva a ocorrência, sem alegar modo600 desde a criação desse helper. O PG sem rede é parado e retido com dados/logs no encerramento. Scratch/REDs/receipts permanecem. Nenhum outro spec/tasks/STATE/ROADMAP/LESSONS é alterado pela QA.

## Limites e fechamento

HTTP usa auth/factory sintéticas e guard local real recortado; OpenAPI usa router real e segurança sintética equivalente. SQLite/PG usam esquema mínimo próprio; migration executa somente revisão OWN, com tipos/PK/FK/CHECK/UNIQUE parciais/SET NULL/sentinelas, sem env.py ou ancestrais. UI usa JSDOM/backend e componentes de apoio sintéticos, com Login/form/hook/Sidebar/store/guards reais selecionados e variantes mistas. Não certifica JWT real, navegador fullapp, nativo, UAT, pool sob carga, operação real ou V1 inteira. Providers Resend/IA/WAHA/push OFF; sem produção/dado real/request externo/cloud/EAS/gasto/upload/assinatura/deploy.

validate_state com feature posicional é obrigatório e foi executado nos quatro roots após este relatório; receipts em state-final/. Fechamento Verified LOCAL documental e commits cabem ao ROOT após revisar este PASS e as ressalvas. Não há defeito de produto, survivor atual ou correção de teste pendente neste recorte.
