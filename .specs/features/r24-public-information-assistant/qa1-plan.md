# R24 QA1: auditoria independente e prescrição

**Estado: aguardando execução dos sensores; nenhum PASS emitido.**

Data: 2026-10-20. Verificador distinto dos autores. Seleção do harness informada: gpt-6.1-sol / medium / fork none; esforço interno não medido. Não executei testes, gates, Git ou serviços. Li integralmente spec/context/design/tasks R24, SKILL.md tlc-spec-driven e referências validate/coding-principles/sub-agents. A spec, e não as tabelas do Main, fundamenta os resultados abaixo.

Range informado pelo Main: `7c4533e1506e8d52326edc42132959cf2ea6cb4f..fcab80f0058f20faec2c13874e5833a37bb4680a`. Commits informados: T1 `aa9cbf2520ea801d3d28a8a064c68111361d1062`, T2 `f20af46a8239d4c88fa0a490ca35312e7a1661d3`, T3 `fcab80f0058f20faec2c13874e5833a37bb4680a`.

Fontes inspecionados: pack persistente `r24/index-candidates`, sob `/home/vncs/.codex/visualizations/2026/10/20/01a15a26-0a0f-7bb3-998f-477d09b1e28d`, informado como HEAD+OWN commitado. Somente quatro módulos novos, os dois hunks próprios da página, namespace publicAssistant de ambos locales e alias público. Testes/helpers/configs inspecionados exclusivamente em `tests/r24`. Todas as leituras tiveram filtro sensível antes da saída. Nenhum caminho protegido foi lido/importado/hashado/resolvido por mim.

Conferi também o diff de fonte/testes do range, materializado pelo Main em `r24/source-final.diff`: quatro módulos novos, dois hunks da página, somente namespace novo em cada locale e sete arquivos novos tests/r24. Nenhum teste preexistente aparece removido ou enfraquecido nessa superfície. Não usei Git. Essa inspeção de diff não equivale a hashing próprio nem à preservação de árvore inteira.

## Cobertura rederivada

Paths de testes abaixo são relativos ao web. São assertions existentes, ainda pendentes dos recibos independentes desta rodada. Leitura não equivale a resultado de execução.

| AC | Resultado exigido pela spec | Assertion / evidência concreta |
| --- | --- | --- |
| INFO-01 | Somente slug atual, sem identidade encaminhada, no-store | `tests/r24/route.test.cjs:109`: deepEqual reads com `[[SLUG, { cache: "no-store" }]]`, request com três headers de identidade em :92; :113 ordem reader/provider |
| INFO-02 | Allowlist de perfil/localidade/agenda; nenhum campo extra | `tests/r24/core.test.cjs:93` deepEqual lista literal completa; :106 keys id/text; :128 omissões malformadas; :142 agenda 30; :174 keys completos do input; `route.test.cjs:118` fatos literais completos |
| INFO-03 | 1..8 IDs conhecidos únicos, texto exato, fontes locais atuais | `core.test.cjs:162` deepEqual payload completo; :200 answer exato após tentativa de mutação; :224..228 oito fatos e fontes; :241..242 rejeição prosa/links extras |
| INFO-04 | Seleção vazia resulta 200/no_information/arrays vazios | `core.test.cjs:208..215` status e payload literal para pergunta por estacionamento ausente |
| INFO-05 | Shape/IDs desconhecidos/duplicados/>8 resultam 502 genérico | `core.test.cjs:241..242`, :264..265 status 502 e objeto exato; loops :232..237 e :251..255 |
| INFO-06 | Ausência retorna 503 sem reader/provider | `core.test.cjs:273..277`; `route.test.cjs:73..77`; provider null em `core.test.cjs:457` |
| INFO-07 | Falha 503, timeout 5000/504, abort, sem detalhes | `core.test.cjs:294..297` e :324..328 |
| INFO-08 | Entrada exata e limitada, recusada antes das dependências | `core.test.cjs:336..339` slugs; :347..350 keys; :357..360 JSON; :367..369 locale; :376..378 vazio; :386..387 aceita 500 Unicode; :397..400 recusa 501; :410 e :417..421 bytes 4096/4097; :284..286 precedência sobre provider ausente |
| INFO-09 | Reader 404/falha vira 404/503 sem provider | `route.test.cjs:170..177`, :194..202; `core.test.cjs:428..430`, :441..443, :451..453 slug divergente |
| INFO-10 | Respostas no-store, sem logs/persistência/ação/config protegido | `core.test.cjs:86` e `route.test.cjs:66` chamados nos caminhos selecionados. Revisão dos quatro módulos: nenhum import runtime no core/provider; rota importa somente três módulos declarados; componente somente React/next-intl. Sem escrita persistente, ferramentas ou logs no fonte próprio. Harness :106..126 bloqueia console/imports fora da allowlist; isso não prova a aplicação inteira. |
| INFO-11 | Formulário acessível, limite, aviso privado, indisponibilidade honesta, sem autofetch | `ui.test.cjs:201..212` labels/describedby/aviso/500/disponibilidade/zero calls para ambos idiomas; :221..227 limites Unicode. Texto literal dos namespaces lidos confirma aviso e ausência de jargão. |
| INFO-12 | Pending impede duplicado e anuncia; fatos escapados/fontes clicáveis; ausência explícita | `ui.test.cjs:241..243`, :251; :263..268 HTML não criado, texto presente e href exato; :281..282 ausência sem link |
| INFO-13 | Falhas/shape/slug/fontes inválidas não exibidas, mensagem localizada e retry; distinguir não configurado | `ui.test.cjs:299..303` inglês; :313..325 distinção/retry; :349..351 inválidos sem ol/link; :360..361 apenas 200; :377..382 rede genérica/retry |
| INFO-14 | Abort e descarte tardio em contexto/unmount; limpar e limitar dez pares | `ui.test.cjs:394..406` slug; :418..433 locale; :444 abort unmount; :456..466 dez pares e sem histórico no request |
| INFO-15 | Todas chaves pt-BR/en, canônica e alias; preservar herança | `ui.test.cjs:189..190` keys literais completas em ambos locales; :555..560 AST import/render dentro ChurchDetailPage e alias. Preservação depende de recibos Main dos reversos/deltas próprios; nenhuma prova de árvore inteira presumida. |

Nenhum gap substantivo de comportamento foi identificado pela leitura. Limites: INFO-10 tem parte demonstrada por inspeção estática, não prova dinâmica universal; integração página é AST, não render da aplicação; preservação exige evidência do Main. Campos de texto são aparados e recebem labels na projeção conforme contrato existente; comparação de resposta usa exatamente o fato projetado.

## Prescrição de oito faults comportamentais

Executor Luna materializa **uma única substituição literal por variante**, em cópias isoladas do pack commitado, nunca no produto, nunca acumulando faults. IDs Q1..Q8. Não alterar testes/helpers/configs nem permitir import/setup/tipo como kill. Scratch ativo deve estar fora do produto; arquivos inertes e recibos permanecem no artifact persistente. Main revisa o diff literal e pina tudo antes de executar.

### Q1: exposição de dado fora da allowlist

Path `src/lib/public-information-assistant.ts:105`.
Antes: `addFact("description", labels.description, boundedPublicText(source.description));`
Depois: `addFact("description", labels.description, boundedPublicText(source.pixKey));`
Viola INFO-02: omite descrição publicada e projeta campo de doação. Witness `tests/r24/core.test.cjs:93`, deepEqual dos fatos literais; fixture tem pixKey em :34. Esperado: assertion de valores falha porque descrição muda para marcador privado. Nenhuma rede/ação/credencial introduzida.

### Q2: fontes de outra comunidade

Path `src/lib/public-information-assistant.ts:340`.
Antes: `sources: selectedFacts.map((fact) => ({ factId: fact.id, href: SOURCE_PATH(slug) })),`
Depois: `sources: selectedFacts.map((fact) => ({ factId: fact.id, href: SOURCE_PATH("outra-comunidade") })),`
Viola INFO-03. Witness `tests/r24/core.test.cjs:162`, deepEqual payload que exige href do SLUG; secundário `route.test.cjs:100`. Esperado: fontes divergentes, status ainda 200.

### Q3: seleção duplicada aceita

Path `src/lib/public-information-assistant.ts:218`.
Antes: `if (typeof factId !== "string" || seen.has(factId)) return null;`
Depois: `if (typeof factId !== "string") return null;`
Viola INFO-05. Witness `tests/r24/core.test.cjs:264` com seleção duplicada de :253. Esperado: 200 em vez de 502; assertion status mata variante.

### Q4: fronteira de pergunta recusa 500 code points

Path `src/lib/public-information-assistant.ts:194`.
Antes: `if (!question || [...question].length > QUESTION_LIMIT_CODE_POINTS) return null;`
Depois: `if (!question || [...question].length >= QUESTION_LIMIT_CODE_POINTS) return null;`
Viola INFO-08 e edge explícito 500 aceito. Witness `tests/r24/core.test.cjs:386`, `assert.equal(response.status, 200)` para 500 emojis. Esperado 400, falha de valor.

### Q5: timeout não aborta signal

Path `src/lib/public-information-assistant.ts:306`.
Antes: `        controller.abort();`
Depois: `        void controller;`
Viola INFO-07, mantendo o timeout e resposta 504 executáveis. Witness `tests/r24/core.test.cjs:325`, `assert.equal(adapterSignal.aborted, true)`. Esperado false e falha da assertion; não aceitar timeout externo do processo como kill.

### Q6: leitura pública passa a usar cache

Path `src/app/api/public/churches/slug/[slug]/assistant/route.ts:13`.
Antes: `return await getPublicChurchBySlug(slug, { cache: "no-store" });`
Depois: `return await getPublicChurchBySlug(slug, { cache: "force-cache" });`
Viola INFO-01. Witness `tests/r24/route.test.cjs:109`, deepEqual de argumentos completos. Esperado diferença no cache. Rodar teste JS direto: falha de tipo pelo stub dirigido não conta como kill e não substitui witness de argumento.

### Q7: cliente aceita fonte inválida

Path `src/components/site/public-information-assistant.tsx:81`.
Antes: `if (item.href !== expectedHref) return null;`
Depois: `void item.href;`
Viola INFO-13: resposta com fonte inválida passa a ser exibida, mesmo que o href renderizado seja reconstituído localmente. Witness `tests/r24/ui.test.cjs:349`, `assert.equal(view.container.querySelector("ol"), null)` no loop de payloads inválidos :329..341. Esperado ol existente para fonte inválida; não basta afirmar que o destino final foi sanitizado.

### Q8: contexto/unmount deixa pedido ativo

Path `src/components/site/public-information-assistant.tsx:111`.
Antes: `requestControllerRef.current?.abort();`
Depois: `void requestControllerRef.current;`
Viola INFO-14. Witness `tests/r24/ui.test.cjs:394`, :418 e :444, `assert.equal(signal.aborted, true)` (forma staleCall nas duas primeiras). Esperado false; descarte por generation pode continuar correto, mas não satisfaz obrigação de abort.

## Seleção e recibos necessários

Main executa seleção idêntica nos controles antes/depois e nas oito variantes: `node tests/r24/core.test.cjs`, `node tests/r24/route.test.cjs`, `node tests/r24/ui.test.cjs`, com R24_SOURCE_ROOT direcionado ao pack/variante. Capturar exit separado e totais dos casos internos node:test. Não usar `--test`. Controles exigem 26+5+16 = 47 casos, zero falhas/skips. Variantes devem mostrar nome do caso e assertion comportamental indicada, expected/actual e stack file:line. Qualquer falha de setup/import/sintaxe, interrupção ou timeout externo é inválida e demanda correção da execução, não dos testes.

Também necessários: pins prévios de fontes/testes/helpers/variantes; revisão das oito substituições; recibo dirigido de tipagem/guard/sintaxe; prova de igualdade das superfícies selecionadas pré/pós e cleanup do scratch; preservação dos três mistos via reversos/deltas informados, com escopo explícito. Main é único executor dos gates; QA avalia receipts e escreve validation.md só depois. AD-007: duas rodadas abertas; terceira somente survivors/regressões/gates, sem reabrir históricos.

## Mapa reverso dos 47 casos

Cada linha identifica o início do teste em seu arquivo, evitando tratar helpers como testes adicionais.

- `core.test.cjs`: :89→INFO-02; :109→INFO-02/04 edge malformado; :137→INFO-02 limite agenda; :148→INFO-01/02 isolamento slug; :154→INFO-02/03; :185→INFO-02/03 edge injeção; :204→INFO-04; :218→INFO-03; :231→INFO-03/05; :246→INFO-05; :269→INFO-06; :280→INFO-08 precedência; :289→INFO-07; :300→INFO-07; :331→INFO-08; :343→INFO-08; :353→INFO-08; :363→INFO-08; :372→INFO-08; :381→INFO-08 edge 500; :390→INFO-08 edge 501; :403→INFO-08 bytes; :424→INFO-09; :433→INFO-09; :447→INFO-01/09; :456→INFO-06. Todos os casos HTTP que chamam assertNoStore também exercitam INFO-10.
- `route.test.cjs`: :69→INFO-06/10; :80→INFO-01/02/03/10; :135→INFO-08/10; :157→INFO-09/10; :180→INFO-09/10.
- `ui.test.cjs`: :185→INFO-15; :194→INFO-11/15; :216→INFO-11/08; :230→INFO-12/10; :257→INFO-12; :271→INFO-12/04; :285→INFO-13/15; :306→INFO-13; :328→INFO-13; :355→INFO-13; :364→INFO-13; :385→INFO-14; :409→INFO-14/15; :436→INFO-14; :447→INFO-14/10; :470→INFO-15.

Não existe provedor real, UAT humana, PG/JWT, fullapp/E2E, deploy ou operação provados. React/ReactDOM/JSDOM são reais; next-intl, HTTP, leitor e adaptador são sintéticos. A rota padrão termina em 503 sem leitor. O sensor avalia discriminação local dessa seleção e não qualidade semântica de IA futura.

## Adendo instrumental: Q7b

Após a execução pelo Main, li os recibos Q1-core, Q2-core, Q3-core, Q4-core, Q5-core, Q6-route e Q8-ui. Os sete witnesses prescritos produziram ERR_ASSERTION de valores: respectivamente descrição pública substituída por marcador privado (:93), href de outra comunidade (:162), 200 versus 502 (:264), 400 versus 200 (:386), false versus true no abort (:325), force-cache versus no-store (:109), false versus true em abort de contexto/unmount (:394/:418/:444). São kills comportamentais válidos, não falhas de import/setup/tipo. Os recibos incluem totais internos 26, 5 ou 16 conforme seleção. O Main informou exits 1 nos arquivos com falhas; aguardam-se consolidação de exits, controle posterior e preservação.

Q7 original não tem resultado: Main informou interrupção do host/tool, arquivo Q7-ui vazio e nenhuma sessão/processo remanescente. Não é kill, survivor ou prova de gap nos testes. A hipótese de custo ao formatar objeto DOM em AssertionError permanece não comprovada. Não se altera nem se enfraquece assertion alguma.

Prescrevo **Q7b**, em variante nova limpa, com uma substituição literal, sem acumular Q7:

Path `src/components/site/public-information-assistant.tsx:75`.
Antes: `const expectedHref = \`/comunidades/${slug}\`;`
Depois: `const expectedHref = \`/comunidades/${slug}/\`;`

Viola INFO-12: a resposta válida tem fonte local exata sem barra final e deve ser exibida; o cliente passa a recusá-la. Exercita a mesma fronteira de validação de citação cliente, em sua direção de aceitação positiva. Não pretende substituir uma prova de rejeição de links arbitrários por equivalência; essa rejeição continua coberta pelas assertions de payloads inválidos e revisão de fonte.

Witness primário `tests/r24/ui.test.cjs:264`: `assert.equal(view.container.textContent.includes(untrustedText), true)`. Esperado false versus true, pois o resultado válido é recusado antes de renderizar. A assertion anterior :263 continua null versus null e a falha primária usa boolean, sem comparar DOM complexo. Witness secundário :405/:433 exige presença de resposta atual; :456 exige dez pares, agora zero. Nenhum payload inválido do loop :329..341 contém a URL com barra final, portanto esse loop deve continuar recusando todos sem gerar a comparação problemática de ol existente.

Main revisa/pina a substituição antes da materialização/execução, executa novamente a seleção inteira 47 em Q7b e mantém o controle posterior idêntico. Q7 permanece tentativa instrumental incompleta no relatório; Q7b só contará após receipt com assertion primitiva e saída normal. Nenhum PASS emitido neste adendo.
