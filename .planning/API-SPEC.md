# API — EJC Medeiros Camisetas

Funções serverless em `api/*` (Vercel Functions). O `api/dev-server.cjs` reproduz as
mesmas rotas localmente despachando para os mesmos handlers. Todas as respostas trazem
headers de segurança e `Cache-Control: no-store`.

Storage: com `FIREBASE_DATABASE_URL` definido → Realtime Database sob `camisetas/`;
sem ele → modo memória (dev/E2E).

## Convenções

- Sessão admin: header `x-admin-session: <token>` (emitido em `/api/auth`).
- Em produção, `ADMIN_API_TOKEN` definido faz o gate de sessão valer; um header
  `x-admin-token` igual a ele também concede acesso (uso server-to-server).

## Endpoints

### `GET /api/health`
Status do serviço. `{ ok, service, storage: 'firebase'|'memory', timestamp }`.

### `GET /api/runtime-config`
Config pública do Firebase para o cliente (sem secret). 500 se faltar env.

### `GET /api/config?etapa=1|2`  — público
Retorna `{ etapa, data }` com catálogo mesclado aos defaults:
`{ produtos, cores, equipes, nome_evento, logo, pix_chave, pix_nome, pix_cidade, pix_qr, prazo, etapa_locked }`.

### `PUT /api/config`  — papel por campo
Body: `{ etapa, ...campos }`. Campos `prazo`/`etapa_locked` = **coordenador**;
qualquer outro (produtos, cores, equipes, pix, branding) = **dirigente**. Rate-limit 20/min.

### `GET /api/pedidos?etapa=1|2`  — **sessão admin**
Lista de pedidos da etapa (contém PII → exige sessão). `{ etapa, data: Pedido[] }`.

### `POST /api/pedidos`  — público
Cria pedido. Body: `{ etapa, nome, tel, equipe, itens: [{produto,tamanho,gola?,cor,quantidade}] }`.
Servidor valida tudo, **calcula `total`** e grava `pago:false`. Erros: 400 (validação),
409 (`etapa_locked`/`pedidos_encerrados`), 429 (rate-limit). Rate-limit 20/min.

### `PUT /api/pedidos`  — **sessão admin**
Marca pago. Body: `{ etapa, id, pago }`. Rate-limit 40/min.

### `POST /api/admin`  — **dirigente**
Body `{ action, ... }`:
- `reset_pedidos` (`etapa`) — zera pedidos da etapa.
- `reset_catalogo` — restaura produtos/cores padrão.
- `lock_etapa` (`lock_etapa: 0|1|2`).
- `change_password` (`password_role`, `passwordHash`).
Rate-limit 15/min.

### `GET /api/auth/status`
`{ initialSetupComplete, coordConfigured, dirConfigured, iterations, algo, salts? }`.
`salts` só aparece antes do setup.

### `GET /api/auth/challenge?role=coordenador|dirigente`
`{ nonce, salt, iterations, algo, expiresAt }`. Rate-limit 30/min.

### `POST /api/auth`
Body `{ role, nonce, proof }`. Sucesso → `{ token, expiresAt }`. Rate-limit 10/min.

### `POST /api/auth/initial-setup`  — header `x-setup-token: AUTH_SETUP_TOKEN`
Body `{ coordHash, dirHash }` (hashes PBKDF2 base64url). Só uma vez por ambiente.

## Modelo de dados (sob `camisetas/`)

```
camisetas/
  config/                     # ver campos acima
  pedidos/etapa{1,2}/{id}/     # { id, nome, tel, equipe, itens[], total, pago, data }
  auth/                       # salts, senha_coord/senha_dir (hash), meta, challenges
```
