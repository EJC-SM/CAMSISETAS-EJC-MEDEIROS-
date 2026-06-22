// Setup global dos testes unitarios (ambiente jsdom).
// Garante WebCrypto disponivel para os utilitarios de senha.
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
}
