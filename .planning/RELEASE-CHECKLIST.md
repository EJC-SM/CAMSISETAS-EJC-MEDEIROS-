# Release checklist

## Antes do merge
- [ ] `npm install` em ambiente com rede.
- [ ] `npm run check` (typecheck + Biome) verde.
- [ ] `npm run test` (Vitest) verde.
- [ ] `npm run build` sem erros.
- [ ] `npx playwright install chromium` e `npm run test:e2e` verde.
- [ ] `npm audit` → **0 vulnerabilidades** (não usar `--force`; preferir upgrade controlado).
- [ ] Revisar `legacy/` permanece apenas como referência (não importado pelo build).

## Segredos (obrigatório)
- [ ] Gerados `ADMIN_API_TOKEN`, `SESSION_SECRET`, `AUTH_SETUP_TOKEN` PRÓPRIOS do camisetas.
- [ ] Configurados na Vercel; não commitados.
- [ ] `.env` fora do git (confirmar `.gitignore`).

## Firebase
- [ ] `database.rules.json` (união doações + camisetas) publicado no Console.
- [ ] `camisetas/pedidos` com leitura pública desabilitada.

## Pós-deploy
- [ ] `GET /api/health` → `storage: firebase`.
- [ ] Setup inicial de senhas executado (aba Painel).
- [ ] Pedido de teste criado e visível no painel do coordenador.
- [ ] `GET /api/pedidos` sem sessão → 401.
- [ ] Web Vitals no console sem regressões graves; Lighthouse ≥ 90 em a11y/SEO.
