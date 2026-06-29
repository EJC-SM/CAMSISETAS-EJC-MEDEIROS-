import { fotoFallback, fotoProduto } from '../assets';
import type { ConfigData, Produto } from '../state/types';
import { el } from '../utils/dom';
import { formatBRL } from '../utils/format';
import { getPreco } from '../utils/validation';

function faixaPreco(produto: Produto): string {
  const valores = produto.tamanhos.map((t) => getPreco(produto, t)).filter((v) => v > 0);
  if (valores.length === 0) return '';
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  return min === max ? formatBRL(min) : `${formatBRL(min)} – ${formatBRL(max)}`;
}

// Rótulos amigáveis das faixas de preço por tamanho (como no legado).
const FAIXA_LABEL: Record<string, string> = {
  'P-GG': 'P–GG',
  EG: 'EG',
  XG: 'XG',
  EGG: 'EGG',
  all: 'Único',
};
const FAIXA_ORDEM = ['P-GG', 'EG', 'XG', 'EGG', 'all'];

function precoFaixa(produto: Produto, key: string): number {
  return Number(produto.precos?.[key]) || 0;
}

function renderProdutoCard(produto: Produto, onSelecionar?: (produto: Produto) => void): HTMLElement {
  const src = fotoProduto(produto.foto_key) || fotoFallback();
  const children: Array<HTMLElement> = [];
  if (src) {
    const img = el('img', { src, alt: produto.tipo, loading: 'lazy', width: 130, height: 130 });
    if (onSelecionar) {
      // A foto vira o gatilho para iniciar o pedido já com o modelo selecionado.
      const fotoBtn = el(
        'button',
        {
          class: 'produto-card__foto-btn',
          type: 'button',
          'aria-label': `Fazer pedido de ${produto.tipo}`,
          title: `Fazer pedido de ${produto.tipo}`,
        },
        [img],
      ) as HTMLButtonElement;
      fotoBtn.addEventListener('click', () => onSelecionar(produto));
      children.push(fotoBtn);
    } else {
      children.push(img);
    }
  }
  children.push(el('div', { class: 'produto-card__nome' }, [produto.tipo]));
  children.push(el('div', { class: 'produto-card__preco' }, [faixaPreco(produto)]));
  if (produto.obs) children.push(el('div', { class: 'produto-card__obs' }, [produto.obs]));
  return el('article', { class: 'produto-card' }, children);
}

function renderCores(config: ConfigData): HTMLElement {
  const grid = el('div', { class: 'cores-grid', role: 'list', 'aria-label': 'Cores disponíveis' });
  for (const cor of config.cores) {
    const swatch = el('span', {
      class: `cor-swatch${cor.border ? ' cor-swatch--border' : ''}`,
      role: 'img',
      'aria-label': cor.nome,
    });
    swatch.style.background = cor.hex;
    grid.appendChild(
      el('div', { class: 'cor-chip', role: 'listitem' }, [
        swatch,
        el('span', { class: 'cor-nome' }, [cor.nome]),
      ]),
    );
  }
  return grid;
}

function renderTabelaPrecos(config: ConfigData): HTMLElement {
  // Colunas de preço = faixas de tamanho realmente usadas no catálogo.
  const faixas = FAIXA_ORDEM.filter((key) => config.produtos.some((produto) => precoFaixa(produto, key) > 0));

  const head = el('tr', {}, [
    el('th', { scope: 'col' }, ['Modelo']),
    el('th', { scope: 'col' }, ['Tamanhos']),
    el('th', { scope: 'col' }, ['Golas']),
    ...faixas.map((key) => el('th', { scope: 'col', class: 'tabela__preco-col' }, [FAIXA_LABEL[key] ?? key])),
  ]);

  const rows = config.produtos.map((produto) => {
    const celulasPreco = faixas.map((key) => {
      const valor = precoFaixa(produto, key);
      const temPreco = valor > 0;
      return el(
        'td',
        {
          'data-label': FAIXA_LABEL[key] ?? key,
          class: temPreco ? 'tabela__preco' : 'tabela__preco is-empty',
        },
        [temPreco ? formatBRL(valor) : '—'],
      );
    });
    return el('tr', {}, [
      el('td', { 'data-label': 'Modelo' }, [produto.tipo]),
      el('td', { 'data-label': 'Tamanhos' }, [produto.tamanhos.join(', ')]),
      el('td', { 'data-label': 'Golas' }, [produto.golas.filter((g) => g && g !== '—').join(', ') || '—']),
      ...celulasPreco,
    ]);
  });

  const table = el('table', { class: 'tabela tabela--precos' }, [
    el('caption', { class: 'sr-only' }, ['Tabela de modelos e preços por tamanho']),
    el('thead', {}, [head]),
    el('tbody', {}, rows),
  ]);
  return el('div', { class: 'tabela-wrap' }, [table]);
}

export function renderCatalogo(
  config: ConfigData,
  onSelecionarProduto?: (produto: Produto) => void,
): HTMLElement {
  return el('div', { class: 'stack' }, [
    el('section', { class: 'card stack', 'aria-labelledby': 'cat-modelos' }, [
      el('h2', { id: 'cat-modelos' }, ['Modelos disponíveis']),
      el(
        'div',
        { class: 'catalogo-grid' },
        config.produtos.map((produto) => renderProdutoCard(produto, onSelecionarProduto)),
      ),
    ]),
    el('section', { class: 'card stack', 'aria-labelledby': 'cat-cores' }, [
      el('h2', { id: 'cat-cores' }, ['Cores']),
      renderCores(config),
    ]),
    el('section', { class: 'card stack', 'aria-labelledby': 'cat-precos' }, [
      el('h2', { id: 'cat-precos' }, ['Tabela de preços']),
      renderTabelaPrecos(config),
    ]),
  ]);
}
