import { describe, expect, it } from 'vitest';
import type { Pedido } from '../../src/state/types';
import { pedidosToCsv } from '../../src/utils/export';

const pedido: Pedido = {
  id: 1,
  nome: '=HYPERLINK(evil)',
  tel: '(11) 98888-7777',
  equipe: 'Cozinha',
  itens: [
    { produto: 'Camiseta básica', tamanho: 'M', gola: 'Gola V', cor: 'Preto', quantidade: 2, preco: 40 },
  ],
  total: 80,
  pago: true,
  data: '2026-06-20T12:00:00.000Z',
};

describe('pedidosToCsv', () => {
  it('inclui cabeçalho e dados', () => {
    const csv = pedidosToCsv([pedido]);
    expect(csv.split('\r\n')[0]).toContain('Nome');
    expect(csv).toContain('Cozinha');
    expect(csv).toContain('2x Camiseta básica M Gola V Preto');
  });

  it('neutraliza injeção de fórmula com aspas e prefixo seguro', () => {
    const csv = pedidosToCsv([pedido]);
    expect(csv).toContain(`"'=HYPERLINK(evil)"`);
  });
});
