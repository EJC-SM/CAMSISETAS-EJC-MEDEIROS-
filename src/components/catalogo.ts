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

function renderProdutoCard(produto: Produto): HTMLElement {
  const src = fotoProduto(produto.foto_key) || fotoFallback();
  const children: Array<HTMLElement> = [];
  if (src) {
    children.push(el('img', { src, alt: produto.tipo, loading: 'lazy', width: 130, height: 130 }));
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
  const head = el('tr', {}, [
    el('th', { scope: 'col' }, ['Modelo']),
    el('th', { scope: 'col' }, ['Tamanhos']),
    el('th', { scope: 'col' }, ['Golas']),
    el('th', { scope: 'col' }, ['Preço']),
  ]);
  const rows = config.produtos.map((produto) =>
    el('tr', {}, [
      el('td', { 'data-label': 'Modelo' }, [produto.tipo]),
      el('td', { 'data-label': 'Tamanhos' }, [produto.tamanhos.join(', ')]),
      el('td', { 'data-label': 'Golas' }, [produto.golas.filter((g) => g && g !== '—').join(', ') || '—']),
      el('td', { 'data-label': 'Preço' }, [faixaPreco(produto)]),
    ]),
  );
  const table = el('table', { class: 'tabela' }, [
    el('caption', { class: 'sr-only' }, ['Tabela de modelos e preços']),
    el('thead', {}, [head]),
    el('tbody', {}, rows),
  ]);
  return el('div', { class: 'tabela-wrap' }, [table]);
}

export function renderCatalogo(config: ConfigData): HTMLElement {
  return el('div', { class: 'stack' }, [
    el('section', { class: 'card stack', 'aria-labelledby': 'cat-modelos' }, [
      el('h2', { id: 'cat-modelos' }, ['Modelos disponíveis']),
      el('div', { class: 'catalogo-grid' }, config.produtos.map(renderProdutoCard)),
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
