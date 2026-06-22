export function formatBRL(value: number): string {
  return `R$ ${Number(value || 0)
    .toFixed(2)
    .replace('.', ',')}`;
}

export function formatDateTimeBr(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPrazoLongo(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function countdown(targetIso: string, now: number = Date.now()): string {
  const target = new Date(targetIso).getTime();
  if (!Number.isFinite(target)) return '';
  const diff = target - now;
  if (diff <= 0) return 'Encerrado';
  const totalSec = Math.floor(diff / 1000);
  const dias = Math.floor(totalSec / 86400);
  const horas = Math.floor((totalSec % 86400) / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const seg = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (dias > 0) return `${dias}d ${pad(horas)}h ${pad(min)}m`;
  return `${pad(horas)}:${pad(min)}:${pad(seg)}`;
}
