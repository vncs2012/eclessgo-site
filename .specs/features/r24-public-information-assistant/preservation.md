# R24 Preservation Record

Baseline inicial nominal de status/HEAD dos repos API, painel e web foi capturada antes de autoria executável R24 no artifact root persistente da sessão: `/home/vncs/.codex/visualizations/2026/10/20/01a15a26-0a0f-7bb3-998f-477d09b1e28d/r24/baseline`. Quatro exclusões literais precederam o path positivo em cada status/diff. Esse inventário não comprova igualdade de bytes da árvore inteira.

Snapshots prévios de conteúdo, por whitelist: web página de detalhe, pt-BR/en, public-api.ts e types/public.ts, com WT e HEAD separados em baseline/web-source. Os dois últimos estavam limpos e seus pins WT/HEAD coincidiram. Os três primeiros são mistos e devem preservar os bytes herdados ao remover somente OWN em cópias verificadas; nunca restaurar a árvore real. Baseline não será rebatizada após interrupção.

## Incidents and limitations

- Na abertura desta sessão, a resposta de uma leitura read_thread do owner foi exibida sem aplicar previamente o filtro de conteúdo obrigatório. A falha de procedimento é reconhecida; não se declara conformidade global retroativa. Leituras posteriores de mensagens de ferramenta passam por filtro antes da saída.
- Uma mensagem inicial de coordenação foi rejeitada pela revisão automática por ausência de autorização humana direta reconhecida. Nenhum canal alternativo foi usado. Após autorização explícita do humano nesta sessão, o envio pelo mesmo tool foi aceito e o owner forneceu ACK nominal de autoria, sem janela de commit.
- Saídas agregadas de documentação sofreram truncamento. Referências necessárias são relidas individualmente para decisões e gates; truncamento não vale como leitura integral.
- Testes, fixtures, helpers e evidências históricos não estão autorizados para execução/reuso. Nenhuma prova de fonte protegida ou preservação integral da árvore é inferida de status.

## Pending final comparison

Pins dos fontes próprios e snapshot nominal antes/depois dos sensores serão registrados após a fonte final. Scratch ativo ficará fora dos produtos; variantes e provas inertes serão arquivadas antes de seu descarte. Não há sensor ou resultado funcional neste registro inicial.
