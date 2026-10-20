# R24 Public Information Assistant Specification

## Problem Statement

Visitantes precisam encontrar informações publicadas de uma comunidade por conversa, mantendo vínculo verificável com a fonte. A R24 entrega contrato de IA por adaptador, rota pública e interface integrada; o provedor será definido posteriormente pelo humano.

## Goals

- [x] Consultar perfil, endereço e horários/atividades publicados da comunidade atual com fontes.
- [x] Comprovar localmente o contrato do adaptador e as fronteiras de informação, com QA independente.

## Out of Scope

| Feature | Reason |
| --- | --- |
| Provedor real, chamadas externas, ativação e deploy | Humano adiou a escolha do provedor e autorizou somente testes locais |
| Ações, CRM, finanças, atendimento, identidade e dados privados | R25 possui escopo separado |
| WhatsApp e memória persistente de conversa | Nenhuma integração ou política de retenção nova autorizada |
| Novas atividades/eventos fora da agenda pública existente | Não criar fonte de publicação nem inferir agenda privada |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Superfície e conteúdo | Site público por comunidade; perfil/endereço/horários/atividades publicadas; fontes vinculadas | Contrato humano confirmado nesta sessão | Sim |
| IA | Interface injetável, adaptador sintético somente em testes, padrão desativado | Humano definiu provedor depois | Sim |
| Saída da IA | Seleção estruturada de IDs de fatos, sem prosa livre | Respostas ancoradas e sem fonte inventada | Assumido |
| Conversa | Perguntas independentes, histórico visual apenas em memória, sem enviar histórico ao adaptador | Minimização e ausência de política de persistência | Assumido |
| Idiomas | pt-BR e en, todos os locales definidos conferidos | Site existente e L-026 | Assumido |
| Throttling | Sem quota distribuída nesta entrega desativada; uma requisição por vez no cliente, tamanhos limitados e timeout | Provedor e operação futura exigem limites próprios antes de ativar | Assumido |
| Limites da projeção pública | Até 30 entradas de agenda; cada campo textual com no máximo 2000 code points, omitindo campos inválidos/maiores sem truncar fatos | Contrato de agenda existente e payload limitado ao futuro adaptador | Assumido |

**Open questions:** none for local delivery. Provedor e ativação ficam deliberadamente adiados.

## User Stories

### P1: Consulta pública ancorada

**User Story**: As a visitor, I want to ask about a community so that I can inspect its published information.

**Why P1**: É o contrato funcional completo local solicitado.

**Acceptance Criteria**:

1. WHEN uma pergunta válida chega para um slug THEN o sistema SHALL carregar somente o detalhe público desse slug, sem encaminhar headers de identidade do visitante, com cache no-store. (INFO-01)
2. The system SHALL projetar para o adaptador somente slug, locale, pergunta e fatos de nome/denominação/descrição, endereço/localidade e agenda pública; campos de contato, doação, membros, plano, IDs internos e quaisquer campos extras SHALL permanecer ausentes. (INFO-02)
3. WHEN o adaptador seleciona entre um e oito IDs válidos e únicos THEN o sistema SHALL responder 200 com status answered, fatos textuais exatos da projeção e fontes locais da comunidade atual; prosa e links arbitrários do adaptador SHALL ser rejeitados. (INFO-03)
4. WHEN não existem fatos selecionados THEN o sistema SHALL responder 200 com status no_information e arrays answer/sources vazios, sem completar informação ausente. (INFO-04)
5. IF o adaptador retorna formato inválido, IDs desconhecidos, duplicados ou mais de oito IDs THEN o sistema SHALL responder 502 com code INVALID_PROVIDER_RESPONSE e sem refletir o payload. (INFO-05)
6. IF o adaptador está ausente THEN o sistema SHALL responder 503 com code ASSISTANT_NOT_CONFIGURED sem chamar leitor público ou provedor. (INFO-06)
7. IF o adaptador falha ou excede 5000 ms THEN o sistema SHALL responder respectivamente 503 ASSISTANT_UNAVAILABLE ou 504 ASSISTANT_TIMEOUT, abortando o signal no timeout e omitindo detalhes internos. (INFO-07)
8. IF o slug não corresponde a [a-z0-9]+ com hífens internos, até 120 caracteres, o body não tem exatamente question/locale, a pergunta aparada tem zero ou mais de 500 code points, locale é distinto de pt-BR/en, JSON é inválido ou body excede 4096 bytes THEN o sistema SHALL responder 400 INVALID_REQUEST ou 413 REQUEST_TOO_LARGE para tamanho, antes do leitor/adaptador. (INFO-08)
9. IF o leitor público retorna 404 ou falha THEN o sistema SHALL responder respectivamente 404 COMMUNITY_NOT_FOUND ou 503 PUBLIC_INFORMATION_UNAVAILABLE sem chamar adaptador. (INFO-09)
10. The system SHALL produzir respostas com Cache-Control no-store, sem logs de perguntas/conteúdo, sem persistência ou ferramentas de ação, e sem importar bootstrap/config protegido. (INFO-10)

**Independent Test**: Leitor e adaptador sintéticos demonstram respostas e falhas no mesmo handler usado pela rota; o padrão da rota responde indisponibilidade honesta.

### P1: Conversa acessível no perfil

**User Story**: As a visitor, I want to ask and inspect cited answers in the current community page.

**Why P1**: A capacidade precisa estar integrada ao site existente.

**Acceptance Criteria**:

11. WHEN o visitante abre detalhe público THEN o site SHALL apresentar formulário com label, limite de 500 code points, aviso para não informar dados pessoais e indicação honesta de indisponibilidade enquanto sem provedor, usando texto de produto sem jargão de configuração; nenhum pedido automático SHALL ocorrer. (INFO-11)
12. WHILE uma pergunta está pendente THEN a interface SHALL impedir envio duplicado e anunciar carregamento; sucesso answered SHALL exibir fatos como texto escapado e fontes locais clicáveis, e no_information SHALL exibir texto explícito de ausência. (INFO-12)
13. IF a resposta falha ou tem shape/slug/fontes inválidos THEN a interface SHALL mostrar mensagem localizada apropriada, não exibir resposta inválida e permitir tentar novamente; 503 ASSISTANT_NOT_CONFIGURED SHALL ser distinguido de falha genérica. (INFO-13)
14. WHEN slug ou locale muda ou o componente desmonta THEN a interface SHALL abortar pedido ativo e descartar resultados atrasados; ao mudar contexto SHALL limpar conversa e pergunta, mantendo no máximo dez pares concluídos em memória por contexto. (INFO-14)
15. The site SHALL fornecer todas as chaves novas em pt-BR e en, integrar a mesma conversa nas rotas canônica e alias existentes e preservar os hunks herdados da página e locales. (INFO-15)

**Independent Test**: DOM sintético exercita formulário real, respostas, falhas, contexto, teclado e textos em ambos idiomas; integração de página conferida por fonte e tipagem dirigida.

## Edge Cases

- IF agenda ou descrição estão vazias/malformadas THEN o sistema SHALL omitir os fatos inválidos e nunca anunciar atividade inexistente. (INFO-02/04)
- IF pergunta ou conteúdo público tentam instruir ações ou expor outros dados THEN o sistema SHALL continuar limitado à projeção permitida e à seleção de fatos atuais. (INFO-02/03)
- WHEN pergunta tem exatamente 500 code points THEN o sistema SHALL aceitá-la; 501 SHALL falhar antes das dependências. (INFO-08)
- IF uma resposta de contexto anterior chega após uma nova THEN a interface SHALL ignorá-la. (INFO-14)
- IF o usuário pergunta por dado ausente THEN o adaptador sintético de prova SHALL selecionar nenhum fato, resultando no_information, sem promessa de acurácia de um provedor ainda inexistente. (INFO-04)

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| INFO-01 | Consulta pública | T2 | Verified |
| INFO-02 | Consulta pública | T1 | Verified |
| INFO-03 | Consulta pública | T1 | Verified |
| INFO-04 | Consulta pública | T1 | Verified |
| INFO-05 | Consulta pública | T1 | Verified |
| INFO-06 | Consulta pública | T1 | Verified |
| INFO-07 | Consulta pública | T1 | Verified |
| INFO-08 | Consulta pública | T1 | Verified |
| INFO-09 | Consulta pública | T2 | Verified |
| INFO-10 | Consulta pública | T2 | Verified |
| INFO-11 | Conversa pública | T3 | Verified |
| INFO-12 | Conversa pública | T3 | Verified |
| INFO-13 | Conversa pública | T3 | Verified |
| INFO-14 | Conversa pública | T3 | Verified |
| INFO-15 | Conversa pública | T3 | Verified |

**Coverage:** 15 total, 15 mapped to tasks, 0 unmapped.

## Success Criteria

- [x] Todos os critérios comprovados por assertions reais e gates locais.
- [x] QA independente PASS com ao menos cinco faults comportamentais válidos detectados, controles antes/depois e preservação delimitada.
- [x] Commits locais exatos por entrega; sem operação real/provedor configurado/UAT humano alegados.
