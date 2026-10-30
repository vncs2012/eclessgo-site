# R26a — vínculo de comunidades a uma rede

Status: Verified LOCAL após QA2 independente PASS e quatro validate_state exit 0; commits documentais de fechamento aguardam janelas ROOT. T1/T2 API, T3 PANEL/WEB e C1 de teste estão commitados localmente. A V1 completa permanece pendente. Classificação: COMPLEXA.

## Problem Statement

Uma rede precisa organizar comunidades existentes sem criar uma hierarquia de acesso aos seus dados. O responsável da rede solicita o vínculo e a própria comunidade decide; a API deve preservar esse isolamento mesmo sob concorrência e revogação.

## Goals

- Cadastrar rede e responsável existente, solicitar, aprovar, recusar, cancelar e encerrar vínculos, com histórico mínimo durável.
- Disponibilizar somente nomes e operações autorizados no PANEL em pt-BR e en, inclusive ao responsável sem Church.
- Preservar os guards e dados comunitários existentes; cobrir resultados especificados em SQLite, PostgreSQL, HTTP e interface novos.

## Out of Scope

| Item | Motivo |
|---|---|
| Árvore de redes, mais de uma rede ativa por comunidade | O modelo aprovado tem um nível e no máximo uma rede ativa. |
| Grants herdados, Membership automática, dados de pessoas, conteúdo ou finanças entre comunidades | A relação é apenas organizacional. |
| Catálogo público de redes, busca nova de contas ou comunidades, mensagens e notificações | Não foram aprovados; IDs existentes são fornecidos explicitamente. |
| Editar, reatribuir ou excluir redes; expurgo ou TTL | Não fazem parte da primeira entrega. |
| UI administrativa MOBILE, novas funções em outros módulos, produção e canais externos | O recorte é local, API e PANEL; MOBILE recebe apenas tipos coordenados se necessário. |

## Assumptions & Open Questions

As decisões humanas ficam em `context.md`. As escolhas abaixo são locais de engenharia, sujeitas à revisão ROOT; não criam poderes de produto.

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Identificação no formulário | E-mail exato; slug ou URL http/https das rotas existentes da comunidade, sem userinfo | Referências compreensíveis, resolvidas dentro dos comandos autorizados, sem catálogo novo | Orientação ROOT; detalhe de engenharia |
| Nome da rede | Trim, 1–120 caracteres Unicode, sem controles; nomes repetidos permitidos | Limite previsível, sem regra de exclusividade de produto | Engenharia |
| Retentativa | UUID de recurso escolhido pelo cliente e versão esperada em transições | Evita duplicação após resposta perdida sem armazenar corpos de requisição | Engenharia |
| Histórico depois do encerramento | ADMIN local consulta somente a própria trilha por IDs; nome da antiga rede fica omitido após estado terminal | Conserva histórico sem ampliar leitura de nomes após perda do vínculo | Engenharia, interpretação restritiva |
| Falhas e listas | Envelope fechado, no-store, páginas de até 100 itens, sem total; códigos em `design.md` | Comportamento verificável e pouca exposição | Engenharia |
| Responsável ou comunidade removida fisicamente | Referências podem ficar nulas; trilha permanece e nenhum poder é transferido | Não bloqueia exclusão atual nem inventa reatribuição | Engenharia |

**Open questions: none** — nenhuma decisão de produto adicional foi presumida; as escolhas locais foram revisadas antes da liberação das entregas.

## User Stories

### P1: Cadastro e pedido

**User Story**: Como SUPER_ADMIN e responsável de rede, quero criar uma rede com conta existente e solicitar uma comunidade existente.

**Acceptance Criteria**
1. WHEN um SUPER_ADMIN ativo cria rede com UUID novo, nome válido e e-mail de responsável existente não excluído THEN the system SHALL persistir rede e evento de criação na mesma transação e retornar 201 com ID e nome. (NET-01)
2. IF a conta solicitante não for SUPER_ADMIN corrente THEN the system SHALL recusar a criação com 403 e não gravar. (NET-02)
3. IF nome, referência, UUID técnico ou JSON forem inválidos ou a conta indicada estiver indisponível THEN the system SHALL responder conforme a tabela de erros de `design.md` sem gravar. (NET-03)
4. WHEN o responsável corrente solicita comunidade existente e ativa por slug ou URL aceita THEN the system SHALL criar vínculo PENDING versão 1 e seu evento, persistindo somente o slug canônico, sem criar Membership. (NET-04)
5. IF já houver PENDING ou APPROVED para a mesma rede e comunidade THEN the system SHALL retornar 409 sem alterar o vínculo existente. (NET-05)
6. WHEN um vínculo da mesma rede e comunidade estiver REJECTED, CANCELLED ou ENDED THEN the system SHALL aceitar nova solicitação com outro UUID válido, mantendo o histórico anterior. (NET-06)

**Independent Test**: criar rede e pedido com identidades sintéticas, reler em conexão nova e comparar vínculos locais antes e depois.

### P1: Decisão e fim do vínculo

**User Story**: Como ADMIN local ou responsável da rede, quero decidir e encerrar um vínculo conforme meu papel.

**Acceptance Criteria**
1. WHEN o CHURCH_ADMIN ativo da comunidade aprova um pedido PENDING THEN the system SHALL mudar esse pedido para APPROVED. (NET-07)
2. WHEN o CHURCH_ADMIN ativo da comunidade recusa um pedido PENDING THEN the system SHALL mudar esse pedido para REJECTED. (NET-08)
3. WHEN o responsável corrente cancela seu pedido PENDING THEN the system SHALL mudar esse pedido para CANCELLED. (NET-09)
4. WHEN o responsável corrente ou o CHURCH_ADMIN ativo da comunidade encerra um vínculo APPROVED THEN the system SHALL mudá-lo para ENDED sem apagar dados comunitários. (NET-10)
5. IF um SUPER_ADMIN não exercer o papel exigido na rede ou comunidade alvo THEN the system SHALL negar aprovação, recusa, cancelamento e encerramento sem alterar estado. (NET-11)
6. IF duas redes tentarem aprovar pedidos da mesma comunidade simultaneamente THEN the system SHALL confirmar exatamente uma aprovação, deixar o outro pedido PENDING e retornar 409 ao perdedor. (NET-12)
7. IF a ação pedida não for uma transição permitida ou a versão esperada estiver desatualizada e não for replay válido THEN the system SHALL retornar 409 sem gravar novo evento. (NET-13)
8. WHEN uma criação ou transição for repetida com a mesma identidade e dados segundo as regras de `design.md` THEN the system SHALL retornar 200 sem criar outro registro ou evento. (NET-14)
9. IF uma gravação de vínculo ou auditoria falhar antes do commit THEN the system SHALL reverter todas as alterações da operação e retornar 503. (NET-15)
10. WHEN uma transição é confirmada THEN the system SHALL acrescentar exatamente um evento mínimo com ação, versão, instante e ator interno na mesma transação. (NET-16)

**Independent Test**: verificar cada transição e replay; disputar duas aprovações em conexões PostgreSQL distintas e comparar os dois estados e eventos.

### P1: Consulta e isolamento

**User Story**: Como pessoa autorizada, quero consultar somente metadados necessários à minha relação com a rede.

**Acceptance Criteria**
1. WHEN um ADMIN local consulta seu próprio pedido PENDING THEN the system SHALL mostrar o nome da rede solicitante sem revelar outras comunidades. (NET-17)
2. WHEN um SUPER_ADMIN, responsável da rede ou ADMIN de comunidade APPROVED consulta a rede THEN the system SHALL retornar apenas redes e nomes de comunidades APPROVED visíveis conforme a matriz de `design.md`, com `is_responsible` verdadeiro em cada NetworkSummary exatamente quando o ator for o responsável corrente daquela rede. (NET-18)
3. IF um vínculo estiver REJECTED, CANCELLED ou ENDED THEN the system SHALL omitir o nome da comunidade e da rede em suas projeções históricas. (NET-19)
4. WHEN um ADMIN local consulta histórico THEN the system SHALL limitar eventos aos vínculos da sua própria comunidade. (NET-20)
5. The system SHALL manter todas as listas e eventos restritos ao ator autorizado, sem catálogo público de redes. (NET-21)
6. The system SHALL preservar o registro mínimo de transições sem prazo de expurgo introduzido por R26a. (NET-22)
7. The system SHALL manter inalterados Membership, papéis e permissões existentes em todas as transições. (NET-23)
8. WHEN o responsável da rede acessa rota comunitária existente sem o respectivo vínculo local permitido THEN the system SHALL manter a mesma negação anterior, inclusive para pessoas e finanças. (NET-24)
9. IF conta, sessão, comunidade ou Membership exigidos forem revogados antes da ação THEN the system SHALL negar a operação sem mudança e sem retornar dados protegidos. (NET-25)

**Independent Test**: comparar projeções de proprietário, SUPER_ADMIN, ADMIN vinculado, ADMIN pendente e não autorizado; repetir após revogação e tentar rotas locais alheias.

### P1: Acesso e interface

**User Story**: Como responsável de rede ou ADMIN local, quero usar os fluxos autorizados no painel em português ou inglês.

**Acceptance Criteria**
1. WHEN qualquer conta autenticada consulta sua capacidade R26a THEN the system SHALL retornar somente os três booleanos próprios definidos em `design.md`, sem nomes ou grants. (NET-26)
2. WHEN responsável de rede ativo sem Church acessa o PANEL THEN the system SHALL permitir login, bootstrap e entrada no fluxo de rede, sem criar ou selecionar Membership. (NET-27)
3. IF usuário sem Church elegível não for responsável de rede ou SUPER_ADMIN THEN the system SHALL manter a negação atual de acesso ao painel. (NET-28)
4. WHEN um usuário MEMBER é responsável de rede THEN the system SHALL permitir somente o fluxo de rede adicional, preservando o bloqueio das rotas locais para MEMBER. (NET-29)
5. WHEN o usuário muda de sessão ou comunidade durante uma consulta de rede THEN the system SHALL descartar respostas anteriores ao novo contexto. (NET-30)
6. WHEN o PANEL oferece cada ação elegível THEN the system SHALL usar `is_responsible` da rede para as ações de responsável e a lista da própria comunidade para as ações de ADMIN local, apresentando estados e erros em pt-BR e en com recarga após conflito 409. (NET-31)
7. WHEN uma lista excede a página solicitada THEN the system SHALL retornar no máximo 100 itens em ordem estável e cursor conforme `design.md`. (NET-32)
8. The system SHALL autenticar todas as rotas R26a e retornar envelopes tipados fechados com Cache-Control no-store, sem ecoar entrada ou exceção. (NET-33)

**Independent Test**: cobrir login e bootstrap sem Church, MEMBER responsável, negação anterior, alternância de contexto e as ações nos dois idiomas com respostas HTTP sintéticas.

## Edge Cases

Retentativas após resposta perdida usam o mesmo UUID e a mesma versão; outras transições concorrentes tornam a resposta 409. Comunidade ou responsável removidos fisicamente deixam referência nula e histórico preservado, sem transferência automática. Nomes são atuais e só são projetados onde autorizados, nunca copiados em eventos.

## Implicit Dimensions

Entrada/limites, falha atômica, replay, autorização, concorrência e transições estão em NET-03/05/12–16/25/27–33. Retenção sem TTL está em NET-22. Auditoria é NET-16; logs não recebem payload, credenciais ou nomes. Rate limit novo não se aplica: não há endpoint público ou provedor novo; não se afirma que há limitação específica de R26a. Dependência externa não se aplica: não há comunicação externa.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| NET-01 | P1 | T1,T2 | Verified LOCAL |
| NET-02 | P1 | T1,T2 | Verified LOCAL |
| NET-03 | P1 | T1,T2 | Verified LOCAL |
| NET-04 | P1 | T1,T2 | Verified LOCAL |
| NET-05 | P1 | T1,T2 | Verified LOCAL |
| NET-06 | P1 | T1,T2 | Verified LOCAL |
| NET-07 | P1 | T1,T2 | Verified LOCAL |
| NET-08 | P1 | T1,T2 | Verified LOCAL |
| NET-09 | P1 | T1,T2 | Verified LOCAL |
| NET-10 | P1 | T1,T2 | Verified LOCAL |
| NET-11 | P1 | T1,T2 | Verified LOCAL |
| NET-12 | P1 | T1,T2 | Verified LOCAL |
| NET-13 | P1 | T1,T2 | Verified LOCAL |
| NET-14 | P1 | T1,T2 | Verified LOCAL |
| NET-15 | P1 | T1,T2 | Verified LOCAL |
| NET-16 | P1 | T1,T2 | Verified LOCAL |
| NET-17 | P1 | T1,T2 | Verified LOCAL |
| NET-18 | P1 | T1,T2 | Verified LOCAL |
| NET-19 | P1 | T1,T2 | Verified LOCAL |
| NET-20 | P1 | T1,T2 | Verified LOCAL |
| NET-21 | P1 | T1,T2 | Verified LOCAL |
| NET-22 | P1 | T1,T2 | Verified LOCAL |
| NET-23 | P1 | T1,T2 | Verified LOCAL |
| NET-24 | P1 | T1,T2 | Verified LOCAL |
| NET-25 | P1 | T1,T2 | Verified LOCAL |
| NET-26 | P1 | T1,T2,T3 | Verified LOCAL |
| NET-27 | P1 | T2,T3 | Verified LOCAL |
| NET-28 | P1 | T2,T3 | Verified LOCAL |
| NET-29 | P1 | T2,T3 | Verified LOCAL |
| NET-30 | P1 | T2,T3 | Verified LOCAL |
| NET-31 | P1 | T2,T3 | Verified LOCAL |
| NET-32 | P1 | T2,T3 | Verified LOCAL |
| NET-33 | P1 | T2,T3 | Verified LOCAL |

Cobertura verificada: 33 requisitos NET-01–33 mapeados na QA2 independente PASS; limites e ressalvas estão em `validation.md` e `preservation.md`. Verified LOCAL não é conclusão da V1 inteira.

## Success Criteria

- Todos os resultados NET-01–33 têm testes novos verificáveis e zero falhas/skips nos gates aplicáveis.
- Duas aprovações concorrentes reais em PostgreSQL novo produzem uma única comunidade APPROVED e um único evento vencedor.
- QA independente e `validate_state` após QA PASS são obrigatórios antes de declarar Verified LOCAL.


## Preparação T3 — entrada e navegação

NET-27–31 incluem o destino após login, bootstrap e visita posterior a `/login` ou rota curinga: responsável confirmado sem Church chega à área de redes sem ciclo com `/painel` ou `/login`. Conta sem papel ou capacidade continua sob a regra anterior; indisponibilidade da capacidade não cria permissão. MEMBER responsável recebe somente o fluxo adicional de redes e mantém os acessos comunitários que já possuía.

A área de redes usa os três booleanos próprios de capacidade para sua porta de entrada; ações de responsável usam `NetworkSummary.is_responsible` da rede específica. ADMIN local usa somente vínculos da própria comunidade. SUPER_ADMIN pode ler ou criar conforme a matriz, mas não ganha ação de responsável ou ADMIN por ser SUPER_ADMIN.

## Resultado local e evidência

QA1 independente registrou FAIL por uma lacuna de discriminação em NET-15; C1 acrescentou o teste de rollback não-DBAPI e foi commitado na API em `0f382277f19ab011568b41287dffb0850cf7c661`, sem alteração de produto. QA2 independente posterior concluiu PASS em 49 métodos API e 34 UI distintos, 33 requisitos mapeados, oito faults mortos e 16 controles; quatro `validate_state` retornaram 0. Os 34 métodos UI foram executados em WT e HEAD, sem duplicar a contagem.

O relatório canônico imutável `validation.md` tem SHA-256 `198df34e22aea7ff4b4a67a1a56abd506604ad324b584e903f417ff192125794`; `validation-iteration-1.md` preserva QA1 FAIL com SHA-256 `39de97078f771d632ea9a1808016a831984a4b64c5e378698534007c419a2192`. A evidência e as ressalvas ficam em `preservation.md`. A prova é local e isolada, não certifica JWT real, navegador integral, app nativo, UAT ou produção.
