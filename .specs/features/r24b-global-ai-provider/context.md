# R24b Context

**Data:** 2026-10-29. Decisões humanas já fechadas; nomes de interfaces e no-op são escolhas técnicas locais.

## Feature Boundary

R24 e R26 integram o primeiro lançamento. A ordem é R24 local, R26, builds/QA MOBILE e site. Este contrato cobre somente R24b; R26 fica fora. Android e iOS saem na mesma versão; EAS fica somente em avaliação documental antes de conta, cloud, upload ou gasto.

## Decisions

SUPER_ADMIN escolhe manualmente um único fornecedor global entre OpenAI e Anthropic. Não há fallback. Seleção persistida não ativa a integração: uma chave operacional separada de servidor começa OFF. Segredos ficam apenas no servidor; modelo e limites monetários não têm defaults. Não configurar credenciais reais nem ativar, chamar, gastar, enviar ou implantar nesta entrega.

A autoridade para INFO-01..15 é a spec histórica WEB `.specs/features/r24-public-information-assistant/spec.md`; seus outros documentos ficam intactos. Projeção e resposta usam fatos/links locais; o modelo retorna apenas IDs. A conversa é manual, independente, limitada e em memória.

Os estados são distintos: nenhuma seleção, seleção persistida, chave OFF, configuração incompleta e resolver indisponível. A tela não mostra nome de modelo, segredo ou qualquer configuração sensível. O retrato de disponibilidade não constitui garantia contínua; cada pergunta reavalia.

## Deferred

Modelo, limite financeiro, política operacional/distribuída, processamento real por provedores, UAT e deploy requerem recortes próprios. R30/R34 são futuros; R16a sem expansão; R22b reservado; D01 mantém 30 dias inclusivos com worker OFF.

## T2 boundary decisions

A leitura pública retorna somente o enum global, sem autenticação ou configuração sensível. O painel usará GET/PUT administrativos autenticados, sem contexto de comunidade; a checagem viva de SUPER_ADMIN continua no boundary transacional T1. A revisão de schema é própria e tem como parent `r28b_participation_review`.

A prova T2 usa auth/factory sintéticos e SQLite novo. A QA independente após a última fonte deve verificar somente a revisão OWN em PostgreSQL novo, com upgrade/downgrade, tipos/FK/CHECK/UNIQUE e sentinelas, sem executar ancestrais. A fábrica abre UoW separado da sessão de autenticação; contenção do pool não foi medida.

## T3 boundary decisions

A página global só é acessível a SUPER_ADMIN, com ou sem comunidade. A exceção de navegação para MEMBER vale exclusivamente para o novo item global e depende do papel global permitido; os itens anteriores mantêm sua matriz. A escolha persistida não ativa o assistente e não expõe chave, modelo ou custo.

Uma gravação em conflito preserva a escolha em edição e exige recarga explícita antes de outra gravação. As respostas atrasadas de uma sessão anterior são descartadas. A geração incremental cobre apenas as operações R24b da API commitada; não representa a OpenAPI integral.

## T4 boundary decisions

A ativação permanece separada, ausente e OFF por padrão. Modelo e máximo de saída são obrigatórios somente para o fornecedor selecionado e não têm valores padrão; essa configuração não substitui decisão financeira ou autorização de operação.

Anthropic usa Bearer e a versão fixa 2026-10-21 do endpoint Messages. ASSISTANT_ANTHROPIC_WORKSPACE_ID é opcional no servidor: chaves vinculadas a um workspace não precisam desse cabeçalho, enquanto chaves multiescopo o exigem. O operador deve confirmar o escopo antes de qualquer ativação; nenhum segredo real foi consultado.


## T5 boundary decisions

O retrato de disponibilidade é pontual e reflete apenas seleção e configuração observadas pelo servidor, sem afirmar saúde do fornecedor. A interface comunica essa incerteza; não recebe adaptador, fornecedor, modelo, chave ou limites. Mesmo quando o retrato é indisponível, uma pergunta manual pode ser tentada e o POST reavalia a seleção.

A conversa continua sem solicitação automática, sem histórico enviado ao servidor e com no máximo dez pares em memória. Trocas de comunidade ou idioma e desmontagem abortam pedidos em curso e descartam resultados tardios.
