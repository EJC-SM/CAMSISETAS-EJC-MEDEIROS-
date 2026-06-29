import { fotoFallback, fotoProduto } from '../assets';
import { criarPedido } from '../state/api';
import { isPrazoEncerrado } from '../state/store';
import type { ConfigData, Cor, Etapa, ItemPedido, Produto } from '../state/types';
import { announceLive } from '../utils/accessibility';
import { clear, el, option } from '../utils/dom';
import { formatBRL } from '../utils/format';
import { formatPhoneBr } from '../utils/security';
import { toastError, toastSuccess } from '../utils/toast';
import { getPreco, validateItemPedido, validateNome, validateTelefone } from '../utils/validation';
import { renderComprovanteUploader } from './comprovante-upload';
import { openModal } from './modal';
import { renderPixBox } from './pix-box';

type DraftItem = Partial<ItemPedido>;

export interface FormPedidoProps {
  config: ConfigData;
  etapa: Etapa;
  // Modelo (tipo ou id) pré-selecionado ao abrir o pedido a partir do catálogo.
  produtoInicial?: string;
  onSubmitted: () => void;
}

function coresDisponiveis(produto: Produto | undefined, cores: Cor[]): Cor[] {
  if (!produto) return cores;
  return cores.filter((c) => !(produto.cores_excluidas || []).includes(c.nome));
}

export function renderFormPedido(props: FormPedidoProps): HTMLElement {
  const { config, etapa } = props;
  const encerrado = isPrazoEncerrado(etapa);

  if (encerrado) {
    return el('section', { class: 'card stack' }, [
      el('h2', {}, ['Pedidos encerrados']),
      el('p', { class: 'muted' }, ['O prazo para pedidos desta etapa foi encerrado.']),
    ]);
  }

  const produtoInicial =
    props.produtoInicial &&
    config.produtos.some((p) => p.tipo === props.produtoInicial || p.id === props.produtoInicial)
      ? props.produtoInicial
      : undefined;

  const itens: DraftItem[] = [
    produtoInicial ? { produto: produtoInicial, quantidade: 1 } : { quantidade: 1 },
  ];

  const itensContainer = el('div', {});
  const totalEl = el('b', {}, ['R$ 0,00']);
  const errorSummary = el('div', { class: 'field-error', role: 'alert', 'aria-live': 'assertive' });

  function findProduto(ref?: string): Produto | undefined {
    return config.produtos.find((p) => p.tipo === ref || p.id === ref);
  }

  function recalcTotal(): void {
    let total = 0;
    for (const item of itens) {
      const produto = findProduto(item.produto);
      if (produto && item.tamanho) {
        total += getPreco(produto, item.tamanho) * (Number(item.quantidade) || 0);
      }
    }
    totalEl.textContent = formatBRL(total);
  }

  function field(labelText: string, control: HTMLElement): HTMLElement {
    return el('div', { class: 'field' }, [
      el('span', { class: 'field__label', 'aria-hidden': 'true' }, [labelText]),
      control,
    ]);
  }

  // Seletor por badges (botões) com comportamento de grupo de rádio. Usado para
  // tamanho e cor no lugar dos <select>.
  function badgeGroup(args: {
    options: Array<{ value: string; label: string; cor?: Cor }>;
    selected: string | undefined;
    ariaLabel: string;
    emptyText: string;
    onSelect: (value: string) => void;
  }): HTMLElement {
    const { options, selected, ariaLabel, emptyText, onSelect } = args;
    if (options.length === 0) {
      return el('p', { class: 'hint badge-group__empty' }, [emptyText]);
    }

    const group = el('div', { class: 'badge-group', role: 'radiogroup', 'aria-label': ariaLabel });
    const buttons: HTMLButtonElement[] = [];

    options.forEach((opt) => {
      const children: Array<Node | string> = [];
      if (opt.cor) {
        const swatch = el('span', {
          class: `badge__swatch${opt.cor.border ? ' badge__swatch--border' : ''}`,
          'aria-hidden': 'true',
        });
        swatch.style.background = opt.cor.hex;
        children.push(swatch);
      }
      children.push(el('span', { class: 'badge__label' }, [opt.label]));

      const isActive = selected === opt.value;
      const btn = el(
        'button',
        {
          class: `badge${isActive ? ' badge--active' : ''}`,
          type: 'button',
          role: 'radio',
          'aria-checked': isActive,
        },
        children,
      ) as HTMLButtonElement;

      btn.addEventListener('click', () => {
        buttons.forEach((other, i) => {
          const active = options[i].value === opt.value;
          other.classList.toggle('badge--active', active);
          other.setAttribute('aria-checked', String(active));
        });
        onSelect(opt.value);
      });

      buttons.push(btn);
      group.appendChild(btn);
    });

    return group;
  }

  function renderItemRow(item: DraftItem, index: number): HTMLElement {
    const produto = findProduto(item.produto);

    const produtoSelect = el('select', { class: 'select', 'aria-label': 'Modelo' }, [
      option('', 'Escolha o modelo', !item.produto),
      ...config.produtos.map((p) => option(p.tipo, p.tipo, item.produto === p.tipo)),
    ]) as HTMLSelectElement;

    // Foto grande do modelo selecionado (à esquerda no desktop, topo no mobile).
    const fotoSrc = produto ? fotoProduto(produto.foto_key) || fotoFallback() : '';
    const itemFoto = el('div', { class: 'item-foto', 'aria-hidden': 'true' }, [
      fotoSrc
        ? (el('img', {
            class: 'item-foto__img',
            src: fotoSrc,
            alt: '',
            width: 280,
            height: 280,
            loading: 'lazy',
          }) as HTMLImageElement)
        : el('span', { class: 'item-foto__placeholder' }, ['👕']),
    ]);

    const unitarioInicial = produto && item.tamanho ? formatBRL(getPreco(produto, item.tamanho)) : '—';
    const unitarioEl = el('span', { class: 'muted' }, [`Unitário: ${unitarioInicial}`]);

    const tamanhoControl = badgeGroup({
      options: (produto?.tamanhos || []).map((t) => ({ value: t, label: t })),
      selected: item.tamanho,
      ariaLabel: 'Tamanho',
      emptyText: 'Escolha o modelo primeiro.',
      onSelect: (value) => {
        item.tamanho = value;
        unitarioEl.textContent = `Unitário: ${produto ? formatBRL(getPreco(produto, value)) : '—'}`;
        recalcTotal();
        updateSubmitState();
      },
    });

    const golasValidas = (produto?.golas || []).filter((g) => g && g !== '—');
    const golaSelect = el('select', { class: 'select', 'aria-label': 'Gola' }, [
      option('', 'Selecione a gola', !item.gola),
      ...golasValidas.map((g) => option(g, g, item.gola === g)),
    ]) as HTMLSelectElement;

    const cores = coresDisponiveis(produto, config.cores);
    const corControl = badgeGroup({
      options: cores.map((c) => ({ value: c.nome, label: c.nome, cor: c })),
      selected: item.cor,
      ariaLabel: 'Cor',
      emptyText: 'Nenhuma cor disponível.',
      onSelect: (value) => {
        item.cor = value;
        updateSubmitState();
      },
    });

    const qtdInput = el('input', {
      class: 'qty__input',
      type: 'number',
      min: 1,
      max: 99,
      step: 1,
      inputmode: 'numeric',
      value: String(item.quantidade ?? 1),
      'aria-label': 'Quantidade',
    }) as HTMLInputElement;

    const clampQty = (n: number): number => Math.max(1, Math.min(99, Math.floor(n || 1)));

    const minusBtn = el(
      'button',
      {
        class: 'qty__btn',
        type: 'button',
        'aria-label': 'Diminuir quantidade',
      },
      ['−'],
    ) as HTMLButtonElement;
    const plusBtn = el(
      'button',
      {
        class: 'qty__btn',
        type: 'button',
        'aria-label': 'Aumentar quantidade',
      },
      ['+'],
    ) as HTMLButtonElement;

    const syncQty = (): void => {
      const value = clampQty(Number(qtdInput.value));
      item.quantidade = value;
      qtdInput.value = String(value);
      minusBtn.disabled = value <= 1;
      plusBtn.disabled = value >= 99;
      recalcTotal();
      updateSubmitState();
    };

    minusBtn.addEventListener('click', () => {
      qtdInput.value = String(clampQty(Number(qtdInput.value) - 1));
      syncQty();
    });
    plusBtn.addEventListener('click', () => {
      qtdInput.value = String(clampQty(Number(qtdInput.value) + 1));
      syncQty();
    });
    qtdInput.addEventListener('input', syncQty);

    const qtyControl = el('div', { class: 'qty' }, [minusBtn, qtdInput, plusBtn]);

    produtoSelect.addEventListener('change', () => {
      item.produto = produtoSelect.value;
      item.tamanho = undefined;
      item.gola = undefined;
      item.cor = undefined;
      rerenderItens();
    });
    golaSelect.addEventListener('change', () => {
      item.gola = golaSelect.value;
      updateSubmitState();
    });

    const fields = el('div', { class: 'item-fields' }, [
      field('Modelo', produtoSelect),
      field('Tamanho', tamanhoControl),
    ]);
    if (golasValidas.length > 0) fields.appendChild(field('Gola', golaSelect));
    fields.appendChild(field('Cor', corControl));
    fields.appendChild(field('Quantidade', qtyControl));

    const removeBtn = el('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, [
      'Remover',
    ]) as HTMLButtonElement;
    removeBtn.disabled = itens.length <= 1;
    removeBtn.addEventListener('click', () => {
      itens.splice(index, 1);
      rerenderItens();
    });

    const row = el('div', { class: 'item-pedido' }, [
      el('div', { class: 'item-pedido__head' }, [
        el('strong', { class: 'grow' }, [`Item ${index + 1}`]),
        unitarioEl,
        removeBtn,
      ]),
      el('div', { class: 'item-pedido__body' }, [itemFoto, fields]),
    ]);

    minusBtn.disabled = (item.quantidade ?? 1) <= 1;
    return row;
  }

  function rerenderItens(): void {
    clear(itensContainer);
    itens.forEach((item, index) => itensContainer.appendChild(renderItemRow(item, index)));
    recalcTotal();
    updateSubmitState();
  }

  const nomeInput = el('input', {
    class: 'input',
    id: 'pedido-nome',
    autocomplete: 'name',
    required: true,
  }) as HTMLInputElement;
  const telInput = el('input', {
    class: 'input',
    id: 'pedido-tel',
    type: 'tel',
    inputmode: 'tel',
    autocomplete: 'tel',
    placeholder: '(00) 00000-0000',
    required: true,
  }) as HTMLInputElement;
  telInput.addEventListener('input', () => {
    telInput.value = formatPhoneBr(telInput.value);
    updateSubmitState();
  });
  nomeInput.addEventListener('input', () => updateSubmitState());

  const equipeSelect = el('select', { class: 'select', id: 'pedido-equipe', required: true }, [
    option('', 'Selecione sua equipe', true),
    ...config.equipes.map((e) => option(e, e)),
  ]) as HTMLSelectElement;
  equipeSelect.addEventListener('change', () => updateSubmitState());

  const addBtn = el('button', { class: 'btn btn--ghost', type: 'button' }, [
    '+ Adicionar item',
  ]) as HTMLButtonElement;
  addBtn.addEventListener('click', () => {
    if (itens.length >= 50) return;
    itens.push({ quantidade: 1 });
    rerenderItens();
  });

  const submitBtn = el('button', { class: 'btn btn--primary btn--block', type: 'submit' }, [
    'Fazer pedido',
  ]) as HTMLButtonElement;
  submitBtn.disabled = true;

  const form = el('form', { class: 'stack', novalidate: true, 'aria-labelledby': 'form-title' }, [
    el('h2', { id: 'form-title' }, ['Fazer pedido']),
    el('div', { class: 'field' }, [
      el('label', { for: 'pedido-nome' }, ['Nome completo ', el('span', { class: 'req' }, ['*'])]),
      nomeInput,
    ]),
    el('div', { class: 'field' }, [
      el('label', { for: 'pedido-tel' }, ['WhatsApp ', el('span', { class: 'req' }, ['*'])]),
      telInput,
    ]),
    el('div', { class: 'field' }, [
      el('label', { for: 'pedido-equipe' }, ['Equipe ', el('span', { class: 'req' }, ['*'])]),
      equipeSelect,
    ]),
    el('h3', {}, ['Itens']),
    itensContainer,
    addBtn,
    el('div', { class: 'total-bar' }, [el('span', { class: 'grow' }, ['Total do pedido']), totalEl]),
    errorSummary,
    submitBtn,
  ]) as HTMLFormElement;

  function updateSubmitState(): void {
    submitBtn.disabled = collectErrors().length > 0;
  }

  function collectErrors(): string[] {
    const errors: string[] = [];
    const nomeRes = validateNome(nomeInput.value);
    if (!nomeRes.valid) errors.push(nomeRes.message!);
    const telRes = validateTelefone(telInput.value);
    if (!telRes.valid) errors.push(telRes.message!);
    if (!equipeSelect.value) errors.push('Selecione sua equipe.');
    if (itens.length === 0) errors.push('Adicione ao menos um item.');
    itens.forEach((item, index) => {
      const res = validateItemPedido(item, config.produtos, config.cores);
      if (!res.valid) errors.push(`Item ${index + 1}: ${res.message}`);
    });
    return errors;
  }

  function openPixModal(pedidoId: number, total: number): void {
    const uploader = renderComprovanteUploader({
      etapa,
      id: pedidoId,
      tel: telInput.value,
    });

    const content = el('div', { class: 'stack pix-box' }, [
      el('h2', { id: 'pix-title' }, ['Pedido registrado! 🎉']),
      el('p', {}, ['Total a pagar: ', el('b', {}, [formatBRL(total)])]),
      el('p', { class: 'muted' }, ['Pague via Pix com o valor já no QR e anexe o comprovante abaixo.']),
      renderPixBox(config, total),
      el('h3', {}, ['Enviar comprovante']),
      el('p', { class: 'muted' }, ['Opcional agora — você também pode enviar depois na aba "Meu pedido".']),
      uploader,
    ]);

    const handle = openModal(content, { labelledBy: 'pix-title' });
    const closeBtn = el('button', { class: 'btn btn--primary btn--block', type: 'button' }, ['Concluir']);
    closeBtn.addEventListener('click', () => {
      handle.close();
      props.onSubmitted();
    });
    content.appendChild(closeBtn);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorSummary.textContent = '';
    const errors = collectErrors();
    if (errors.length > 0) {
      errorSummary.textContent = errors[0];
      announceLive(errors[0], false);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando…';

    const result = await criarPedido(etapa, {
      nome: nomeInput.value,
      tel: telInput.value,
      equipe: equipeSelect.value,
      itens: itens.map((item) => ({
        produto: item.produto!,
        tamanho: item.tamanho!,
        gola: item.gola || '',
        cor: item.cor!,
        quantidade: Number(item.quantidade) || 1,
      })),
    });

    submitBtn.textContent = 'Fazer pedido';
    updateSubmitState();

    if (result.ok && result.data?.data) {
      toastSuccess('Pedido enviado com sucesso!');
      openPixModal(result.data.data.id, result.data.data.total);
    } else {
      const message =
        result.error === 'etapa_locked'
          ? 'Esta etapa está travada para pedidos.'
          : result.error === 'pedidos_encerrados'
            ? 'O prazo de pedidos foi encerrado.'
            : result.error === 'rate_limit_exceeded'
              ? 'Muitas tentativas. Aguarde um instante.'
              : 'Não foi possível registrar o pedido. Revise os dados.';
      errorSummary.textContent = message;
      toastError(message);
    }
  });

  rerenderItens();
  return el('section', { class: 'card' }, [form]);
}
