import { describe, expect, it } from 'vitest';
import { deriveKeyFromPassword, validatePasswordPolicy } from '../../src/utils/password-auth';

describe('validatePasswordPolicy', () => {
  it('exige mínimo de 8 caracteres', () => {
    expect(validatePasswordPolicy('curta')).not.toBeNull();
    expect(validatePasswordPolicy('senhaok123')).toBeNull();
  });
  it('rejeita senhas muito longas', () => {
    expect(validatePasswordPolicy('a'.repeat(81))).not.toBeNull();
  });
});

describe('deriveKeyFromPassword', () => {
  it('é determinística e base64url', async () => {
    const salt = 'c2FsdA';
    const a = await deriveKeyFromPassword('minhaSenha1', salt, 10000);
    const b = await deriveKeyFromPassword('minhaSenha1', salt, 10000);
    expect(a).toBe(b);
    expect(/^[A-Za-z0-9_-]+$/.test(a)).toBe(true);
  });
  it('muda quando a senha muda', async () => {
    const salt = 'c2FsdA';
    const a = await deriveKeyFromPassword('senhaA12345', salt, 10000);
    const b = await deriveKeyFromPassword('senhaB12345', salt, 10000);
    expect(a).not.toBe(b);
  });
});
