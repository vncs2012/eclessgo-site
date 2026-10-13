# R11 Pessoas e visitantes — Specification

## Problem Statement

Membros administra User e acesso; não representa pessoas atendidas sem conta. R11 acrescenta um cadastro local à organização sem converter contatos em identidades ou prova de presença. A autorização AD-013 cobre este recorte até verificação e demonstração local.

## Goals

- [ ] Cadastrar, consultar, editar e buscar pessoas sem login em API e painel real.
- [ ] Provar isolamento tenant, permissões, duplicidade advisory e preservação do trabalho existente.

## Out of Scope

| Feature | Reason |
|---|---|
| Exclusão, arquivamento, fusão e expurgo CRM | Política por categoria pendente; não herdar prazo de paz |
| Associação com User, convites e mensagens | Não associar por contato; identidade exige confirmação própria |
| Histórico de visitas/presença, notas, dados sensíveis, CPF/nascimento | Fora do cadastro mínimo; classificação não prova visita |
| Importação, jornadas, grupos, presença, atendimento, WhatsApp | R12–R17 têm requisitos e dependências próprios |
| Exportação integral CRM, novos indicadores | R08 e R21 futuros; não criar métricas fictícias |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Papéis CRM | Apenas CHURCH_ADMIN ativo da organização em todas as ações | Contatos não têm grant próprio hoje; reduzir acesso inicial | Discrição autorizada |
| Campos | name 1–120 após normalização; classification PERSON ou VISITOR; email opcional válido até254; phone opcional até32, 8–15 dígitos | Nome suficiente e contatos sem impor país/documento | Discrição autorizada |
| Nome | NFKC, strip, espaços internos colapsados; chave casefold sem remover acentos; rejeitar controles | Critério determinístico, sem identidade inferida | Discrição autorizada |
| Timestamps | JSON ISO8601 em UTC com Z; armazenamento UTC naive segue BaseModel | Consumidores interpretam corretamente o instante sem adivinhar timezone | Discrição autorizada |
| Contatos | Email strip/lowercase; telefone aceita dígitos ASCII, espaços, parênteses, hífen e + somente no início; chave só dígitos; vazio vira null | Dedupe conservador e armazenamento compreensível | Discrição autorizada |
| Duplicidade | Igualdade de chave name OU email não nulo OU phone não nulo; até10 candidatos mais recentes; exclui próprio id em edição | Avisar possível duplicidade sem fusão nem bloqueio global | Discrição autorizada |
| Concorrência e retry | Advisory pode mudar entre consulta e salvar; PUT substitui campos editáveis, último salvamento vence; POST não se repete automaticamente | Sem prometer dedupe forte ou idempotência inexistentes | Discrição autorizada |
| Payload completo | POST exige name/classification e permite omitir email/phone; PUT exige as quatro chaves, contatos aceitam null | Distinguir substituição completa de alteração parcial e limpeza explícita | Discrição autorizada |
| Lista | page1, limit20 (1–100), page até100000; search até120 após NFKC/colapso de espaços e antes de casefold; classification opcional; ordem created_at desc/id desc; busca literal substring por chaves normalizadas | Paginação determinística e busca sem wildcard acidental; casefold pode expandir120 para360 | Discrição autorizada |
| Chaves da busca | Texto NFKC/colapso preservado; nome usa casefold, email usa lowercase; telefone usa dígitos somente quando consulta tem um dígito e apenas separadores/ASCII/plus inicial permitidos, inclusive fragmentos | Igualar a normalização de cada campo; email Unicode com ß continua pesquisável; texto misto não vira telefone arbitrário | Discrição autorizada |
| Direitos CRM | Sem FK para User, sem exportar por autoria e sem apagar ao excluir conta do operador | Ficha de terceiro não pertence ao operador por criação | Pedido + R32b |
| Campos auditados | changed_fields em ordem name, classification, email, phone; criação registra os quatro nomes; edição registra só valores editáveis efetivamente alterados, inclusive lista vazia em PUT sem alteração | Metadados suficientes sem copiar valores pessoais | Discrição autorizada |
| Arquitetura | Módulo no monólito existente, repository/use-case/router e React Query | Preservar padrões; alternativa tabela User rejeitada pelo requisito | Pedido |

**Open questions:** none, decisões rotineiras autorizadas e registradas; política destrutiva pendente mantida fora do escopo.

## User Stories

### P1: Cadastro independente

**User Story**: Como administrador, quero registrar pessoa ou visitante sem criar acesso.

**Acceptance Criteria**:

1. WHEN o administrador cria uma ficha válida THEN the system SHALL responder201 com id, church_id autorizado, name, classification, email, phone e timestamps, persistindo Person sem User, ChurchMember, token, convite, outbox ou mensagem novos. [CRM-01]
2. WHEN envia campos editáveis válidos ao PUT THEN the system SHALL responder200 e persistir nome, classificação e contatos, permitindo null limpar contatos e preservando id/church_id/created_at. [CRM-02]
3. IF campo obrigatório é inválido, enum desconhecido, contato inválido, limite excedido ou campo extra é enviado THEN the system SHALL responder422 sem salvar/auditar sucesso; DTOs rejeitam church_id/user_id/notes extras. [CRM-03]

**Independent Test**: Criar apenas nome e classificação VISITOR, reiniciar sessão de consulta, editar e reler os valores exatos.

### P1: Consulta e duplicidade no contexto local

**User Story**: Como administrador, quero encontrar a ficha e reconhecer cadastros semelhantes.

**Acceptance Criteria**:

1. WHEN lista/busca/filtra THEN the system SHALL retornar somente registros vivos da organização autorizada com data/meta(page,limit,total,total_pages), classificação exata e busca literal por nome/email/telefone normalizados, incluindo páginas vazias além do fim. [CRM-04]
2. WHEN consulta um id local THEN the system SHALL responder200 com a ficha persistida; id inexistente, apagado ou de outra organização recebe404. [CRM-05]
3. WHEN consulta POST duplicates com name/email/phone e exclude_id opcional THEN the system SHALL responder200 com candidatos locais (id,name,classification,matched_fields na ordem name,email,phone) segundo as regras, sem contatos integrais e excluindo o próprio id local em edição; exclude_id estrangeiro/inexistente recebe404. [CRM-06]
4. WHEN confirma continuar após alerta de duplicidade THEN the system SHALL permitir ficha separada, sem modificar/fundir a anterior e sem impedir o mesmo contato em outra organização. [CRM-07]

**Independent Test**: Semear21 fichas locais e outras na segunda organização, buscar e paginar; duplicidade por cada campo e edição sem autorreferência.

### P1: Segurança e direitos

**User Story**: Como organização, quero controlar os contatos e rastrear mudanças mínimas.

**Acceptance Criteria**:

1. IF sessão está ausente/inválida/revogada ou conta excluída THEN the system SHALL responder401; se papel local não é ADMIN, vínculo é pending/inactive/apagado, organização apagada/inativa ou contexto ausente THEN the system SHALL negar403 (organização inexistente/apagada pode404), sem leitura/escrita/dedupe. [CRM-08]
2. WHEN qualquer rota CRM é chamada THEN the system SHALL resolver contexto pela dependência autorizada do servidor e filtrar church_id em cada consulta/escrita/dedupe, sem bypass de ADMIN/SUPER_ADMIN global e sem confiar em query/body church_id; conflito rota/header recebe400 quando aplicável. [CRM-09]
3. WHEN cria/edita com sucesso THEN the system SHALL gravar person.created/person.updated na mesma transação com actor, church_id, target_type person, target_id e apenas nomes dos campos alterados em details, sem nome/contato/valor/anotação; falha antes de commit não deixa ficha ou auditoria parcial. [CRM-10]
4. WHEN exporta ou exclui conta de um operador THEN the system SHALL preservar fichas CRM e não incluí-las no pacote por autoria/contato, com inventário e política CRM explicitamente pendente, sem ativar rotina de retenção. [CRM-11]

**Independent Test**: Quatro papéis, dois tenants, vínculo revogado e global SUPER_ADMIN; snapshot CRM antes/depois dos direitos de conta em banco sintético.

### P1: Painel utilizável

**User Story**: Como administrador, quero operar Pessoas no painel e distinguir cadastro de acesso.

**Acceptance Criteria**:

1. WHEN administrador usa navegação THEN the system SHALL oferecer Pessoas em /pessoas, cadastro /pessoas/novo, detalhe /pessoas/:id e edição /pessoas/:id/editar; Membros e /membros permanecem funcionais com explicação de contas/acessos. [CRM-12]
2. WHEN usa Pessoas THEN the system SHALL oferecer lista paginada20, busca, filtro Todas/Pessoas/Visitantes, total e navegação de página; filtros reiniciam página1, consultas/cache isolam organização e detalhe tem ação Editar. [CRM-13]
3. WHEN cadastra/edita THEN the system SHALL validar campos, mostrar erros associados, conferir duplicidade antes de salvar, mostrar aviso com candidatos e exigir ação explícita “Cadastrar mesmo assim”/“Salvar mesmo assim” para continuar; falha na verificação oferece retry e impede salvamento silencioso. [CRM-14]
4. WHILE consulta ou salvamento está pendente the system SHALL apresentar carregamento e impedir submissão repetida; vazio, erro com retry e sucesso com confirmação/localização da ficha têm textos pt-BR/en; mudança de tenant não reaproveita ficha/formulário/resultado tardio do anterior. [CRM-15]
5. IF perfil não é autorizado THEN the system SHALL ocultar entrada/ações e bloquear rotas diretas de Pessoas; classificação Visitante é explicada como cadastro, sem visitas/presença/métricas inferidas. [CRM-16]

**Independent Test**: Navegador contra API/PG R11, nome sintético, edição/busca/reload, duplicidade e acesso negado.

## Edge Cases

- IF name contém só espaços ou controles THEN the system SHALL responder422. [E1]
- WHEN há homônimos/email igual ignorando caixa/telefone com separadores THEN the system SHALL avisar sem fusão; contatos nulos não combinam por null. [E2]
- WHEN search contém % ou _ THEN the system SHALL tratar como texto literal, sem ampliar resultados. [E3]
- WHEN edição limpa contato com null THEN the system SHALL persistir null e retirar a antiga chave de duplicidade. [E4]
- IF API falha ou tenant muda durante formulário THEN the system SHALL manter erro/retry no tenant correto e não mostrar/salvar o registro anterior. [E5]
- WHEN último ADMIN tenta excluir a conta THEN the system SHALL preservar a proteção existente de handoff; teste CRM de direitos usa operador com outro ADMIN ativo. [E6]

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| CRM-01 | Cadastro | Execute | Implementing — API T1–T4; UI/PG rede T10 pendentes |
| CRM-02 | Edição | Execute | Implementing — API T2–T4; UI/PG rede pendentes |
| CRM-03 | Validação | Execute | Implementing — DTOs T2/HTTP T4; UI pendente |
| CRM-04 | Lista | Execute | Implementing — query/SQL/HTTP T2–T4; UI/PG rede pendentes |
| CRM-05 | Detalhe | Execute | Implementing — leitura local/HTTP T3/T4; UI pendente |
| CRM-06 | Duplicidade | Execute | Implementing — matching/projeção/HTTP T2–T4; UI pendente |
| CRM-07 | Continuação | Execute | Implementing — fichas separadas T3; confirmação UI pendente |
| CRM-08 | Papéis | Execute | Implementing — cinco operações/estados/papéis HTTP T4; UI pendente |
| CRM-09 | Tenant | Execute | Implementing — estrutura T1/queries T3/autorização HTTP T4; PG rede/UI pendentes |
| CRM-10 | Auditoria | Execute | Implementing — transação/projeção/HTTP T3/T4; integração final pendente |
| CRM-11 | Direitos | Execute | Implementing — exportação/exclusão do operador T3; inventário T5 |
| CRM-12 | Navegação | Tasks | Pending |
| CRM-13 | Lista UI | Tasks | Pending |
| CRM-14 | Form UI | Tasks | Pending |
| CRM-15 | Estados | Tasks | Pending |
| CRM-16 | Acesso UI | Tasks | Pending |

## Implicit requirement dimensions

Validação CRM-03; falha/rollback CRM-10/15; dedupe advisory CRM-06/07 e retry manual; auth CRM-08/09, rate limit existente sem grant novo; concorrência último PUT vence, ordem CRM-04; lifecycle CRM-11 sem destruição; observabilidade CRM-10; integração externa N/A (nenhuma); transições PERSON/VISITOR são classificação humana, sem estado de visitas.

## Success Criteria

- [ ] Gates completos, migration PostgreSQL isolado e contratos dos três consumidores verdes. Falhas herdadas são registradas com baseline; enquanto um gate estiver vermelho, R11 não é Verified.
- [ ] Verifier independente PASS com sensor discriminante e validate_state0.
- [ ] Demonstração real com roteiro/capturas e commits locais próprios; baseline/user hunks preservados.
