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
