import { describe, expect, it } from 'vitest';
import { pixPayload, pixQrUrl } from '../../src/utils/pix';

describe('pixPayload', () => {
  it('gera um BR Code com cabeçalho e CRC de 4 dígitos hex', () => {
    const payload = pixPayload('financasejcmedeiros@gmail.com', 'EJC Medeiros', 'Sao Paulo');
    expect(payload.startsWith('000201')).toBe(true);
    expect(payload).toContain('BR.GOV.BCB.PIX');
    expect(payload).toContain('5802BR');
    expect(/[0-9A-F]{4}$/.test(payload)).toBe(true);
  });

  it('é determinístico para as mesmas entradas', () => {
    const a = pixPayload('chave@x.com', 'EJC', 'SP');
    const b = pixPayload('chave@x.com', 'EJC', 'SP');
    expect(a).toBe(b);
  });
});

describe('pixQrUrl', () => {
  it('codifica o payload na querystring', () => {
    const url = pixQrUrl('000201ABC');
    expect(url).toContain('api.qrserver.com');
    expect(url).toContain(encodeURIComponent('000201ABC'));
  });
});
