# EJC Medeiros Camisetas — Roadmap da Refatoração

**Data**: junho 2026
**Status**: em execução
**Versão alvo**: v2.0 (refatorada)

---

## Resumo executivo

Refatorar o app monolítico de pedidos de camisetas (React, `legacy/App.jsx.reference`, ~1906 linhas, Supabase + senhas hardcoded) para a mesma arquitetura segura do app de doações: **Vite + Vanilla TypeScript**, **API serverless** (`api/*`) com dev-server local, **Firebase Realtime Database acessado pelo servidor**, autenticação **PBKDF2 challenge-response**, validação estrita, acessibilidade WCAG AA, SEO e performance.

## Decisões de arquitetura

| Decisão | Escolha | Racional |
|---------|---------|----------|
| Build | Vite | Rápido, TS nativo, igual ao doações |
| Frontend | Vanilla TS | Sem framework; máximo reuso da infra do doações |
| Backend | Vercel Functions + dev-server | Escrita server-side, secret nunca no cliente |
| Banco | Firebase RTDB (namespace `camisetas/`) | Mesmo banco do doações, dados isolados |
| Auth | PBKDF2 + challenge-response | Senha nunca trafega; setup único |
| Lint/format | Biome | Igual ao doações |
| Git hooks | Husky (pre-commit: check, pre-push: test) | Padronização |
| Testes | Vitest (unit) + Playwright (E2E) | Gate de migração |

## Isolamento de dados (banco compartilhado)

Todos os caminhos do app são prefixados com `camisetas/` em `api/firebase-rest.cjs`:
`camisetas/pedidos/etapaN`, `camisetas/config`, `camisetas/auth`. As regras em
`database.rules.json` incluem o subtree do doações e o do camisetas (publicar a união
no Firebase Console).

## Fases

- [ ] **Fase 0 — Scaffolding**: stack TS + Biome + Husky + Vitest/Playwright, configs, `.env.example`, `.planning`.
- [ ] **Fase 1 — API serverless**: portar infra do doações sob `camisetas/`; `database.rules.json`.
- [ ] **Fase 1b — Endpoints de domínio**: `/api/pedidos`, `/api/config`, `/api/admin`, `/api/auth/*`, `/api/runtime-config`, `/api/health`.
- [ ] **Fase 2 — Frontend modular**: state, components, utils, styles; extrair imagens base64.
- [ ] **Fase 3 — Forms**: validação estrita, sanitização, máscaras, rate-limit, CSRF de sessão.
- [ ] **Fase 4 — A11y + SEO + performance**: WCAG AA, meta/OG/schema, Web Vitals.
- [ ] **Fase 5 — Testes (gate)**: unit + E2E; migração só conclui com tudo verde.
- [ ] **Fase 6 — Segurança**: skills, npm audit, Dependabot, OWASP, rotação de segredos.
- [ ] **Fase 7 — Documentação**: `.planning/*` + README.

## Mapeamento de domínio (doações → camisetas)

- `doacoes/etapaN` → `camisetas/pedidos/etapaN`.
- Item de doação `{nome, unidade, quantidade}` → item de pedido `{produto, tamanho, cor, quantidade}`.
- Pedido tem `total` (R$) e `pago` (booleano) no lugar de `entregue`.
- `config`: catálogo de produtos (tamanhos, golas, preços), cores, equipes por etapa, Pix (chave/QR), prazo (timer) por etapa, `etapa_locked`, branding/logo.
- Coordenador marca `pago`; Dirigente edita catálogo, equipes, prazos, travas e senhas.

## Critérios de sucesso

- Paridade funcional com o legado (catálogo, pedido, Pix, painéis, etapas, prazos, travas).
- Zero senha/segredo no código; auth server-side PBKDF2.
- TypeScript estrito sem erros; Biome limpo; Husky ativo.
- Validação 100% cliente + servidor; sem XSS/CSRF; rate-limit.
- WCAG AA; SEO técnico; bons Web Vitals.
- **Gate**: `typecheck` + `biome check` + Vitest + Playwright todos verdes.

## Pendências operacionais (deploy)

1. Publicar `database.rules.json` (união doações + camisetas) no Firebase Console.
2. Configurar na Vercel: `FIREBASE_*`, `FIREBASE_DATABASE_SECRET` e segredos PRÓPRIOS do camisetas (`ADMIN_API_TOKEN`, `SESSION_SECRET`, `AUTH_SETUP_TOKEN`).
3. Executar o setup inicial de senhas uma vez por ambiente.
