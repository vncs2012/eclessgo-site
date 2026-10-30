# R24b Design

## Architecture Overview

Seleção global durável na API → projeção pública mínima no-store → resolver server-side do WEB por pergunta → adaptador selecionado → validação local de IDs → texto e fontes locais. PANEL grava com SUPER_ADMIN. OFF é chave operacional separada e precede seleção; nenhuma seleção alterna automaticamente de fornecedor.

No handler WEB: validar request → resolver chave/config e seleção global fresca → ler comunidade → projetar fatos → chamar somente adaptador selecionado com timeout de INFO-07 → validar resposta. OFF/ausência retorna ASSISTANT_NOT_CONFIGURED; resolver inválido/falha retorna ASSISTANT_UNAVAILABLE; ambos antes do leitor. A leitura da seleção não repassa identidade, query ou escolha do visitante. Respostas não carregam credenciais, IDs de modelo, atores ou revisão.

A página recebe apenas prontidão booleana derivada no servidor para o instante da renderização. Não executa pergunta automática nem envia credenciais ao cliente. O POST reavalia; mudança depois do início não altera o snapshot em voo, mas a próxima consulta vê a seleção nova. Falha no servidor é indisponibilidade, não suposição de prontidão.

## Code Reuse Analysis

`organization_presentation_schema.py` e seu repository são padrões para metadata própria, CAS e audit transacional. A autenticação existente consulta usuário e session_version, mas T1 faz nova leitura com bloqueio na mesma transação e exige role global SUPER_ADMIN; não aproveita Church como grant. Audit próprio evita ampliar por suposição o catálogo histórico de 44 ações e não altera tabelas de outros módulos.

## Data Models

`global_ai_provider_selection`: singleton PK id=1 com CHECK, provider nullable em enum fechado, row_version inteiro positivo. Ausência física = null/0, sem escrita em read. CAS inicial por INSERT e concorrência por PK; updates por WHERE id e row_version. Igual após checar versão é no-op.

`global_ai_provider_audit`: id próprio, actor_user_id, row_version único, action fixa e instante; enum provider opcional. Nenhum texto de pergunta/resposta, payload, chave ou modelo. Mudança e audit compartilham transação. Falhas anteriores à durabilidade revertem ambas; retorno de sucesso somente após commit observado. Se a confirmação se perder depois de commit durável, o resultado para o chamador pode ser indeterminado; não se alega exactly-once.

DDL é metadata OWN com referências mínimas a `users` e instalação explícita futura por revisão normal OWN, não registry nem migrador paralelo. A instalação cria somente `global_ai_provider_selection` e `global_ai_provider_audit`; o `users` declarado na metadata é apenas referência e nunca é criado em ambiente de aplicação. T1 cria schema apenas em banco novo temporário e não executa migrations anteriores. T2 precisa identificar o head real por metadados dos cabeçalhos nominalmente autorizados, sem ler/importar corpos antigos; não se presume que 0042 ou o head histórico R36a continue sendo o atual.

## HTTP and Provider Boundaries

T2 prevê GET público somente `{provider}` e GET/PUT administrativos com `{provider, version}` e entrada exata `{provider, expected_version}`. Status sanitizados: 401 sessão/conta, 403 papel, 409 versão, 422 entrada, 503 persistência; no-store. Detalhes finais e registro da rota dependem de liberação nominal T2. Não há configuração de credenciais na API ou no painel.

Somente servidor WEB armazena chaves e configurações por fornecedor; modelo e máximo de saída exigem valores explícitos. A ativação e limites financeiros requerem decisão separada. OpenAI Responses usa saída estruturada e `store:false`; isso não prova ausência de logs de abuso ou retenção do fornecedor. Anthropic Messages usa saída estruturada; seu schema remoto de array não deve incluir maxItems ou uniqueItems, pois a API documenta restrições limitadas de arrays. O schema usa apenas factIds como array de strings e additionalProperties false; o handler local ainda exige 0..8 IDs conhecidos e únicos. Recusas, resultados incompletos/truncados e payloads inválidos não são refletidos. Referências oficiais consultadas: [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), [OpenAI Responses e armazenamento](https://developers.openai.com/api/docs/guides/migrate-to-responses?api-mode=responses), [Anthropic structured outputs e limites de schema](https://platform.claude.com/docs/en/build-with-claude/structured-outputs#json-schema-limitations), em 2026-10-29. Nenhuma chamada de fornecedor foi feita.

## Risks & Concerns

| Risco | Local | Mitigação |
| --- | --- | --- |
| Papel/sessão revogados entre autenticação e escrita | dependências API e transação | Revalidar e bloquear conta na transação; teste revogado |
| Duas criações ou audit/commit parciais | store próprio | PK/CAS, uma transação, teste de corrida/rollback |
| Projeção pública falsa ou cache antigo | resolver WEB | no-store por chamada, shape fechado, fail-closed |
| Prompt malicioso ou erro remoto | adaptador WEB | só fatos públicos e IDs, schema estrito, validação local, sem logs de conteúdo |
| Valores monetários ausentes | operação | OFF por padrão e nenhuma ativação nesta entrega |
| SQLite não prova bloqueios PostgreSQL | teste T1 | Provar CAS adicional em PostgreSQL sintético novo com dois administradores distintos |

## Proof and Preservation

Testes novos usam cópias nominais, guarda antes de imports, banco temporário e configuração isolada sem .env. Nenhum teste/helper/fixture histórico é executado ou copiado. Cada task terá gates próprios e preservação por lista nominal, não alegação da árvore inteira. Após última fonte, Verifier novo Sol 6.1/medium, AC↔assertions e ao menos cinco faults; AD-007: duas rodadas abertas e terceira restrita se necessária. L-026 exige verificar ambos locales.

## T2 checkpoint

O router compõe `get_current_user` e uma factory de sessão nova a partir do engine existente; o core T1 reconsulta role, sessão e conta no boundary transacional. No GET público retorna somente provider; admin recebe provider/version e PUT usa request tipado com expected_version. Um route handler local rejeita chaves JSON duplicadas antes da validação tipada, preservando o request e as respostas específicas no OpenAPI; exceções são sanitizadas e respostas no-store. Nenhum handler global ou outro router mudou.

A dependência de autenticação pode manter uma conexão enquanto o UoW requer outra. O teste demonstra sessões distintas e não encerra a transação de autenticação, mas não prova progresso sob pool esgotado ou carga. A revisão OWN cria e remove apenas as duas tabelas da feature; teste SQLite de metadata não certifica uma execução PostgreSQL da revisão nem o grafo completo migrado. A QA após a última fonte deve testar upgrade/downgrade somente da revisão OWN em PostgreSQL novo, comparar tipos/FK/CHECK/UNIQUE com a metadata T1 e preservar users sentinela, sem executar ancestrais.

## T3 checkpoint

A página usa o guard global existente, sem exigir Church, e o cliente HTTP compartilhado para GET/PUT administrativos. Um flag restrito ao novo item permite a SUPER_ADMIN com vínculo MEMBER vê-lo sem mudar as regras dos demais itens. Snapshot e draft são separados; 409 bloqueia a gravação até leitura explícita, e mudanças de sessão invalidam operações em voo.

A OpenAPI mínima contém três operações nas duas rotas reais R24b e 13 schemas novos sem colisão com 339 declarações anteriores. A projeção conserva os bytes antigos dos três gerados; PANEL e MOBILE recebem os mesmos bytes e o candidato WEB permanece privado até T4. O renderer versionado amplia const de códigos de erro para string no TypeScript. O contrato OpenAPI e os testes de runtime preservam os códigos específicos; não se afirma regeneração integral da aplicação.

O gate isolado passou oito métodos Node distintos em WT e HEAD+OWN, dois métodos backend diretos em SQLite novo e tipagem nas duas variantes. Auth do teste backend é sintética; AppRoutes, ProtectedRoute, store, cliente e navegação são reais, com fronteiras alheias nomeadas como stubs. As comparações revertem os hunks de locale byte a byte. Os gates não certificam JWT real, navegador real, integração operacional, migração completa ou produção.

## T4 checkpoint

Após validar request, o handler consulta o resolver somente se o controle operacional estiver ON. A leitura pública da seleção ocorre a cada pedido, sem cabeçalhos do visitante e com no-store. Sua espera, inclusive leitura do body, tem timeout de 8000 ms com abort e falha fechada antes do leitor público. O adaptador capturado por pedido permanece estável durante a chamada; a próxima requisição resolve novamente. Inspeção inválida ou getter que lança no resultado do resolver retorna 503 antes do leitor.

Os dois adaptadores usam fetch server-side, URLs oficiais fixas, redirect error e apenas o fornecedor selecionado. OpenAI Responses usa text.format com schema estrito e store false; o parser aceita itens reasoning documentados mais uma única mensagem textual final, recusando ferramentas, recusa, truncamento ou conteúdo extra. Anthropic Messages usa Authorization Bearer, versão 2026-10-21 e workspace opcional quando o operador precisa informar o escopo da chave. O parser aceita um único bloco textual com stop_reason end_turn. O schema remoto não inclui maxItems/uniqueItems; a validação local continua impondo zero a oito IDs únicos e conhecidos.

Falha de transporte/HTTP retorna 503; timeout do adaptador retorna 504; recusa, truncamento, JSON/seleção inválida e chaves factIds duplicadas retornam 502. Uma seleção vazia somente é aceita quando JSON e envelope são válidos. Um draft inicial normalizava chaves duplicadas e produzia falso 200 no_information; testes reproduziram a falha, e o parser passou a rejeitar a ambiguidade. O RED e o patch estão preservados como defeito corrigido antes do commit, não como sensor da QA independente.

O gate passou 29 métodos Node distintos e typecheck isolado TypeScript 5.9.3; foram usados apenas transporte, identidades e configuração sintéticos. WEB, PANEL e MOBILE têm os mesmos bytes gerados incrementais; os tipos de erro seguem a limitação const para string já documentada. Não se alegam chamadas reais, JWT, app completo, retenção zero, produção ou UAT. T5 e QA independente permanecem pendentes.


## T5 checkpoint

Após localizar um detalhe público válido, a página server-side chama uma vez o resolver T4 e passa somente slug e available booleano ao componente. Nenhuma consulta ocorre em metadata, static params, 404 ou tela de detalhe indisponível; falhas do resolver produzem false. A rota alias delega à mesma página. O resolver não chama fornecedor na renderização e evita consulta de seleção quando OFF. O POST reavalia por pedido.

Os textos pt-BR/en descrevem o retrato de modo cauteloso e pontual; a interação continua manual mesmo quando o retrato é false. O gate passou 11 métodos distintos em WT+OWN e HEAD+OWN, além de typecheck isolado nas duas variantes. React, NextIntl, componente, página e alias são reais; fronteiras externas são stubs nomeados. Os três arquivos mistos revertem byte a byte às preimagens, com operações OWN idênticas em WT e HEAD.

Esse gate usa fetch e resolver sintéticos e não prova navegador real, fornecedor real, produção ou UAT. A QA independente, revisão PostgreSQL da revisão OWN e sensores comportamentais seguem obrigatórios após o commit T5.


## Fechamento QA2: Verified LOCAL (2026-10-29)

R24b está Verified LOCAL, com QA2 independente PASS e ressalvas processuais aceitas. Este fechamento sucede as referências históricas a tarefas, commit ou QA pendentes nos checkpoints acima; esses registros continuam como eram no momento em que foram escritos. A conclusão é de R24b local, não da V1 inteira. Os commits documentais ainda dependem da janela ROOT.

A prova técnica consolida 81 métodos distintos: 30 reexecutados na QA2 e 51 conservados por pins. São 13 faults distintos mortos e zero sobreviventes, com 24 controles conservados da QA1 e dois novos. A prova PostgreSQL da revisão OWN, incluindo upgrade/downgrade e CAS em fixture sintética real, foi conservada da QA1; não foi reexecutada na QA2. O relatório imutável é `validation.md`, SHA-256 `9f67ea6367f2640aa4c0d1c56c49c9067c5e1de92ecde4e702272952ded4f526`.

A pessoa respondeu literalmente “Aprovar fechamento com ressalvas”. A QA1 permanece FAIL em `validation-iteration-1.md`, SHA-256 `f74dab5a3e2a25c24a9d3691ab33040e4cf088d317d35f7780d9a74b4917b8a9`. Os nove pares iniciais de logs perdidos não foram recuperados; dois helpers tiveram permissões corrigidas posteriormente e os índices foram capturados apenas durante/final da QA1. Os incidentes QA2, incluindo dados privados inicialmente em 0664 sob diretório 0700 e exposição de literais sintéticos em stdout, também permanecem registrados e aceitos. Não se afirma preservação integral. O relatório QA2 anterior ao aceite permanece em backup privado, não foi reconstruído.

A QA2 avaliou fontes até API `d0bfde6f062cb8c894b9a4230b3c297c8f44006e`, PANEL `e756b449e15380dd98aff33986ed8d3f4df3d1c1` e WEB `d1f3146466a16259d3d82afba62c145de3fd8577`. O fechamento documental posterior não é fonte avaliada por essa QA. O manifesto de aceitação é `evidence/r24b-global-ai-provider/qa2-acceptance-12eb2221-8c00-4ac6-8b13-dbb42f82bca2/final-gates-3108055a-3e1a-4d54-96a6-a8669c572079/manifest-final.json`, SHA-256 `8634041f1aa42f7d7bf24b5c5fb3b8bae01b99d372da269bb1d1b27cf15fef56`.

Transportes, configuração, autenticação e DOM são sintéticos. A prova não certifica JWT ou navegador real, aplicação completa, migrations ancestrais, carga do pool, serviço ou retenção zero do fornecedor, UAT ou produção. Não houve request ou credencial real, gasto, ativação, push ou deploy. A próxima etapa é R26 local, com contrato ainda a delimitar; R24 e R26 integram o primeiro lançamento, seguido dos builds e QA finais MOBILE e site. Android e iOS devem sair na mesma versão; EAS fica somente em avaliação antes de cloud, upload ou gasto. R30/R34 são futuros, R16a segue sem expansão, R22b reservado e D01 mantém corte inclusivo de 30 dias com worker OFF; demais políticas permanecem pendentes.
