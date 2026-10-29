# R19g T3 — WEB

Concluída; QA independente T5 pendente. `src/lib/generated-api.ts` coincide integralmente com o contrato canônico, sem alteração de runtime ou consumidor.

Bases: API `4d4aefeeda2c9cbdf93c29c8b14e0c8e04eee05b`, PANEL `2bde1ce3bc36b9dc85ef8954f8e68868a02a3bc8` e parent WEB `0bf035bbec01635c30bc0888fad190bbc1ff2218`. O contrato tem SHA-256 `079b63e81940b2ed253c1e6033414926d6e6a236d8c61c5875c1c98b0aabc980` e 54.368 bytes. Ele foi gerado do OpenAPI versionado SHA-256 `2f46fa5099ae2a9afc22e3610f150895670efc10e2148bec629a9b188fd4c01b`; os vínculos e os resultados das duas gerações anteriores foram conferidos.

Gate dirigido: TypeScript WEB 5.9.3 e Node 24.18.0, exit 0, stdout/stderr vazios. A fixture sem casts confirma os dois estados públicos de recuperação, nove rejeições esperadas e igualdade com as 44 ações R19f T11, divididas em 33 ORGANIZATION e 11 FINANCE sem sobreposição. O consumidor público real e suas dependências nominais foram compilados em cópia isolada. Os arquivos físicos PANEL e WEB coincidem com o canônico; MOBILE ainda aguarda T4.

A pré-imagem WEB e os arquivos herdados foram preservados. Não houve teste de runtime, build global, execução de aplicação ou checker integral da árvore física; a alteração contém apenas tipos e o checker dos três clientes depende de T4. Evidência: `ROOT/.specs/evidence/r19g-contract-regression-stabilization/t3-web-20261029/`.
