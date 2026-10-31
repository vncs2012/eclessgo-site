# V1d contexto
Autorizado pelo humano executar pendências V1 sequencialmente, commits e QA independente, serviços reais OFF e acompanhamento no navegador. ROOT coordena commit e QA nova após último commit de fonte; executor T1 não cria QA nem toca índice/ref antes de janela ROOT.

Baseline WEB f801b24df3e750f727dacc9cdc69dab75e5fbab9; API07f8582d244262acf4436bb7b49d1356c1535fff; PANEL e90ec10d248e80b4175e256e8bf7b32390a4b4a4. V1c Verified LOCAL Android não certifica site/iOS/V1 global.

O harness executa fontes reais congeladas, sem dotenv, keystore ou node_modules antigo. Blobs públicos são candidatos somente após SHA512 do lock. Não há autorização de requests de negócio externos. Namespace novo, logs0600, diretórios0700 e versões/falhas preservadas. Os aliases existentes compartilham implementação; não se cria rota. Contratos: mensagens pt-BR e e2e/church-finder-states; detalhe404 via notFound,503 em página informativa SSR200, confirmado pelo ROOT antes dos testes.

Reserva: nove arquivos versionados WEB (seis harness, três docs) e três espelhos canônicos ROOT nongit. Nenhum documento de fechamento ou QA antecipado.

## Decisão humana de endereço, 2026-10-31
O RED original do endereço partiu da suposição inicial do executor de que o endereço completo deveria ser montado com as partes disponíveis. Depois do RED, o humano confirmou: “Mostrar o endereço completo (recomendado)”, com rua, número, bairro, cidade e estado disponíveis. A expectativa V1D-04 “Rua Sintética Alfa, 10, Centro, Goiânia, GO” permanece intacta; o RED original38 descreve o HEAD sob a expectativa então não confirmada, não um defeito de produto já confirmado.

O hunk `normalizeAddress` aprovado para OWN foi reconstruído contra o HEAD e comparado ao preimage WT preservado. O HEAD tinha blob `001090c4ed2c540ff8ebfe5616bc2e7f5a2fb3f9`, SHA-256 `f7d4d4818adc79087a3407ba3312c94d91f1618b91a13e98029cfcbbd6c9f131` e modo Git `100644`; a correção fechada usa blob `27a4fab531e1d01a01349f1ab23bb8ba582bd101`, SHA-256 `145321e59829cc5b397671d58ed5678c7700d88ee983cf52ae7d0a5e10851e53` e modo `100644`. A classificação OWN decorre desta aprovação, sem atribuir autoria histórica aos bytes WT existentes. Os outros 13 deltas WT permanecem somente leitura e fora do snapshot.


## Reprodutibilidade do snapshot após T1
BASE é o commit imutável `f801b24df3e750f727dacc9cdc69dab75e5fbab9`; HEAD corrente é consultado a cada preparação e não é presumido igual ao BASE. O candidato fechado contém 105 blobs/modos BASE e somente o `OWN:normalizeAddress` fixado acima. Antes do commit, o harness admite HEAD==BASE e o overlay OWN exato. Após o commit, admite somente descendente de BASE cuja árvore nominal de fontes coincide integralmente com os mesmos 106 pins; não há hash de commit futuro e qualquer fonte divergente ou OWN adicional é rejeitado antes da leitura dos arquivos-fonte. Os 13 deltas de working tree herdados seguem preservados e fora do candidato.

## Integração T1 e limites
A integração T1 incorpora dez caminhos WEB: nove novos arquivos do harness/docs e somente o normalizador OWN aprovado. O arquivo físico normalizador já continha os bytes corretos; não foi reescrito, não se atribui autoria histórica e seu modo físico real é preservado. Outros13deltas WT não são OWN e não entram no candidato. Três documentos ROOT são espelhos nongit, não parte do commit WEB.

C1 Full verde foi mantido por paridade106fontes/16828dependências e run/spec/fixture idênticos;42checks são subconjunto das110assertions, não testes adicionais. A correção posterior de prepare mudou guard/metadata/docs, sem mudar o candidato funcional. Preparação pós-commit REAL e build otimizado local são pendências da T2, sem publicação ou credenciais reais.

A falha de X11 do headed permanece histórica; o painel IAB visível usa contexto separado. Demo corrigida http://127.0.0.1:40989, anterior35351 mantida até troca pelo ROOT. Nenhum aceite humano/UAT é inferido pela abertura da página.

Ressalvas instrumentais preservadas: arquivos OWN criados inicialmente0644 sob0700 e normalizados0600 na execução original; bytecode __pycache__ instrumental criado sob diretório0775 e corrigido0700 tardiamente na C1. O bytecode está preservado e fora de manifesto/stage. Não há garantia retroativa universal de modos.

## Fechamento T3, 2026-10-31
V1d está Verified LOCAL nos seis ACs. T1 fonte `6da91fa43c73ec6dacf0fcfaf9f2f696ec4e3a49` e T2 documental `ea56b7441b8e670e753230e6fb838ad7eef5887b` estão commitados. QA1 independente PASS na fonte T1, relatório validation.md SHA-256 `ed2e6b815c987aeb7e8d96b174fab4d34bb577748a9eead86e54a05f1c3d86e2`. As frases pendentes nas seções históricas T1 são checkpoints anteriores, superados por este registro, sem mudança retroativa das expectativas.

Full110avaliações/39sites,42checksSUBCONJUNTO/6jornadas; optimizedLOCAL78avaliações/30checksSUBCONJUNTO/2jornadas,TypeScript habilitado/21páginas,perfilstrictreleaseausente. Sete focos, noveexecuçõesfault e18controlesincluindopreliminares,zero sobreviventes/skips/pageerrors. PreparepóscommitREAL passou;106fontes=105BASE+1OWN,13deltasWTfora.

BackendfixtureHTTP,viewportmóvel não nativo,demoIAB40989 separada e nãoUAT. HistóricosRED/setup/pré-IO/modos/bytecode preservados,sem garantia retroativa. iOS,nativo em execução,UAT,operacional,R32 e publicaçãoV1 continuam pendentes;R24b/R26a VerifiedLOCAL/providersOFF,V1cunsignedAndroidfechada,R30/R34futuros,R22breservado. Próxima tarefaAndroid será delimitada pelo ROOT e não é iniciada aqui.
