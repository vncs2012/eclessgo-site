# T2 Evidence

PASS local: core 26/26 e rota 5/5, zero fails/skips; tsc com projeto próprio e node --check de harness/rota-test exit 0. Pins dos oito arquivos conferidos antes/depois sem mudanças. Main executou após revisão do guard e stubs; autor não executou gates/Git.

## Receipts

Cwd eclessgo-web; comandos diretos separados `node tests/r24/core.test.cjs` e `node tests/r24/route.test.cjs`; tipos `node node_modules/typescript/bin/tsc --project tests/r24/tsconfig.json`. Recibos evidence/t2-core.txt, t2-route.txt, t2-types.txt e t2-pins.txt. Config próprio sem extends, files explícitos e public-api somente em stub nominal; public-api/config reais não são carregados nos testes/tipagem.

## Adequacy

| AC | Assertion evidence | Outcome |
| --- | --- | --- |
| INFO-01 | tests/r24/route.test.cjs:109 assert.deepEqual(JSON.parse(JSON.stringify(fixture.calls.reads)), [[SLUG,{cache:no-store}]]); :100 assert.deepEqual(payload,objeto completo) | Leitor somente público, sem headers do visitante, resposta ancorada |
| INFO-09 | tests/r24/route.test.cjs:170 assert.equal(response.status,404); :191 assert.equal(response.status,503) | Falhas 404/503 com code exato e zero seletor |
| INFO-10 | tests/r24/route.test.cjs:66 assert.equal(response.headers.get(cache-control),no-store); harness.cjs:77 guard bloqueia imports sem mock | Respostas sem cache e import graph isolado |

Reverse map dos cinco testes: linhas69/80/135/157/180 (padrão off, composição, entrada inválida, 404, falha) → INFO-06/01/08/09/10. Assertions de reads normalizadas somente para atravessar realms VM; preservam exatamente valores e ausência de propriedades extras. Casos de handler T1 continuam intactos e verdes. Inspeção estática confirma somente export POST, sem persistência/log/ferramenta de ação; rota real mantém adaptador null.

## Limits

Rota exercitada no VM com Request/Response reais do Node e leitor/provedor sintéticos; sem processo Next/API, dados reais, configuração protegida ou chamada externa. Tipagem por stub da dependência pública não equivale à compilação do app completo. UI e QA final pendentes.
