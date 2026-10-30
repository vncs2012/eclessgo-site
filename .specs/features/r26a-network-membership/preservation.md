# R26a — preservação T0 selecionada

A captura é parcial e anterior à autoria documental; não é inventário nem cópia integral das árvores. Não há alteração de fonte de produto, teste, configuração, migration, índice, ref ou commit nesta etapa.

## Baseline observada

Evidência privada: `.specs/evidence/r26a-network-membership/contract-ca7e3743-2798-4219-9a55-f0789f034592/privado/`. `baseline.json`, `selected-preimages.json`, `additional-preimages.json`, `target-baseline.json` e diretórios `preimages/` e `targets/` contêm hashes, metadados e cópias selecionadas. Arquivos privados foram criados com modo 600 e diretórios privados com 700.

| Repositório | HEAD observado | SHA-256 do índice bruto nesta baseline |
|---|---|---|
| API | `d18935439f08e033b1cd8c6c926d029926fdf162` | `fa8de1b91c6bd3ba953f3d4538d12ea2457eed88bb2b39171884889d8ced7c96` |
| PANEL | `b4736fc058323af6dba367ea4e9fb83d4b8bbd6d` | `8e5538bec77e44b517b148739fb1c5aa38d0240d440f66d335c1c9991dba943f` |
| WEB | `77b9d5c20a1ea4b0452a3cf82977338add957d7f` | `0a200a85f6c236c16fc9db16f09bc68ea417b3ff132aaa716fbe90f65cfb75e5` |

Os três hashes coincidiram com os recibos pós-commit documental R24b; portanto, naquele instante também eram semanticamente iguais. Não se presume que statcache permanecerá byteigual mais tarde. `preauthor-check.json` verificou HEADs e índices sem mudança antes da primeira autoria, além de STATE, ROADMAP, lessons e os dois arquivos históricos R26 inalterados.

As dez fontes nominais da descoberta, regras de negócio, pontos de autorização/navegação e as dez superfícies herdadas foram capturadas seletivamente. As dez herdadas são cinco API (`pyproject.toml`, `poetry.lock`, dois DTOs e `church_router.py`), dois locales PANEL e três arquivos WEB; todos têm WT diferente do HEAD e são somente leitura. `ChurchSwitcher.tsx` também é misto e segue somente leitura. Algumas fontes de teste do painel existem no WT sem entrada HEAD; foram preservadas como WT e não são fontes R26a. Os locais originais e os hashes constam dos manifestos privados.

O manifesto privado `manifest-t0.md` contém 49 caminhos futuros nominados, inclusive cinco possíveis espelhos por repositório e o carrier MOBILE. Desses, dez existiam no WT no instante da captura; nenhuma das superfícies Git futuras existentes era mista HEAD/WT. MOBILE não tem Git e sua pré-imagem WT foi copiada. Cada T1/T2/T3 e cada espelho ainda depende de reserva nominal própria; nenhum caminho de produto foi liberado por esta captura. Os dois locales herdados não serão editados.

## Observações e incidentes

- A tentativa inicial de capturar `src/features/auth/hooks.ts` usou cwd incorreto e falhou antes de gravar. Uma busca leu trechos antes da captura posterior; a pré-imagem HEAD/WT foi preservada antes da autoria, mas não se afirma captura anterior à leitura.
- Uma captura de amostras de testes parou ao encontrar um teste sem HEAD; os arquivos já copiados foram mantidos e a captura continuou sob nome novo. As amostras de teste foram lidas antes de suas próprias cópias, sem execução.
- Uma amostra textual de teste antigo imprimiu uma assertion com cabeçalho sintético. Não houve request nem credencial real observada. O fato e os intervalos consultados estão em `incident-synthetic-header.json`; a conformidade anterior não é alegada. Depois disso, inspeções textuais selecionadas passaram por redator privado fail-closed, fixado antes de executar, com outputs separados.
- Rascunhos substituídos por orientação ROOT foram copiados em `revisions-v1/` antes de alteração. O ROOT rejeitou exigir UUID na interface; as referências propostas são e-mail exato e link/endereço curto.

As observações Git foram nominais: `status` e `diff` receberam as quatro exclusões literais antes dos caminhos positivos, e `diff` também recebeu `--no-ext-diff --no-textconv`. Não houve status amplo, refresh, stage, stash, reset, restore ou clean. Os quatro sufixos proibidos não foram lidos, importados, hasheados, submetidos a stat ou resolvidos nesta etapa.

As lessons confirmed foram consultadas usando cópia privada do store e script também copiado e fixado; original `.specs/lessons.json` não foi alterado. L-026/L-036 são orientações de desenho de testes, não prova comportamental. Nenhum teste, helper ou fixture histórico foi executado como prova R26a. Nenhum serviço, banco, ambiente antigo, app ou provider foi iniciado; não houve rede, produção, push, deploy ou commit.

## Gates documentais T0

`validate_spec.py --strict`: exit 0, zero erros e zero avisos. `validate_tasks.py --strict`: exit 0, zero erros e zero avisos. Inputs, pins, logs e resultados estão em `gates-v1/`. Estes validadores conferem estrutura documental; não demonstram comportamento de produto. `validate_state` e QA de feature não foram executados.

## Ajuste após revisão ROOT

O mount é `settings.api_prefix`, com default estático `/api/v1`; os caminhos do router são relativos a ele. O site apresenta `/comunidades/{slug}` como canônico e mantém `/igrejas/{slug}`. `config/settings.py` e a página canônica foram preservados em HEAD/WT antes desta inspeção adicional; eles não integravam a captura anterior à primeira autoria. As inspeções textuais passaram por helpers privados fixados e redatores sem expor conteúdo sensível. Os caminhos `[locale]` correspondentes não existiam na verificação nominal; não se afirma busca global de aliases.

A entrada `church_ref` foi delimitada para slug ou URL http/https sem userinfo; query/fragmento são descartados e somente o slug canônico é persistido. A opção por runner privado e receita reproduzível, sem helpers adicionais de produto, está no manifesto. As versões T0 anteriores foram preservadas em `revisions-v3/`.

Após a alteração dos dois artefatos cobertos pelos validadores, `validate_spec.py --strict` e `validate_tasks.py --strict` passaram novamente com exit 0, zero erros e zero avisos. Os pins e logs atuais estão em `gates-v2/`; `gates-v1/` permanece como histórico. Não houve QA de feature ou `validate_state`.

## T1 — preparação local e incidente de reserva

A baseline T1 separada preserva os três HEADs, índices brutos e 64 fontes selecionadas. Nove caminhos de fonte/testes e cinco espelhos API estavam ausentes na verificação inicial. Os três índices coincidiam em bytes e semântica com T0. A evidência privada T1 contém pins, preimagens, logs exclusivos, 31 testes distintos verdes, mapa de adequação e corpos/mutações isoladas; não representa QA independente nem preservação integral da árvore.

Quatro nomes temporários de produto usados durante correções não estavam na reserva nominal. Foram criados com `O_CREAT|O_EXCL`, removidos por substituição e conferidos ausentes nominalmente; pré/pós-imagens e incidente estão preservados. Não se alega conformidade retroativa nem inventário global. Execuções SQLite bloqueadas pelo sandbox, RED de draft e as falhas instrumentais ficam preservados e fora dos gates aceitos. Os três containers PostgreSQL novos foram parados e permanecem sem remoção, com dados e logs.

Nenhum índice ou ref foi alterado; nenhum commit ou QA de feature foi realizado. T1 aguarda janela ROOT, e `validate_state` só será executado após QA independente final da feature.


## R26a T2 — baseline e resultados locais

A baseline T2 é independente da T0/T1: três HEADs e índices brutos foram observados e preservados, 64 fontes selecionadas conferidas, três pré-imagens WT/HEAD e cinco ausências nominais registradas antes da autoria. A cópia é parcial, não uma preservação integral da árvore. Os cinco documentos ROOT/API tiveram pré-imagens imediatas antes deste registro. Os oito caminhos de produto são os autorizados para T2; sem stage, ref, commit ou alteração PANEL/WEB/MOBILE nesta etapa.

O grafo combina os 45 OIDs HEAD históricos iguais e os quatro campos do cabeçalho WT R24b lidos sem corpo; não foi afirmada igualdade integral WT/HEAD. ROOT aceitou `r24b_global_ai_provider` como parent da revisão OWN. Evidência, versões anteriores, falhas de instrumento e gates ficam no diretório privado T2 registrado em `tasks.md`. Foram mantidas as quatro proibições de caminhos e os limites de serviços, dados, rede e QA do contrato.


## R26a T3 — baseline nominal e exceções

A captura T3 registrou HEADs API `0fd9a503db99087f0fad6123b2f2c44263930cd6`, PANEL `b4736fc058323af6dba367ea4e9fb83d4b8bbd6d` e WEB `77b9d5c20a1ea4b0452a3cf82977338add957d7f`, e três índices brutos iguais à observação pós-T2. São 55 registros selecionados, não preservação integral. Os três gerados estão iguais, 55.719 bytes e SHA-256 `98cf930dd996d8344f941b47b4206b6f7025281ba013945b30c0891e1d7d4ae0`.

Os dez herdados permanecem readonly; `useLoginPageState.ts`, `Sidebar.tsx` e `ChurchSwitcher.tsx` também estão mistos e readonly. `src/api/client.ts` e `src/pages/Login.tsx` estão limpos e são candidatos adicionais. Os cinco espelhos PANEL estavam ausentes antes de serem criados nesta reserva documental. API e WEB documentais não foram alterados.

A primeira visualização deixou passar um campo público de metadado do cliente, sem credencial ou request; o redator foi reforçado e a ocorrência preservada. Um arquivo privado de metadados de claims foi criado com modo 0664 por engano e corrigido para 0600 ao ser observado; contém somente nomes e contagens, sem alegação retroativa de conformidade. Saídas e versões anteriores permanecem no diretório privado T3.


## R26a T3 — implementação local para revisão

Os HEADs e a semântica dos três índices seguem iguais à baseline T3; nesta observação os bytes brutos dos três índices também coincidiram. Foram conferidas 36 fontes/documentos readonly selecionados, incluindo os dez herdados e os três caminhos mistos useLoginPageState.ts, Sidebar.tsx e ChurchSwitcher.tsx. Não é alegação de preservação da árvore inteira.

Os três gerados compartilham SHA-256 abda26a67520f47efce1f3bb873ec9117e77f66d72646239f6f951ba984d77f8 e preservam integralmente o prefixo anterior. Quatro colisões de nomes foram comparadas e remapeadas apenas no acréscimo; o carrier aplica e reverte com fuzz zero. Pré/pós-imagens, falhas de fixture, gates e índices selecionados estão em .specs/evidence/r26a-network-membership/t3-b16b919b-a63c-4f71-9acb-946201141845/. Nenhum índice foi staged e nenhuma janela de commit foi aberta.
