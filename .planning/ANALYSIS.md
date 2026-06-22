# Análise — Refatoração EJC Camisetas

## Problema original

O EJC Medeiros precisava facilitar **fazer e pagar pedidos de camisetas**. O app
existente era um monólito React (`legacy/App.jsx.reference`, ~1906 linhas, ~450 KB)
com:

- 26 imagens base64 e estilos inline embutidos no bundle.
- Senhas de administração hardcoded.
- Autenticação feita no cliente; credenciais Supabase expostas.
- Dados em `localStorage`, validação fraca, sem rate-limit.

## Objetivos

1. Tornar pedido + pagamento simples e acessíveis.
2. Eliminar vulnerabilidades (ver `SECURITY.md`).
3. Reduzir e organizar o código (TypeScript + módulos).
4. Espelhar a arquitetura **já validada** do app de doações.
5. Acessibilidade (WCAG AA), SEO e performance.
6. Testes unitários + E2E como gate de migração.

## Decisões

| Tema | Decisão |
|------|---------|
| Framework | **Vanilla TypeScript** (igual ao doações; sem React/Vue) |
| Build | Vite |
| Backend | Vercel Functions + dev-server local |
| Banco | Firebase RTDB, dados sob `camisetas/` (mesmo banco do doações, isolado) |
| Auth | PBKDF2 challenge-response + sessão HMAC |
| Qualidade | Biome + Husky (pre-commit: check; pre-push: test) |
| Testes | Vitest (unit) + Playwright (E2E) |

### Por que Vanilla TS e não React/Vue?
O objetivo era paridade com o doações (infra de segurança já resolvida) e redução de
peso. Vanilla TS + Vite entrega bundle mínimo, sem runtime de framework, com a mesma
camada de API/segurança reaproveitada quase verbatim. React/Vue agregariam dependências
e complexidade sem ganho para o escopo (catálogo + formulário + painéis).

## Mapeamento de domínio (doações → camisetas)

- `doacoes/etapaN` → `camisetas/pedidos/etapaN`.
- Item `{nome,unidade,quantidade}` → `{produto,tamanho,gola,cor,quantidade,preco}`.
- Pedido ganha `total` (R$, calculado no servidor) e `pago` no lugar de `entregue`.
- `config`: catálogo de produtos (tamanhos/golas/preços), cores, equipes por etapa,
  Pix, prazo por etapa, trava de etapa, branding.
- Coordenador marca `pago`; Dirigente edita catálogo/equipes/Pix/senhas.

## Estrutura final

```
api/            Funções serverless + dev-server + defaults compartilhados
src/state/      store, types, api client, gateway de polling
src/components/ header, catalogo, form-pedido, painel(-coordenador/-dirigente), auth-setup, login-gate, modal
src/utils/      validation, security, auth, password-auth, pix, format, export, web-vitals, icons, accessibility, dom
src/assets/     imagens extraídas (produtos/*.png, logo.jpg)
src/styles/     tokens + global + a11y + buttons + forms + layout
tests/unit/     Vitest
tests/e2e/      Playwright
legacy/         App.jsx original (referência de regras de negócio)
```
