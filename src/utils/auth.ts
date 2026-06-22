import type { AuthRole } from '../state/types';
import { buildLoginProof } from './password-auth';

const SESSION_KEY = 'ejc_cam_admin_session';

interface AdminSession {
  role: AuthRole;
  token: string;
  expiresAt: number;
}

function readSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed.token || parsed.expiresAt < Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(session: AdminSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function currentRole(): AuthRole | null {
  return readSession()?.role ?? null;
}

export function isLoggedIn(role: AuthRole): boolean {
  const session = readSession();
  if (!session) return false;
  if (role === 'coordenador') return session.role === 'coordenador' || session.role === 'dirigente';
  return session.role === role;
}

export function getAdminSessionToken(): string | null {
  return readSession()?.token ?? null;
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function loginApi(role: AuthRole, password: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const proofPayload = await buildLoginProof(role, password);
    if ('error' in proofPayload) return { ok: false, message: proofPayload.error };

    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, proof: proofPayload.proof, nonce: proofPayload.nonce }),
    });
    const data = (await response.json()) as { token?: string; expiresAt?: number; error?: string };
    if (!response.ok || !data.token || !data.expiresAt) {
      return { ok: false, message: data.error || 'Credenciais inválidas.' };
    }
    writeSession({ role, token: data.token, expiresAt: data.expiresAt });
    return { ok: true };
  } catch {
    return { ok: false, message: 'Não foi possível autenticar agora.' };
  }
}

export function adminAuthHeaders(): Record<string, string> {
  const token = getAdminSessionToken();
  return token ? { 'x-admin-session': token } : {};
}
