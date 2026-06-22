const {
  dbGet,
  dbSet,
  validateEtapa,
  applySecurityHeaders,
  isRateLimited,
  requireConfigUpdateAccess,
} = require('./_firebase');
const { defaultConfig, buildConfigPayload, applyConfigUpdate } = require('./catalogo-defaults.cjs');

async function getConfig(req, res) {
  const etapa = validateEtapa(req.query.etapa || 1);
  const cfg = (await dbGet('config')) || defaultConfig();
  res.status(200).json({ etapa, data: buildConfigPayload(cfg, etapa) });
}

async function updateConfig(req, res) {
  if (!requireConfigUpdateAccess(req, req.body)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (isRateLimited(req, 'config:update', 20, 60_000)) {
    return res.status(429).json({ error: 'rate_limit_exceeded' });
  }

  const etapa = validateEtapa(req.body?.etapa || 1);
  const cfg = (await dbGet('config')) || defaultConfig();
  applyConfigUpdate(cfg, req.body, etapa);

  await dbSet('config', cfg);
  res.status(200).json({ etapa, data: buildConfigPayload(cfg, etapa) });
}

module.exports = async function handler(req, res) {
  try {
    applySecurityHeaders(res);

    if (req.method === 'GET') return await getConfig(req, res);
    if (req.method === 'PUT') return await updateConfig(req, res);

    res.setHeader('Allow', 'GET,PUT');
    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (err) {
    return res.status(500).json({ error: 'internal_error', detail: err.message });
  }
};
