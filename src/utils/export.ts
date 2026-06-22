import type { Pedido } from '../state/types';
import { formatBRL } from './format';

// Mitiga CSV/Formula Injection: celulas que comecam com =,+,-,@ recebem prefixo seguro.
function csvSafe(value: string): string {
  const text = String(value ?? '');
  const needsGuard = /^[=+\-@\t\r]/.test(text);
  const guarded = needsGuard ? `'${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
}

function itensToText(pedido: Pedido): string {
  return pedido.itens
    .map((item) => {
      const gola = item.gola && item.gola !== '—' ? ` ${item.gola}` : '';
      return `${item.quantidade}x ${item.produto} ${item.tamanho}${gola} ${item.cor}`;
    })
    .join(' | ');
}

export function pedidosToCsv(pedidos: Pedido[]): string {
  const header = ['Nome', 'WhatsApp', 'Equipe', 'Itens', 'Total', 'Pago', 'Data'];
  const rows = pedidos.map((pedido) => [
    csvSafe(pedido.nome),
    csvSafe(pedido.tel),
    csvSafe(pedido.equipe),
    csvSafe(itensToText(pedido)),
    csvSafe(formatBRL(pedido.total)),
    csvSafe(pedido.pago ? 'Sim' : 'Não'),
    csvSafe(new Date(pedido.data).toLocaleString('pt-BR')),
  ]);
  return [header.map(csvSafe).join(','), ...rows.map((row) => row.join(','))].join('\r\n');
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
