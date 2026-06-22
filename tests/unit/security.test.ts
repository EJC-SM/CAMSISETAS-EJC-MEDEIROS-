import { describe, expect, it } from 'vitest';
import { digitsOnly, formatPhoneBr, sanitizeText } from '../../src/utils/security';

describe('sanitizeText', () => {
  it('remove caracteres perigosos e normaliza espaços', () => {
    expect(sanitizeText('  <script>Maria</script>  ')).toBe('scriptMaria/script');
    expect(sanitizeText('a"b\'c<d>e')).toBe('abcde');
    expect(sanitizeText('João   da    Silva')).toBe('João da Silva');
  });
});

describe('digitsOnly', () => {
  it('mantém apenas dígitos', () => {
    expect(digitsOnly('(11) 98888-7777')).toBe('11988887777');
    expect(digitsOnly('abc123def')).toBe('123');
  });
});

describe('formatPhoneBr', () => {
  it('formata celular de 11 dígitos', () => {
    expect(formatPhoneBr('11988887777')).toBe('(11) 98888-7777');
  });
  it('formata fixo de 10 dígitos', () => {
    expect(formatPhoneBr('1133334444')).toBe('(11) 3333-4444');
  });
  it('trunca além de 11 dígitos', () => {
    expect(formatPhoneBr('119888877779999')).toBe('(11) 98888-7777');
  });
});
