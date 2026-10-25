# R29a — Contexto e limites


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


## Contrato humano aprovado

Atividades públicas aprovadas/futuras respeitam publicação, privacidade e cancelamento. Pessoa autenticada registra interesse com consentimento explícito, nome e um contato escolhido; sem consentimento, zero gravação R29. Repetição não duplica. Titular consulta/retira somente seu interesse. ADMIN local decide LINK explícito de Person existente ou CREATE via R11; nenhum merge automático. Autorização/consentimento/elegibilidade são atuais no momento da confirmação, com isolamento e auditoria. Interesse, cadastro e presença são distintos; R15 permanece intacto.

## Decisões humanas e autorização atual

P1/P2 foram resolvidas nos limites do checkpoint T2 abaixo. T1 commitada; T2 liberada nominalmente, sem janela de índice/commit. T3–T5 seguem sem liberação.

## Fatos de integração consultados estaticamente

Event atual tem publicidade/datas e soft-delete, sem aprovação/cancelamento próprios. Church pública exige PUBLISHED/ativa/não excluída. dependencies usa conta atual/sessão e membership local ativa. R11 consulta matches sem fusão e cria Person com audit na mesma sessão. get_session faz commit/rollback da requisição; after_commit não serve para confirmação durável. Essa era a observação estática T1. T2 executa somente as folhas reais nominalmente liberadas sob loader guardado; só community_router é composição existente alterada.

T1 não importa essas integrações: recebe portas. T2 precisará demonstrar sua conexão real e transação/serialização durável; testes atuais não substituem isso. Web não teve sessão de usuário demonstrada nas fontes consultadas. Retomada R29 no painel será própria, com destino restrito, apenas ID/path público e nenhum POST após login sem clique novo; login/store/hooks/client reais permanecem opacos nesta entrega.

## Finalidade e minimização

Interesse guarda nome/um contato escolhidos para revisão humana e eventual cadastro local, titular/Event/Church e prova mínima de consentimento. Auditoria R29 guarda apenas IDs, ação fixa, versão e referências. Sem Analytics individual, mensagens, User/convite, outbox ou presença automática. Retirada bloqueia novos encaminhamentos, não apaga Person nem histórico.

RETENTION_POLICY pública mantém CRM e demais categorias sem prazo geral aprovado. Nenhum prazo de paz/30dias, TTL, expurgo, base jurídica nova, exportação ou worker foi herdado.

## Deferred Ideas

Nenhuma expansão automática: reconsentimento após retirada, edição de contato, outros tipos de atividade, providers, notificações e ampliação R15/R16/R24/R26 ficam fora do recorte. R26 permanece com owner externo; R24 provedor/ativação pausados; R16a sem expansão e fechamentos anteriores preservados.
