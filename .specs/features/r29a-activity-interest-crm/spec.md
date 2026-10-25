# R29a — Interesse consentido e confirmação CRM


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


**Status:** contrato humano de seis itens preservado; T1 commitada, T2 implementada localmente sob liberação nominal ROOT. Feature em andamento, sem Verified.

## Problem Statement

Uma pessoa precisa declarar interesse em atividade pública sem virar cadastro ou presença automaticamente. ADMIN local deve decidir explicitamente o vínculo com Person ou sua criação R11, com autorização atual, consentimento e isolamento entre comunidades.

## Goals

Entregar cinco recortes finitos: núcleo API, persistência/API, descoberta web, interesse autenticado no painel e fila ADMIN. T1 estabelece invariantes e contratos de portas, com prova unitária; T2 demonstrará adaptadores reais e transação durável.

## Out of Scope

| Item | Limite |
|---|---|
| T1 | Sem persistência, HTTP, schema/migration, web/painel ou fonte existente |
| Aprovação/cancelamento Event | P1 resolvida pela publicação atual; nenhum campo/estado novo |
| Operação | Sem provedor, mensagens, outbox, presença/RSVP, User/convite, serviço, rede, push/deploy |
| Ciclo de vida | Sem TTL/expurgo, merge, atualização automática ou exclusão de Person |
| Históricos | R26 externo; R24 provedor/ativação pausados; R16a sem expansão; fechamentos preservados |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| P1: significado de aprovado/cancelado | Publicação atual, futuro e não exclusão | Decisão humana direta na retomada T2 | Sim,2026-10-25 |
| P2: cabeçalhos das migrations e grafo | Somente4atributos literais no prefixo |42nós/head0042_person_relationships comprovados por grafo estático | Sim,leitura limitada |
| T1 independente | Portas de elegibilidade, autorização, normalização R11, store, People e audit | Liberação ROOT restringiu a implementação ao núcleo | Sim, liberação T1 |
| Serialização/durabilidade | Contrato explícito de store; doubles somente | SQL, concorrência entre workers e integração R11 real pertencem a T2 | Limite de prova T1 |
| Retirada/retry | Não reativar nem substituir contato implicitamente | Consentimento retirado impede novos encaminhamentos | Contrato T1 |
| Falhas e contato | Erros de domínio sem dados pessoais; exatamente um contato por request | Minimização; normalização R11 fornecida por porta | Contrato T1 |

**Open questions: none for the released T2 scope.** P1/P2 resolvidas nos limites do checkpoint atual; isso não declara aprovação integral/Verified da feature.

## User Stories

### R29A-01: Atividade elegível

**User Story:** Como visitante, quero descobrir somente atividades públicas futuras elegíveis.
**Acceptance Criteria:**
1. WHEN a elegibilidade autoritativa é negada THEN o núcleo SHALL rejeitar registro ou confirmação sem gravação de sucesso.
2. WHEN o catálogo é consultado THEN ele SHALL expor somente Event público com início estritamente futuro e não excluído em Church PUBLISHED/ativa/não excluída, conforme P1; exclusão lógica retira o Event do catálogo.

### Critérios WEB T3 derivados de R29A-01/02/06

1. WHEN /atividades recebe parâmetros válidos THEN o web SHALL fazer somente GET no-store ao catálogoT2 com page1–1000, limit1–100 e filtroChurchUUID opcional, preservando o prefixo da raizAPIconfigurada.
2. IF page/limit/church_id é inválido ou repetido THEN o web SHALL mostrar estado inválido traduzido sem GETglobal silencioso.
3. WHEN a respostaT2 é válida THEN o web SHALL projetar somente campos públicos/dataUTCZ/meta, renderizar PT/EN e distinguir lista/empty/error; erros e extras não são propagados.
4. WHEN o perfil de comunidade renderiza THEN ele SHALL oferecer somente link público estável /atividades?church_id=UUID sem novo fetch ou mudança do cache existente.
5. IF NEXT_PUBLIC_PANEL_URL ou UUID é ausente/inválido THEN o CTA SHALL não possuir href e mostrar estado traduzido.
6. WHEN origem válida é configurada THEN o CTA SHALL usar exatamente origem+/interesses/atividades/UUID sem query/contato/token/returnTo, aceitando HTTPS ou HTTP somente nos três hosts locais explícitos.
7. The web SHALL não manter sessão ou enviar interesse/POST ao entrar; confirmação consentida pertence à futura T4 e finalidadesR29A06 permanecem separadas.

8. IF o signal está abortado antes do GET ou durante leitura do corpo THEN o transporte SHALL rejeitar a promoção para ready e devolver erro sem dados, mesmo se JSON ainda resolver.
9. WHEN o orçamento público de I/O8.000ms vence THEN a requisição SHALL ser cancelada e liberar timer/listeners, sem introduzir TTL de negócio.
10. WHEN a rota própria está pendente THEN o fallback SHALL apresentar loading traduzido PT/EN com status e sem CTA; SSR não declara transição de navegador.

### R29A-02: Registrar interesse

**User Story:** Como pessoa autenticada, quero declarar interesse com nome, um contato escolhido e consentimento explícito.
**Acceptance Criteria:**
1. IF o consentimento não é literalmente true THEN o núcleo SHALL rejeitar sem store ou auditoria R29.
2. IF a conta/sessão não é atual ou a validação R11 rejeita nome/contato THEN o núcleo SHALL rejeitar sem gravar interesse ou auditoria R29.
3. WHEN o registro válido é aceito THEN o núcleo SHALL preservar nome/contato normalizados e prova mínima de consentimento por titular/Event/Church.
4. WHEN o mesmo registro é repetido THEN o núcleo SHALL devolver a mesma identidade sem duplicação ou alteração silenciosa.
5. IF o retry possui dados normalizados divergentes THEN o núcleo SHALL rejeitá-lo explicitamente.

### R29A-03: Consultar e retirar

**User Story:** Como titular, quero consultar e retirar meu interesse.
**Acceptance Criteria:**
1. IF outra conta consulta ou retira o interesse THEN o núcleo SHALL negar sem revelar ou alterar o registro.
2. WHEN o titular retira o interesse THEN o núcleo SHALL impedir novas confirmações e reativação implícita.
3. WHEN uma retirada é repetida THEN o núcleo SHALL preservar o mesmo resultado sem nova auditoria.
4. WHEN o Event deixa de ser elegível THEN o núcleo SHALL continuar permitindo consulta e retirada pelo titular.

### R29A-04: Decisão humana sobre Person

**User Story:** Como ADMIN local, quero confirmar LINK ou CREATE explicitamente.
**Acceptance Criteria:**
1. WHEN LINK é confirmado THEN o núcleo SHALL aceitar somente a Person ativa escolhida no mesmo tenant.
2. WHEN CREATE é confirmado com classificação administrativa explícita THEN o núcleo SHALL usar a porta de criação R11 na mesma unidade de trabalho.
3. The núcleo SHALL nunca selecionar match, fundir ou atualizar Person existente automaticamente.
4. WHEN a mesma confirmação é repetida THEN o núcleo SHALL preservar seu resultado sem criar nova Person.
5. IF a intenção de confirmação repetida diverge THEN o núcleo SHALL rejeitá-la explicitamente.

### R29A-05: Autorização, consentimento e auditoria

**User Story:** Como comunidade, quero decisão atual e auditável sob uma fronteira consistente.
**Acceptance Criteria:**
1. WHEN uma operação entra na fronteira serializada THEN o núcleo SHALL revalidar conta/sessão atual.
2. WHEN uma confirmação entra nessa fronteira THEN o núcleo SHALL revalidar ADMIN local vivo, consentimento, elegibilidade e tenant.
3. WHEN confirmação ou retirada modifica interesse THEN o núcleo SHALL usar a mesma fronteira de serialização do store.
4. IF qualquer escrita, criação R11, auditoria ou saída da fronteira falha THEN o núcleo SHALL propagar a falha sem anunciar sucesso parcial.
5. WHEN há auditoria R29 THEN seus dados SHALL conter apenas IDs, ação fixa, versão de consentimento e referências, sem nome, contato ou texto livre.
6. WHEN retirada vence a serialização THEN o núcleo SHALL negar qualquer encaminhamento posterior.

### R29A-06: Interesse, cadastro e presença distintos

**User Story:** Como titular e ADMIN, quero preservar as finalidades separadas.
**Acceptance Criteria:**
1. The núcleo SHALL manter interesse e Person como identidades distintas, sem criar User por interesse.
2. WHEN interesse é retirado após confirmação THEN o núcleo SHALL preservar Person já criada/vinculada.
3. The núcleo SHALL não integrar callbacks de envio, R15, RSVP, presença, convite, WhatsApp, IA ou outbox.

## Edge Cases

Cobertura T1: consentimento false/None/1/string, conta ausente/sessão divergente, rejeição da normalização, contato duplo na forma do comando, retry igual/divergente/concorrente no double, invasão por outro titular, Event inelegível após registro, retirada repetida, LINK ausente/inativo/outro tenant, CREATE sem classificação, matches existentes sem merge, perda de grant/sessão ao entrar na fronteira, consentimento atual negado, retry de confirmação com Person removida, falhas de save/audit/criação/exit e ambas ordens de retirada versus confirmação no double.

T1 isoladamente não prova datas/SQL. T2 agrega a prova SQL/ASGI descrita no checkpoint; JWT/fullapp, driver asyncSQLite nativo e concorrência PostgreSQL continuam sem prova.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| R29A-01 | Porta e catálogo API concreto; WEB pendente | T1/T2/T3 | Implementing |
| R29A-02 | Registro consentido | T1/T2/T4 | Implementing |
| R29A-03 | Consulta/retirada | T1/T2/T4 | Implementing |
| R29A-04 | Decisão Person | T1/T2/T5 | Implementing |
| R29A-05 | Revalidação/auditoria | T1/T2/T5 | Implementing |
| R29A-06 | Finalidades separadas | T1/T2/T4/T5 | Implementing |

T1 pode estar concluída localmente sem que um requisito integrado esteja Verified. QA independente será solicitada pelo ROOT somente após última fonte commitada.

## Success Criteria

T1: 33 testes OWN sem falhas/skips, compilação em memória, lint dirigido, gates documentais e mensagem futura válidos; nenhum existente, índice ou serviço alterado. Feature: depende das demais entregas, decisões humanas e QA independente.
