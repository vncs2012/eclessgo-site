# R26a — decisões e limites

Data: 2026-10-29. Status: contrato T0 aprovado, T1 e T2 commitadas localmente; T3 implementada localmente; commits PANEL/WEB e QA independente pendentes. O histórico `r26-network-unit-hierarchy/{discovery,preservation}.md` é imutável e permanece na namespace original; suas antigas dúvidas e referências a FUTURE retratam aquele momento.

## Decisões humanas vigentes

- Unidade é uma comunidade existente. Uma rede agrupa comunidades em um único nível; cada comunidade tem no máximo uma rede ativa.
- SUPER_ADMIN cria a rede e aponta uma conta existente como responsável. O responsável solicita um vínculo; somente CHURCH_ADMIN ativo da comunidade o aprova.
- Responsável ou ADMIN ativo da própria comunidade encerram um vínculo já aprovado. Os registros e os dados permanecem.
- Para pedido ainda pendente, ADMIN ativo da comunidade pode recusar e o responsável da rede pode cancelar. Esta é a resposta humana explícita “Permitir recusa e cancelamento (recomendado)”.
- Nomes da rede e das comunidades vinculadas são restritos a SUPER_ADMIN, responsável da rede e ADMINs das comunidades vinculadas. Não existe catálogo público. A leitura do nome da rede solicitante pelo ADMIN do pedido pendente é o mínimo necessário para a decisão; não libera as outras comunidades.
- O vínculo não cria Membership, herança de papéis ou acesso a pessoas, finanças ou outros dados internos de comunidades. Os guards atuais permanecem.
- R24 e R26 locais integram o primeiro lançamento V1. R24b já está Verified LOCAL com QA2 PASS e ressalvas processuais aceitas; R26a está parcialmente implementado e ainda não foi verificado.

## Escolhas de implementação propostas

A spec e `design.md` separam as escolhas de engenharia das decisões humanas: referências compreensíveis em vez de novos catálogos; nomes entre 1 e 120 caracteres; envelopes fechados e respostas no-store; versão para transições; listas paginadas; históricos terminais sem nomes; eventos mínimos. O responsável de rede sem Church deve obter capacidade pelo servidor, não por um papel global inventado. Qualquer conta sem a capacidade continua sujeita ao comportamento atual do login.

O painel atual rejeita no login/bootstrap usuário sem Church elegível, exceto SUPER_ADMIN (`src/features/auth/hooks.ts`). T3 altera somente esse ponto, a entrada e a navegação necessários ao fluxo; o backend revalida cada pedido. MEMBER responsável não recebe contexto de outra comunidade. A existência e os estados de Church, conta, sessão e Membership são revalidados na transação. A autorização exige o papel específico mesmo para SUPER_ADMIN.

A interface de criação aceita o e-mail exato da conta existente; a solicitação aceita o slug ou URL http/https sem userinfo dos caminhos existentes `/comunidades/{slug}` e `/igrejas/{slug}`. A URL é analisada localmente, sem request, com query e fragmento descartados; só o slug canônico da comunidade é persistido. Cada referência é resolvida somente dentro do respectivo comando autorizado. A API não oferece busca nova ampla nem revela o nome da comunidade pendente. IDs internos continuam UUIDs. O OWNER pode reconhecer pedidos pelo endereço curto que forneceu, sem receber a identidade de outras comunidades. A escolha atende à orientação ROOT que rejeitou exigir UUID na interface.

## Não incluído

Sem hierarquia multinível, múltiplas redes ativas, concessão de dados cruzados, edição de rede, troca de responsável, exclusão, expurgo, mensagens, provedor ou UI administrativa MOBILE. Não há permissão para ler corpos de migrations ancestrais ou antecipar seu head. R16a segue sem expansão, R22b reservado e R30/R34 futuros; D01 mantém corte inclusivo de 30 dias e worker OFF, com demais políticas pendentes.

A sequência é três entregas locais e QA independente após a última fonte commitada. O ROOT avalia contrato e reserva nominal antes de liberar cada etapa. Android e iOS devem compartilhar a versão no primeiro lançamento; EAS permanece só em avaliação, sem cloud, gasto, upload ou publicação.

## Ajuste técnico de projeção para T2

Cada NetworkSummary autorizado inclui `is_responsible`, calculado para o ator corrente e aquela rede. A pessoa pode ser responsável da rede A e SUPER_ADMIN com leitura da rede B: o campo é true em A e false em B. ADMIN local vinculado também recebe false quando não for responsável. O campo não revela conta de terceiro, não concede papel nem altera a matriz humana. A criação continua retornando apenas id/nome; a capacidade global continua com os três booleanos próprios.


## Pré-reserva T3 — entrada sem Church

A página de login decide o destino de sessões já autenticadas. O caso responsável sem Church exige ajuste nominal em `src/pages/Login.tsx`, além do fallback em `src/App.tsx` e do fluxo de login/bootstrap em `src/features/auth/hooks.ts`. O formulário `useLoginPageState.ts` apenas delega ao hook e permanece readonly; o `Sidebar.tsx` recebe itens calculados e também permanece readonly. Ambos estão mistos e suas pré-imagens foram preservadas.

A verificação de capacidade no login usa a sessão recém-obtida pelo cliente compartilhado, antes de aceitar conta sem Church elegível; o padrão existente de consulta de comunidades já usa credencial transitória. Sem resposta válida com `is_responsible=true`, a exceção não é concedida. Isso não concede Church, Membership ou papel novo.
