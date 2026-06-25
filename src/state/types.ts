export type Etapa = 1 | 2;

export type AuthRole = 'coordenador' | 'dirigente';

export interface Cor {
  id: string;
  nome: string;
  hex: string;
  border?: boolean;
}

export interface Produto {
  id: string;
  tipo: string;
  foto_key: string;
  tamanhos: string[];
  golas: string[];
  precos: Record<string, number>;
  cores_excluidas: string[];
  obs: string;
}

export interface ItemPedido {
  produto: string;
  tamanho: string;
  gola: string;
  cor: string;
  quantidade: number;
  preco: number;
}

export interface Pedido {
  id: number;
  nome: string;
  tel: string;
  equipe: string;
  itens: ItemPedido[];
  total: number;
  pago: boolean;
  data: string;
  comprovante?: boolean;
  comprovanteAt?: string;
}

export interface MeuPedidoResumo {
  id: number;
  total: number;
  pago: boolean;
  comprovante: boolean;
  data: string;
  resumo: string;
}

export interface ComprovanteArquivo {
  name: string;
  type: string;
  dataBase64: string;
  uploadedAt?: string;
}

export interface ConfigData {
  produtos: Produto[];
  cores: Cor[];
  equipes: string[];
  nome_evento: string;
  logo: string;
  pix_chave: string;
  pix_nome: string;
  pix_cidade: string;
  pix_qr: string;
  prazo: string;
  etapa_locked: 0 | Etapa;
}

export interface FirebaseRuntimeConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}
