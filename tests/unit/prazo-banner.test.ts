import { describe, expect, it } from 'vitest';
import { renderPrazoBanner } from '../../src/components/prazo-banner';

describe('renderPrazoBanner', () => {
  it('retorna null quando não há prazo ou a data é inválida', () => {
    expect(renderPrazoBanner('')).toBeNull();
    expect(renderPrazoBanner('data-invalida')).toBeNull();
  });

  it('mostra a contagem regressiva para um prazo futuro', () => {
    const futuro = new Date(Date.now() + 3 * 86_400_000).toISOString();
    const banner = renderPrazoBanner(futuro);
    expect(banner).not.toBeNull();
    expect(banner?.classList.contains('is-encerrado')).toBe(false);
    expect(banner?.querySelector('.prazo-banner__timer')?.textContent).not.toBe('Encerrado');
  });

  it('marca como encerrado quando o prazo já passou', () => {
    const passado = new Date(Date.now() - 1000).toISOString();
    const banner = renderPrazoBanner(passado);
    expect(banner).not.toBeNull();
    expect(banner?.classList.contains('is-encerrado')).toBe(true);
  });
});
