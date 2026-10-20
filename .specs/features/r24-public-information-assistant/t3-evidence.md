# T3 Evidence

PASS local: 26 core + 5 rota + 16 UI, zero fails/skips, tanto no WT quanto no pack HEAD+OWN. Tipagem própria e sintaxe dos helpers exit 0. Main revisou guard/imports, arquivos novos e variantes antes de executar; autor Luna não executou testes/Git.

## Commands and receipts

Cwd eclessgo-web; três comandos diretos separados node tests/r24/core.test.cjs, route.test.cjs e ui.test.cjs. Repetidos com R24_SOURCE_ROOT apontando ao artifact index-candidates. Recibos finais evidence/t3-{core,route,ui,index-core,index-route,index-ui}.txt. Tipagem node node_modules/typescript/bin/tsc --project tests/r24/tsconfig.json, evidence/t3-types.txt. evidence/t3-pins.txt e t3-index-pins.txt conferidos antes/depois.

evidence/t3-ui-first.txt registra 16 PASS no WT antes de reforçar o escopo do AST. Não é o recibo final da seleção corrigida. O candidato inicialmente mal ancorado foi detectado por inspeção antes de qualquer execução/stage do pack; foi corrigido pelo autor, preservando os testes e acrescentando checagens de escopo. A geração/reversão de mistos e suas limitações estão em preservation.md.

## Adequacy

| AC | Assertion evidence | Outcome |
| --- | --- | --- |
| INFO-11 | tests/r24/ui.test.cjs:202 assert.equal(label.textContent,messages[locale].publicAssistant.questionLabel); :212 assert.equal(view.calls.length,0); :222/226 contagens 500/501 | Formulário acessível/localizado, limite em code points e ausência de fetch automático |
| INFO-12 | tests/r24/ui.test.cjs:241 assert.equal(view.calls.length,1); :267 assert.equal(link.getAttribute(href),fonte canônica); :281 assert.match(textContent,ausência) | Duplicidade síncrona impedida, fatos escapados/citações e vazio explícito |
| INFO-13 | tests/r24/ui.test.cjs:313 assert.match(textContent,indisponibilidade inicial); :349 assert.equal(querySelector(ol),null); :380 assert.equal(view.calls.length,2) | Erros distintos, payload inválido descartado e retry |
| INFO-14 | tests/r24/ui.test.cjs:394/418 assert.equal(staleCall.options.signal.aborted,true); :456 assert.equal(turns.length,10) | Contextos isolados, abortos/limpeza/tardias, histórico limitado |
| INFO-15 | tests/r24/ui.test.cjs:189 assert.deepEqual(Object.keys(namespace).sort(),TRANSLATION_KEYS.sort()); :557 assert.equal(assistantInDetailPage,true); :558 assert.equal(assistantInUnavailablePage,false) | Todos os 17 textos não vazios nos dois locales e ligação AST da função correta |

Reverse map dos 16 testes por linha: 185→INFO-15;194/216→INFO-11;230/257/271→INFO-12;285→INFO-12/13/15;306/328/355/364→INFO-13;385/409/436/447→INFO-14;470→INFO-15. Payload enviado é confrontado por conteúdo exato, sem histórico; resultados e links são inspecionados no DOM, não apenas por contagem de mock.

Antes do primeiro gate, Main identificou a necessidade de trava síncrona de submit e a colisão de substring do rascunho de teste Resposta1 com Resposta10/11. Autor acrescentou trava/prova de dois eventos no mesmo batch e fez o teste distinguir textos exatos, preservando o requisito. Nenhuma assertion foi relaxada/removida para passar um gate.

## Limits

ReactDOM/JSDOM reais, HTTP e next-intl sintéticos; mensagens reais por leitura delimitada. A definição src/i18n/locales.ts foi conferida pelo Main e declara pt-BR/en. Página e alias são validados por AST sem importar seu runtime amplo. Tipagem isolada usa stubs de public-api/next-intl; não equivale a full app, Next build, navegador real, UAT humana, autenticação, banco ou IA externa. Provedor ausente permanece padrão real. QA independente e sensores ainda pendentes.
