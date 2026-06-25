import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_INPUT_BYTES, MAX_PDF_BYTES, validateComprovanteMeta } from '../../src/utils/comprovante';

describe('validateComprovanteMeta', () => {
  it('aceita imagem dentro do limite', () => {
    expect(validateComprovanteMeta({ type: 'image/jpeg', size: 2_000_000 }).valid).toBe(true);
    expect(validateComprovanteMeta({ type: 'image/png', size: 500_000 }).valid).toBe(true);
    expect(validateComprovanteMeta({ type: 'image/webp', size: 500_000 }).valid).toBe(true);
  });

  it('aceita PDF dentro do limite', () => {
    expect(validateComprovanteMeta({ type: 'application/pdf', size: MAX_PDF_BYTES }).valid).toBe(true);
  });

  it('rejeita tipos não permitidos', () => {
    const res = validateComprovanteMeta({ type: 'application/zip', size: 100 });
    expect(res.valid).toBe(false);
    expect(res.message).toMatch(/imagem|PDF/i);
  });

  it('rejeita PDF acima do teto', () => {
    const res = validateComprovanteMeta({ type: 'application/pdf', size: MAX_PDF_BYTES + 1 });
    expect(res.valid).toBe(false);
  });

  it('rejeita imagem acima do teto de entrada', () => {
    const res = validateComprovanteMeta({ type: 'image/jpeg', size: MAX_IMAGE_INPUT_BYTES + 1 });
    expect(res.valid).toBe(false);
  });
});
