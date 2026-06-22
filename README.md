# EJC Medeiros — Camisetas

App de **pedidos de camisetas** do EJC Medeiros: catálogo, pedido com cálculo de total e
pagamento via **Pix**, além de painéis de Coordenador (gerenciar pedidos) e Dirigente
(catálogo, equipes, prazos e senhas).

Refatorado de um monólito React para **Vite + Vanilla TypeScript** com **API serverless**
e **Firebase Realtime Database**, espelhando a arquitetura segura do app de doações.

## Stack
- Vite 8 + TypeScript (frontend modular, sem framework de UI)
- Vercel Functions + dev-server local (`api/*`)
- Firebase Realtime Database (dados isolados sob `camisetas/`)
- Auth PBKDF2 challenge-response + sessão HMAC
- Biome + Husky · Vitest 4 (unit) + Playwright (E2E)

## Início rápido
```bash
npm install
cp .env.example .env     # opcional: sem Firebase, roda em modo memória
npm run dev              # http://localhost:5173
```

Validação rápida do backend sem instalar nada:
```bash
node scripts/smoke-api.cjs
```

## Scripts principais
`dev` · `build` · `preview` · `typecheck` · `lint` · `check` · `test` · `test:e2e` · `test:all`

## Gate de migração
A migração só é válida com `npm run test:all` (typecheck + Biome + Vitest + Playwright)
100% verde **e `npm audit` sem vulnerabilidades**. Ver `.planning/TESTING.md`.

## Documentação
Em `.planning/`:
- `ROADMAP.md` — plano e fases
- `ANALYSIS.md` — análise e decisões
- `SECURITY.md` — auditoria, OWASP e **rotação obrigatória de segredos**
- `API-SPEC.md` — endpoints e modelo de dados
- `DEPLOYMENT.md` — deploy Vercel + regras do Firebase
- `DEV-GUIDE.md` — desenvolvimento
- `TESTING.md` — testes e gate
- `RELEASE-CHECKLIST.md` · `LESSONS-LEARNED.md`

## Segurança (leia antes do deploy)
Os dados ficam sob `camisetas/` no mesmo banco do app de doações. É **obrigatório** gerar
`ADMIN_API_TOKEN`, `SESSION_SECRET` e `AUTH_SETUP_TOKEN` próprios deste app (não reutilizar
os do doações). Detalhes em `.planning/SECURITY.md`.

> `legacy/App.jsx.reference` é o código original, mantido apenas como referência de regras
> de negócio. Não é importado pelo build.
