# R24 Local Guide

O assistente pertence ao detalhe público de uma comunidade. As rotas do site comunidades/slug e seu alias igrejas/slug compartilham a página existente. O endpoint POST local termina em api/public/churches/slug/slug/assistant.

## Local contract

A requisição contém somente question e locale (pt-BR ou en). O handler valida formato e limites antes de qualquer dependência. O leitor é o detalhe público existente, chamado sem headers de identidade e com no-store. Somente perfil, endereço/localidade e agenda publicados entram na projeção.

O adaptador recebe pergunta, idioma, slug, fatos e AbortSignal. Sua resposta contém apenas factIds conhecidos, únicos e no máximo oito. O texto e os links são montados pelo handler a partir do snapshot de fatos; respostas de prosa livre, links fornecidos pelo adaptador e IDs desconhecidos são rejeitados. Uma seleção vazia resulta em ausência explícita de informação.

## Provider deliberately deferred

public-information-assistant-provider.ts mantém o padrão ausente. A rota responde 503 ASSISTANT_NOT_CONFIGURED sem consultar o leitor público. Nenhum provedor foi escolhido, nenhuma variável de credencial criada e nenhum client externo ativado. Os seletores sintéticos existem somente nos testes.

Para uma futura implementação de provedor, preservar a projeção mínima e o contrato de seleção; definir fornecedor, custos/limites operacionais, finalidade de tratamento, configuração e validação externa em autorização própria. Qualidade semântica de uma IA real e disponibilidade operacional não foram comprovadas pelo teste do adaptador local.

## Verification entrypoints

Main executa separadamente os arquivos próprios core.test.cjs, route.test.cjs e ui.test.cjs com Node direto, sem flag --test. O runner node:test interno relata os casos individuais; a flag --test na execução inicial relatou apenas o arquivo e foi excluída da prova aceita. A tipagem usa exclusivamente tests/r24/tsconfig.json.

O harness transpila somente fontes R24 allowlistados, usa mocks explícitos no lugar de public-api e next-intl e não inicializa a aplicação. R24_SOURCE_ROOT permite que a mesma seleção de testes exerça cópias isoladas para o sensor. Isso não autoriza apontar a variável para arquivos históricos/protegidos ou executar o app completo.

## Deliberate limits

Sem dados privados, ações administrativas, WhatsApp, persistência de conversa, logs de perguntas, instalação, serviços, banco, produção, push ou deploy. Testes de DOM sintético não constituem UAT humana ou E2E autenticado. validation.md registra o parecer independente e os limites reais após a verificação.
