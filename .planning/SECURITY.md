# Segurança — EJC Medeiros Camisetas

Documento de auditoria e medidas de segurança da refatoração v2.

## 1. O que havia de errado no app legado (`legacy/App.jsx.reference`)

| # | Problema | OWASP | Status v2 |
|---|----------|-------|-----------|
| 1 | Senhas hardcoded no bundle (`ejcadmin2025`, `Senh@ejc123!*`) | A07 Auth Failures | **Resolvido** — auth PBKDF2 server-side, zero senha no código |
| 2 | Autenticação 100% no cliente (comparação de string) | A01 Broken Access Control | **Resolvido** — verificação no servidor com sessão HMAC |
| 3 | Credenciais Supabase + `anon key` expostas no front | A02 / A05 | **Resolvido** — Supabase removido; segredo do Firebase só no servidor |
| 4 | Dados (incl. telefone) só em `localStorage`, sem backend confiável | A04 Insecure Design | **Resolvido** — escrita server-side validada |
| 5 | Validação fraca / ausente nos formulários | A03 Injection | **Resolvido** — validação cliente + sanitização server-side |
| 6 | Sem rate-limit / anti-abuso | A04 | **Resolvido** — rate-limit por IP em todas as mutações |
| 7 | Imagens base64 e estilos inline (450 KB) | (performance) | **Resolvido** — imagens extraídas para `src/assets/` |

## 2. Arquitetura de autenticação (PBKDF2 challenge-response)

1. Cliente pede um **challenge** (`GET /api/auth/challenge?role=`): servidor devolve `nonce`, `salt`, `iterations`.
2. Cliente deriva a chave PBKDF2-SHA256 (`salt`, `iterations`) a partir da senha digitada e calcula `proof = HMAC(chave, nonce)`.
3. `POST /api/auth` envia `{role, nonce, proof}`. O servidor recomputa e compara com `timingSafeEqual`. **A senha nunca trafega.**
4. Em caso de sucesso, é emitida uma **sessão assinada via HMAC** (`SESSION_SECRET`/`ADMIN_API_TOKEN`), com expiração de 8h, enviada em `x-admin-session`.

O hash derivado da senha fica em `camisetas/auth` (nunca a senha em claro). O setup inicial (`POST /api/auth/initial-setup`) exige `AUTH_SETUP_TOKEN` e só roda uma vez por ambiente.

## 3. Isolamento de dados (banco compartilhado com o Doações)

- Ambos os apps usam o mesmo Realtime Database. Os dados do camisetas ficam **todos** sob o nó raiz `camisetas/` (prefixo aplicado em `api/firebase-rest.cjs`).
- `database.rules.json` contém a **união** dos subtrees (doações + camisetas). Publicar essa união no Firebase Console.
- `camisetas/pedidos` tem **leitura pública desabilitada** (contém WhatsApp = PII). Pedidos só são lidos pela API (server-side, com `FIREBASE_DATABASE_SECRET`) e exigem sessão admin (`GET /api/pedidos`).
- `camisetas/config` é leitura pública (catálogo/cores/prazo — sem PII); escrita sempre via API.
- `camisetas/auth` é `read:false`/`write:false` (apenas servidor com secret).

## 4. ROTAÇÃO DE SEGREDOS — AÇÃO OBRIGATÓRIA

O `.env` atual do camisetas é **idêntico** ao do doações. Como a sessão admin é assinada com `ADMIN_API_TOKEN`/`SESSION_SECRET`, **reutilizar os mesmos valores permitiria que uma sessão de um app fosse aceita no outro** (escalonamento entre apps).

Gerar valores **próprios** do camisetas antes do deploy:

```bash
openssl rand -hex 32   # ADMIN_API_TOKEN
openssl rand -hex 32   # SESSION_SECRET
openssl rand -hex 32   # AUTH_SETUP_TOKEN
```

Configurar esses três na Vercel (Environment Variables) do projeto camisetas. O `FIREBASE_DATABASE_SECRET` pode ser compartilhado (mesmo banco), pois o isolamento é garantido por namespace + rules.

## 5. Outras defesas implementadas

- **Headers de segurança** em toda resposta da API: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Content-Security-Policy`, `Cache-Control: no-store`.
- **Sanitização** server-side (`sanitizeText`) e cliente (`utils/security.ts`); DOM construído com `textContent` (sem `innerHTML` de dados do usuário) → previne XSS.
- **Preço calculado no servidor** a partir do catálogo — o cliente não consegue forjar `total`.
- **Validação de pedido** server-side: produto/tamanho/cor/gola válidos, cor não excluída, quantidade 1..99, equipe pertencente à etapa, etapa não travada e dentro do prazo.
- **CSRF**: as ações admin usam header customizado `x-admin-session` (não-cookie), o que impede CSRF clássico; o formulário público é protegido por rate-limit + validação.
- **Rate-limit por IP**: challenge (30/min), login (10/min), criar pedido (20/min), config update (20/min), admin (15/min), setup (5/min).
- **CSV export** com mitigação de Formula/CSV Injection (prefixo seguro + aspas).

## 6. Auditoria de dependências (`npm audit`)

**Estado atual: `npm audit` = 0 vulnerabilidades** (verificado em 2026-06).

Histórico: o `npm install` inicial acusou 5 vulnerabilidades (3 moderate, 1 high, 1 critical),
todas de uma **única cadeia de tooling de build/teste**: `esbuild ≤0.24.2`
(advisory de dev-server GHSA-67mh-4wv8-2f99) → `vite` → `@vitest/mocker` → `vitest`/`vite-node`.

- **Exposição em produção: nenhuma.** São dependências de build/teste; o artefato publicado
  é estático e a API Node não tem dependências de runtime. As falhas só têm efeito durante
  `npm run dev` / Vitest UI na máquina do desenvolvedor.
- **Correção aplicada:** upgrade controlado Vite 5→8 e Vitest 2→4 (esbuild 0.25+), em vez de
  `npm audit fix --force` cego. Gate revalidado (typecheck + Biome + Vitest 39/39 + build + smoke).

Checklist contínuo (rodar onde houver rede):

```bash
npm audit                       # deve retornar "found 0 vulnerabilities"
gh repo view                    # confirmar Dependabot habilitado no GitHub
npx playwright install chromium
npm run test:all                # gate: typecheck + biome + vitest + e2e
```

Skills de segurança sugeridas para revisão assistida (clonar onde houver rede; links 2 e 3 do pedido são o mesmo `trailofbits/skills`):
`claude-code-owasp`, `trailofbits/skills`, `snyk/studio-recipes`, `trilwu/secskills`, `dralgorhythm/claude-agentic-framework`, `Eyadkelleh/awesome-claude-skills-security`.

## 7. Riscos residuais / observações

- O QR Pix usa um serviço externo (`api.qrserver.com`) quando não há `pix_qr` próprio configurado; o código copia-e-cola é gerado localmente e é a fonte da verdade.
- `pix_qr` e `logo` aceitam base64 grande (até 500 KB) — limitado no servidor para evitar abuso.
- A sessão admin expira em 8h e fica em `sessionStorage` (sem persistência entre navegadores).
