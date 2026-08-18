# eclessGO Web

Site público do EclessGO.

## Objetivo
- divulgar o ecossistema
- listar comunidades em um mapa web
- publicar páginas públicas por comunidade
- permitir cadastro público de comunidade

## Stack
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Leaflet + OpenStreetMap
- React Hook Form + Zod

## Rotas
- `/`
- `/igrejas`
- `/igrejas/[slug]`
- `/comunidades`
- `/comunidades/[slug]`
- `/cadastro-igreja`
- `/cadastro-igreja/sucesso`
- `/cadastro-comunidade`
- `/cadastro-comunidade/sucesso`
- `/termos`
- `/privacidade`

## Integração com API
Usa:
- `GET /api/v1/churches`
- `GET /api/v1/churches/slug/{slug}`
- `POST /api/v1/auth/register-church/uploads`
- `POST /api/v1/auth/register-church`

O formulario de cadastro envia logo/foto-capa primeiro por
`/api/public/register-church/upload`, que faz proxy multipart para a API. Se o
storage MinIO/S3 nao estiver habilitado no backend, o usuario recebe uma
mensagem amigavel e pode tentar novamente sem credenciais no web.

## Variáveis

- `NEXT_PUBLIC_SITE_URL`: URL canônica do site público. Obrigatória no deploy (HTTPS), pois alimenta `sitemap.xml`, `robots.txt` e metadados.
- `API_BASE_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_PANEL_URL`: URL pública do painel administrativo; configure-a no deploy, sem `localhost`.
- `NEXT_PUBLIC_APP_CTA_URL`
- `SENTRY_ENABLED`
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_ENABLED`
- `NEXT_PUBLIC_SENTRY_DSN`

Product analytics externo nao usa credenciais no web; os eventos publicos passam por
`/api/public/analytics` e podem ser encaminhados pela API conforme
[`../eclessgo-docs/INTEGRATIONS.md`](../eclessgo-docs/INTEGRATIONS.md).

## Observabilidade Sentry

A base de Sentry e opcional:

- `src/instrumentation.ts` inicializa observabilidade no server runtime quando houver DSN real.
- `src/app/error.tsx` encaminha falhas de tela para o wrapper client.
- Sem `@sentry/nextjs` instalado, o wrapper nao quebra build e apenas registra no console em desenvolvimento.
- Mantenha `SENTRY_ENABLED=false` e DSNs vazios em ambientes locais sem credenciais.

Padrões locais:
- API: `http://127.0.0.1:8000/api/v1`
- Painel: `http://localhost:3000`

## Rodando localmente
```bash
npm install
npm run dev
```

## Validação
```bash
npm run lint
npm run typecheck
npm run test:a11y
npm run build
```

## Regra importante
Somente comunidades publicáveis com `location.lat` e `location.lng` válidos entram no mapa. A listagem textual continua sendo o fallback acessível.

Documentação transversal: [desenvolvimento](../eclessgo-docs/DEVELOPMENT.md), [integrações](../eclessgo-docs/INTEGRATIONS.md), [deployment](../eclessgo-docs/DEPLOYMENT.md) e [segurança](../eclessgo-docs/SECURITY.md).
