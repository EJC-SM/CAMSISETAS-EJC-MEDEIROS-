import { adminAction, atualizarConfig, fetchComprovante, fetchPedidos, marcarPago } from '../state/api';
import { getConfig, setConfig } from '../state/store';
import type { ConfigData, Etapa, Pedido } from '../state/types';
import { clear, el } from '../utils/dom';
import { downloadCsv, pedidosToCsv } from '../utils/export';
import { formatBRL, formatDateTimeBr } from '../utils/format';
import { toastError, toastSuccess } from '../utils/toast';
import { renderComprovanteUploader } from './comprovante-upload';
import { openModal } from './modal';

function base64ToBlob(base64: string, type: string): Blob {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type });
}

async function verComprovante(etapa: Etapa, pedido: Pedido): Promise<void> {
  const file = await fetchComprovante(etapa, pedido.id);
  if (!file) {
    toastError('Comprovante indisponível.');
    return;
  }
  const url = URL.createObjectURL(base64ToBlob(file.dataBase64, file.type));
  if (file.type === 'application/pdf') {
    window.open(url, '_blank', 'noopener');
    return;
  }
  const img = el('img', {
    src: url,
    alt: `Comprovante de ${pedido.nome}`,
    class: 'comprovante-preview',
  }) as HTMLImageElement;
  const content = el('div', { class: 'stack' }, [
    el('h2', { id: 'comprovante-title' }, [`Comprovante — ${pedido.nome}`]),
    img,
  ]);
  const handle = openModal(content, {
    labelledBy: 'comprovante-title',
    onClose: () => URL.revokeObjectURL(url),
  });
  const closeBtn = el('button', { class: 'btn btn--primary btn--block', type: 'button' }, ['Fechar']);
  closeBtn.addEventListener('click', () => handle.close());
  content.appendChild(closeBtn);
}

export interface PainelCoordenadorProps {
  etapa: Etapa;
  onConfigChanged: () => void;
  onAbrirDirigente: () => void;
}

function renderTotais(pedidos: Pedido[]): HTMLElement {
  const totalReais = pedidos.reduce((acc, p) => acc + p.total, 0);
  const pagos = pedidos.filter((p) => p.pago).length;
  const totalCamisetas = pedidos.reduce(
    (acc, p) => acc + p.itens.reduce((sum, item) => sum + item.quantidade, 0),
    0,
  );
  return el('div', { class: 'totais' }, [
    el('div', { class: 'stat' }, [el('b', {}, [String(pedidos.length)]), 'Pedidos']),
    el('div', { class: 'stat' }, [el('b', {}, [String(totalCamisetas)]), 'Peças']),
    el('div', { class: 'stat' }, [el('b', {}, [`${pagos}/${pedidos.length}`]), 'Pagos']),
    el('div', { class: 'stat' }, [el('b', {}, [formatBRL(totalReais)]), 'Total']),
  ]);
}

function renderPedido(pedido: Pedido, etapa: Etapa, onChange: () => void): HTMLElement {
  const badge = el('span', { class: `badge ${pedido.pago ? 'badge--pago' : 'badge--pendente'}` }, [
    pedido.pago ? 'Pago' : 'Pendente',
  ]);

  const toggle = el(
    'button',
    { class: `btn btn--sm ${pedido.pago ? 'btn--ghost' : 'btn--success'}`, type: 'button' },
    [pedido.pago ? 'Marcar pendente' : 'Marcar pago'],
  ) as HTMLButtonElement;
  toggle.addEventListener('click', async () => {
    toggle.disabled = true;
    const result = await marcarPago(etapa, pedido.id, !pedido.pago);
    if (result.ok) {
      toastSuccess('Pedido atualizado.');
      onChange();
    } else {
      toggle.disabled = false;
      toastError('Não foi possível atualizar.');
    }
  });

  const itensList = el(
    'ul',
    { class: 'muted' },
    pedido.itens.map((item) => {
      const gola = item.gola && item.gola !== '—' ? ` ${item.gola}` : '';
      return el('li', {}, [`${item.quantidade}x ${item.produto} ${item.tamanho}${gola} — ${item.cor}`]);
    }),
  );

  const comprovanteInfo = el('span', { class: 'grow muted' }, [
    pedido.comprovante ? 'Comprovante enviado' : 'Sem comprovante',
  ]);
  const acoes: Array<Node | string> = [comprovanteInfo];
  if (pedido.comprovante) {
    const verBtn = el('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, [
      'Ver comprovante',
    ]) as HTMLButtonElement;
    verBtn.addEventListener('click', () => {
      void verComprovante(etapa, pedido);
    });
    acoes.push(verBtn);
  }

  // Anexo de comprovante pelo coordenador (ex.: cliente enviou por outro canal).
  // O endpoint confere o telefone do pedido, que o coordenador ja possui aqui.
  const anexar = el('details', { class: 'comprovante-anexar' }, [
    el('summary', {}, [pedido.comprovante ? 'Substituir comprovante' : 'Anexar comprovante']),
    renderComprovanteUploader({ etapa, id: pedido.id, tel: pedido.tel, onUploaded: onChange }),
  ]);

  return el('div', { class: 'pedido-item stack' }, [
    el('div', { class: 'pedido-item__head' }, [el('strong', {}, [pedido.nome]), badge]),
    el('div', { class: 'muted' }, [`${pedido.equipe} · ${pedido.tel} · ${formatDateTimeBr(pedido.data)}`]),
    itensList,
    el('div', { class: 'row' }, acoes),
    anexar,
    el('div', { class: 'row' }, [el('b', { class: 'grow' }, [formatBRL(pedido.total)]), toggle]),
  ]);
}

export function renderPainelCoordenador(props: PainelCoordenadorProps): HTMLElement {
  const { etapa } = props;
  const container = el('div', { class: 'stack' });
  let pedidos: Pedido[] = [];
  let filtro: 'todos' | 'pagos' | 'pendentes' = 'todos';

  async function refresh(): Promise<void> {
    const data = await fetchPedidos(etapa);
    if (data) pedidos = data;
    render();
  }

  function visiblePedidos(): Pedido[] {
    if (filtro === 'pagos') return pedidos.filter((p) => p.pago);
    if (filtro === 'pendentes') return pedidos.filter((p) => !p.pago);
    return pedidos;
  }

  function render(): void {
    clear(container);
    const config = getConfig(etapa);

    const exportBtn = el('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, ['Exportar CSV']);
    exportBtn.addEventListener('click', () => {
      downloadCsv(`pedidos-etapa${etapa}.csv`, pedidosToCsv(pedidos));
    });

    const dirigenteBtn = el('button', { class: 'btn btn--accent btn--sm', type: 'button' }, [
      'Área do dirigente',
    ]);
    dirigenteBtn.addEventListener('click', () => props.onAbrirDirigente());

    const filtroSelect = el(
      'select',
      { class: 'select', 'aria-label': 'Filtrar pedidos' },
      [
        ['todos', 'Todos'],
        ['pendentes', 'Pendentes'],
        ['pagos', 'Pagos'],
      ].map(([v, l]) => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = l;
        if (filtro === v) opt.selected = true;
        return opt;
      }),
    ) as HTMLSelectElement;
    filtroSelect.addEventListener('change', () => {
      filtro = filtroSelect.value as typeof filtro;
      render();
    });

    const lista = visiblePedidos();
    const listaEl = lista.length
      ? el(
          'div',
          { class: 'stack' },
          lista.map((p) => renderPedido(p, etapa, () => void refresh())),
        )
      : el('p', { class: 'muted' }, ['Nenhum pedido nesta etapa ainda.']);

    container.appendChild(
      el('section', { class: 'card stack' }, [
        el('div', { class: 'row' }, [
          el('h2', { class: 'grow' }, [`Pedidos — Etapa ${etapa}`]),
          dirigenteBtn,
        ]),
        renderTotais(pedidos),
        el('div', { class: 'row' }, [filtroSelect, exportBtn]),
        listaEl,
      ]),
    );

    container.appendChild(renderControles(config));
  }

  function renderControles(config: ConfigData): HTMLElement {
    const prazoInput = el('input', {
      class: 'input',
      type: 'datetime-local',
      'aria-label': 'Prazo de pedidos',
      value: toLocalInput(config.prazo),
    }) as HTMLInputElement;
    const salvarPrazo = el('button', { class: 'btn btn--sm', type: 'button' }, ['Salvar prazo']);
    salvarPrazo.addEventListener('click', async () => {
      const iso = prazoInput.value ? new Date(prazoInput.value).toISOString() : '';
      const result = await atualizarConfig(etapa, { prazo: iso });
      if (result.ok && result.data?.data) {
        setConfig(etapa, result.data.data);
        toastSuccess('Prazo atualizado.');
        props.onConfigChanged();
      } else {
        toastError('Não foi possível salvar o prazo.');
      }
    });

    const lockSelect = el(
      'select',
      { class: 'select', 'aria-label': 'Travar etapa' },
      [
        ['0', 'Sem trava'],
        ['1', 'Travar na Etapa 1'],
        ['2', 'Travar na Etapa 2'],
      ].map(([v, l]) => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = l;
        if (String(config.etapa_locked) === v) opt.selected = true;
        return opt;
      }),
    ) as HTMLSelectElement;
    const salvarLock = el('button', { class: 'btn btn--sm', type: 'button' }, ['Aplicar trava']);
    salvarLock.addEventListener('click', async () => {
      const result = await adminAction({ action: 'lock_etapa', etapa, lock_etapa: Number(lockSelect.value) });
      if (result.ok) {
        toastSuccess('Trava atualizada.');
        props.onConfigChanged();
      } else {
        toastError('Ação não permitida.');
      }
    });

    const resetBtn = el('button', { class: 'btn btn--danger btn--sm', type: 'button' }, [
      'Zerar pedidos da etapa',
    ]);
    resetBtn.addEventListener('click', async () => {
      if (!window.confirm(`Apagar TODOS os pedidos da Etapa ${etapa}? Esta ação é irreversível.`)) return;
      const result = await adminAction({ action: 'reset_pedidos', etapa });
      if (result.ok) {
        toastSuccess('Pedidos zerados.');
        void refresh();
      } else {
        toastError('Ação não permitida (requer dirigente).');
      }
    });

    return el('section', { class: 'card stack' }, [
      el('h3', {}, ['Controles da etapa']),
      el('div', { class: 'field' }, [
        el('label', {}, ['Prazo de pedidos']),
        el('div', { class: 'row' }, [prazoInput, salvarPrazo]),
      ]),
      el('div', { class: 'field' }, [
        el('label', {}, ['Trava de etapa']),
        el('div', { class: 'row' }, [lockSelect, salvarLock]),
      ]),
      resetBtn,
    ]);
  }

  void refresh();
  return container;
}

function toLocalInput(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}
