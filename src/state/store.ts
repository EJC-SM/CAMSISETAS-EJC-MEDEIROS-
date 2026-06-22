import type { ConfigData, Cor, Etapa, Pedido, Produto } from './types';

export const CORES_DEFAULT: Cor[] = [
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

export const PRODUTOS_DEFAULT: Produto[] = [
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

export const EQUIPES_DEFAULT: Record<Etapa, string[]> = {
  1: [
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
  ],
  2: [
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
  ],
};

export function defaultConfig(etapa: Etapa): ConfigData {
  return {
    produtos: PRODUTOS_DEFAULT.map((p) => ({ ...p })),
    cores: CORES_DEFAULT.map((c) => ({ ...c })),
    equipes: [...EQUIPES_DEFAULT[etapa]],
    nome_evento: 'EJC Medeiros — Camisetas',
    logo: '',
    pix_chave: 'financasejcmedeiros@gmail.com',
    pix_nome: 'EJC Medeiros',
    pix_cidade: 'Sao Paulo',
    pix_qr: '',
    prazo: '',
    etapa_locked: 0,
  };
}

interface StoreState {
  etapa: Etapa;
  config: Record<Etapa, ConfigData>;
  pedidos: Record<Etapa, Pedido[]>;
}

const state: StoreState = {
  etapa: 1,
  config: { 1: defaultConfig(1), 2: defaultConfig(2) },
  pedidos: { 1: [], 2: [] },
};

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notify(): void {
  for (const listener of listeners) listener();
}

export function getEtapa(): Etapa {
  return state.etapa;
}

export function setEtapa(etapa: Etapa): void {
  state.etapa = etapa;
}

export function getConfig(etapa: Etapa = state.etapa): ConfigData {
  return state.config[etapa];
}

export function setConfig(etapa: Etapa, config: ConfigData): void {
  state.config[etapa] = config;
}

export function getEtapaLocked(): 0 | Etapa {
  return state.config[state.etapa].etapa_locked;
}

export function isEtapaSelectable(etapa: Etapa): boolean {
  const locked = getEtapaLocked();
  return locked === 0 || locked === etapa;
}

export function getPedidos(etapa: Etapa = state.etapa): Pedido[] {
  return state.pedidos[etapa];
}

export function setPedidos(etapa: Etapa, pedidos: Pedido[]): void {
  state.pedidos[etapa] = pedidos;
}

export function isPrazoEncerrado(etapa: Etapa = state.etapa): boolean {
  const prazo = state.config[etapa].prazo;
  if (!prazo) return false;
  const deadline = new Date(prazo).getTime();
  return Number.isFinite(deadline) && Date.now() >= deadline;
}
