const CSRF_SESSION_KEY = 'ejc_cam_csrf_token';

export function sanitizeText(value: string): string {
  return value
    .replace(/[<>"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function digitsOnly(value: string): string {
  return value.replace(/\D+/g, '');
}

export function formatPhoneBr(value: string): string {
  const d = digitsOnly(value).slice(0, 11);
  if (!d) return '';
  const isMobile = d.length > 10;
  const ddd = d.slice(0, 2);
  const mid = isMobile ? d.slice(2, 7) : d.slice(2, 6);
  const end = isMobile ? d.slice(7, 11) : d.slice(6, 10);
  let out = `(${ddd}`;
  if (d.length > 2) out += `) ${mid}`;
  if (end) out += `-${end}`;
  return out;
}

export function getOrCreateClientCsrfToken(): string {
  const existing = sessionStorage.getItem(CSRF_SESSION_KEY);
  if (existing) return existing;
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem(CSRF_SESSION_KEY, token);
  return token;
}

export function isValidClientCsrfToken(token: string): boolean {
  return token.length > 12 && token === sessionStorage.getItem(CSRF_SESSION_KEY);
}
