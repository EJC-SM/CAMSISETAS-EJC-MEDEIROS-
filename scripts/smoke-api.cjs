// Smoke test do backend em modo memoria, usando apenas Node (sem dependencias npm).
// Exercita health, setup, challenge-response, criacao/leitura de pedidos e admin.
// Uso: node scripts/smoke-api.cjs
const crypto = require('node:crypto');

process.env.FIREBASE_DATABASE_URL = '';
process.env.AUTH_SETUP_TOKEN = 'smoke-setup-token';
// ADMIN_API_TOKEN definido reflete producao: sem header x-admin-token, exige sessao.
process.env.ADMIN_API_TOKEN = 'smoke-admin-token';
process.env.SESSION_SECRET = 'smoke-session-secret';

const health = require('../api/health.js');
const authStatus = require('../api/auth/status.js');
const initialSetup = require('../api/auth/initial-setup.js');
const challenge = require('../api/auth/challenge.js');
const auth = require('../api/auth.js');
const pedidos = require('../api/pedidos.js');
const config = require('../api/config.js');
const admin = require('../api/admin.js');

let failures = 0;
function assert(cond, label) {
  if (cond) {
    console.log(`  ok  ${label}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
}

function call(handler, { method = 'GET', headers = {}, query = {}, body = null } = {}) {
  return new Promise((resolve) => {
    const res = {
      _status: 200,
      setHeader() {},
      status(code) {
        this._status = code;
        return this;
      },
      json(payload) {
        resolve({ status: this._status, body: payload });
        return this;
      },
      end() {
        resolve({ status: this._status, body: null });
        return this;
      },
    };
    Promise.resolve(handler({ method, headers, query, body }, res)).catch((err) => {
      resolve({ status: 500, body: { error: err.message } });
    });
  });
}

function clientProof(storedHashB64, nonce) {
  const key = Buffer.from(storedHashB64, 'base64url');
  return crypto.createHmac('sha256', key).update(String(nonce)).digest('base64url');
}

async function main() {
  console.log('== health ==');
  let r = await call(health, {});
  assert(r.status === 200 && r.body.storage === 'memory', 'health responde em modo memoria');

  console.log('== status inicial ==');
  r = await call(authStatus, {});
  assert(r.status === 200 && r.body.initialSetupComplete === false, 'setup ainda nao concluido');
  assert(r.body.salts?.coord && r.body.salts?.dir, 'salts publicos presentes');

  const storedHash = crypto.randomBytes(32).toString('base64url');

  console.log('== initial-setup ==');
  r = await call(initialSetup, {
    method: 'POST',
    headers: { 'x-setup-token': 'wrong' },
    body: { coordHash: storedHash, dirHash: storedHash },
  });
  assert(r.status === 401, 'token de setup invalido e rejeitado');

  r = await call(initialSetup, {
    method: 'POST',
    headers: { 'x-setup-token': 'smoke-setup-token' },
    body: { coordHash: storedHash, dirHash: storedHash },
  });
  assert(r.status === 200 && r.body.ok, 'setup concluido com token valido');

  r = await call(authStatus, {});
  assert(r.body.initialSetupComplete === true, 'status reflete setup concluido');

  console.log('== login challenge-response (dirigente) ==');
  r = await call(challenge, { query: { role: 'dirigente' } });
  assert(r.status === 200 && r.body.nonce && r.body.salt, 'challenge emite nonce + salt');
  const nonce = r.body.nonce;

  r = await call(auth, {
    method: 'POST',
    body: { role: 'dirigente', nonce, proof: clientProof(storedHash, nonce) },
  });
  assert(r.status === 200 && r.body.token, 'login retorna token de sessao');
  const dirToken = r.body.token;

  console.log('== login com proof invalido ==');
  const r2 = await call(challenge, { query: { role: 'dirigente' } });
  r = await call(auth, {
    method: 'POST',
    body: { role: 'dirigente', nonce: r2.body.nonce, proof: 'deadbeef' },
  });
  assert(r.status === 401, 'proof invalido e rejeitado');

  console.log('== config GET (publico) ==');
  r = await call(config, { query: { etapa: '1' } });
  assert(
    r.status === 200 && Array.isArray(r.body.data.produtos) && r.body.data.produtos.length > 0,
    'config retorna catalogo',
  );

  console.log('== criar pedido (publico) ==');
  r = await call(pedidos, {
    method: 'POST',
    body: {
      etapa: 1,
      nome: 'Maria Teste',
      tel: '(11) 98888-7777',
      equipe: 'Cozinha',
      itens: [{ produto: 'Camiseta básica', tamanho: 'EGG', cor: 'Preto', quantidade: 2 }],
    },
  });
  assert(
    r.status === 201 && r.body.data.total === 110,
    'pedido criado com total calculado no servidor (2x EGG=55)',
  );
  assert(r.body.data.pago === false, 'pedido nasce como nao pago');

  console.log('== pedido invalido (cor excluida) ==');
  r = await call(pedidos, {
    method: 'POST',
    body: {
      etapa: 1,
      nome: 'Joao',
      tel: '(11) 98888-7777',
      equipe: 'Cozinha',
      itens: [{ produto: 'Polo', tamanho: 'P', cor: 'Roxo', quantidade: 1 }],
    },
  });
  assert(r.status === 400, 'cor excluida para Polo e rejeitada');

  console.log('== listar pedidos exige sessao ==');
  r = await call(pedidos, { query: { etapa: '1' } });
  assert(r.status === 401, 'listar pedidos sem sessao e bloqueado (PII)');

  r = await call(pedidos, { query: { etapa: '1' }, headers: { 'x-admin-session': dirToken } });
  assert(r.status === 200 && r.body.data.length === 1, 'listar pedidos com sessao retorna o pedido');

  console.log('== marcar pago ==');
  const pedidoId = r.body.data[0].id;
  r = await call(pedidos, {
    method: 'PUT',
    headers: { 'x-admin-session': dirToken },
    body: { etapa: 1, id: pedidoId, pago: true },
  });
  assert(r.status === 200 && r.body.data.pago === true, 'pedido marcado como pago');

  console.log('== admin lock_etapa exige dirigente ==');
  r = await call(admin, {
    method: 'POST',
    headers: { 'x-admin-session': dirToken },
    body: { action: 'lock_etapa', etapa: 1, lock_etapa: 1 },
  });
  assert(r.status === 200 && r.body.etapa_locked === 1, 'dirigente trava etapa');

  console.log('== pedido em etapa travada ==');
  r = await call(pedidos, {
    method: 'POST',
    body: {
      etapa: 2,
      nome: 'Ana',
      tel: '(11) 98888-7777',
      equipe: 'Cozinha',
      itens: [{ produto: 'Camiseta básica', tamanho: 'P', cor: 'Preto', quantidade: 1 }],
    },
  });
  assert(r.status === 409, 'pedido em etapa travada e bloqueado');

  console.log(failures === 0 ? '\nTODOS OS SMOKE CHECKS PASSARAM' : `\n${failures} CHECK(S) FALHARAM`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
