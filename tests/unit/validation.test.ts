import { describe, expect, it } from 'vitest';
import { CORES_DEFAULT, PRODUTOS_DEFAULT } from '../../src/state/store';
import {
  getPreco,
  validateItemPedido,
  validateNome,
  validateQuantidade,
  validateTelefone,
} from '../../src/utils/validation';

const produtos = PRODUTOS_DEFAULT;
const cores = CORES_DEFAULT;

describe('validateNome', () => {
  it('rejeita nomes vazios ou curtos', () => {
    expect(validateNome('').valid).toBe(false);
    expect(validateNome('Jo').valid).toBe(false);
  });
  it('aceita nome válido com acentos', () => {
    expect(validateNome('João da Silva').valid).toBe(true);
  });
});

describe('validateTelefone', () => {
  it('exige 10 ou 11 dígitos', () => {
    expect(validateTelefone('').valid).toBe(false);
    expect(validateTelefone('(11) 9999').valid).toBe(false);
    expect(validateTelefone('(11) 98888-7777').valid).toBe(true);
  });
});

describe('validateQuantidade', () => {
  it('aceita 1..99 inteiros', () => {
    expect(validateQuantidade(1).valid).toBe(true);
    expect(validateQuantidade(99).valid).toBe(true);
    expect(validateQuantidade(0).valid).toBe(false);
    expect(validateQuantidade(100).valid).toBe(false);
    expect(validateQuantidade(1.5).valid).toBe(false);
  });
});

describe('getPreco', () => {
  it('usa preço único quando há "all"', () => {
    const infantil = produtos.find((p) => p.id === 'infantil')!;
    expect(getPreco(infantil, '4')).toBe(30);
  });
  it('aplica faixas P-GG/EG/EGG', () => {
    const basica = produtos.find((p) => p.id === 'camiseta-basica')!;
    expect(getPreco(basica, 'M')).toBe(40);
    expect(getPreco(basica, 'EG')).toBe(45);
    expect(getPreco(basica, 'EGG')).toBe(55);
  });
});

describe('validateItemPedido', () => {
  it('valida um item correto', () => {
    expect(
      validateItemPedido(
        { produto: 'Camiseta básica', tamanho: 'M', gola: 'Gola V', cor: 'Preto', quantidade: 2 },
        produtos,
        cores,
      ).valid,
    ).toBe(true);
  });
  it('rejeita cor excluída do modelo', () => {
    const res = validateItemPedido(
      { produto: 'Polo', tamanho: 'P', gola: 'Masculina', cor: 'Roxo', quantidade: 1 },
      produtos,
      cores,
    );
    expect(res.valid).toBe(false);
  });
  it('exige gola quando o modelo tem golas reais', () => {
    const res = validateItemPedido(
      { produto: 'Camiseta básica', tamanho: 'M', cor: 'Preto', quantidade: 1 },
      produtos,
      cores,
    );
    expect(res.valid).toBe(false);
  });
});
