# Testes — gate de migração

A migração só é considerada válida quando **todos** passam:

```bash
npm run typecheck     # TypeScript estrito
npm run lint          # Biome
npm run test          # Vitest (unitários)
npm run test:e2e      # Playwright (E2E)
npm audit             # 0 vulnerabilidades (ver "Dependências" abaixo)
# atalho (testes):
npm run test:all
```

> **Toolchain:** Vite 8 + Vitest 4 (Node 20.19+/22.12+). O bump em 2026-06 de Vite 5→8 /
> Vitest 2→4 eliminou a cadeia de advisories de dev-server (esbuild ≤0.24.2 → vite →
> @vitest/mocker → vitest/vite-node). Estado atual: `npm audit` = **0 vulnerabilidades**.

## Unitários (Vitest) — `tests/unit/`
Ambiente jsdom + WebCrypto (setup em `tests/unit/setup.ts`). Cobrem:
- `security.test.ts` — sanitização, dígitos, máscara de telefone.
- `validation.test.ts` — nome, telefone, quantidade, item de pedido, `getPreco`.
- `pix.test.ts` — payload BR Code + CRC, URL de QR, e **valor embutido (campo 54)**
  (com/sem valor, formato de 2 casas, posição entre os campos 53 e 58).
- `comprovante.test.ts` — validação de tipo/tamanho do comprovante (imagem/PDF).
- `prazo-banner.test.ts` — banner de prazo: nulo sem data, contagem para prazo futuro,
  estado encerrado para prazo passado.
- `format.test.ts` — moeda e countdown.
- `export.test.ts` — CSV + mitigação de Formula Injection.
- `password-auth.test.ts` — política de senha e derivação PBKDF2.
- `backend.test.ts` — módulos `api/*` via `createRequire`: sanitização, `validateEtapa`,
  classificação de acesso ao config, sessões HMAC (criar/verificar/adulterar),
  hash/proof, defaults do catálogo, integração cliente↔servidor (chave PBKDF2 do
  cliente aceita pelo `verifyProof` do servidor), e os endpoints de **comprovante**
  (upload com conferência de telefone, 403 divergente, 400 tipo inválido, GET só com
  sessão admin) e **meus-pedidos** (busca por telefone com campos mínimos, sem PII).

## E2E (Playwright) — `tests/e2e/`
Sobem o `npm run dev` em **modo memória** (`FIREBASE_DATABASE_URL` vazio) com
`ADMIN_API_TOKEN`/`AUTH_SETUP_TOKEN` de teste (ver `playwright.config.ts`):
- `pedido.spec.ts` — fluxo público: catálogo → pedido → modal Pix.
- `admin.spec.ts` — setup inicial → login de coordenador → visão de pedidos.

> O `admin.spec` faz o setup quando o servidor está limpo; com servidor reaproveitado
> (`reuseExistingServer`), o teste é pulado com aviso. Em CI (`reuseExistingServer:false`)
> o servidor é sempre novo.

## Verificação sem dependências npm
`node scripts/smoke-api.cjs` valida o backend ponta-a-ponta em memória (útil quando
não há rede para instalar pacotes). Já validado: health, setup, challenge-response,
criação/leitura de pedidos com PII protegida, marcação de pago e trava de etapa.

## Dependências (`npm audit`)
- Política: o gate exige **0 vulnerabilidades**.
- Todas as dependências de risco aqui são de **build/teste** (esbuild/vite/vitest) e não
  vão para produção (o build é estático e a API Node não tem dependências de runtime).
- Correção preferida é **upgrade controlado** (ajustar versão + reexecutar o gate), não
  `npm audit fix --force` cego — ele pode subir majors quebrando `vite.config.ts`/`vitest.config.ts`.
- Histórico: 2026-06 — Vite 5→8 e Vitest 2→4 zeraram 5 advisories (3 moderate, 1 high,
  1 critical) originados de `esbuild ≤0.24.2`.
