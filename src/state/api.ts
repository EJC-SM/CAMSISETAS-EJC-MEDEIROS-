import { adminAuthHeaders } from '../utils/auth';
import type { ConfigData, Etapa, ItemPedido, Pedido } from './types';

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

async function requestJson<T>(url: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, { cache: 'no-store', ...init });
    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};
    if (!response.ok) {
      return { ok: false, status: response.status, error: payload.error || 'request_failed' };
    }
    return { ok: true, status: response.status, data: payload as T };
  } catch {
    return { ok: false, status: 0, error: 'network_error' };
  }
}

function jsonHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { 'Content-Type': 'application/json', ...extra };
}

export async function fetchConfig(etapa: Etapa): Promise<ConfigData | null> {
  const result = await requestJson<{ etapa: Etapa; data: ConfigData }>(`/api/config?etapa=${etapa}`);
  return result.ok && result.data ? result.data.data : null;
}

export async function fetchPedidos(etapa: Etapa): Promise<Pedido[] | null> {
  const result = await requestJson<{ etapa: Etapa; data: Pedido[] }>(`/api/pedidos?etapa=${etapa}`, {
    headers: adminAuthHeaders(),
  });
  return result.ok && result.data ? result.data.data : null;
}

export interface NovoPedidoInput {
  nome: string;
  tel: string;
  equipe: string;
  itens: Array<Pick<ItemPedido, 'produto' | 'tamanho' | 'gola' | 'cor' | 'quantidade'>>;
}

export async function criarPedido(
  etapa: Etapa,
  input: NovoPedidoInput,
): Promise<ApiResult<{ data: Pedido }>> {
  return requestJson<{ data: Pedido }>('/api/pedidos', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ etapa, ...input }),
  });
}

export async function marcarPago(
  etapa: Etapa,
  id: number,
  pago: boolean,
): Promise<ApiResult<{ data: Pedido }>> {
  return requestJson<{ data: Pedido }>('/api/pedidos', {
    method: 'PUT',
    headers: jsonHeaders(adminAuthHeaders()),
    body: JSON.stringify({ etapa, id, pago }),
  });
}

export async function atualizarConfig(
  etapa: Etapa,
  patch: Partial<ConfigData>,
): Promise<ApiResult<{ data: ConfigData }>> {
  return requestJson<{ data: ConfigData }>('/api/config', {
    method: 'PUT',
    headers: jsonHeaders(adminAuthHeaders()),
    body: JSON.stringify({ etapa, ...patch }),
  });
}

export interface AdminActionInput {
  action: 'reset_pedidos' | 'reset_catalogo' | 'lock_etapa' | 'change_password';
  etapa?: Etapa;
  lock_etapa?: number;
  password_role?: 'coordenador' | 'dirigente';
  passwordHash?: string;
}

export async function adminAction(input: AdminActionInput): Promise<ApiResult<Record<string, unknown>>> {
  return requestJson<Record<string, unknown>>('/api/admin', {
    method: 'POST',
    headers: jsonHeaders(adminAuthHeaders()),
    body: JSON.stringify(input),
  });
}

export async function initialSetup(
  setupToken: string,
  coordHash: string,
  dirHash: string,
): Promise<ApiResult<{ ok: boolean }>> {
  return requestJson<{ ok: boolean }>('/api/auth/initial-setup', {
    method: 'POST',
    headers: jsonHeaders({ 'x-setup-token': setupToken }),
    body: JSON.stringify({ coordHash, dirHash }),
  });
}
