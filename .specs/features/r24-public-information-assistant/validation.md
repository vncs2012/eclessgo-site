# R24 Public Information Assistant Validation

## Validation: PASS

**Verdict: PASS, entrega local delimitada.** Os 15 critérios possuem evidência compatível com a spec. A seleção de 47 testes passou antes e depois; oito faults comportamentais válidos foram detectados. Q7 original foi uma tentativa instrumental incompleta, excluída da contagem. Não há survivor ou gap substantivo pendente nesta superfície.

Data: 2026-10-20. Verificador QA1 independente, distinto dos autores de produto/testes. Seleção informada do harness: gpt-6.1-sol / medium / fork none; sem alegação de medição de esforço interno. QA leu fontes/testes e prescreveu faults; Luna materializou variantes; Main revisou, pinou e executou. QA não executou testes, gates, Git, serviços ou variantes, nem alterou produto/testes/helpers/configs. Aplicados SKILL.md tlc-spec-driven e referências validate.md, coding-principles.md e sub-agents.md, lidos integralmente; `eclessGO/AGENTS.md` também lido.

**Spec:** `.specs/features/r24-public-information-assistant/spec.md`, com context/design/tasks da mesma feature. **Diff range informado pelo Main:** `7c4533e1506e8d52326edc42132959cf2ea6cb4f..fcab80f0058f20faec2c13874e5833a37bb4680a`. T1 `aa9cbf2520ea801d3d28a8a064c68111361d1062`, T2 `f20af46a8239d4c88fa0a490ca35312e7a1661d3`, T3 `fcab80f0058f20faec2c13874e5833a37bb4680a`. Main confirmou ausência de alteração fonte posterior. O fechamento documental posterior não é fonte futura presumida.

## Evidência e execução

Artifact root `A = /home/vncs/.codex/visualizations/2026/10/20/01a15a26-0a0f-7bb3-998f-477d09b1e28d/r24`. QA inspecionou o pack commitado `A/index-candidates`, o diff próprio materializado `A/source-final.diff`, testes próprios R24 e recibos. O diff tem quatro módulos novos, dois hunks da página, namespace publicAssistant nos dois locales e sete arquivos novos tests/r24. Não contém remoção de teste anterior nessa superfície. Não se inferiu herança lendo o WT misto.

Comandos executados pelo Main, separados: `node tests/r24/core.test.cjs`, `node tests/r24/route.test.cjs`, `node tests/r24/ui.test.cjs`, com R24_SOURCE_ROOT para controle ou variante. O runner direto reporta 26+5+16 casos internos; execução `--test` não foi aceita como prova. Runtime informado: Node v24.18.0. Mesma seleção nos controles e variantes.

| Controle/gate | Resultado observado nos recibos |
| --- | --- |
| control-before | 26/26 core, 5/5 route, 16/16 UI; exits [0,0,0] |
| control-recovery-before | 26/26, 5/5, 16/16; exits [0,0,0] |
| control-after | 26/26, 5/5, 16/16; exits [0,0,0] |
| Tipagem dirigida final | exit 0, registrada em exits-recovery.json; saída final-types.txt sem diagnósticos segundo Main |
| Guard/imports/sintaxe | Revisados e pinados pelo Main antes da execução; harness R24 lido por QA confirma allowlist e módulos sintéticos explícitos |

Recibos `A/sensor-receipts/control-{before,recovery-before,after}-{core,route,ui}.txt`; exits em `exits-first.json` e `exits-recovery.json`. QA leu contagens e os manifestos; witnesses detalhados abaixo foram lidos. Controles têm zero fails, skips, cancelled e todo. Sete arquivos tests/r24 são novos no range; delta selecionado +47, sem pretensão de contar a suíte histórica inteira. T1/T2/T3 têm seus Done when marcados e commits informados, sem tarefa de produto parcial identificada.

## AC → fonte, assertion e outcome

Paths são relativos ao web. Todos os resultados PASS abaixo se referem aos controles da seleção, combinados com inspeção estática onde explicitado. Assertions usam valores definidos pela spec, não apenas existência de chamada.

| AC | Fonte própria | Assertion exata ou conjunção de assertions | Outcome |
| --- | --- | --- | --- |
| INFO-01 | `src/app/api/public/churches/slug/[slug]/assistant/route.ts:13` | `tests/r24/route.test.cjs:109` deepEqual reads com `[[SLUG,{cache:"no-store"}]]`, diante dos headers de identidade :92; :113 events igual reader/provider | PASS: somente slug atual, sem headers encaminhados, no-store |
| INFO-02 | `src/lib/public-information-assistant.ts:90` e :314 | `tests/r24/core.test.cjs:93` deepEqual fatos literais completos; :106 keys id/text; :128 omissões exatas; :142 agenda 30; :174 keys do input iguais facts/locale/question/signal/slug; `tests/r24/route.test.cjs:118` fatos completos literais | PASS: allowlist mínima, campos extras ausentes, malformados omitidos e agenda limitada |
| INFO-03 | `src/lib/public-information-assistant.ts:204` e :336 | `tests/r24/core.test.cjs:162` deepEqual payload inteiro com textos e fontes atuais; :200 answer literal após tentativa de mutação; :224..228 oito fatos/fontes e href atual; :241..242 prosa/links extras rejeitados | PASS: 1..8 IDs únicos conhecidos, resposta ancorada exata |
| INFO-04 | `src/lib/public-information-assistant.ts:332` | `tests/r24/core.test.cjs:208` status 200; :210 deepEqual slug/status no_information/answer []/sources [], para estacionamento ausente | PASS: ausência explícita sem completar dado |
| INFO-05 | `src/lib/public-information-assistant.ts:209` e :330 | `tests/r24/core.test.cjs:241` status 502 e :242 objeto exato INVALID_PROVIDER_RESPONSE; :264..265 repetem para desconhecido/duplicado/nove IDs | PASS: inválidos rejeitados sem payload refletido |
| INFO-06 | `src/lib/public-information-assistant.ts:273`; `src/lib/public-information-assistant-provider.ts:1` | `tests/r24/core.test.cjs:273..277` 503/code/reads 0/selections 0; :457 provider null; `tests/r24/route.test.cjs:73..77` resposta padrão e nenhuma leitura | PASS: indisponibilidade honesta e nenhuma dependência chamada |
| INFO-07 | `src/lib/public-information-assistant.ts:303` e :322 | `tests/r24/core.test.cjs:294..297` 503/code e ausência do detalhe privado; :324 delay 5000, :325 aborted true, :326 status 504, :328 code ASSISTANT_TIMEOUT | PASS: falha/timeout distintos, signal abortado, detalhes omitidos |
| INFO-08 | `src/lib/public-information-assistant.ts:142`, :154, :185, :260 | `tests/r24/core.test.cjs:336..339` slugs inválidos/status400/zero deps; :347..350 keys; :357..360 JSON; :367..369 locale; :376..378 vazio; :386..387 500 emojis aceitos e enviados exatos; :397..400 501 recusados; :410 aceita4096; :417..421 413/code/zero deps em4097; :284..286 valida antes da ausência de provider | PASS: limites e ordem de validação definidos pela spec |
| INFO-09 | `src/app/api/public/churches/slug/[slug]/assistant/route.ts:15`; `src/lib/public-information-assistant.ts:275` | `tests/r24/route.test.cjs:170..177` 404/code/provider0; :194..202 503/code/sem detalhe/provider0; `tests/r24/core.test.cjs:428..430` null; :441..443 falhas; :451..453 slug divergente | PASS: 404 e falhas genéricas sem adaptador |
| INFO-10 | `src/lib/public-information-assistant.ts:230`; módulos novos sem armazenamento/logs/ações | `tests/r24/core.test.cjs:86` e `tests/r24/route.test.cjs:66` comparam cache-control a no-store nos caminhos selecionados; `tests/r24/ui.test.cjs:250..251` body exato; :466 keys sem histórico | PASS delimitado: respostas no-store e requests mínimos; inspeção estática confirma ausência de logs/persistência/ações/import protegido nos fontes próprios. Não é prova dinâmica universal de todo o app. |
| INFO-11 | `src/components/site/public-information-assistant.tsx:116` e :199; namespaces publicAssistant | `tests/r24/ui.test.cjs:201..212` label/describedby/aviso/500/disponibilidade/zero calls para pt-BR/en; :221..227 botão e contagens 500/501 | PASS: formulário acessível/localizado, aviso pessoal e indisponibilidade sem jargão; sem autofetch |
| INFO-12 | `src/components/site/public-information-assistant.tsx:125`, :239, :265 | `tests/r24/ui.test.cjs:241` calls1 após submits síncronos; :242 disabled true; :243 status localizado; :263 HTML injetado ausente; :264 texto literal presente; :267 href atual; :281 ausência explícita e :282 sem link | PASS: pendência bloqueia duplicado, texto escapado, fonte clicável e ausência explícita |
| INFO-13 | `src/components/site/public-information-assistant.tsx:56` e :166 | `tests/r24/ui.test.cjs:299..303` mensagens en distintas; :313..325 mensagens pt e retry; :349..351 inválidos sem ol/link e erro localizado; :360..361 recusa 201; :377..382 falha de rede genérica e retry | PASS: shape/slug/fontes inválidos descartados, erros distintos e tentativa posterior possível |
| INFO-14 | `src/components/site/public-information-assistant.tsx:107`, :136, :181 | `tests/r24/ui.test.cjs:394..406` abort/limpeza/descarte/nova resposta por slug; :418..433 idem locale e body novo; :444 aborted true no unmount; :456 dez pares; :460..463 primeiro ausente/último presente; :466 request sem histórico | PASS: isolamento de contexto, cancelamento e dez pares em memória |
| INFO-15 | `src/app/igrejas/[slug]/page.tsx:16` e :425; alias público; publicAssistant pt-BR/en | `tests/r24/ui.test.cjs:189` keys completas iguais às 17 esperadas em ambos locales; :190 todas strings não vazias; :555..560 AST exige import, render em ChurchDetailPage, ausência na função indisponível e alias delegando props | PASS: idiomas definidos completos e integração mínima. Preservação dos hunks herdados tem prova selecionada do Main, abaixo. |

Edge cases mapeados: agenda/descrição malformadas → core:128; tentativas de injeção e dados extra → core:93/:174/:188..201; 500/501 → core:386/:397 e ui:221/:225; dado ausente → core:210 e ui:281; resposta antiga após contexto novo → ui:400/:425. Não se afirmou qualidade semântica de provedor inexistente.

## Discrimination sensor

Prescrição completa literal anterior à execução está em `qa1-plan.md`, incluindo adendo Q7b. QA comparou os oito diffs materializados com as substituições prescritas. Main informou revisão/pins prévios de helper/variantes; nenhum fault foi acumulado. A seleção inteira executou por variante. Formato exits = core/route/UI; contagens de falhas abaixo são internas, não número de arquivos.

| Fault | Mudança de comportamento e AC violado | Witness observado (expected / actual) | Exits; fails core/route/UI | Resultado |
| --- | --- | --- | --- | --- |
| Q1 | core:105 troca descrição por pixKey; INFO-02 | `tests/r24/core.test.cjs:93` descrição pública / private-payment-marker | [1,0,0]; 2/0/0 | Killed |
| Q2 | core:340 fonte de outra comunidade; INFO-03 | `tests/r24/core.test.cjs:162` href comunidade-do-norte / outra-comunidade | [1,1,0]; 3/1/0 | Killed |
| Q3 | core:218 remove rejeição de duplicados; INFO-05 | `tests/r24/core.test.cjs:264` 502 / 200 | [1,0,0]; 1/0/0 | Killed |
| Q4 | core:194 recusa exatamente500; INFO-08 | `tests/r24/core.test.cjs:386` 200 / 400 | [1,0,0]; 1/0/0 | Killed |
| Q5 | core:306 omite abort timeout; INFO-07 | `tests/r24/core.test.cjs:325` true / false | [1,0,0]; 1/0/0 | Killed |
| Q6 | route:13 usa force-cache; INFO-01 | `tests/r24/route.test.cjs:109` no-store / force-cache nos argumentos completos | [0,1,0]; 0/3/0 | Killed |
| Q7b | componente:75 exige barra final e recusa fonte válida; INFO-12 | `tests/r24/ui.test.cjs:264` texto presente true / false; secundários :405/:433 false e :456 0 versus10 | [0,0,1]; 0/0/6 | Killed |
| Q8 | componente:111 omite abort contexto/unmount; INFO-14 | `tests/r24/ui.test.cjs:394`, :418, :444 true / false | [0,0,1]; 0/0/3 | Killed |

Resultado: **8/8 faults válidos killed, 0 survivors**. Logs `A/sensor-receipts/Qn-{core,route,ui}.txt` e Q7b equivalentes. Cada seleção tem 26/5/16 casos completos, zero skips/cancelled; witnesses lidos são ERR_ASSERTION de resultado de comportamento. Nenhum kill é falha de setup/import/sintaxe/tipo, timeout externo ou ausência de serviço.

**Q7 original excluído:** removia a guarda de href inválido, mas o host/tool interrompeu com receipt UI vazio e sessão perdida. Não é kill nem survivor. Causa do incidente não comprovada; possível custo de formatação DOM é hipótese, não conclusão. Q7b foi prescrito antes de materializar, com witness booleano e sem alterar assertions. Ele prova aceitação de citação válida; a rejeição de citações inválidas permanece comprovada nos controles pelo loop ui:328..352 e pela revisão da guarda. Não se declara que Q7b matou o mesmo defeito de aceitação indevida de Q7. AD-007 respeitada: recuperação instrumental delimitada, sem reabertura de históricos ou modificação do produto.

## Mapa reverso: todos os 47 casos

Cada referência é início do teste, não helper. Todos se vinculam a AC ou edge explícito.

- `tests/r24/core.test.cjs`: :89→INFO-02; :109→INFO-02/04; :137→INFO-02; :148→INFO-01/02; :154→INFO-02/03; :185→INFO-02/03; :204→INFO-04; :218→INFO-03; :231→INFO-03/05; :246→INFO-05; :269→INFO-06; :280→INFO-08; :289→INFO-07; :300→INFO-07; :331→INFO-08; :343→INFO-08; :353→INFO-08; :363→INFO-08; :372→INFO-08; :381→INFO-08; :390→INFO-08; :403→INFO-08; :424→INFO-09; :433→INFO-09; :447→INFO-01/09; :456→INFO-06. Chamadas assertNoStore também cobrem INFO-10.
- `tests/r24/route.test.cjs`: :69→INFO-06/10; :80→INFO-01/02/03/10; :135→INFO-08/10; :157→INFO-09/10; :180→INFO-09/10.
- `tests/r24/ui.test.cjs`: :185→INFO-15; :194→INFO-11/15; :216→INFO-11/08; :230→INFO-12/10; :257→INFO-12; :271→INFO-12/04; :285→INFO-13/15; :306→INFO-13; :328→INFO-13; :355→INFO-13; :364→INFO-13; :385→INFO-14; :409→INFO-14/15; :436→INFO-14; :447→INFO-14/10; :470→INFO-15.

## Preservação, descarte e limites da prova

`preservation.md` e `t3-evidence.md` registram comparações selecionadas do Main: três reversos derivados do WT removendo somente OWN coincidiram com snapshots anteriores; assinaturas de delta OWN WT/HEAD coincidiram; pack HEAD+OWN e WT passaram separadamente os mesmos 47 testes. Página só adiciona import/JSX na função correta, locales só namespace novo. QA leu esses registros e o diff próprio; não executou comparação/Git. Não há alegação de igualdade de bytes da árvore inteira.

No sensor, Main reportou `sha256sum -c` exit0 para 15 pins reais, 72 pins scratch originais e oito Q7b. `A/sensor-receipts/exits-recovery.json`, lido por QA, registra allPinsUnchanged e filteredNominalStatusesUnchanged true. Status nominais dos três repos foram comparados com filtros consistentes; primeira comparação com after sem filtro foi corrigida, não usada como prova de modificação. Isso preserva superfície selecionada e inventário nominal, não conteúdo de todo repo. Main informou índices filtrados vazios e HEADs preservados.

Main informou arquivo `A/sensor-proof.tar.gz` íntegro (`gzip -t` exit0), 320 entradas listadas em sensor-archive-list.txt, incluindo cópias variantes/helpers/diffs/recibos/baseline, e remoção de scratch-active com teste de ausência exit0. QA leu o pin do archive: `8ba8b26e3bd9858cedbadc38b5205df136617c12fbb803fd77b2513411eaa127`. Não abriu/importou o archive nem executou limpeza; essas verificações de preservação/cleanup são atestadas pelo Main e pelo manifesto, não reexecutadas pelo verificador. Artefatos inertes persistem para auditoria.

As mesmas provas estão copiadas no namespace persistente da feature: `evidence/sensor-proof.tar.gz`, `evidence/sensor-archive-pin.txt` e `evidence/final-types.txt`. QA leu também `sensor-evidence.md` e a seção Final sensor comparison de `preservation.md`, que consolidam os exits, pins e descarte. A biblioteca JSDOM real fornece um DOM sintético; não se confunde com navegador real. Spec/tasks ainda têm atualização documental de status pelo Main após este PASS, sem lacuna funcional inferida desse estado intermediário.

Fontes novos são pequenos e restritos à solicitação: core sem runtime imports, provider null, rota com três imports, cliente React/next-intl. Não identifiquei escopo extra ou refactor adjacente no diff próprio. Testes comparam payload e estado completos, satisfazendo conjunções de contrato; cobertura de domínio, rota happy/edge/error e estados da UI é apropriada ao escopo. L-026 foi aplicada: Main conferiu definição pt-BR/en; QA conferiu namespace de ambos, sem importar configuração runtime. Não há novo sinal fundamentado que demande lesson ou fix task; root STATE/ROADMAP/lessons permanecem do owner.

**Limites materiais:** leitor, adaptador, HTTP e next-intl são sintéticos; React/ReactDOM/JSDOM são reais. Integração de página/alias é AST, sem runtime amplo; tipagem usa stubs próprios de public-api/next-intl e não equivale a Next/fullapp build. Nenhuma UAT humana, navegador real/E2E, PG/JWT, provedor externo, acurácia semântica de IA, produção, ativação ou deploy foi executada/provada. Rota real permanece sem provedor e responde503 antes do reader. IA operacional e quotas distribuídas ficam adiadas conforme spec.

Este PASS autoriza o aceite documental **local da R24**. O gate determinístico de fechamento continua responsabilidade do Main, que deve executá-lo após este relatório; QA não o executou nem o antecipou como já concluído.
