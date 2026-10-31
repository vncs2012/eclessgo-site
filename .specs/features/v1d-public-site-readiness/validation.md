# V1d public site readiness validation

**Overall**: PASS
**Date**: 2026-10-31. **Verifier**: QA1 independente T2, Sol6.1/medium, distinto dos autores e corretor. Rodada aberta 1, AD-007. Nenhum commit criado pela QA.
**Diff**: WEB `f801b24df3e750f727dacc9cdc69dab75e5fbab9..6da91fa43c73ec6dacf0fcfaf9f2f696ec4e3a49`, 9A/1M. API `07f8582d244262acf4436bb7b49d1356c1535fff`; PANEL `e90ec10d248e80b4175e256e8bf7b32390a4b4a4`.
**Evidência QA**: `.specs/evidence/v1d-public-site-readiness/qa1-bd612dda-c0c2-40a4-bf09-3782253481b4/` (ROOT), abreviada Q. Full: Q/prepared/execution-1793473851729/. Evidência autoral foi apenas insumo; contagens abaixo foram derivadas desta execução nova.

## Resultado por critério

| AC | Esperado e observado | Evidência de assertion / gate | Resultado |
|---|---|---|---|
| V1D-01 | Recusa lexical antes IO, O_NOFOLLOW em cada componente; BASE imutável e HEAD descendente com exatamente105 BASE+1 OWN. Prepare real observou committed-candidate,106 fontes e88 pacotes; SHA OWN145321e59829cc5b397671d58ed5678c7700d88ee983cf52ae7d0a5e10851e53,blob27a4fab531e1d01a01349f1ab23bb8ba582bd101,Git100644. | tests/v1d-public-site-readiness/guard.py:26 (capture),:94(source_maps),:132(tree),:145(antes callback),:149(OWN),:254(prepare),:428(preservation),:437(selftest); Q/baseline.json,prepared/snapshot-state.json,guard.stdout. | PASS |
| V1D-02 | Reserva/HOME/tmp/fixture/Chrome/contextos novos; providersOFF e env allowlisted.313 requests Chrome+3 Node externos bloqueados no Full;0 requests externos de aplicação efetivados pelos caminhos instrumentados. | tests/v1d-public-site-readiness/run.mjs:24(preload),:35(env),:95(profile),:99(route abort); Q/full-independent-counts.json e logs brutos Full. | PASS |
| V1D-03 | Home/diretório:Alfa+Beta; buscaAlfa:Alfa visível,Beta count0,HTTP200; SemResultado:texto exato “Nenhuma comunidade encontrada para os filtros informados.”;alias/igrejas HTTP200+Beta. Todos observados nas duas viewports. | tests/v1d-public-site-readiness/public.spec.mjs:28,:31,:34,:39,:42,:45,:54,:57,:60,:63,:90,:93,:96,:110,:113; IDs15–32,45–47,55–56 em assertions.jsonl. | PASS |
| V1D-04 | Links reais levam a Alfa; nome,descrição “Descrição pública sintética Alfa.”,endereço “Rua Sintética Alfa, 10, Centro, Goiânia, GO”,programação “Encontro sintético Alfa” presentes. Alias detalhe200;ausente404+título exato;upstream503→SSR200+título temporariamente indisponível,semAlfa,retryhref correto. | tests/v1d-public-site-readiness/public.spec.mjs:68,:71,:74,:77,:80,:85,:116,:119,:122,:125,:129,:132,:135,:138; IDs35–42,57–65. | PASS |
| V1D-05 | Vazio inicial:mensagens de ausência distintas do erro inicial. BuscaErroSintetico:HTTP502 e “Não foi possível aplicar os filtros agora.”; não afirma resultado vazio. Textos home/diretório pt-BR exatos nos dois estados e duas viewports. | tests/v1d-public-site-readiness/public.spec.mjs:103,:106,:143,:149,:152,:157,:160,:166,:170; IDs52,53,68,72,73,76,77,81,83. | PASS |
| V1D-06 | Desktop1440x1000 e viewport390x844;24medidas document.scrollWidth<=innerWidth true; identidades,URLs e links verificados;24PNG+6traces;0pageerrors/skips. | tests/v1d-public-site-readiness/run.mjs:97,:110;public.spec.mjs:21; Q/reverse-assertions.json e Full/artifacts/. | PASS |

## Gates, contagens e reverso

- Quick selftest exit0:17recusas lexicais,6OWN,3árvores,3recusas antes sourceIO; positivos preservados. Python/Node sintaxe e diffcheck dirigido exit0.
- ROOT e WEB: validate_spec --strict e validate_tasks --strict,4/4exit0; espelhos3/3 idênticos.
- Full real pós-commit exit0:110assertionsPASS,39statements distintos;42checks são SUBCONJUNTO das110;6/6jornadas;0skips,0pageerrors. Saudável78,vazio16,indisponível16. ID10repetido24vezes,não24testes distintos.
- Reverso completo das39definições,expressões,file:line,AC,contagens/status: Q/reverse-assertions.json. Cobertura harness V1D-01/02 corresponde a guard/selftest/prepare/preservation/network nos arquivos citados; nenhuma assertionUI sem AC.
- Build adicional otimizado: NODE_ENV=production,ECLESSGO_RELEASE_STRICT ausente,Next16.2.6 build --webpack exit0,TypeScript real habilitado,21páginas geradas; next start com fixtureHTTP saudável NOVA e Chrome novo:78/78assertions,30checksSUBCONJUNTO,2/2jornadas,0skips/pageerrors;228requestsChrome abortados,0Node externos observados.106 fontes idênticas após build. Q/optimized/{healthy-next.stdout.log,run.stderr,build.jsonl,result.json,assertions.jsonl},Q/optimized-counts.json,Q/optimized-source-parity.json.
- Dependências: closure88 do lock restaurada nominalmente por SRI,16828arquivos,sem lifecycle/metadata/downloadChrome. Complemento privado apenas @types/leaflet1.9.21 e @types/geojson7946.0.16 do mesmo lock,2GET/21565B; acumulado61requests/103856005B,90objetos públicos,468427248Bextraídos combinado. Histórico59/103834440 preservado; tentativasbloqueadas não são GETs. Q/build-input-plan.json,build-inputs-complete.json,final-acquisition-ledger.json e raws/receipts.

## Discriminação

| Sensor | Falha isolada / observado | Controles antes/depois | Resultado |
|---|---|---|---|
| address-number | remove record.number; assertion 38 detecta endereço sem10 | 39/39 PASS em cada controle separado | morto |
| filter-alfa | search undefined; assertions 32,45,46,47,52,53 detectam filtro/estados incorretos | 39/39 PASS em cada controle separado | morto |
| bff-status | upstream normalizado503; assertion 52 exige502 | 39/39 PASS em cada controle separado | morto |
| empty-message | mensagem vazia vira erro; assertion 45 exige texto vazio exato | 39/39 PASS em cada controle separado | morto |
| unavailable-title | indisponível vira título404; assertion 63 exige título informativo | 39/39 PASS em cada controle separado | morto |
| lexical-before-io | remove recusa lexical; tentativa de IO chega somente ao double seguro | antes/depois rejeitam antes IO | morto |
| candidate-closed | remove rejeições de árvore e hashOWN; callback/OWN inválido admitidos | antes/depois recusam ambos | morto |

**Resultado final: 7/7 focos discriminados, 0 sobreviventes e 14 controles intactos.** As cinco falhas UI executaram39 assertions cada,com nenhuma interrupção/skip; suas failures esperadas não são falhas do candidato.

Cinco sensores UI executam publicJourney intacto em Next real sobre clone nominal validado ANTES da mutação; adapter privado só remove reclonagem/integritycheck após o clone para permitir a falha isolada,seleciona saudável/desktop e mantém assertions. Cada before/fault/after possui snapshot,logs,trace,screenshots e fonte original separados. Q/sensor-run.mjs,Q/sensor-prospective-pins.json,Q/mutations.json,Q/sensors-summary.json. Controles/sensores não são somados à cobertura funcional110.

Dois focos guard usam doubles/callbacks seguros e código de guard isolado:sem pathsprotegidos materializados e sem rede externa. V2do mesmo foco fechado inclui árvoreOWN divergente e admissãoOWNhash inválida; V1instrumental preservada e não contada como sensoradicional. Q/guard-sensors-v2-summary.json. Todo helper privado possui pin prospectivo preservado antes de execução.

Contabilidade completa: 7 focos planejados. Etapa final: 5 UI + 2 guard V2, com 7 execuções fault e 14 controles (21 estados). Há ainda 2 faults e 4 controles preliminares guard V1 preservados. Total REAL: 9 execuções fault, 18 controles, 27 estados; nenhuma repetição foi contada como foco novo. Guard V1: 5 probes lexicais + 1 de árvore por estado; V2: 5 lexicais + 2 de árvore/OWN por estado, total 39 probes semânticos nas duas versões e três estados. As 5 variantes UI mudam uma expressão cada; a variante guard lexical muda uma condição e a candidata final muda duas condições do mesmo foco. V1 e V2 do candidato não são mutações UI nem setup.

## Preservação, qualidade e limites

Comparação nominal final independente PASS:106 fontes reais (incluindo13 deltas herdados),HEAD/index/HEADfile de WEB/API/PANEL,bytes/modos/tamanhos inalterados. Normalizador físico0664 preservado;9 arquivos novos0600,Git100644. Dez caminhosOWN físicos batem com HEAD;13 deltas nãoOWN ficaram fora do candidato. Quinze snapshots têm0deltas nos controles e exatamente1fonte mutada nos faults. Todos58raws anteriores revalidadosSRI/receipts/allowlist;34objetos cache usados idênticos ao baseline (incluem os30originais). FonteFull106 e fonteoptimized106 preservadas. Q/final-preservation.json,Q/candidate10-independent.json,Q/full-source-parity.json. Reserva0700 e gravaçõesinstrumentais sob umask077; os históricosde modos anteriores permanecem sem garantia retroativa.

Fonte pública real congelada,sem HTMLfake/mocksDOM. Vazio≠erro e404≠upstream503 comprovados;alias compartilhado exercitado. Tiles/CDN abortados limitam prova cartográfica. Viewportmóvel não é emulador/device nativo. Não certifica fullapp autenticado,API/DB reais,iOS,UAT humano,releaseconfigestrito,assinatura,cloud/EAS,deploy ou V1global. O perfil estrito de release requer configurações reais ausentes;nenhuma validação strict foi desabilitada nem next.config.ts/tsconfig alterados. DemoIAB40989 permaneceu separada,intocada e não conta como QA/UAT.

Revisão de qualidade: diffmínimo aprovado,normalizador simples preserva padrões,sem abstrações ou escopo extra;cada teste mapeado a AC/edge. T1implementado;este relatório avalia T2,sem fechar T3/tarefas/spec/STATE/ROADMAP. V1cpermaneceVerifiedLOCALAndroid somente.

Setuphistórico desta QA:tentativa PATH sem node e bindEPERM falharam antes de assertions;retidos sem contá-los como sensores. Correção nominal de nome PANEL ocorreu antes do baseline completo/gates. Q/setup-history.json. O campo independentQA:false em result.json é metadata fixa do runner autoral;autoria independente desta QA é a do verificador identificado acima,sem editar recibos.

Cronologia herdada preservada:REDinicial do endereço precedeu confirmação humana do endereço completo;esta QA usa decisão atual. Correções anteriores do harness (emptytitle<p>,BFF502,linkmóvelvisível) não são reclassificadas como defeitos históricos confirmados. As limitações antigas de modos/bytecode e QA V1c não recebem garantia retroativa. Nenhuma limpeza de scratch/evidência,commit,stage,index/ref,push,envio ou operação real foi executada pela QA.

**Pendências**: T3 documental pelo ROOT e escopos operacionais acima. Nenhuma lacuna de produto/teste no recorte local avaliado. T3 permanece sob coordenação do ROOT.
