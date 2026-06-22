import { describe, expect, it } from 'vitest';
import { countdown, formatBRL } from '../../src/utils/format';

describe('formatBRL', () => {
  it('formata em reais com vírgula', () => {
    expect(formatBRL(40)).toBe('R$ 40,00');
    expect(formatBRL(55.5)).toBe('R$ 55,50');
    expect(formatBRL(0)).toBe('R$ 0,00');
  });
});

describe('countdown', () => {
  it('retorna Encerrado quando já passou', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(countdown(past)).toBe('Encerrado');
  });
  it('mostra dias quando faltam mais de 24h', () => {
    const now = Date.parse('2026-01-01T00:00:00Z');
    const target = new Date(now + (2 * 86400 + 3600) * 1000).toISOString();
    expect(countdown(target, now)).toMatch(/^2d/);
  });
});
