# T1 Evidence

PASS local: 26 testes node:test na execução direta, zero fails/skips, e tipagem dirigida dos dois fontes exit 0. Main executou após leitura e pins do guard/harness e dos quatro arquivos próprios; autor Luna não executou gates/Git.

## Commands and receipts

Cwd: eclessgo-web. Comando canônico: `node tests/r24/core.test.cjs`. Recibo evidence/t1-tests-direct.txt contém cada teste e total 26. Tipagem: `node node_modules/typescript/bin/tsc --noEmit --strict --skipLibCheck --target ES2022 --module commonjs --lib ES2022,DOM --types node src/lib/public-information-assistant.ts src/lib/public-information-assistant-provider.ts`, exit 0, evidence/t1-types.txt.

Três invocações anteriores com flag --test reportaram somente o arquivo como um teste; não comprovam os 26 casos e foram excluídas do gate. Recibos t1-tests.txt, t1-tests-tap.txt e t1-tests-clean-env.txt preservados como instrumentais. Ambiente limpo também exibiu esse comportamento; não se atribui causa não demonstrada. Execução direta comprovou os 26 casos nomeados sem modificar assertions ou fonte.

Validadores spec/tasks strict passaram na feature absoluta própria com raiz isolada vazia. A primeira chamada de check_commit incluiu flag --root não suportada e retornou uso 2; repetição no cwd isolado, sem essa flag, retornou OK. Nenhuma dessas invocações modifica a instalação ou valida features alheias.

## Adequacy

| AC | Assertion evidence | Outcome |
| --- | --- | --- |
| INFO-02 | tests/r24/core.test.cjs:93 assert.deepEqual(normalized, lista explícita); :128 assert.deepEqual(facts, lista explícita); :142 assert.equal(agendaFacts.length,30) | Somente fatos permitidos, limites e omissão |
| INFO-03 | tests/r24/core.test.cjs:162 assert.deepEqual(payload, objeto completo); :201 assert.deepEqual(payload.sources, fonte local) | Texto e fontes ancorados, snapshot imutável |
| INFO-04 | tests/r24/core.test.cjs:210 assert.deepEqual(payload, no_information com arrays vazios) | Ausência sem completar informação |
| INFO-05 | tests/r24/core.test.cjs:241 assert.equal(response.status,502); :265 assert.deepEqual(await responsePayload(response),{code:INVALID_PROVIDER_RESPONSE}) | Seleções inválidas rejeitadas |
| INFO-06 | tests/r24/core.test.cjs:273 assert.equal(response.status,503); :276 assert.equal(reads,0) | Padrão ausente antes do leitor |
| INFO-07 | tests/r24/core.test.cjs:294 assert.equal(response.status,503); :324 assert.equal(timeoutDuration,5000); :325 assert.equal(signal.aborted,true) | Falha genérica e timeout/abort exatos |
| INFO-08 | tests/r24/core.test.cjs:336 assert.equal(response.status,400); :386 assert.equal(response.status,200); :397 assert.equal(reads,0); :417 assert.equal(response.status,413) | Formato e limites antes das dependências |

Reverse map: testes projection (linhas 89/109/137/148) → INFO-02; payload/imutabilidade/eight IDs (154/185/218) → INFO-03; vazio (204) → INFO-04; shape/IDs (231/246) → INFO-05; absent/invalid-before-provider/default (269/280/456) → INFO-06/08; failure/timeout (289/300) → INFO-07; slug/body/JSON/locale/blank/codepoints/bytes (331/343/353/363/372/381/390/403) → INFO-08; missing/reader/error/mismatch (424/433/447) → INFO-09 e isolamento INFO-02, já preparados no handler T1 e serão exercitados na composição T2.

Revisão identificou mutabilidade da projeção antes do primeiro gate; autor isolou snapshot e adicionou teste sem remover/enfraquecer assertions. Matcher de erro cross-realm ajustado antes da execução mantendo expectativa TypeError. Projeção/assertions explícitas não dependem apenas de mocks chamados; payload final inteiro é confrontado.

## Limits

Sem provedor real, rede, serviços, banco, app completo, UAT humana ou demonstração visual. T2/T3 e QA independente ainda pendentes. Preservação limitada ao inventário nominal e snapshots selecionados, não à árvore inteira.
