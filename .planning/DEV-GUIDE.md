# Guia de desenvolvimento

## Requisitos
- Node 18+ (testado em Node 22).
- npm.

## Setup
```bash
npm install
cp .env.example .env   # preencha se quiser usar o banco real; sem isso roda em memória
```

## Scripts
| Script | O que faz |
|--------|-----------|
| `npm run dev` | Vite + API local (`api/dev-server.cjs`) |
| `npm run build` | Build de produção |
| `npm run preview` | Servir o build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` / `npm run format` | Biome |
| `npm run check` | typecheck + biome (roda no pre-commit) |
| `npm run test` | Vitest (unit) |
| `npm run test:e2e` | Playwright (E2E) |
| `npm run test:all` | check + unit + e2e (gate de migração) |

## Modos de execução da API
- **Memória** (sem `FIREBASE_DATABASE_URL`): dados em RAM do processo. Ideal para dev/E2E;
  não toca o banco compartilhado.
- **Firebase**: com `FIREBASE_DATABASE_URL` + `FIREBASE_DATABASE_SECRET`, lê/escreve em
  `camisetas/` no Realtime Database.

## Smoke test rápido (sem dependências npm)
```bash
node scripts/smoke-api.cjs   # exercita auth + pedidos + admin em memória
```

## Reextrair imagens do legado (se necessário)
```bash
node scripts/extract-assets.cjs
```

## Padrões de código
- Sem `innerHTML` com dados do usuário — usar `utils/dom.ts` (`el`, `textContent`).
- Toda mutação passa pela API (`src/state/api.ts`); nada de escrever no banco pelo cliente.
- Validação no cliente (`utils/validation.ts`) **e** no servidor (`api/*`).
- Componentes são funções que retornam `HTMLElement` e recebem callbacks.
