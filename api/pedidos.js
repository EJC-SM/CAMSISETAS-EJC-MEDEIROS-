const {
  dbGet,
  dbSet,
  sanitizeText,
  validateEtapa,
  applySecurityHeaders,
  isRateLimited,
  requireAdminAccess,
} = require('./_firebase');
const { withDefaults } = require('./catalogo-defaults.cjs');

function badRequest(res, message) {
  res.status(400).json({ error: message });
}

// Replica a regra de preco do app legado, mas sempre a partir do catalogo do servidor.
function getPreco(produto, tamanho) {
  const p = produto?.precos || {};
  if (p.all != null) return Number(p.all) || 0;
  if (tamanho === 'EGG') return Number(p.EGG ?? p.EG ?? p['P-GG']) || 0;
  if (tamanho === 'XG') return Number(p.XG ?? p['P-GG']) || 0;
  if (tamanho === 'EG') return Number(p.EG ?? p['P-GG']) || 0;
  return Number(p['P-GG']) || 0;
}

function findProduto(produtos, ref) {
  return produtos.find((p) => p.tipo === ref || p.id === ref) || null;
}

function validateItens(itens, cfg) {
  if (!Array.isArray(itens) || itens.length === 0) {
    throw new Error('itens must be a non-empty array');
  }
  if (itens.length > 50) {
    throw new Error('too many itens');
  }

  const produtos = cfg.produtos || [];
  const coresValidas = new Set((cfg.cores || []).map((c) => c.nome));

  return itens.map((item) => {
    const produtoRef = sanitizeText(item?.produto, 80);
    const tamanho = sanitizeText(item?.tamanho, 10);
    const gola = sanitizeText(item?.gola, 30);
    const cor = sanitizeText(item?.cor, 40);
    const quantidade = Number(item?.quantidade);

    const produto = findProduto(produtos, produtoRef);
    if (!produto) throw new Error(`produto inválido: ${produtoRef}`);
    if (!produto.tamanhos.includes(tamanho)) throw new Error(`tamanho inválido para ${produtoRef}`);
    if (!cor) throw new Error('cor é obrigatória');
    if (coresValidas.size > 0 && !coresValidas.has(cor)) throw new Error(`cor inválida: ${cor}`);
    if ((produto.cores_excluidas || []).includes(cor)) throw new Error(`cor indisponível para ${produtoRef}`);
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 99) {
      throw new Error('quantidade must be integer between 1 and 99');
    }

    const preco = getPreco(produto, tamanho);
    return {
      produto: produto.tipo,
      tamanho,
      gola: gola || '',
      cor,
      quantidade,
      preco,
    };
  });
}

async function loadConfig() {
  return withDefaults((await dbGet('config')) || {});
}

function pedidosEncerrados(cfg, etapa) {
  const prazo = cfg[`prazo${etapa}`];
  if (!prazo) return false;
  const deadline = new Date(prazo);
  return Number.isFinite(deadline.getTime()) && Date.now() >= deadline.getTime();
}

async function listPedidos(req, res) {
  // Pedidos contem dados pessoais (nome + WhatsApp): leitura exige sessao admin.
  if (!requireAdminAccess(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const etapa = validateEtapa(req.query.etapa || 1);
  const raw = (await dbGet(`pedidos/etapa${etapa}`)) || {};
  const list = Object.values(raw);
  res.status(200).json({ etapa, data: list });
}

async function createPedido(req, res) {
  if (isRateLimited(req, 'pedidos:create', 20, 60_000)) {
    return res.status(429).json({ error: 'rate_limit_exceeded' });
  }

  const etapa = validateEtapa(req.body?.etapa);
  const cfg = await loadConfig();

  if (cfg.etapa_locked && Number(cfg.etapa_locked) !== etapa) {
    return res.status(409).json({ error: 'etapa_locked' });
  }
  if (pedidosEncerrados(cfg, etapa)) {
    return res.status(409).json({ error: 'pedidos_encerrados' });
  }

  const nome = sanitizeText(req.body?.nome, 80);
  const tel = sanitizeText(req.body?.tel, 20);
  const equipe = sanitizeText(req.body?.equipe, 60);
  const itens = validateItens(req.body?.itens, cfg);

  if (!nome) return badRequest(res, 'nome is required');
  if (!equipe) return badRequest(res, 'equipe is required');

  const equipesValidas = cfg[`equipes${etapa}`] || [];
  if (equipesValidas.length > 0 && !equipesValidas.includes(equipe)) {
    return badRequest(res, 'equipe inválida');
  }

  const total = itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  const raw = (await dbGet(`pedidos/etapa${etapa}`)) || {};
  const id = Date.now();
  const pedido = {
    id,
    nome,
    tel,
    equipe,
    itens,
    total,
    pago: false,
    data: new Date().toISOString(),
  };

  raw[String(id)] = pedido;
  await dbSet(`pedidos/etapa${etapa}`, raw);

  res.status(201).json({ etapa, data: pedido });
}

async function updatePago(req, res) {
  if (!requireAdminAccess(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (isRateLimited(req, 'pedidos:update', 40, 60_000)) {
    return res.status(429).json({ error: 'rate_limit_exceeded' });
  }

  const etapa = validateEtapa(req.body?.etapa);
  const id = String(Number(req.body?.id || 0));
  if (!id || id === '0' || id === 'NaN') return badRequest(res, 'id is required');

  const raw = (await dbGet(`pedidos/etapa${etapa}`)) || {};
  const found = raw[id];
  if (!found) return res.status(404).json({ error: 'pedido not found' });

  found.pago = Boolean(req.body?.pago);
  raw[id] = found;
  await dbSet(`pedidos/etapa${etapa}`, raw);
  res.status(200).json({ etapa, data: found });
}

module.exports = async function handler(req, res) {
  try {
    applySecurityHeaders(res);

    if (req.method === 'GET') return await listPedidos(req, res);
    if (req.method === 'POST') return await createPedido(req, res);
    if (req.method === 'PUT') return await updatePago(req, res);

    res.setHeader('Allow', 'GET,POST,PUT');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    return res.status(400).json({ error: 'invalid_request', detail: err.message });
  }
};
