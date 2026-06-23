// Acesso ao Firebase Realtime Database via REST, do lado do servidor.
//
// Todos os caminhos sao prefixados com `camisetas/` para isolar os dados deste
// app do app de doacoes, que compartilha o mesmo banco.
//
// Quando FIREBASE_DATABASE_URL nao esta definido, opera em modo MEMORIA (process-wide),
// o que permite rodar `npm run dev` e os testes E2E sem tocar no banco real.

const NAMESPACE = 'camisetas';

function getFirebaseBaseUrl() {
  const baseUrl = process.env.FIREBASE_DATABASE_URL;
  if (!baseUrl) return null;
  return baseUrl.replace(/\/+$/, '');
}

function hasFirebaseConfig() {
  return Boolean(getFirebaseBaseUrl());
}

function namespacedPath(path) {
  const clean = String(path || '').replace(/^\/+|\/+$/g, '');
  return clean ? `${NAMESPACE}/${clean}` : NAMESPACE;
}

// Caminho na raiz do banco, FORA do namespace camisetas/ (ex.: config global
// compartilhado com o app de doacoes).
function rootPath(path) {
  return String(path || '').replace(/^\/+|\/+$/g, '');
}

// ---- Modo memoria -------------------------------------------------------
const memoryTree = {};

function splitPath(path) {
  return namespacedPath(path).split('/').filter(Boolean);
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function memGet(path) {
  const segments = splitPath(path);
  let node = memoryTree;
  for (const seg of segments) {
    if (node == null || typeof node !== 'object' || !(seg in node)) return null;
    node = node[seg];
  }
  return node === undefined ? null : clone(node);
}

function memSet(path, value) {
  const segments = splitPath(path);
  let node = memoryTree;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const seg = segments[i];
    if (node[seg] == null || typeof node[seg] !== 'object') node[seg] = {};
    node = node[seg];
  }
  node[segments[segments.length - 1]] = clone(value);
  return clone(value);
}

function memDelete(path) {
  const segments = splitPath(path);
  let node = memoryTree;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const seg = segments[i];
    if (node[seg] == null || typeof node[seg] !== 'object') return;
    node = node[seg];
  }
  delete node[segments[segments.length - 1]];
}

// Variantes de memoria SEM namespace (para o config externo na raiz).
function memGetRaw(path) {
  const segments = rootPath(path).split('/').filter(Boolean);
  let node = memoryTree;
  for (const seg of segments) {
    if (node == null || typeof node !== 'object' || !(seg in node)) return null;
    node = node[seg];
  }
  return node === undefined ? null : clone(node);
}

function memSetRaw(path, value) {
  const segments = rootPath(path).split('/').filter(Boolean);
  let node = memoryTree;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const seg = segments[i];
    if (node[seg] == null || typeof node[seg] !== 'object') node[seg] = {};
    node = node[seg];
  }
  node[segments[segments.length - 1]] = clone(value);
  return clone(value);
}

// ---- REST autenticado ---------------------------------------------------
function buildDbUrl(path) {
  const base = getFirebaseBaseUrl();
  if (!base) throw new Error('missing FIREBASE_DATABASE_URL');
  const secret = process.env.FIREBASE_DATABASE_SECRET;
  const auth = secret ? `?auth=${encodeURIComponent(secret)}` : '';
  return `${base}/${namespacedPath(path)}.json${auth}`;
}

async function dbGet(path) {
  if (!hasFirebaseConfig()) return memGet(path);
  const resp = await fetch(buildDbUrl(path), { method: 'GET' });
  if (!resp.ok) throw new Error(`firebase GET failed: ${resp.status}`);
  const data = await resp.json();
  return data ?? null;
}

async function dbSet(path, value) {
  if (!hasFirebaseConfig()) return memSet(path, value);
  const resp = await fetch(buildDbUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  if (!resp.ok) throw new Error(`firebase PUT failed: ${resp.status}`);
  return await resp.json();
}

async function dbDelete(path) {
  if (!hasFirebaseConfig()) {
    memDelete(path);
    return null;
  }
  const resp = await fetch(buildDbUrl(path), { method: 'DELETE' });
  if (!resp.ok) throw new Error(`firebase DELETE failed: ${resp.status}`);
  return null;
}

function buildExternalDbUrl(path) {
  const base = getFirebaseBaseUrl();
  if (!base) throw new Error('missing FIREBASE_DATABASE_URL');
  const secret = process.env.FIREBASE_DATABASE_SECRET;
  const auth = secret ? `?auth=${encodeURIComponent(secret)}` : '';
  return `${base}/${rootPath(path)}.json${auth}`;
}

// Leitura de caminhos FORA do namespace camisetas/ (ex.: o config global
// compartilhado com o app de doacoes). Somente leitura em producao.
async function dbGetExternal(path) {
  if (!hasFirebaseConfig()) return memGetRaw(path);
  const resp = await fetch(buildExternalDbUrl(path), { method: 'GET' });
  if (!resp.ok) throw new Error(`firebase GET (external) failed: ${resp.status}`);
  const data = await resp.json();
  return data ?? null;
}

// Escrita fora do namespace — usada apenas em testes/dev (modo memoria) para
// semear o config externo. A producao nao escreve nesse caminho.
async function dbSetExternal(path, value) {
  if (!hasFirebaseConfig()) return memSetRaw(path, value);
  const resp = await fetch(buildExternalDbUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  if (!resp.ok) throw new Error(`firebase PUT (external) failed: ${resp.status}`);
  return await resp.json();
}

function getClientFirebaseConfig(env = process.env) {
  const firebase = {
    apiKey: env.FIREBASE_API_KEY || '',
    authDomain: env.FIREBASE_AUTH_DOMAIN || '',
    databaseURL: env.FIREBASE_DATABASE_URL || '',
    projectId: env.FIREBASE_PROJECT_ID || '',
    storageBucket: env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.FIREBASE_APP_ID || '',
  };
  const complete = Object.values(firebase).every(Boolean);
  return complete ? firebase : null;
}

function resetMemoryStore() {
  for (const key of Object.keys(memoryTree)) delete memoryTree[key];
}

module.exports = {
  NAMESPACE,
  hasFirebaseConfig,
  dbGet,
  dbSet,
  dbDelete,
  dbGetExternal,
  dbSetExternal,
  getClientFirebaseConfig,
  resetMemoryStore,
};
