const {
  dbGet,
  dbSet,
  sanitizeText,
  validateEtapa,
  applySecurityHeaders,
  isRateLimited,
  requireAdminAccess,
} = require('./_lib/_firebase');

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
// Teto do conteudo armazenado (base64 decodificado). Cobre o PDF de ate 3MB e
// as imagens ja comprimidas no cliente, com folga.
const MAX_STORED_BYTES = 4 * 1024 * 1024;
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

function digitsOnly(value) {
  return String(value || '').replace(/\D+/g, '');
}

function base64Bytes(b64) {
  const len = b64.length;
  const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((len * 3) / 4) - pad;
}

async function uploadComprovante(req, res) {
  if (isRateLimited(req, 'comprovante:upload', 10, 60_000)) {
    return res.status(429).json({ error: 'rate_limit_exceeded' });
  }

  const etapa = validateEtapa(req.body?.etapa);
  const id = String(Number(req.body?.id || 0));
  if (!id || id === '0' || id === 'NaN') return badRequest(res, 'id is required');

  const tel = digitsOnly(req.body?.tel);
  const file = req.body?.file || {};
  const type = sanitizeText(file.type, 40);
  const name = sanitizeText(file.name, 120) || 'comprovante';
  const data = typeof file.dataBase64 === 'string' ? file.dataBase64.trim() : '';

  if (!ALLOWED_TYPES.has(type)) return badRequest(res, 'tipo de arquivo não permitido');
  if (!data || !BASE64_RE.test(data)) return badRequest(res, 'arquivo inválido');
  if (base64Bytes(data) > MAX_STORED_BYTES) return badRequest(res, 'arquivo muito grande');

  const raw = (await dbGet(`pedidos/etapa${etapa}`)) || {};
  const pedido = raw[id];
  if (!pedido) return res.status(404).json({ error: 'pedido not found' });

  // Confere o telefone do pedido para reduzir abuso/enchimento de storage por
  // terceiros que nao fizeram o pedido.
  if (!tel || digitsOnly(pedido.tel) !== tel) {
    return res.status(403).json({ error: 'tel_mismatch' });
  }

  const uploadedAt = new Date().toISOString();
  await dbSet(`comprovantes/etapa${etapa}/${id}`, { name, type, data, uploadedAt });

  pedido.comprovante = true;
  pedido.comprovanteAt = uploadedAt;
  raw[id] = pedido;
  await dbSet(`pedidos/etapa${etapa}`, raw);

  return res.status(201).json({ ok: true, etapa, id: Number(id), uploadedAt });
}

async function getComprovante(req, res) {
  if (!requireAdminAccess(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const etapa = validateEtapa(req.query?.etapa || 1);
  const id = String(Number(req.query?.id || 0));
  if (!id || id === '0' || id === 'NaN') return badRequest(res, 'id is required');

  const stored = await dbGet(`comprovantes/etapa${etapa}/${id}`);
  if (!stored) return res.status(404).json({ error: 'comprovante not found' });

  return res.status(200).json({
    etapa,
    id: Number(id),
    data: { name: stored.name, type: stored.type, dataBase64: stored.data, uploadedAt: stored.uploadedAt },
  });
}

module.exports = async function handler(req, res) {
  try {
    applySecurityHeaders(res);
    if (req.method === 'POST') return await uploadComprovante(req, res);
    if (req.method === 'GET') return await getComprovante(req, res);
    res.setHeader('Allow', 'GET,POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    return res.status(400).json({ error: 'invalid_request', detail: err.message });
  }
};
