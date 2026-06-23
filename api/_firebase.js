const crypto = require('node:crypto');
const { dbGet, dbSet, dbGetExternal } = require('./firebase-rest.cjs');

function normalizeEtapaLock(value) {
  const lock = Number(value);
  return lock === 1 || lock === 2 ? lock : 0;
}

// A trava de etapa segue o config GLOBAL (raiz /config, fora do namespace
// camisetas/, compartilhado com o app de doacoes). O etapa_locked do
// camisetas/config funciona como fallback quando o externo nao existir.
async function resolveEtapaLock(camisetasCfg) {
  let lock = normalizeEtapaLock(camisetasCfg?.etapa_locked);
  try {
    const external = await dbGetExternal('config');
    if (external && external.etapa_locked != null) {
      lock = normalizeEtapaLock(external.etapa_locked);
    }
  } catch {
    // Em falha de leitura do config externo, mantem o fallback do camisetas.
  }
  return lock;
}

function sanitizeText(value, maxLen) {
  const text = String(value || '')
    .replace(/[<>"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return maxLen ? text.slice(0, maxLen) : text;
}

function validateEtapa(value) {
  const etapa = Number(value);
  if (etapa !== 1 && etapa !== 2) {
    throw new Error('etapa must be 1 or 2');
  }
  return etapa;
}

const RATE_LIMIT_BUCKET = new Map();
const SESSION_BUCKET = new Map();

function getSessionSecret() {
  return process.env.ADMIN_API_TOKEN || process.env.SESSION_SECRET || 'ejc-cam-dev-session-secret';
}

function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'; base-uri 'self'");
}

function getClientIp(req) {
  const fromHeader = String(req.headers['x-forwarded-for'] || '')
    .split(',')[0]
    .trim();
  return fromHeader || req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(req, scope, maxRequests, windowMs) {
  const now = Date.now();
  const ip = getClientIp(req);
  const key = `${scope}:${ip}`;
  const previous = RATE_LIMIT_BUCKET.get(key) || [];
  const validWindow = previous.filter((t) => now - t < windowMs);

  if (validWindow.length >= maxRequests) {
    RATE_LIMIT_BUCKET.set(key, validWindow);
    return true;
  }

  validWindow.push(now);
  RATE_LIMIT_BUCKET.set(key, validWindow);
  return false;
}

function createAdminSession(role) {
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;
  const payload = `${role}:${expiresAt}:${crypto.randomBytes(12).toString('hex')}`;
  const signature = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('hex');
  const token = `${Buffer.from(payload).toString('base64url')}.${signature}`;
  SESSION_BUCKET.set(token, { role, expiresAt });
  return { token, expiresAt };
}

function verifyAdminSession(token) {
  if (!token) return null;
  const cached = SESSION_BUCKET.get(token);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const parts = String(token).split('.');
  if (parts.length !== 2) return null;
  const payload = Buffer.from(parts[0], 'base64url').toString('utf8');
  const expected = crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('hex');
  if (expected !== parts[1]) return null;

  const [role, expiresAtRaw] = payload.split(':');
  const expiresAt = Number(expiresAtRaw);
  if (!role || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
  if (role !== 'coordenador' && role !== 'dirigente') return null;

  const session = { role, expiresAt };
  SESSION_BUCKET.set(token, session);
  return session;
}

function requireAdminToken(req) {
  const required = process.env.ADMIN_API_TOKEN;
  if (!required) return true;
  const incoming = String(req.headers['x-admin-token'] || '');
  return incoming.length > 0 && incoming === required;
}

function requireAdminAccess(req) {
  if (requireAdminToken(req)) return true;
  const session = verifyAdminSession(String(req.headers['x-admin-session'] || ''));
  return Boolean(session);
}

function requireDirigenteAccess(req) {
  if (requireAdminToken(req)) return true;
  const session = verifyAdminSession(String(req.headers['x-admin-session'] || ''));
  return session?.role === 'dirigente';
}

// Campos do config que cada papel pode mutar.
// Coordenador pode ajustar apenas o "operacional" (prazo + trava de etapa);
// tudo mais (catalogo, equipes, pix, branding) exige Dirigente.
const OPERATIONAL_FIELDS = new Set(['prazo', 'etapa_locked']);

function getConfigMutationFields(body) {
  const fields = [];
  if (Array.isArray(body?.produtos)) fields.push('produtos');
  if (Array.isArray(body?.cores)) fields.push('cores');
  if (Array.isArray(body?.equipes)) fields.push('equipes');
  if (typeof body?.nome_evento === 'string') fields.push('nome_evento');
  if (typeof body?.pix_chave === 'string') fields.push('pix_chave');
  if (typeof body?.pix_nome === 'string') fields.push('pix_nome');
  if (typeof body?.pix_cidade === 'string') fields.push('pix_cidade');
  if (typeof body?.pix_qr === 'string') fields.push('pix_qr');
  if (typeof body?.logo === 'string') fields.push('logo');
  if (typeof body?.prazo === 'string') fields.push('prazo');
  if (body?.etapa_locked != null) fields.push('etapa_locked');
  return fields;
}

function isOperationalOnlyConfigUpdate(body) {
  const fields = getConfigMutationFields(body);
  return fields.length > 0 && fields.every((field) => OPERATIONAL_FIELDS.has(field));
}

function requireConfigUpdateAccess(req, body) {
  if (isOperationalOnlyConfigUpdate(body)) return requireAdminAccess(req);
  return requireDirigenteAccess(req);
}

module.exports = {
  dbGet,
  dbSet,
  dbGetExternal,
  resolveEtapaLock,
  sanitizeText,
  validateEtapa,
  applySecurityHeaders,
  isRateLimited,
  requireAdminToken,
  requireAdminAccess,
  requireDirigenteAccess,
  requireConfigUpdateAccess,
  isOperationalOnlyConfigUpdate,
  createAdminSession,
  verifyAdminSession,
  getSessionSecret,
};
