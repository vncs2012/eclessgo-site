# R03b T4 — contrato gerado WEB

**Status**: T4 concluída (implementada); QA independente da feature pendente.
**Requisito**: R03B-16, parcela WEB.
**Dependência**: T3 PANEL commitada em `cf857c701a0977fb4b407c8d7674a5a49681c658`.

## Critério

`ForgotPasswordResponse.delivery` expõe exatamente `"not_configured" | "unconfirmed"`, igual à projeção canônica T2. Todos os demais bytes do arquivo gerado preservam a baseline WEB; a divergência global preexistente de contratos não é certificada.

## Gate

Comparação de projeção e bytes externos ao campo; TypeScript estrito em cópia nominal, usando o export real com valores positivos e negativos; check de documento e da mensagem `chore(api): align web recovery delivery contract`; diff-check e prova de aplicação/reversão do patch. Sem execução de runtime, geração global, Next typegen ou build.
