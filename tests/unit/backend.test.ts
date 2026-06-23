/**
 * @vitest-environment node
 *
 * Ambiente Node (não jsdom): além de exercitar handlers CJS da API, este arquivo
 * deriva chave via WebCrypto (`deriveKeyFromPassword`). Sob jsdom os buffers vêm
 * de outro realm e o WebCrypto do Node rejeita o salt do PBKDF2. Sem uso de DOM.
 */
import { createRequire } from 'node:module';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { deriveKeyFromPassword } from '../../src/utils/password-auth';

const require = createRequire(import.meta.url);

// Modulos CJS da API (api/package.json -> type commonjs). createRequire respeita
// a resolucao do Node e evita atrito ESM/CJS no Vite.
const firebase = require('../../api/_firebase.js');
const firebaseRest = require('../../api/firebase-rest.cjs');
const password = require('../../api/password.js');
const catalogo = require('../../api/catalogo-defaults.cjs');
const pedidosHandler = require('../../api/pedidos.js');

function mockRes() {
  return {
    statusCode: 200,
    body: null as unknown,
    setHeader() {},
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
}

beforeAll(() => {
  process.env.FIREBASE_DATABASE_URL = '';
  process.env.ADMIN_API_TOKEN = 'unit-admin-token';
});

describe('_firebase.sanitizeText / validateEtapa', () => {
  it('sanitiza e limita tamanho', () => {
    expect(firebase.sanitizeText('  <b>oi</b>  ', 10)).toBe('boi/b');
  });
  it('aceita etapa 1 e 2, rejeita o resto', () => {
    expect(firebase.validateEtapa('1')).toBe(1);
    expect(firebase.validateEtapa(2)).toBe(2);
    expect(() => firebase.validateEtapa(3)).toThrow();
  });
});

describe('_firebase config access classification', () => {
  it('prazo/etapa_locked são operacionais (coordenador)', () => {
    expect(firebase.isOperationalOnlyConfigUpdate({ prazo: '2026-01-01T00:00:00Z' })).toBe(true);
    expect(firebase.isOperationalOnlyConfigUpdate({ etapa_locked: 1 })).toBe(true);
  });
  it('catálogo exige dirigente (não operacional)', () => {
    expect(firebase.isOperationalOnlyConfigUpdate({ produtos: [] })).toBe(false);
    expect(firebase.isOperationalOnlyConfigUpdate({ prazo: 'x', produtos: [] })).toBe(false);
  });
});

describe('_firebase sessões HMAC', () => {
  it('cria e verifica sessão válida', () => {
    const { token } = firebase.createAdminSession('dirigente');
    const session = firebase.verifyAdminSession(token);
    expect(session?.role).toBe('dirigente');
  });
  it('rejeita token adulterado', () => {
    const { token } = firebase.createAdminSession('coordenador');
    const tampered = `${token.split('.')[0]}.deadbeef`;
    expect(firebase.verifyAdminSession(tampered)).toBeNull();
  });
});

describe('password hash/proof', () => {
  it('valida formato de hash', () => {
    expect(password.validatePasswordHashFormat('a'.repeat(43))).toBe(true);
    expect(password.validatePasswordHashFormat('short')).toBe(false);
    expect(password.validatePasswordHashFormat('inv@lid!'.repeat(6))).toBe(false);
  });
  it('createProof/verifyProof batem para o mesmo hash e nonce', () => {
    const hash = 'A'.repeat(44);
    const nonce = 'nonce-xyz';
    const proof = password.createProof(hash, nonce);
    expect(password.verifyProof(hash, nonce, proof)).toBe(true);
    expect(password.verifyProof(hash, 'outro-nonce', proof)).toBe(false);
  });
});

describe('catalogo-defaults', () => {
  it('sanitizeProdutos descarta itens inválidos e normaliza preços', () => {
    const produtos = catalogo.sanitizeProdutos([
      { tipo: 'X', tamanhos: ['P'], precos: { 'P-GG': '40', evil: 999999999 } },
      { tipo: '', tamanhos: [] },
    ]);
    expect(produtos).toHaveLength(1);
    expect(produtos[0].precos['P-GG']).toBe(40);
    expect(produtos[0].precos.evil).toBe(100000);
  });
  it('sanitizeCores valida hex', () => {
    const cores = catalogo.sanitizeCores([
      { nome: 'Preto', hex: '#111111' },
      { nome: 'Ruim', hex: 'xyz' },
    ]);
    expect(cores[0].hex).toBe('#111111');
    expect(cores[1].hex).toBe('#000000');
  });
  it('withDefaults preenche config vazio', () => {
    const full = catalogo.withDefaults({});
    expect(full.produtos.length).toBeGreaterThan(0);
    expect(full.equipes1.length).toBeGreaterThan(0);
    expect(full.pix_chave).toContain('@');
  });
  it('buildConfigPayload entrega equipes da etapa', () => {
    const payload = catalogo.buildConfigPayload({}, 2);
    expect(payload.equipes).toContain('Gesto Concreto');
  });
});

describe('trava de etapa via config externo (/config global)', () => {
  afterEach(() => {
    firebaseRest.resetMemoryStore();
  });

  it('o config externo precede o camisetas (trava)', async () => {
    await firebaseRest.dbSetExternal('config', { etapa_locked: 2 });
    // mesmo com o camisetas destravado, o externo manda
    expect(await firebase.resolveEtapaLock({ etapa_locked: 0 })).toBe(2);
  });

  it('o config externo precede o camisetas (destrava)', async () => {
    await firebaseRest.dbSetExternal('config', { etapa_locked: 0 });
    // o camisetas pedia trava 1, mas o externo destrava
    expect(await firebase.resolveEtapaLock({ etapa_locked: 1 })).toBe(0);
  });

  it('sem config externo, usa o etapa_locked do camisetas (fallback)', async () => {
    expect(await firebase.resolveEtapaLock({ etapa_locked: 1 })).toBe(1);
    expect(await firebase.resolveEtapaLock({ etapa_locked: 0 })).toBe(0);
  });

  it('createPedido bloqueia (409) quando o externo trava outra etapa', async () => {
    await firebaseRest.dbSetExternal('config', { etapa_locked: 2 });
    const req = {
      method: 'POST',
      headers: {},
      socket: { remoteAddress: 'unit-test' },
      body: { etapa: 1, nome: 'Maria', tel: '(11) 98888-7777', equipe: 'Cozinha', itens: [] },
    };
    const res = mockRes();
    await pedidosHandler(req, res);
    expect(res.statusCode).toBe(409);
    expect((res.body as { error?: string })?.error).toBe('etapa_locked');
  });
});

describe('integração cliente↔servidor (PBKDF2 + proof)', () => {
  it('chave derivada no cliente é aceita pelo verifyProof do servidor', async () => {
    const salt = 'c2FsdC1leGFtcGxl';
    const iterations = 50000;
    const derived = await deriveKeyFromPassword('senhaForte123', salt, iterations);
    const nonce = 'nonce-de-teste';
    const proof = password.createProof(derived, nonce);
    expect(password.verifyProof(derived, nonce, proof)).toBe(true);
  });
});
