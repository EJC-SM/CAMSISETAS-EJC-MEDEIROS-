# Deploy (Vercel + Firebase)

## 1. Variáveis de ambiente na Vercel (projeto camisetas)

Firebase (mesmo projeto do doações — banco compartilhado):
```
FIREBASE_API_KEY
FIREBASE_AUTH_DOMAIN
FIREBASE_DATABASE_URL
FIREBASE_DATABASE_SECRET
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID
FIREBASE_APP_ID
```

Segredos PRÓPRIOS do camisetas (NÃO reutilizar os do doações — ver `SECURITY.md` §4):
```
ADMIN_API_TOKEN     # openssl rand -hex 32
SESSION_SECRET      # openssl rand -hex 32
AUTH_SETUP_TOKEN    # openssl rand -hex 32
```

## 2. Regras do banco

Publicar `database.rules.json` (que contém a **união** doações + camisetas) no
Firebase Console → Realtime Database → Regras. Conferir que:
- `camisetas/config` = leitura pública, escrita `false`.
- `camisetas/pedidos` = leitura `false` (PII), escrita `false`.
- `camisetas/auth` = `false`/`false`.

> Atenção: publicar essas regras substitui as regras atuais do banco. Por isso elas
> incluem também o subtree `doacoes`/`config`/`auth` do app de doações.

## 3. Build

A Vercel detecta Vite. `vercel.json` faz o rewrite de SPA e mantém `/api/*` nas funções.

## 4. Setup inicial de senhas (uma vez por ambiente)

Após o primeiro deploy, com `AUTH_SETUP_TOKEN` configurado, abra o app → aba **Painel** →
formulário **Configuração inicial**: informe o token e defina as senhas de Coordenador e
Dirigente. Isso grava os hashes em `camisetas/auth` e desativa o setup.

## 5. Pós-deploy
- `GET /api/health` deve responder `storage: "firebase"`.
- Fazer um pedido de teste e conferir em `camisetas/pedidos/etapa1`.
- Confirmar que `GET /api/pedidos` sem sessão retorna 401.
