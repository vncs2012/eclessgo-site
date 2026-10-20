# R24 Sensor Evidence

Fonte final: fcab80f0058f20faec2c13874e5833a37bb4680a. QA independente prescreveu faults após esse commit; executor único materializou cópias e Main revisou/pinou/executou. Mesmos três arquivos de teste em todos controles e variantes: node tests/r24/core.test.cjs, node tests/r24/route.test.cjs, node tests/r24/ui.test.cjs, com R24_SOURCE_ROOT apontando exclusivamente à cópia nominal. Exits separados e recibos filtrados no arquivo inerte evidence/sensor-proof.tar.gz. Nenhuma assertion alterada.

| Cópia | Core/route/UI exits | Witness comportamental |
| --- | --- | --- |
| control-before | 0/0/0 | 26+5+16 PASS, zero skips |
| Q1 | 1/0/0 | core:93 projeção pública versus campo privado sintético |
| Q2 | 1/1/0 | core:162 fonte de outra comunidade |
| Q3 | 1/0/0 | core:264 200 versus 502 para IDs duplicados |
| Q4 | 1/0/0 | core:386 400 versus 200 em 500 code points |
| Q5 | 1/0/0 | core:325 signal não abortado |
| Q6 | 0/1/0 | route:109 force-cache versus no-store |
| Q7 | 0/0/incompleto | Excluída, sem resultado UI utilizável |
| Q8 | 0/0/1 | ui:394/418/444 signal não abortado |
| control-recovery-before | 0/0/0 | 26+5+16 PASS, zero skips |
| Q7b | 0/0/1 | ui:264 false versus true para resposta válida; UI 10 PASS/6 FAIL |
| control-after | 0/0/0 | 26+5+16 PASS, zero skips |

Oito faults válidos detectados; nenhum import/setup/type failure contado. Q7b altera uma única literal de href para rejeitar fonte canônica válida; não reutiliza a cópia Q7. Interrupção de Q7 motivou controle de recuperação adicional, sem nova baseline retroativa. Helper Q7b revisado integralmente, pinado e sintaxe exit 0 antes de execução. Tipagem dirigida final exit 0.

Preservação: 15 pins reais, 72 pins originais de scratch e oito Q7b inalterados. Status nominais filtrados dos três repos iguais ao pré-sensor. Arquivo gzip verificado, 320 entradas, SHA em evidence/sensor-archive-pin.txt. Cópias ativas removidas após arquivamento. Limites: DOM/HTTP/adaptador sintéticos; sem UAT humano, browser real, fullapp, PG/JWT, provedor ou produção. PASS local não afirma qualidade de provedor ainda não escolhido.
