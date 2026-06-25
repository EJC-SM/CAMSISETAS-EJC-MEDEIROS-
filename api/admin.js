const {
  dbGet,
  dbSet,
  sanitizeText,
  validateEtapa,
  applySecurityHeaders,
  isRateLimited,
  requireDirigenteAccess,
} = require('./_lib/_firebase');
const { setPasswordHash } = require('./_lib/password');
const { defaultConfig, PRODUTOS_DEFAULT, CORES_DEFAULT } = require('./_lib/catalogo-defaults.cjs');

async function handleAdmin(req, res) {
  if (!requireDirigenteAccess(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (isRateLimited(req, 'admin:action', 15, 60_000)) {
    return res.status(429).json({ error: 'rate_limit_exceeded' });
  }

  const etapa = validateEtapa(req.body?.etapa || 1);
  const action = sanitizeText(req.body?.action, 40);
  const cfg = (await dbGet('config')) || defaultConfig();

  if (action === 'reset_pedidos') {
    await dbSet(`pedidos/etapa${etapa}`, {});
    return res.status(200).json({ ok: true, etapa });
  }

  if (action === 'reset_catalogo') {
    cfg.produtos = PRODUTOS_DEFAULT.map((p) => ({ ...p }));
    cfg.cores = CORES_DEFAULT.map((c) => ({ ...c }));
    await dbSet('config', cfg);
    return res.status(200).json({ ok: true });
  }

  if (action === 'lock_etapa') {
    const lock = Number(req.body?.lock_etapa || 0);
    if (lock !== 0 && lock !== 1 && lock !== 2) {
      return res.status(400).json({ error: 'invalid_lock' });
    }
    cfg.etapa_locked = lock;
    await dbSet('config', cfg);
    return res.status(200).json({ ok: true, etapa_locked: lock });
  }

  if (action === 'change_password') {
    const role = sanitizeText(req.body?.password_role, 20);
    const passwordHash = sanitizeText(req.body?.passwordHash, 128);

    if (role !== 'coordenador' && role !== 'dirigente') {
      return res.status(400).json({ error: 'invalid_role' });
    }

    const result = await setPasswordHash(role, passwordHash);
    if (!result.ok) {
      const status = result.error === 'setup_required' ? 503 : 400;
      return res.status(status).json({ error: result.error });
    }

    return res.status(200).json({ ok: true, updatedAt: result.updatedAt });
  }

  return res.status(400).json({ error: 'invalid_action' });
}

module.exports = async function handler(req, res) {
  try {
    applySecurityHeaders(res);
    if (req.method === 'POST') return await handleAdmin(req, res);
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', detail: err.message });
  }
};
