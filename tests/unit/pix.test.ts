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

  it('não inclui o campo de valor (54) quando não há valor', () => {
    const payload = pixPayload('chave@x.com', 'EJC', 'SP');
    expect(payload).not.toContain('5405');
    expect(payload).not.toContain('5406');
  });

  it('embute o valor no campo 54 com duas casas decimais', () => {
    const payload = pixPayload('chave@x.com', 'EJC', 'SP', 12.5);
    // 54 = id, 05 = tamanho de "12.50"
    expect(payload).toContain('540512.50');
    expect(/[0-9A-F]{4}$/.test(payload)).toBe(true);
  });

  it('ignora valores inválidos ou não positivos', () => {
    expect(pixPayload('chave@x.com', 'EJC', 'SP', 0)).not.toContain('5405');
    expect(pixPayload('chave@x.com', 'EJC', 'SP', Number.NaN)).not.toContain('5405');
    expect(pixPayload('chave@x.com', 'EJC', 'SP', -5)).not.toContain('5405');
  });

  it('mantém o valor entre os campos 53 (moeda) e 58 (país)', () => {
    const payload = pixPayload('chave@x.com', 'EJC', 'SP', 99.9);
    const idx53 = payload.indexOf('5303986');
    const idx54 = payload.indexOf('540599.90');
    const idx58 = payload.indexOf('5802BR');
    expect(idx53).toBeGreaterThanOrEqual(0);
    expect(idx54).toBeGreaterThan(idx53);
    expect(idx58).toBeGreaterThan(idx54);
  });
});

describe('pixQrUrl', () => {
  it('codifica o payload na querystring', () => {
    const url = pixQrUrl('000201ABC');
    expect(url).toContain('api.qrserver.com');
    expect(url).toContain(encodeURIComponent('000201ABC'));
  });
});
