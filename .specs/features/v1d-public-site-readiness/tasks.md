# V1d tasks

## Test Coverage Matrix
| Criteria | Layer | Tests |
|---|---|---|
| V1D-01/02 | harness | guard, pins, isolamento, requests externos |
| V1D-03/04 | navegador real | home, aliases, busca Alfa/sem resultado, detalhe,404,503 |
| V1D-05/06 | navegador real | vazio/erro, duas viewports, overflow, screenshots/traces |

## Gate Check Commands
Quick: `python3 tests/v1d-public-site-readiness/guard.py selftest`.
Full: `node tests/v1d-public-site-readiness/run.mjs ROOT_PRIVATE_RESERVA` após prepare nominal.
Build: Full + sintaxe Python/Node + validate_spec/validate_tasks strict + preservação nominal + diffcheck dirigido. Build de produção/fullsuite não são este gate; Next dev real é o alvo local.
T2: QA independente no commit final, outcome check e sensores comportamentais com controles antes/depois; setup não é kill.
T3: validate_state ROOT/WEB exit0 e revisão documental.

## Execution Plan
```text
T1 -> T2 -> T3
```

## Task Breakdown
### T1: harness e fonte congelada
Depends on: none
Where: namespace novo v1d-public-site-readiness
Tests: navegador real derivado de seisAC, guard/preservação e artefatos.
Gate: Build acima; único commit atômico após janela ROOT.
Status: commitado em 6da91fa43c73ec6dacf0fcfaf9f2f696ec4e3a49; fonte congelada, QA1 independente PASS e seis ACs Verified LOCAL.
Done when: seisAC provados no recorte local, matriz/reverso e fontes congeladas revisáveis.

### T2: QA independente
Depends on: T1
Where: relatório independente coordenado pelo ROOT
Tests: outcome check e discriminação em scratch novo após último commit de fonte.
Gate: QA PASS com file:line, sensores válidos e preservação.
Status: concluída, QA1 independente PASS na fonte 6da91fa43c73ec6dacf0fcfaf9f2f696ec4e3a49; relatório validation.md SHA-256 ed2e6b815c987aeb7e8d96b174fab4d34bb577748a9eead86e54a05f1c3d86e2.

### T3: fechamento documental
Depends on: T2
Where: documentos finais coordenados pelo ROOT
Tests: validação estrutural e consistência do fechamento.
Gate: validate_state0 somente após QA PASS.
Status: concluído localmente em 2026-10-31; fechamento documental com gates estruturais/validate_state e commit separado sob janela ROOT.

## T1 receipts
C1 Full:110/110assertions,42/42checksSUBCONJUNTO,6/6jornadas,0skips/pageerrors;24screenshots/6traces;293requestsChrome+3Node externos bloqueados. Matriz/reverso e paridade estão na reserva ROOT .specs/evidence/v1d-public-site-readiness/t1-integration-bfb1a512-935b-4779-aeb7-ac6573a30198/.

A demo corrigida usa fixtureHTTP nova e contexto IAB separado do runner headless, sem aceite UAT. O gate autoral é Next dev real; build otimizado local e prepare pós-commit REAL ficam registrados como verificações adicionais da T2 independente já autorizada. Nenhum novo escopo de produto, deploy ou releaseconfig real é introduzido.

Históricos RED/setup e preimages preservados. Guard/reproducibilidade pós-commit foi verificado por doubles e recusas pré-IO, que não são sensores comportamentais. T2 ainda precisa executar o prepare real após o commit, outcome check e discriminação independente.

## Fechamento T3, 2026-10-31
V1d está Verified LOCAL nos seis ACs. T1 fonte `6da91fa43c73ec6dacf0fcfaf9f2f696ec4e3a49` e T2 documental `ea56b7441b8e670e753230e6fb838ad7eef5887b` estão commitados. QA1 independente PASS na fonte T1, relatório validation.md SHA-256 `ed2e6b815c987aeb7e8d96b174fab4d34bb577748a9eead86e54a05f1c3d86e2`. As frases pendentes nas seções históricas T1 são checkpoints anteriores, superados por este registro, sem mudança retroativa das expectativas.

Full110avaliações/39sites,42checksSUBCONJUNTO/6jornadas; optimizedLOCAL78avaliações/30checksSUBCONJUNTO/2jornadas,TypeScript habilitado/21páginas,perfilstrictreleaseausente. Sete focos, noveexecuçõesfault e18controlesincluindopreliminares,zero sobreviventes/skips/pageerrors. PreparepóscommitREAL passou;106fontes=105BASE+1OWN,13deltasWTfora.

BackendfixtureHTTP,viewportmóvel não nativo,demoIAB40989 separada e nãoUAT. HistóricosRED/setup/pré-IO/modos/bytecode preservados,sem garantia retroativa. iOS,nativo em execução,UAT,operacional,R32 e publicaçãoV1 continuam pendentes;R24b/R26a VerifiedLOCAL/providersOFF,V1cunsignedAndroidfechada,R30/R34futuros,R22breservado. Próxima tarefaAndroid será delimitada pelo ROOT e não é iniciada aqui.
