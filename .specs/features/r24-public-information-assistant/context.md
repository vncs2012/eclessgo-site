# R24 Context

**Gathered:** 2026-10-20
**Status:** Ready for implementation

## Feature Boundary

Humano confirmou conversa no site público por comunidade, baseada em perfil, endereço, horários e atividades publicadas, com links das fontes. Em seguida definiu IA com adaptador e testes locais, provedor depois, e autorizou seguir até fechamento local. R25 e operação real permanecem fora.

## Implementation Decisions

- Adaptador recebe projeção mínima e retorna IDs de fatos. Texto final é montagem de fatos exatos, não prosa arbitrária gerada.
- Padrão sem provedor retorna indisponibilidade honesta. Nenhum adaptador sintético é ligado na rota real.
- Agenda pública existente representa horários/atividades; nenhuma agenda privada ou fonte nova presumida.
- Histórico visual em memória, perguntas independentes; sem armazenamento ou logs de conteúdo.
- Assunções de limites, erros e interface constam na spec; escolhas rotineiras cobertas pela autorização de prosseguir.

## Preservation

Owner ACKou autoria exclusivamente nos sete fontes e namespaces tests/r24 e feature R24 do web. Três fontes mistos herdados: página e dois locales. Snapshots WT/HEAD anteriores à autoria guardados no artifact root persistente da sessão; fontes limpos public-api.ts e types/public.ts possuem pins coincidentes HEAD/WT. Inventário nominal inicial dos três repos não equivale a baseline de bytes da árvore inteira.

## Deferred Ideas

Provedor, ativação, limites distribuídos e validação de qualidade semântica real exigem definição posterior. Nenhuma UAT humana/produção presumida.
