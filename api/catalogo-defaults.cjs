// Defaults do catalogo de camisetas + helpers de config compartilhados entre a
// Vercel Function (`config.js`) e o dev-server local, para evitar divergencia.

function sanitizeText(value, maxLen) {
  const text = String(value || '')
    .replace(/[<>"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return maxLen ? text.slice(0, maxLen) : text;
}

const CORES_DEFAULT = [
  { id: 'amarelo', nome: 'Amarelo', hex: '#F5C518' },
  { id: 'azul-marinho', nome: 'Azul marinho', hex: '#1B2A6B' },
  { id: 'azul-royal', nome: 'Azul royal', hex: '#2255CC' },
  { id: 'azul-turquesa', nome: 'Azul turquesa', hex: '#1ABCB0' },
  { id: 'bordo', nome: 'Bordô', hex: '#6B1A2A' },
  { id: 'branco', nome: 'Branco', hex: '#FFFFFF', border: true },
  { id: 'cinza-claro', nome: 'Cinza claro', hex: '#C8C8C8' },
  { id: 'grafite', nome: 'Grafite', hex: '#444444' },
  { id: 'laranja', nome: 'Laranja', hex: '#E8621A' },
  { id: 'preto', nome: 'Preto', hex: '#111111' },
  { id: 'rosa-bebe', nome: 'Rosa bebê', hex: '#F9AECB' },
  { id: 'rosa-pink', nome: 'Rosa pink', hex: '#E8198A' },
  { id: 'roxo', nome: 'Roxo', hex: '#6B1FCC' },
  { id: 'verde-bandeira', nome: 'Verde Bandeira', hex: '#007940' },
  { id: 'verde-limao', nome: 'Verde limão', hex: '#99CC00' },
  { id: 'verde-musgo', nome: 'Verde musgo', hex: '#4A6B2A' },
  { id: 'vermelho', nome: 'Vermelho', hex: '#CC1A1A' },
];

const PRODUTOS_DEFAULT = [
  {
    id: 'camiseta-basica',
    tipo: 'Camiseta básica',
    foto_key: 'camiseta-basica',
    tamanhos: ['P', 'M', 'G', 'GG', 'EG', 'EGG'],
    golas: ['Gola V', 'Gola Careca'],
    precos: { 'P-GG': 40, EG: 45, EGG: 55 },
    cores_excluidas: [],
    obs: '',
  },
  {
    id: 'baby-look',
    tipo: 'Baby Look',
    foto_key: 'baby-look',
    tamanhos: ['P', 'M', 'G', 'GG', 'EG'],
    golas: ['Gola V', 'Gola Careca'],
    precos: { 'P-GG': 40, EG: 45 },
    cores_excluidas: [],
    obs: '',
  },
  {
    id: 'camiseta-manga-longa',
    tipo: 'Camiseta manga longa',
    foto_key: 'camiseta-manga-longa',
    tamanhos: ['P', 'M', 'G', 'GG', 'EG'],
    golas: ['Gola V', 'Gola Careca'],
    precos: { 'P-GG': 50, EG: 60 },
    cores_excluidas: [],
    obs: '',
  },
  {
    id: 'polo',
    tipo: 'Polo',
    foto_key: 'polo',
    tamanhos: ['P', 'M', 'G', 'GG', 'EG', 'EGG'],
    golas: ['Masculina', 'Feminina'],
    precos: { 'P-GG': 50, EG: 55, EGG: 70 },
    cores_excluidas: ['Roxo', 'Azul royal', 'Bordô'],
    obs: 'Cores reduzidas',
  },
  {
    id: 'infantil',
    tipo: 'Infantil (00–08)',
    foto_key: 'infantil',
    tamanhos: ['0', '2', '4', '6', '8'],
    golas: ['—'],
    precos: { all: 30 },
    cores_excluidas: [],
    obs: '',
  },
  {
    id: 'juvenil',
    tipo: 'Juvenil (10–16)',
    foto_key: 'juvenil',
    tamanhos: ['10', '12', '14', '16'],
    golas: ['—'],
    precos: { all: 35 },
    cores_excluidas: [],
    obs: '',
  },
  {
    id: 'blusao-basico',
    tipo: 'Blusão básico',
    foto_key: 'blusao-basico',
    tamanhos: ['P', 'M', 'G', 'GG', 'XG'],
    golas: ['—'],
    precos: { 'P-GG': 60, XG: 70 },
    cores_excluidas: [],
    obs: 'Cores reduzidas',
  },
  {
    id: 'blusao-canguru',
    tipo: 'Blusão canguru s/ zíper',
    foto_key: 'blusao-canguru',
    tamanhos: ['P', 'M', 'G', 'GG', 'XG'],
    golas: ['—'],
    precos: { all: 80 },
    cores_excluidas: [],
    obs: 'Cores reduzidas',
  },
];

const EQUIPES1_DEFAULT = [
  'Apoio',
  'Círculo',
  'Cozinha',
  'Dirigente',
  'Divulgação',
  'Eventos',
  'Folclore',
  'Liturgia',
  'Ordem',
  'Sala',
  'Secretaria',
  'Sexteto',
  'Trânsito',
  'Visitação A',
  'Visitação B',
];

const EQUIPES2_DEFAULT = [
  'Apoio',
  'Cozinha',
  'Dirigente',
  'Divulgação',
  'Eventos',
  'Folclore',
  'Gesto Concreto',
  'Grupo de Estudo',
  'Liturgia',
  'Ordem',
  'Sala',
  'Secretaria',
  'Segurança',
  'Sexteto',
  'Visitação',
];

const PIX_DEFAULT = {
  pix_chave: 'financasejcmedeiros@gmail.com',
  pix_nome: 'EJC Medeiros',
  pix_cidade: 'Sao Paulo',
};

function defaultConfig() {
  return {
    produtos: PRODUTOS_DEFAULT.map((p) => ({ ...p })),
    cores: CORES_DEFAULT.map((c) => ({ ...c })),
    equipes1: [...EQUIPES1_DEFAULT],
    equipes2: [...EQUIPES2_DEFAULT],
    nome_evento: 'EJC Medeiros — Camisetas',
    logo: '',
    ...PIX_DEFAULT,
    pix_qr: '',
    prazo1: '',
    prazo2: '',
    etapa_locked: 0,
  };
}

function sanitizePrecos(precos) {
  if (!precos || typeof precos !== 'object') return {};
  const out = {};
  let count = 0;
  for (const rawKey of Object.keys(precos)) {
    if (count >= 12) break;
    const key = sanitizeText(rawKey, 10);
    if (!key) continue;
    const value = Math.max(0, Math.min(100000, Number(precos[rawKey] || 0)));
    out[key] = value;
    count += 1;
  }
  return out;
}

function sanitizeStringList(list, maxLen, maxItems) {
  if (!Array.isArray(list)) return [];
  return list
    .map((value) => sanitizeText(value, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function sanitizeProdutos(produtos) {
  if (!Array.isArray(produtos)) return [];
  return produtos
    .map((p) => ({
      id: sanitizeText(p?.id, 40) || sanitizeText(p?.tipo, 40).toLowerCase().replace(/\s+/g, '-'),
      tipo: sanitizeText(p?.tipo, 80),
      foto_key: sanitizeText(p?.foto_key, 60),
      tamanhos: sanitizeStringList(p?.tamanhos, 10, 30),
      golas: sanitizeStringList(p?.golas, 30, 10),
      precos: sanitizePrecos(p?.precos),
      cores_excluidas: sanitizeStringList(p?.cores_excluidas, 40, 40),
      obs: sanitizeText(p?.obs, 120),
    }))
    .filter((p) => p.tipo && p.tamanhos.length > 0)
    .slice(0, 60);
}

function sanitizeCores(cores) {
  if (!Array.isArray(cores)) return [];
  return cores
    .map((c) => {
      const nome = sanitizeText(c?.nome, 40);
      const hexRaw = sanitizeText(c?.hex, 7);
      const hex = /^#[0-9a-fA-F]{6}$/.test(hexRaw) ? hexRaw : '#000000';
      return {
        id: sanitizeText(c?.id, 40) || nome.toLowerCase().replace(/\s+/g, '-'),
        nome,
        hex,
        border: Boolean(c?.border),
      };
    })
    .filter((c) => c.nome)
    .slice(0, 60);
}

// Mescla um config armazenado (possivelmente vazio/parcial) sobre os defaults,
// garantindo catalogo utilizavel mesmo logo apos o setup inicial.
function withDefaults(cfg) {
  const source = cfg && typeof cfg === 'object' ? cfg : {};
  return {
    ...source,
    produtos: source.produtos?.length ? source.produtos : PRODUTOS_DEFAULT.map((p) => ({ ...p })),
    cores: source.cores?.length ? source.cores : CORES_DEFAULT.map((c) => ({ ...c })),
    equipes1: source.equipes1?.length ? source.equipes1 : [...EQUIPES1_DEFAULT],
    equipes2: source.equipes2?.length ? source.equipes2 : [...EQUIPES2_DEFAULT],
    nome_evento: source.nome_evento || 'EJC Medeiros — Camisetas',
    logo: source.logo || '',
    pix_chave: source.pix_chave || PIX_DEFAULT.pix_chave,
    pix_nome: source.pix_nome || PIX_DEFAULT.pix_nome,
    pix_cidade: source.pix_cidade || PIX_DEFAULT.pix_cidade,
    pix_qr: source.pix_qr || '',
    prazo1: source.prazo1 || '',
    prazo2: source.prazo2 || '',
    etapa_locked: Number(source.etapa_locked || 0),
  };
}

function buildConfigPayload(cfg, etapa) {
  const full = withDefaults(cfg);
  return {
    produtos: full.produtos,
    cores: full.cores,
    equipes: full[`equipes${etapa}`] || [],
    nome_evento: full.nome_evento,
    logo: full.logo,
    pix_chave: full.pix_chave,
    pix_nome: full.pix_nome,
    pix_cidade: full.pix_cidade,
    pix_qr: full.pix_qr,
    prazo: full[`prazo${etapa}`] || '',
    etapa_locked: full.etapa_locked,
  };
}

// Aplica no objeto `cfg` apenas os campos presentes em `body` (ja com checagem de papel feita fora).
function applyConfigUpdate(cfg, body, etapa) {
  if (Array.isArray(body?.produtos)) cfg.produtos = sanitizeProdutos(body.produtos);
  if (Array.isArray(body?.cores)) cfg.cores = sanitizeCores(body.cores);
  if (Array.isArray(body?.equipes)) {
    cfg[`equipes${etapa}`] = sanitizeStringList(body.equipes, 60, 60);
  }
  if (typeof body?.nome_evento === 'string') cfg.nome_evento = sanitizeText(body.nome_evento, 80);
  if (typeof body?.pix_chave === 'string') cfg.pix_chave = sanitizeText(body.pix_chave, 120);
  if (typeof body?.pix_nome === 'string') cfg.pix_nome = sanitizeText(body.pix_nome, 60);
  if (typeof body?.pix_cidade === 'string') cfg.pix_cidade = sanitizeText(body.pix_cidade, 60);
  if (typeof body?.pix_qr === 'string') cfg.pix_qr = String(body.pix_qr).slice(0, 500000);
  if (typeof body?.logo === 'string') cfg.logo = String(body.logo).slice(0, 500000);
  if (typeof body?.prazo === 'string') cfg[`prazo${etapa}`] = sanitizeText(body.prazo, 40);
  if (body?.etapa_locked != null) {
    const lock = Number(body.etapa_locked);
    if (lock === 0 || lock === 1 || lock === 2) cfg.etapa_locked = lock;
  }
  return cfg;
}

module.exports = {
  sanitizeText,
  CORES_DEFAULT,
  PRODUTOS_DEFAULT,
  EQUIPES1_DEFAULT,
  EQUIPES2_DEFAULT,
  PIX_DEFAULT,
  defaultConfig,
  withDefaults,
  sanitizeProdutos,
  sanitizeCores,
  buildConfigPayload,
  applyConfigUpdate,
};
