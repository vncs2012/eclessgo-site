# R29a T1 — Preservação e manifesto


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


**Parent API esperado:** 5f06b46b7cc66f0b3bfe16eee14a394811e441a5.
**Status:** cinco fontes/testes e cinco documentos API novos; cinco documentos ROOT idênticos como mirrors. Nenhum índice ou commit autorizado.

## Baseline prospectiva

Recibos privados: ROOT/.specs/evidence/r29a-activity-interest-crm/t1-core-20261024/.
000 registra ausência exata dos15paths e componentes sem symlink antes de escrita; 001 registra os três HEADs esperados e cached completos filtrados vazios. As quatro exclusões literais precedem o positivo ponto nos cached; sem hooks/fsmonitor/extdiff/textconv.

STATE467145B SHA2562ae000da3ec86fe9415de750c578fb24ec97fca5525bd4f5bc9c0b5dc27f6fcf; ROADMAP157010B SHA256e1c1d904d8ebe7e4d5706c401b6b0b6cdf229e39fb1b17e842cd27ad87906a1d. Baseline T1 confirmou os canônicos e os preimages integrais persistidos/fsynced na passagem preflight. Nenhum canônico foi escrito.

Não há fonte existente OWN nesta entrega; portanto nenhum preimage/hash de produto antigo foi capturado. Fontes somente de leitura, reservas externas, quatro sufixos proibidos, três static-only, auth/store/client/config/bootstrap e evidências/testes históricos permaneceram sem escrita ou importação. Nenhum cabeçalho migration foi consultado.

## Manifesto literal API: dez paths

| Tipo | Path |
|---|---|
| Fonte | src/application/activity_interest/__init__.py |
| Fonte | src/application/activity_interest/contracts.py |
| Fonte | src/application/activity_interest/use_cases.py |
| Teste | tests/r29a/test_core.py |
| Loader teste | tests/r29a/isolation.py |
| Doc | .specs/features/r29a-activity-interest-crm/spec.md |
| Doc | .specs/features/r29a-activity-interest-crm/context.md |
| Doc | .specs/features/r29a-activity-interest-crm/design.md |
| Doc | .specs/features/r29a-activity-interest-crm/tasks.md |
| Doc | .specs/features/r29a-activity-interest-crm/preservation.md |

ROOT recebe somente .specs/features/r29a-activity-interest-crm/{spec.md,context.md,design.md,tasks.md,preservation.md}, bytes idênticos aos cinco API. Nenhuma feature/doc PANEL/WEB foi criada.

## Recibos e limites instrumentais

Pedidos de execução T1 guardam cwd e argv completos antes do subprocesso; saídas stdout/stderr/exit brutas são persistidas depois, com0600/O_EXCL/fsync. Bootstrap cria somente o alojamento privado0700 antes de gravar seu primeiro pedido. Fontes/docs novos usam0644; não há alteração de modo herdado. Manifesto final privado registra modos/tamanhos/SHA256/blob Git calculado com hashlib sem gravar objeto Git.

Unidade005:33 testes,0falhas,0skips. Compilação006:cinco arquivos em memória sem execução/pyc. Lint007:ruff check --isolated somente cinco OWN, exit0. Mensagem008:check_commit exit0. As validações de spec/tasks ROOT/API são registradas após documentos finais. Nenhum validate_state/QA/sensor de feature foi executado.

**Ressalva de cache:** o lint007 foi executado antes do lembrete ROOT de --no-cache e não possuía essa flag. A leitura somente de nomes/lstat010 encontrou diretórios de cache preexistentes; API/.ruff_cache/0.5.7 tem mtime compatível com a invocação. Sem baseline desse cache não é possível determinar seu delta nem afirmar ausência de escrita instrumental fora OWN. Conteúdo não foi aberto, hash não foi calculado e nada foi removido. O lint verde não foi repetido. Essa ressalva não é falha de produto nem prova de preservação global da árvore.

A contagem final distingue invocações históricas e gates lógicos; nenhum verde é repetido por cosmética. Autenticação/Person/audit são doubles. Serialização no double é somente um processo; durabilidade e concorrência real ficam em T2.

## Ownership e próxima janela

R22b mantém admin_router/models registry/0042/PersonPage/relationships e demais reservas externas; R26 externo, R24 provedor/ativação pausados, R16a sem expansão. Janelas anteriores continuam fechadas. ROOT revisará somente estes dez paths API e decidirá eventual janela de índice/commit. T1 não libera T2 ou cabeçalhos de migrations.

## Preservação T2 e ressalvas reais

Baseline atual prospectiva: preparation-v1/preimages e implementation-v1/000-existing-preimages.json guardam cópias integrais/fsynced dos canônicos CURRENT e dos11existentesOWN antes das escritas. STATE469597B0664 SHA7bc31ce5dd6afd86ae7d1c5a52dcbd4f2a3349bcfdbcc066c7ea2c6ef8406cc1; ROADMAP159462B0664 SHA65b07e2e4320bd9e7ef8a9d9de0d9979178394e3628b526add80768326f88d69. Preflight original e pré-append T1 preservados; não substituídos.

ParentAPI T2 esperado2b30d19b6e025e8805907d23b88e83d52931a8e5; PANEL33458ba58cadc83a9002d115ab5187873f9e4cf2; WEBacf47a4e758ccb11dec4cd65a6f10f11786d9c35. Três cached filtrados vazios no baseline; novo manifesto final revalida. community_router herdado clean e0664 preservado; demais novos0644. Sem alteração T1source/test, STATE/ROADMAP/lessons, registry/reservas ou índices.

Tentativa006 unittest ficou sem retorno; Ctrl-C da ferramenta encerrou wrapper com130. Request prospectivo006 existe, mas wrapper mantinha buffers do filho em memória e NÃO persistiu stdout/stderr/exit brutos antes da interrupção. Recibo retrospectivo007 registra exatamente a lacuna; não há reconstrução, contagem ou prova comportamental dessa tentativa. Dois reads estáticosOWN e diagnóstico de nomes de processos após compaction ocorreram sem request prospectivo;007 também registra essa precisão, sem alegação universal de instrumentação.

Tentativas010 e023 e dirigido014 foram interrompidos por timeout, raws/exit reais preservados. Diagnósticos015–020 (seis processos) localizaram future SQL concluído com await sem retomada, não falha de negócio. Ponte IO passou a aguardar future.done()/result() real no worker exclusivo; dirigido022 passou1/1. Override ASGI async removeu hang do threadpool auxiliar; dirigido028 passou1/1. Fixture de email .test inválida pelo R11 real foi corrigida para .com, sem mudar critérios.

Discover029 passou56/56; lint030 falhou3itens e foi corrigido sem enfraquecer regras. Compile032/lint032 e dirigido de corrida032 passaram. Cinco gates estruturais finais ainda são registrados após os docs; manifesto final distingue8gates lógicos, invocações históricas e6diagnósticos, sem contar timeout como detecção comportamental. Lint T2 sempre --isolated --no-cache; ressalva cache T1 histórica permanece, nada foi limpo.

Migration OWN fixa/autocontida; somente ela é executada sobre pais novos.42ancestrais tiveram apenas4metadados literais do cabeçalho extraídos; nenhum corpo/import/hash/cópia/execução. Exceção de leitura não transferiu ownership0042/R22b. Loader executa somente folhas nominais, Base neutra de fixture e classe AuditLogModel isolada; não bootstrap/config/registro/database completo.

## Manifesto literal T2

- API src/infrastructure/persistence/activity_interest_schema.py
- API src/infrastructure/persistence/repositories/activity_interest_repository.py
- API src/infrastructure/persistence/activity_interest_adapters.py
- API src/infrastructure/api/routers/v1/activity_interest_router.py
- API alembic/versions/r29a_activity_interests.py
- API tests/r29a/sql_fixture.py
- API tests/r29a/test_persistence.py
- API tests/r29a/test_routes.py
- API tests/r29a/test_migration.py
- API src/infrastructure/api/routers/v1/community_router.py
- API .specs/features/r29a-activity-interest-crm/spec.md
- API .specs/features/r29a-activity-interest-crm/context.md
- API .specs/features/r29a-activity-interest-crm/design.md
- API .specs/features/r29a-activity-interest-crm/tasks.md
- API .specs/features/r29a-activity-interest-crm/preservation.md

ROOT: os mesmos5docs acima, espelhos byte a byte. Exatamente15API+5ROOT; nenhuma UI liberada. Sem serviço, rede, instalação, provedor/envio/push/deploy. R26ownerexterno, R24PAUSADO, R16asemexpansão e fechamentos preservados.

## Preservação T3 e incidente instrumental

v2 é correção do instrumento/executor, não nova rodadaQA. v1Luna não alterou fontes/testes/config/docs públicos ou índice. Fatos recebidosROOT: cinco consultasGit em003request usaram magicpathspec incorretamente prefixado:3cachedraw completosWEB/API/PANEL e2WTnominaisstatus/diff. Todosreturn0; seisrawsstdout/stderrcached tinham lstat0B; WT35B/13433Bnominais. Oagente também abriu003-result.json e004-result.json porjson.load, lendo streamsinline (duasleituras). Não reduzir incidente a2consultas. Nada desses resultados/raws foi reaberto/copiado/hasheado emv2; não inferir exposição deconteúdo dos4sufixos, não alegar preservaçãoglobal. 012requestv1semresultado permanece semresultado. Histórico não apagado/renomeado.

v2 guarda argvFINAL failclosed:4exclusõesliteraisexatas emordem logo após -- antes dequalquerpositivo. PrefixoGitobrigatório, diffsemextdiff/textconv, rawsemabreviação; WTsomente17nominais, cachedcompletofiltrado pontopositivo. Pedidosargv/cwd fsynced antes; streamsseparados flush/fsync e exitreal depois; resultJSONsómetadata. Nenhumresultado desconhecido parseadoparadescobrirschema; v1permaneceopaco.

Baseline001 registra14novosWEBausentes, preimagesintegrais atuais dos3existentesWEB+5docsROOT e2canônicos fsynced antesdeescrever. Page16824B0664 SHAc34753569f1078aa48be5d10f89b9f932373baffdf8807d0a7046f3e94c5501c; public-api7257B0664 SHA1cbd810b5b382a5faf48be35ce0b2d5d0772516d785e2345b193344173e88172; request819B0664 SHA94b9e42f6e525e644d18ecedb53eb30bc79e70f0c728289efc78f49a64761060. SomentePage tinha delta herdado nosnominais. church-detail-actions não lido/hasheado/tocado. Pagepreimage integralnovo é preservado; OWNpatch ealvoHEAD+OWN separados, reversibilidade exata. WTcompletoherdado não é blobcommitautorizado.

STATE472480B0664 SHA58792a92ce9ab22f5df37ec96059533cd4f5a8be414caa76dc6330230c5f3ecd; ROADMAP162345B0664 SHA2f8cc57a0337fea1473f8347486a82bafc172fee7a5ea5ec97a8782ab4647192. Não alterados; baselinesoriginais/T1/T2 preservados. API4fc63f800271b470d22902870c5cb3ae7014aa74, PANEL33458ba58cadc83a9002d115ab5187873f9e4cf2 eparentWEBacf47a4e758ccb11dec4cd65a6f10f11786d9c35;3cachedfiltrados vaziosbaseline. T1/T2 fontes/testes/docsAPI não alterados.

Resultados/limites/contagemhistórica T3 ficam em manifesto final próprio. Falhas007/008 e009originais preservadas; duasassertionsSSR foram corrigidas somente apósACKROOT, valoresdenegócioexatos; novoendnão-null também autorizado. Node013padrão reportou1arquivoPASS, não24casos; Node015semisolamentoprocesso reportou24/24 reais. Sem fullbuild/fullTSC/Vitest/configraiz/JSONantigo/browser. tests/r29a/.build é derivado doTSC, nunca pathcommit.

## Manifesto nominal WEB T3

- src/app/igrejas/[slug]/page.tsx
- src/lib/public-api.ts
- src/i18n/request.ts
- src/app/atividades/page.tsx
- src/app/atividades/loading.tsx
- src/lib/public-activity-catalog.ts
- src/lib/public-panel-activity-origin.ts
- src/components/site/church-public-activities.tsx
- src/i18n/messages/activity-interest/pt-BR.ts
- src/i18n/messages/activity-interest/en.ts
- tests/r29a/tsconfig.json
- tests/r29a/isolation.d.ts
- tests/r29a/public-activities.test.cjs
- .specs/features/r29a-activity-interest-crm/spec.md
- .specs/features/r29a-activity-interest-crm/context.md
- .specs/features/r29a-activity-interest-crm/design.md
- .specs/features/r29a-activity-interest-crm/tasks.md
- .specs/features/r29a-activity-interest-crm/preservation.md

ROOTsomente5docs correspondentes idênticos aosWEB; snapshotAPIhistórico não reescrito. Modos3existentes0664 preservados, novos0644. Manifesto final calculaSHA/blobsbytes semescreverobjetoGit; PagepossuiWT ealvocommit distintos. Índice/commit ainda aguardam janelaROOT.

## Complementos T3 e contagem final

ROOT liberou loading.tsx como18ºpath antes da escrita; ausência e componentes conferidos017. Declaração pública017: PUBLIC_UPSTREAM_TIMEOUT_MS=8_000, sem ler/seguir/executar restante BFF. Testes018 persistidos antes da correção comportamental;019 dirigido registrou ready≠error para body cancelado ainda resolvendo. Fontes020 corrigiram abort/deadline/cleanup e acrescentaram loading; TSC021/Node02129/29 e sintaxe022 public-api finais verdes. Gates verdes006/010/015 são versões anteriores; Page/request continuam nos mesmos bytes de010.

Histórico de gates de fonte:006TSC0,007Nodearquivo1,008TAParquivo1,010sintaxe0,013Nodearquivo0,015TAP24/240,019dirigido1comfalhacomportamental,021TSC0,021TAP29/290,022sintaxe0. Diagnóstico009 separado:23casos21PASS/2FAIL; help014 e declaraçãoestática017 não são gates. Mais cinco gates estruturais finais serão registrados após docs, totalprospectivo15invocações de gate e8gateslógicos. Não contar falhas de launcher como detecção comportamental. Manifesto final será a referência dos resultados reais.

Node semisolamentoprocesso é opção suportada confirmada nohelp local014 e autorizadaROOT. Nenhum teste/assertion omitido;29/29 finais semskips. SSRloading prova markup, não transição no navegador. API/T1/T2/canônicos não escritos; nenhuma nova prova global de preservação. Snapshotdosdocsantesdestacomplementação em023-before-* mantém a versão24/24.
