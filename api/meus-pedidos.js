const { dbGet, validateEtapa, applySecurityHeaders, isRateLimited } = require('./_firebase');

function digitsOnly(value) {
  return String(value || '').replace(/\D+/g, '');
}

function resumoItens(itens) {
  const lista = Array.isArray(itens) ? itens : [];
  const pecas = lista.reduce((acc, item) => acc + (Number(item?.quantidade) || 0), 0);
  return `${pecas} peça${pecas === 1 ? '' : 's'}`;
}

// Busca publica por telefone. Retorna apenas o minimo necessario para o cliente
// reencontrar o proprio pedido e (re)enviar o comprovante — sem expor PII de
// terceiros (nome/telefone/itens detalhados nao sao retornados).
async function listMeusPedidos(req, res) {
  if (isRateLimited(req, 'meus-pedidos:lookup', 15, 60_000)) {
    return res.status(429).json({ error: 'rate_limit_exceeded' });
  }

  const etapa = validateEtapa(req.query?.etapa || 1);
  const tel = digitsOnly(req.query?.tel);
  if (tel.length < 10) return res.status(400).json({ error: 'tel inválido' });

  const raw = (await dbGet(`pedidos/etapa${etapa}`)) || {};
  const data = Object.values(raw)
    .filter((p) => digitsOnly(p?.tel) === tel)
    .map((p) => ({
      id: p.id,
      total: p.total,
      pago: Boolean(p.pago),
      comprovante: Boolean(p.comprovante),
      data: p.data,
      resumo: resumoItens(p.itens),
    }));

  return res.status(200).json({ etapa, data });
}

module.exports = async function handler(req, res) {
  try {
    applySecurityHeaders(res);
    if (req.method === 'GET') return await listMeusPedidos(req, res);
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    return res.status(400).json({ error: 'invalid_request', detail: err.message });
  }
};
