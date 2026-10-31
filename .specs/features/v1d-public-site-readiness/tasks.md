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
Status: concluído localmente; fonte congelada e gate autoral PASS, aguardando commit sob janela ROOT e T2 independente.
Done when: seisAC provados no recorte local, matriz/reverso e fontes congeladas revisáveis.

### T2: QA independente
Depends on: T1
Where: relatório independente coordenado pelo ROOT
Tests: outcome check e discriminação em scratch novo após último commit de fonte.
Gate: QA PASS com file:line, sensores válidos e preservação.
Status: pendente.

### T3: fechamento documental
Depends on: T2
Where: documentos finais coordenados pelo ROOT
Tests: validação estrutural e consistência do fechamento.
Gate: validate_state0 somente após QA PASS.
Status: pendente.

## T1 receipts
C1 Full:110/110assertions,42/42checksSUBCONJUNTO,6/6jornadas,0skips/pageerrors;24screenshots/6traces;293requestsChrome+3Node externos bloqueados. Matriz/reverso e paridade estão na reserva ROOT .specs/evidence/v1d-public-site-readiness/t1-integration-bfb1a512-935b-4779-aeb7-ac6573a30198/.

A demo corrigida usa fixtureHTTP nova e contexto IAB separado do runner headless, sem aceite UAT. O gate autoral é Next dev real; build otimizado local e prepare pós-commit REAL ficam registrados como verificações adicionais da T2 independente já autorizada. Nenhum novo escopo de produto, deploy ou releaseconfig real é introduzido.

Históricos RED/setup e preimages preservados. Guard/reproducibilidade pós-commit foi verificado por doubles e recusas pré-IO, que não são sensores comportamentais. T2 ainda precisa executar o prepare real após o commit, outcome check e discriminação independente.
