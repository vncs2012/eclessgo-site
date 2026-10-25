# R29a — Design proporcional


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


**Status:** núcleo T1 intacto e commitado; adaptadores T2 implementados; T3–T5 pendentes.

## Architecture Overview

InterestCore depende somente de contracts próprios e biblioteca padrão. As portas são Authorization, Eligibility, R11Normalizer, InterestStore/UnitOfWork, People e Audit. A porta Eligibility é autoritativa e não possui flags ou estados de aprovação inventados. O namespace não importa src, modelos, config, API, R11 real ou bootstrap.

Registro valida consentimento literal e normalização antes de abrir store; autorização é consultada antes e revalidada dentro da fronteira. Chave lógica: Church/Event/titular. Retry normalizado igual retorna identidade estável; divergência é explícita. Retirada mantém histórico e bloqueia reativação/encaminhamento.

Confirmação exige comando LINK com person_id ou CREATE com classificação. Dentro da fronteira há autorização atual, ADMIN local vivo, recarga do interesse, consentimento atual, elegibilidade e tenant. People só recebe o comando humano; nenhuma busca/seleção automática de match integra o núcleo. LINK não atualiza cadastro. CREATE delega R11 e audit próprio R11 à mesma unidade de trabalho.

Registro, confirmação e retirada só retornam depois de sair da fronteira. O contrato do store exige commit conjunto/rollback inclusive por falha de saída e serialização entre workers. T1 demonstra somente uso correto da porta por double de um processo. T2 deve provar implementação durável, locks/constraints e rollback SQL real.

## Components

| Arquivo T1 | Responsabilidade |
|---|---|
| src/application/activity_interest/__init__.py | Namespace sem bootstrap |
| src/application/activity_interest/contracts.py | Comandos imutáveis, referências, erros e portas |
| src/application/activity_interest/use_cases.py | Registro, consulta própria, retirada e confirmação |
| tests/r29a/isolation.py | Loader só dos três OWN sob namespace sintético |
| tests/r29a/test_core.py | Critérios prospectivos com double e assertivas de estado |

## Code Reuse Analysis

T1 reutiliza os contratos observados como interfaces, sem copiar/importar histórico. T2 integrará normalização e CreatePersonUseCase R11 reais, membership/autorização atual e AuditLogRepository na sessão request. Composição API candidata é community_router; admin_router/models registry e reservas R22b continuam fora da entrega.

## Data Models

Actor contém ID e session_version, não token. Interest guarda ID próprio, Church/Event/titular, Contact normalizado, versão/instante de consentimento, concessão atual, retirada e confirmação opcional. Confirmation guarda comando humano, Person/ator/instante. AuditEntry possui campos fechados de IDs/ação/versão/referência; não aceita details livre.

São valores de domínio, não schema SQL. Nenhuma migration, nova representação de Event ou estado de presença foi criada.

## Error Handling Strategy

InterestError usa código fixo sem dados pessoais. Ausência/negação de auth, elegibilidade, ownership, tenant, Person ou consentimento interrompe a operação. Save, People, audit e saída da fronteira podem propagar falhas; o núcleo não as converte em sucesso nem tenta novo envio. Mapeamento HTTP pertence a T2.

## Risks & Concerns

| Risco/limite | Tratamento |
|---|---|
| Sem aprovação/cancelamento em Event | P1 usa publicação atual/soft-delete, sem estados novos |
| Store double não prova SQL/concurrency PG | Contrato explícito; prova durável e R11 real exigidas T2 |
| Grant/sessão/consent mudam após preview | Revalidar dentro da fronteira; teste com mudança antes da entrada |
| Retirada disputa confirmação | Mesma fronteira; duas ordens verificadas no double |
| Contato/nome em auditoria | Payload fechado e assertiva exata de todos os campos |
| Imports protegidos/históricos | Loader não resolve src/config; teste verifica namespace não carregado |
| Ruff sem --no-cache na invocação inicial | Ressalva instrumental registrada em preservation; nenhuma limpeza autorizada |

## Transação e HTTP T2

SqlInterestStore abre sessão própria e resolve o tenant sem lock de Event/Interest; toma primeiro Church FOR UPDATE NOWAIT antes de entregar UnitOfWork. Assim register (Event antes de Interest no core) e confirm (Interest antes de Event) compartilham primeira ordem Church. Locks PG posteriores usam NOWAIT; lock/deadlock/serialization conflict é rollback+409, sem retry oculto. SQLite usa BEGIN IMMEDIATE real, arbitrando escritores por banco; isso é mais amplo que lock por tenant e não simula PG. Row_version condiciona UPDATE; UNIQUE(Church,Event,titular) impede duplicata.

Conta/session_version, ADMIN local ACTIVE/CHURCH_ADMIN, Church/Event atuais, consentimento e Person ativa/no tenant são revalidados na fronteira. CREATE executa CreatePersonUseCase e AuditLogRepository R11 na mesma sessão; LINK não altera Person. Commit ocorre na saída do store, antes do retorno do core e construção da resposta HTTP. Falha real de constraint no commit e falha de audit revertem Person, vínculo e audits, verificadas em conexão nova.

Schema runtime tem checks/FKs/UNIQUE e confirmação com guards IS NOT NULL explícitos para evitar UNKNOWN SQL em modo/classificação. Migration OWN contém DDL fixo/autocontido; upgrade/downgrade e equivalência colunas/checks/uniques/FKs com runtime são exercitados sem ancestral. Não há registro automático de modelos nem import do schema de produto pela revision.

GET public/activities e detalhe retornam só Event/Church IDs, título, nomeChurch e início/fim UTC, Cache-Control:no-store. Filtro usa datas normalizadas ou helper ISO real (legado assume UTC, offset é normalizado), nunca comparação lexical. Ordenação/contagem e paginação são feitas sobre seleção minimizada em memória para compatibilidade legada; grandes catálogos/fila exigem otimização futura, sem nova política. GET interests/mine é somente titular; fila usa contexto local e atuais grants. POST register/confirm e DELETE withdraw retornam apenas após commit. Erros OWN têm código fixo; nenhum SQL/parâmetro/contato vai para audit/log OWN.

Harness: worker exclusivo por Session real; execute/flush/commit/rollback/close delegam IO e devolvem o resultado/exceção SQLAlchemy/sqlite3 efetivo. add/get_bind/in_transaction também rodam nesse worker. A ponte aguarda future.done() cedendo ao loop e retorna future.result(); isso evita o hang observado no transporte de Future sem simular resultado. Overrides ASGI de identity/factory/clock são async para não exercitar threadpool auxiliar. Provas são SQL/ASGI mínimo, não driver async nativo/fullapp/PG.

## Integração WEB T3

public-activity-catalog contém parser/GET/decoder/projeção/paginação próprios; public-api acrescenta somente entryque reutiliza DEFAULT_API_BASE_URL. Nenhuma função/semântica antiga de cache foi modificada. Rota serverforce-dynamic/revalidate0 recebe searchParams, usa entryreal, lê NEXT_PUBLIC_PANEL_URL cru e locale. church-public-activities exporta viewSSR pura e wrapperperfil server que obtém getLocale próprio, sem depender do getTranslations/agenda herdados noPage.

i18n/request preserva composição de mensagens antigas e acrescenta namespace activityInterest PT/EN de módulos próprios. Teste executa requestreal com cookies/locales e JSONantigo sintéticos; mensagens antigas não lidas. SSRescapa títulos/textos viaReact; endpoints econfig inválidos viram erros públicos fixos.

Page é misto: WT pré-existente16824B/0664 SHAc34753569f1078aa48be5d10f89b9f932373baffdf8807d0a7046f3e94c5501c. OWN acrescenta só import ChurchPublicActivities e JSXcom church.id em âncoras comuns aHEAD/WT. Alvo privado005-page-commit-target.tsx contém HEAD+somenteOWN;005-page-own.patch é patch revisável. Remover exatamente essas duas adições reproduz WTpreimage byteabyte eHEAD respectivamente. Não stagear Pageinteiro. Gate sintaxe usa alvo; sem typecheckfull/perfil/browser, semapropriar i18nherdada ou church-detail-actions.

## Cancelamento, deadline e loading T3

public-api passa o binding público PUBLIC_UPSTREAM_TIMEOUT_MS à chamada OWN. O helper usa AbortController e Promise.race com cancelamento; revalida signal antes do GET, depois do fetch e depois do JSON, antes de devolver projeção. Um reader que ignora abort pode resolver, mas seu resultado não promove a resposta. finally limpa timer e listener externo; nenhum retry/envio posterior. /atividades/loading.tsx obtém locale e renderiza view OWN PT/EN. Prazo de8s é somente limite técnico de I/O; não altera retenção nem elegibilidade. A prova SSR cobre markup, não suspense/browser em operação.
