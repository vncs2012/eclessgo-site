# R24b: provedor global do assistente público

## Problem Statement

A R24 entrega o assistente e um adaptador ausente. O primeiro lançamento precisa dos dois provedores escolhidos, com seleção global manual e integração desligada por padrão, preservando o contrato ancorado em fatos públicos.

## Goals

- [x] Persistir uma seleção global auditável e protegida por SUPER_ADMIN vigente.
- [x] Integrar OpenAI e Anthropic sem fallback, mantendo INFO-01..15.

## Out of Scope

| Item | Motivo |
| --- | --- |
| Ativação, credenciais reais, chamadas reais, gastos, deploy ou produção | Não autorizados |
| Modelo ou limite monetário padrão | Não escolhidos; operação requer decisão e configuração separadas |
| R26, R30, R34 e expansão de outros recortes | Fora desta reserva |
| Persistência da conversa, ações ou fontes privadas | Excluídas por INFO-01..15 |

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Estado sem registro | provider null, versão 0, sem inserção ao ler | OFF e nenhuma escolha inicial | Decisão técnica |
| Salvamento igual | Versão e audit não mudam se expected_version atual e provider igual | Idempotência; primeiro verificar versão e autorização | Decisão técnica |
| Escritas concorrentes | CAS; versão antiga retorna conflito mesmo com valor igual | Não ocultar substituição por outro administrador | Decisão técnica |
| Disponibilidade visual | Um booleano de prontidão no servidor, sem segredos, é instantâneo; consulta manual reavalia | Não fazer pergunta automática nem anunciar prontidão duradoura | Decisão técnica |
| Limites operacionais | Configuração necessária sem valor inventado; decisão monetária e ativação são separadas | Ausência de decisão não autoriza gasto | Decisão humana |
**Open questions:** none para T1 local; política financeira/modelos e ativação continuam decisões futuras fora da entrega.

## User Stories

### P1: Controle global

**Acceptance Criteria**:
1. WHEN não existe seleção persistida THEN o sistema SHALL retornar provider null e versão 0 sem criar registro. (AI-01)
2. The system SHALL aceitar somente provider null, openai ou anthropic e expected_version inteiro não negativo que não seja boolean. (AI-02)
3. WHEN uma escrita é solicitada THEN o sistema SHALL revalidar na transação a conta não excluída, a sessão vigente e o papel global SUPER_ADMIN; papéis de comunidade não concedem acesso. (AI-03)
4. IF expected_version difere da versão durável THEN o sistema SHALL rejeitar a escrita com VERSION_CONFLICT sem alterar seleção ou audit. (AI-04)
5. WHEN duas escritas diferentes disputam a mesma versão THEN o sistema SHALL confirmar no máximo uma nova revisão e uma entrada de audit. (AI-05)
6. WHEN a seleção difere e a versão corresponde THEN o sistema SHALL confirmar seleção, próxima revisão e audit na mesma transação antes de retornar sucesso. (AI-06)
7. WHEN a seleção é igual e a versão corresponde THEN o sistema SHALL manter a revisão e não criar audit. (AI-07)
8. IF persistência, audit ou commit falhar antes da durabilidade THEN o sistema SHALL reverter seleção e audit e não retornar sucesso. (AI-08)
9. The audit SHALL conter somente identificador, ator, revisão, ação fixa, instante e enum opcional do provedor, sem pergunta, resposta, corpo, credencial ou modelo. (AI-09)
10. WHEN uma troca é confirmada THEN uma nova leitura SHALL retornar a seleção e revisão duráveis mais recentes. (AI-10)
11. WHEN a API fornece a leitura pública THEN o sistema SHALL retornar somente provider null, openai ou anthropic com no-store, sem credenciais, modelos, atores ou revisão. (AI-11)

**Independent Test**: Testes novos isolados exercitam core, SQLite temporário, reabertura, CAS, sessão revogada e rollback, sem bootstrap da aplicação.

### P1: Consulta e interface

**Acceptance Criteria**:
12. WHILE a chave operacional de servidor está OFF ou configuração obrigatória está ausente o sistema SHALL retornar 503 ASSISTANT_NOT_CONFIGURED antes do leitor público. (AI-12)
13. WHEN uma requisição de assistente é recebida THEN o sistema SHALL validar slug e body com os códigos 400 ou 413 de INFO-08 antes de resolver fornecedor ou ler a comunidade. (AI-13)
14. IF a resolução de seleção falha ou devolve dados inválidos THEN o sistema SHALL retornar 503 ASSISTANT_UNAVAILABLE antes de ler a comunidade e sem detalhes internos. (AI-14)
15. WHEN uma pergunta válida é processada com integração pronta THEN o sistema SHALL resolver a seleção global novamente sem cache para aquela chamada, sem escolha nem headers do visitante. (AI-15)
16. The system SHALL executar somente o adaptador selecionado entre OpenAI e Anthropic, sem fallback ou retry automático para outro provedor. (AI-16)
17. The provider adapters SHALL devolver ao handler somente o contrato exato factIds de INFO-03..05; recusas, resultados truncados, texto extra, IDs inválidos ou formato inválido não viram resposta livre. (AI-17)
18. The system SHALL preservar integralmente INFO-01..15, inclusive timeout, no-store, dados públicos limitados e interface manual em dois idiomas. (AI-18)

**Independent Test**: Transportes falsos verificam os dois envelopes e recusas; DOM sintético e rota isolada verificam estados, ordem e contrato original sem requisições reais.

## Edge Cases

- Ausência inicial e save igual não criam audit; stale igual continua conflito.
- Conta excluída, sessão revogada ou remoção de SUPER_ADMIN negam leitura administrativa/escrita no boundary; Church nunca concede privilégio global.
- Erro de audit ou commit antes da durabilidade reverte seleção e audit; uma confirmação perdida depois do commit pode deixar o resultado indeterminado. Falha de resolver não consulta comunidade.
- A mudança após início de uma requisição não altera o snapshot já selecionado; a próxima requisição resolve novamente.
- Erro do provedor nunca é refletido ou registrado com pergunta, resposta, body ou credencial.

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| AI-01 | Estado inicial | T1 | Verified LOCAL |
| AI-02 | Entrada fechada | T1,T3 | Verified LOCAL |
| AI-03 | SUPER_ADMIN atual | T1,T3 | Verified LOCAL |
| AI-04 | CAS stale | T1,T3 | Verified LOCAL |
| AI-05 | Concorrência | T1 | Verified LOCAL |
| AI-06 | Atomicidade | T1,T3 | Verified LOCAL |
| AI-07 | Idempotência | T1 | Verified LOCAL |
| AI-08 | Rollback | T1 | Verified LOCAL |
| AI-09 | Audit mínimo | T1 | Verified LOCAL |
| AI-10 | Leitura fresca | T1 | Verified LOCAL |
| AI-11 | Projeção pública | T2 | Verified LOCAL |
| AI-12 | OFF | T4 | Verified LOCAL |
| AI-13 | Ordem de validação | T4 | Verified LOCAL |
| AI-14 | Falha de resolver | T4 | Verified LOCAL |
| AI-15 | Resolução fresca | T4 | Verified LOCAL |
| AI-16 | Dois provedores | T4 | Verified LOCAL |
| AI-17 | Seleção ancorada | T4 | Verified LOCAL |
| AI-18 | Preservar INFO | T4,T5 | Verified LOCAL |

## Success Criteria

- [x] Cada task passou seus testes dirigidos e revisão de adequação; os commits locais de fonte ocorreram em suas janelas.
- [x] QA independente após última fonte confronta AC/assertions e detecta ao menos cinco faults comportamentais válidos, com controles antes/depois.
- [x] Nenhuma conclusão de operação real, retenção zero de fornecedor, produção ou UAT humana é alegada.


## T5 checkpoint

A conversa recebe somente um retrato booleano de disponibilidade derivado no servidor após localizar a comunidade. A interface preserva envio manual, revalidação no POST e os critérios INFO-11..15. A conclusão desses critérios na entrega atual ainda depende da QA independente após o commit T5; nenhum requisito é marcado Verified antecipadamente.


## Fechamento QA2: Verified LOCAL (2026-10-29)

R24b está Verified LOCAL, com QA2 independente PASS e ressalvas processuais aceitas. Este fechamento sucede as referências históricas a tarefas, commit ou QA pendentes nos checkpoints acima; esses registros continuam como eram no momento em que foram escritos. A conclusão é de R24b local, não da V1 inteira. Os commits documentais ainda dependem da janela ROOT.

A prova técnica consolida 81 métodos distintos: 30 reexecutados na QA2 e 51 conservados por pins. São 13 faults distintos mortos e zero sobreviventes, com 24 controles conservados da QA1 e dois novos. A prova PostgreSQL da revisão OWN, incluindo upgrade/downgrade e CAS em fixture sintética real, foi conservada da QA1; não foi reexecutada na QA2. O relatório imutável é `validation.md`, SHA-256 `9f67ea6367f2640aa4c0d1c56c49c9067c5e1de92ecde4e702272952ded4f526`.

A pessoa respondeu literalmente “Aprovar fechamento com ressalvas”. A QA1 permanece FAIL em `validation-iteration-1.md`, SHA-256 `f74dab5a3e2a25c24a9d3691ab33040e4cf088d317d35f7780d9a74b4917b8a9`. Os nove pares iniciais de logs perdidos não foram recuperados; dois helpers tiveram permissões corrigidas posteriormente e os índices foram capturados apenas durante/final da QA1. Os incidentes QA2, incluindo dados privados inicialmente em 0664 sob diretório 0700 e exposição de literais sintéticos em stdout, também permanecem registrados e aceitos. Não se afirma preservação integral. O relatório QA2 anterior ao aceite permanece em backup privado, não foi reconstruído.

A QA2 avaliou fontes até API `d0bfde6f062cb8c894b9a4230b3c297c8f44006e`, PANEL `e756b449e15380dd98aff33986ed8d3f4df3d1c1` e WEB `d1f3146466a16259d3d82afba62c145de3fd8577`. O fechamento documental posterior não é fonte avaliada por essa QA. O manifesto de aceitação é `evidence/r24b-global-ai-provider/qa2-acceptance-12eb2221-8c00-4ac6-8b13-dbb42f82bca2/final-gates-3108055a-3e1a-4d54-96a6-a8669c572079/manifest-final.json`, SHA-256 `8634041f1aa42f7d7bf24b5c5fb3b8bae01b99d372da269bb1d1b27cf15fef56`.

Transportes, configuração, autenticação e DOM são sintéticos. A prova não certifica JWT ou navegador real, aplicação completa, migrations ancestrais, carga do pool, serviço ou retenção zero do fornecedor, UAT ou produção. Não houve request ou credencial real, gasto, ativação, push ou deploy. A próxima etapa é R26 local, com contrato ainda a delimitar; R24 e R26 integram o primeiro lançamento, seguido dos builds e QA finais MOBILE e site. Android e iOS devem sair na mesma versão; EAS fica somente em avaliação antes de cloud, upload ou gasto. R30/R34 são futuros, R16a segue sem expansão, R22b reservado e D01 mantém corte inclusivo de 30 dias com worker OFF; demais políticas permanecem pendentes.
