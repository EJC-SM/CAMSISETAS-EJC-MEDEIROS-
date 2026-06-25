# API — EJC Medeiros Camisetas

Funções serverless em `api/*` (Vercel Functions). O `api/dev-server.cjs` reproduz as
mesmas rotas localmente despachando para os mesmos handlers. Todas as respostas trazem
headers de segurança e `Cache-Control: no-store`.

Storage: com `FIREBASE_DATABASE_URL` definido → Realtime Database sob `camisetas/`;
sem ele → modo memória (dev/E2E). A única leitura **fora** desse namespace é o `config`
global na raiz (`/config`), usado para resolver a trava de etapa (ver `etapa_locked` abaixo).

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

> **Trava de etapa (`etapa_locked`)**: a fonte de verdade é o `config` **global** na raiz do
> banco (`/config.etapa_locked`), compartilhado com o app de doações. O `etapa_locked` salvo em
> `camisetas/config` é usado apenas como **fallback** quando o global não tiver valor (ex.: modo
> memória em dev/testes). O `GET /api/config` já entrega o valor resolvido (global → fallback), e o
> `POST /api/pedidos` aplica a mesma resolução ao bloquear pedidos fora da etapa liberada. Valores
> válidos: `0` (sem trava), `1` ou `2`. O painel do camisetas ainda escreve o `etapa_locked` local,
> que só vale como fallback.

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

### `GET /api/meus-pedidos?etapa=1|2&tel=...`  — público
Busca pública por telefone para o cliente reencontrar o próprio pedido e enviar o
comprovante. Retorna **apenas** campos mínimos (sem expor PII de terceiros):
`{ etapa, data: [{ id, total, pago, comprovante, data, resumo }] }`. Rate-limit 15/min.

### `POST /api/comprovante`  — público
Anexa o comprovante de pagamento a um pedido. Body:
`{ etapa, id, tel, file: { name, type, dataBase64 } }`. Aceita `image/jpeg|png|webp` e
`application/pdf`; valida base64 e tamanho (≤ 4 MB armazenado). Confere o `tel` contra o
do pedido (anti-abuso → 403 `tel_mismatch`). Grava em `comprovantes/etapa{n}/{id}` e marca
`pedido.comprovante = true` + `comprovanteAt`. Rate-limit 10/min.

### `GET /api/comprovante?etapa=1|2&id=...`  — **sessão admin**
Retorna o arquivo armazenado para visualização no painel:
`{ etapa, id, data: { name, type, dataBase64, uploadedAt } }`. 404 se não houver.

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
  pedidos/etapa{1,2}/{id}/     # { id, nome, tel, equipe, itens[], total, pago, data, comprovante?, comprovanteAt? }
  comprovantes/etapa{1,2}/{id}/ # { name, type, data(base64), uploadedAt } — leitura só via API com sessão admin
  auth/                       # salts, senha_coord/senha_dir (hash), meta, challenges
```
