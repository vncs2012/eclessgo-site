# R26a — design local

Status: contrato T0 aprovado, T1 e T2 commitadas localmente; T3 implementada localmente; commits PANEL/WEB e QA independente pendentes. As decisões humanas estão em `context.md`; os detalhes abaixo são escolhas locais de engenharia. A divisão por três entregas preserva fronteiras de transação e autorização.

## Reuso e alternativas

Usar core próprio pequeno e armazenamento transacional, no estilo `src/application/global_ai_provider` e `src/infrastructure/persistence/global_ai_provider_*`. O guard local continua em `dependencies.py` e a leitura corrente de Membership em `member_repository.py`; não alterar esses guards. `ChurchModel.slug` é único e `/churches/slug/{slug}` e a listagem/busca pública já existem. A regra pública existente só publica comunidades autorizadas (`eclessgo-docs/BUSINESS_RULES.md`). `UserModel.email` é único e `UserRepository.find_by_email` usa igualdade exata. Nas superfícies de roteador de usuários examinadas não foi identificada busca privilegiada adequada; a resolução exata de e-mail ocorre dentro da criação autorizada, não em endpoint novo de busca. Não usar rotas existentes para obter nome de comunidade pendente.

Alternativa de coluna direta em Church torna histórico e pedidos concorrentes frágeis; alternativa de grafo e grants amplia o produto. A opção recomendada é rede + vínculos + eventos append-only, com índices parciais e transações. Somente os nomes autorizados são projetados de tabelas existentes; nenhuma cópia de nome entra na auditoria.

## Matriz de autorização

Um ator pode acumular papéis; a união dos papéis realmente exercidos vale para cada operação. SUPER_ADMIN sozinho nunca age como responsável ou ADMIN local.

| Ação | SUPER_ADMIN corrente | Responsável corrente daquela rede | CHURCH_ADMIN ativo da comunidade alvo | Outros |
|---|---|---|---|---|
| Criar rede com conta existente | sim | não por esse papel | não | não |
| Solicitar comunidade | somente se também responsável | sim | não | não |
| Aprovar/recusar PENDING | somente se também ADMIN alvo | somente se também ADMIN alvo | sim | não |
| Cancelar PENDING | somente se também responsável | sim | não por esse papel | não |
| Encerrar APPROVED | somente se também responsável ou ADMIN alvo | sim | sim | não |
| Listar redes | todas | suas | redes com sua comunidade APPROVED ativa | não |
| Ver nomes das comunidades APPROVED de uma rede | sim | sim, de sua rede | sim, quando sua comunidade está APPROVED ativa naquela rede | não |
| Ver nome da rede de pedido PENDING | sim | sim, da sua rede | sim, somente no próprio pedido | não |
| Ver eventos sem nomes | sim | sua rede | somente vínculos da própria comunidade | não |

A capacidade autenticada própria não expõe nomes e não concede papel. Para ler rede ou comunidades, ADMIN exige Membership ACTIVE, role CHURCH_ADMIN, vínculo APPROVED e comunidade existente, ativa e não excluída; a única exceção para nome de rede é o pedido PENDING dirigido à própria comunidade. TERMINAL = REJECTED, CANCELLED ou ENDED: projeções de histórico omitem ambos os nomes e a referência textual; ADMIN local mantém acesso somente aos eventos da própria comunidade, sem revelar nome da antiga rede. Não existe caminho público de rede.

## Modelo e transação

- `Network`: UUID, nome imutável, `responsible_user_id`, instante; conta deve existir e estar não excluída ao criar. A conta pode não ter Church e pode ter qualquer papel global. Rede não pode conter outra rede.
- `NetworkLink`: UUID, `network_id`, `church_id`, estado, versão inteira positiva, `requested_slug` canônico e instantes; nunca persistir a URL ou query/fragmento de entrada. A referência é exibida somente ao responsável/supervisor enquanto PENDING; APPROVED mostra o nome autorizado; terminal não mostra referência nem nomes. Nunca gravar o e-mail informado, nomes ou corpo de entrada na trilha.
- `NetworkEvent`: UUID, referência de rede/vínculo, ação, versão, instante UTC, ator interno e correlação interna. `NETWORK_CREATED` é evento de rede; `REQUESTED`, `APPROVED`, `REJECTED`, `CANCELLED`, `ENDED` são eventos de vínculo. A projeção pública autenticada de evento contém só ação, versão e instante, sem nome ou ator.
- FK de responsável, comunidade e ator admite `ON DELETE SET NULL` para não bloquear exclusões físicas existentes; após perda de referência não há transferência automática. Exclusão lógica ou desativação revoga acesso e impede novas ações; histórico permanece. Não alterar o contrato de exclusão existente.
- CHECK restringe estados e versão. Índice UNIQUE parcial em `church_id` onde estado = APPROVED garante uma rede ativa por comunidade; outro UNIQUE parcial em `(network_id, church_id)` onde estado = PENDING impede pedido duplicado. A solicitação também rejeita uma associação APPROVED da mesma rede. PENDING de redes diferentes pode coexistir.
- Cada mutação revalida conta, sessão, papel global ou Membership, estado da comunidade e responsabilidade **dentro da mesma transação** que a alteração e o evento. PostgreSQL bloqueia linhas pertinentes em ordem estável; SQLite serializa a escrita equivalente. Revogação commitada antes do ponto de serialização impede a ação; se a ação obtiver os locks primeiro, ela é linearizada antes da revogação. Consultas validam e projetam sob fronteira consistente; nenhuma resposta retorna nome após autorização revogada antes de sua leitura. Uma falha desfaz estado e evento.
- Corrida de aprovações em redes distintas: duas conexões PostgreSQL e dois ADMINs correntes, mesma comunidade, barreira antes dos locks. Um commit APPROVED e um evento APPROVED; outro retorna 409, permanece PENDING e não cria evento. A garantia é do banco, não apenas de checagem anterior em aplicação.

## Transições e idempotência

| Origem | Ação | Destino | Autor |
|---|---|---|---|
| ausência | solicitar | PENDING v1 | responsável |
| PENDING | aprovar | APPROVED | ADMIN local |
| PENDING | recusar | REJECTED | ADMIN local |
| PENDING | cancelar | CANCELLED | responsável |
| APPROVED | encerrar | ENDED | responsável ou ADMIN local |
| terminal | novo UUID de pedido | PENDING v1 | responsável |

Criação usa UUID novo gerado no cliente. Repetir `PUT` da mesma rede com os mesmos nome e responsável resolvido, ou do mesmo pedido com a mesma rede e slug canônico, retorna 200 sem novo evento. Dados divergentes no mesmo UUID retornam 409. Se a conta ou comunidade indicada não está mais disponível no replay, retorna 404 sem criar duplicata; o cliente pode reler a lista autorizada. Cada transição usa `expected_version`. A primeira ação incrementa uma vez. Replay imediato da mesma ação, mesma versão original e mesmo ator retorna 200 apenas se ainda for o último evento e a autorização corrente continuar válida; qualquer outro estado/versão retorna 409. Após perda de resposta o cliente conserva UUID/versão originais, relê ou repete; nunca inventa novo UUID automaticamente.

## Contrato HTTP autenticado v1

`main.py` monta o router sob `settings.api_prefix`; o default estático confirmado é `/api/v1`. A tabela mostra caminhos completos nesse mount padrão. Os caminhos declarados no router são relativos: remover exatamente `/api/v1` de cada linha, por exemplo `/network-memberships/access`. Se o prefixo for configurado de outro modo, substitui-se apenas esse prefixo; clientes e testes não devem duplicá-lo. Não se importou a aplicação nem se consultou configuração operacional.

O site usa `/comunidades/{slug}` como canônico e mantém `/igrejas/{slug}`; as fontes e o redator fixado estão na evidência privada. Não foi observado um prefixo de idioma nas páginas nominais dessas rotas.

Todos os objetos são fechados (`additionalProperties: false`); UUIDs são canônicos, instantes ISO 8601 UTC, campos ausentes são inválidos salvo os explicitamente nulos. Corpos JSON têm no máximo 4096 bytes e não aceitam chaves duplicadas. Nome é trim, 1–120 caracteres Unicode sem controles; duplicidade de nomes é permitida. E-mail é trim, 1–255 sem controles, comparado por igualdade exata ao valor existente da conta não excluída; zero ou múltiplos resultados produzem 404. Apenas o UUID resultante é persistido. O campo `church_ref` aceita slug existente (1–255, sem controles ou barra) ou URL absoluta dos caminhos reais `/comunidades/{slug}` e `/igrejas/{slug}`. A URL deve usar `http` ou `https`, ter host e não ter userinfo; query e fragmento são descartados. Interpretar localmente, sem request externo; decodificar o segmento de slug uma única vez em UTF-8 estrito e rejeitar barra ou controle após decode. O slug é comparado exatamente a `Church.slug` de comunidade ativa e não excluída. Persistir apenas esse valor canônico de `Church.slug`, nunca a URL, query ou fragmento. Slug direto e URLs equivalentes resolvem à mesma identidade para replay. Não há busca por prefixo ou resposta com nome antes da aprovação.

| Operação | Entrada | Sucesso e projeção |
|---|---|---|
| `GET /api/v1/network-memberships/access` | sem corpo | 200 `{can_create, is_responsible, has_local_admin}`: três booleanos próprios |
| `PUT /api/v1/networks/{network_id}` | `{name, responsible_email}` | 201 novo, 200 replay; `{id, name}` |
| `PUT /api/v1/networks/{network_id}/links/{link_id}` | `{church_ref}` | 201 novo, 200 replay; `OwnedLink` |
| `POST /api/v1/network-links/{link_id}/{action}` | `{expected_version}`, action = approve, reject, cancel, end | 200 `LinkBase`, com versão atual |
| `GET /api/v1/networks` | `limit`, `cursor` | 200 página de `NetworkSummary` autorizados |
| `GET /api/v1/networks/{network_id}/links` | `limit`, `cursor` | 200 página de `OwnedLink` para SUPER_ADMIN/responsável, ou `PeerLink` para ADMIN vinculado |
| `GET /api/v1/churches/{church_id}/network-links` | `limit`, `cursor` | 200 página de `LocalLink` só para ADMIN da própria comunidade |
| `GET /api/v1/network-links/{link_id}/events` | `limit`, `cursor` | 200 página de `EventView` segundo a matriz |

`NetworkSummary = {id, name, is_responsible}`; o booleano é true exatamente se `responsible_user_id` da rede for o ID do ator corrente e false nos demais casos. O ID do responsável não é serializado. A criação continua retornando `{id, name}` e a capacidade global continua com exatamente três booleanos. `LinkBase = {id, network_id, status, version, created_at, updated_at}`. `OwnedLink` contém `LinkBase` mais `requested_ref: string|null` e `church_name: string|null`: somente PENDING tem o slug canônico submetido, somente APPROVED com comunidade ativa tem nome, e terminal tem ambos null. `PeerLink = {church_name}` inclui exclusivamente comunidades APPROVED ativas. `LocalLink` contém `LinkBase` mais `network_name: string|null`, preenchido apenas em PENDING/APPROVED. `EventView = {action, version, occurred_at}`. Todos os IDs são internos; nenhuma projeção inclui e-mail, nome de pessoa, dados internos ou financeiros. Em caso de múltiplos papéis, a seleção de projeção é SUPER_ADMIN, depois responsável, depois ADMIN local; isso não altera a matriz de ações. O campo por rede é calculado a partir da linha já obtida por `networks_visible`, sem N+1 ou requisições adicionais; somente o próprio booleano sai da API. O painel usa o campo para solicitar/cancelar/encerrar como responsável, e usa a lista da própria comunidade para ações de ADMIN local.

Listas retornam `{items, next_cursor}`; cursor é UUID da última linha, ou versão decimal para eventos; ordem crescente e estável por UUID, ou por versão nos eventos. Limite default 50 e máximo 100, sem total; cursor inválido é 422. `next_cursor` é null ao fim. Não se promete snapshot global entre páginas.

| Condição | HTTP | Corpo fechado `detail.code` |
|---|---:|---|
| Sessão ausente, inválida, expirada ou revogada | 401 | `UNAUTHENTICATED` |
| Papel global ausente na criação | 403 | `FORBIDDEN` |
| Recurso inexistente, referência não resolvida ou ação de ator sem acesso ao recurso | 404 | `NOT_FOUND` |
| Estado/versão, UUID divergente ou exclusividade concorrente | 409 | `CONFLICT` |
| Corpo maior que 4096 bytes | 413 | `PAYLOAD_TOO_LARGE` |
| JSON/chave/valor/limite inválido | 422 | `INVALID_INPUT` |
| Persistência indisponível ou falha transacional | 503 | `UNAVAILABLE` |

Todas as respostas, inclusive erros de dependência e validação, enviam `Cache-Control: no-store`. Nenhum erro ou log devolve e-mail, referência, corpo, exception, stack ou SQL. Não criar rate limit específico, canal de notificação ou busca pública de redes; limites de infraestrutura já existentes não são alegados como cobertura desta feature.

## PANEL e riscos

`hooks.ts` hoje exige Church elegível ou SUPER_ADMIN para login e bootstrap. Chamar o caminho relativo `/network-memberships/access` sob o prefixo configurado, padrão `/api/v1`, com a sessão autenticada permite responsável existente sem Church e MEMBER responsável; falha da consulta não vira permissão. Apenas a rota de rede e seu item de navegação recebem a nova capacidade; as demais rotas continuam usando os guards anteriores. Em troca de sessão/comunidade, abortar e descartar respostas antigas. Ações mostram estados, desabilitam duplicação, usam recarga explícita em 409 e não apresentam nomes não autorizados. Locales R26a próprios são integrados ao i18n, sem editar os dois JSON herdados.

| Risco | Evidência | Mitigação |
|---|---|---|
| Login sem Church é hoje negado | `src/features/auth/hooks.ts` | Testes novos de login/bootstrap, MEMBER responsável, USER sem rede e matriz anterior. |
| Guard local usa Membership por comunidade | `src/infrastructure/api/dependencies.py` e `member_repository.py` | Revalidar na transação e testar negação de dados internos alheios. |
| Proveniência combinada do head de migration | 45 OIDs ancestrais HEAD iguais e quatro campos R24b lidos apenas do cabeçalho WT | ROOT aceitou o parent R24b; não se afirma igualdade integral WT/HEAD e só a revisão OWN foi executada nos bancos novos. |
| Input conhecido pode deixar resposta de commit perdida | Estado e evento são transacionais | UUID estável, replay restrito, consulta autorizada e testes de rollback/race. |
| IDs/nomes fora do escopo podem vazar por projeção ou erro | Novo router e painel | Schemas fechados por papel, erros sem eco, no-store e testes negativos multiator. |
| Fontes selecionadas mistas e quatro caminhos proibidos | `preservation.md` | Pré-imagens HEAD/WT, allowlist nominal e prova HEAD+OWN; bloqueio de leitura/importação dos quatro caminhos. |


## Pré-reserva técnica T3

- `src/api/client.ts` é o ponto compartilhado de transporte. Estender apenas a classificação sem contexto das oito operações R26 para URLs relativas e para o prefixo versionado efetivo, inclusive a rota da comunidade alvo; caminhos parecidos e endpoints antigos conservam a classificação anterior. Preservar geração de sessão, refresh, logout e descarte de resposta obsoleta. Não usar fetch alternativo ou importar o arquivo protegido.
- Em login/bootstrap, consultar a capacidade autenticada com a sessão em negociação, no cliente compartilhado e sob o mesmo controle de geração usado pela consulta existente de comunidades; não persistir autenticação elegível apenas por tentativa. Com zero comunidades elegíveis e sem SUPER_ADMIN, aceitar somente `is_responsible=true`; falha, cancelamento ou troca de sessão não autorizam. Preservar os demais destinos e papéis anteriores.
- `Login.tsx` redireciona responsável confirmado sem Church à área de redes. `App.tsx` registra a rota sob o guard autenticado sem Church e corrige o fallback desse caso; a própria área exige capacidade própria válida. Guards de pessoas, finanças e comunidades permanecem como eram. O item de navegação só aparece a SUPER_ADMIN, responsável ou ADMIN local efetivo; um MEMBER responsável recebe essa exceção apenas para redes.
- O painel separa a lista local de pedidos da lista da rede: ADMIN pendente vê o nome da rede solicitante apenas no pedido da própria comunidade; a lista de pares não vira fonte de IDs ou ações de outra comunidade. Ações de owner dependem do booleano por rede; ações locais dependem da Membership apropriada.
- A capacidade e cada consulta usam cancelamento e conferência de geração/sessão e comunidade antes de apresentar resultados. Dados antigos, falhas, 409 e mudanças de contexto não reaproveitam nomes ou respostas obsoletas.
- Os três gerados partem dos mesmos 55.719 bytes. O renderer versionado importa `api.main` no topo: em runtime novo extrair estaticamente somente as seis funções puras e a constante necessária, fixar código e entradas, e nunca importar esse módulo integral. A triagem encontrou nome de tipo já existente; comparar o conjunto fechado de schemas e referências das oito operações, reutilizar colisão apenas quando equivalente ou renomear schemas novos e suas referências. Não reescrever declarações anteriores; comparar prefixo/bytes e tipar os três destinos. Se MOBILE mudar, carrier PANEL aplicado e revertido com fuzz zero em cópia.


O interceptor atual pode aplicar a credencial já presente na store; por isso a consulta de capacidade durante login/bootstrap deve usar a credencial da sessão em negociação e não a de uma conta anterior. Caso necessário, o override é explícito, transitório e restrito à consulta própria R26, com verificação de geração e sem alterar refresh/logout nem a precedência de credenciais dos demais endpoints. Os testes devem distinguir conta anterior e conta em negociação, inclusive logout ou troca de sessão antes da resposta.


A capacidade pode ser compartilhada por provider/hook em `useNetworkAccess.ts` dentro de `App.tsx`, somente em memória: snapshot da geração de sessão, estado de carregamento/erro e cancelamento com descarte por geração e contexto. Não serializar o `Symbol` da geração como chave de cache nem persistir grant. Na volta a `/login` ou ao fallback sem Church, aguardar a capacidade; falha oferece estado de erro/retentativa e não cria ciclo ou acesso. O fluxo de interesse anterior continua com suas regras próprias.
