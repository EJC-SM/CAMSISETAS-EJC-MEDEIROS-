import { buscarMeusPedidos } from '../state/api';
import type { ConfigData, Etapa, MeuPedidoResumo } from '../state/types';
import { announceLive } from '../utils/accessibility';
import { clear, el } from '../utils/dom';
import { formatBRL, formatDateTimeBr } from '../utils/format';
import { formatPhoneBr } from '../utils/security';
import { validateTelefone } from '../utils/validation';
import { renderComprovanteUploader } from './comprovante-upload';
import { renderPixBox } from './pix-box';

export interface MeuPedidoProps {
  etapa: Etapa;
  config: ConfigData;
}

export function renderMeuPedido(props: MeuPedidoProps): HTMLElement {
  const { etapa, config } = props;

  const telInput = el('input', {
    class: 'input',
    type: 'tel',
    inputmode: 'tel',
    autocomplete: 'tel',
    placeholder: '(00) 00000-0000',
    'aria-label': 'WhatsApp do pedido',
  }) as HTMLInputElement;
  telInput.addEventListener('input', () => {
    telInput.value = formatPhoneBr(telInput.value);
  });

  const buscarBtn = el('button', { class: 'btn btn--primary', type: 'button' }, [
    'Buscar pedidos',
  ]) as HTMLButtonElement;

  const resultados = el('div', { class: 'stack' });

  function renderPedidoCard(pedido: MeuPedidoResumo): HTMLElement {
    const badge = el('span', { class: `badge ${pedido.pago ? 'badge--pago' : 'badge--pendente'}` }, [
      pedido.pago ? 'Pago' : 'Pendente',
    ]);
    const comprovanteStatus = el('span', { class: 'muted' }, [
      pedido.comprovante ? 'Comprovante enviado ✅' : 'Sem comprovante',
    ]);

    const uploader = renderComprovanteUploader({
      etapa,
      id: pedido.id,
      tel: telInput.value,
      onUploaded: () => {
        comprovanteStatus.textContent = 'Comprovante enviado ✅';
      },
    });

    const children: Array<Node | string> = [
      el('div', { class: 'pedido-item__head' }, [
        el('strong', { class: 'grow' }, [`Pedido de ${formatDateTimeBr(pedido.data)}`]),
        badge,
      ]),
      el('div', { class: 'muted' }, [`${pedido.resumo} · ${formatBRL(pedido.total)}`]),
      comprovanteStatus,
    ];

    // Enquanto nao houver comprovante, mostra o Pix (QR + copia-e-cola) para o
    // cliente conseguir pagar e so depois anexar o comprovante.
    if (!pedido.comprovante) {
      children.push(el('h4', {}, ['Pagar via Pix']), renderPixBox(config, pedido.total));
    }

    children.push(
      el('h4', {}, [pedido.comprovante ? 'Reenviar comprovante' : 'Enviar comprovante']),
      uploader,
    );

    return el('div', { class: 'pedido-item stack' }, children);
  }

  async function buscar(): Promise<void> {
    const telRes = validateTelefone(telInput.value);
    if (!telRes.valid) {
      clear(resultados);
      resultados.appendChild(el('p', { class: 'field-error' }, [telRes.message!]));
      announceLive(telRes.message!, false);
      return;
    }

    buscarBtn.disabled = true;
    buscarBtn.textContent = 'Buscando…';
    const data = await buscarMeusPedidos(etapa, telInput.value);
    buscarBtn.disabled = false;
    buscarBtn.textContent = 'Buscar pedidos';

    clear(resultados);
    if (!data) {
      resultados.appendChild(
        el('p', { class: 'field-error' }, ['Não foi possível buscar agora. Tente novamente.']),
      );
      return;
    }
    if (data.length === 0) {
      resultados.appendChild(
        el('p', { class: 'muted' }, ['Nenhum pedido encontrado para este WhatsApp nesta etapa.']),
      );
      return;
    }
    for (const pedido of data) resultados.appendChild(renderPedidoCard(pedido));
  }

  buscarBtn.addEventListener('click', () => void buscar());

  const form = el('section', { class: 'card stack' }, [
    el('h2', {}, ['Meu pedido']),
    el('p', { class: 'muted' }, [
      'Informe o WhatsApp usado no pedido para acompanhar o status e enviar o comprovante.',
    ]),
    el('div', { class: 'field' }, [
      el('label', { for: 'meu-pedido-tel' }, ['WhatsApp']),
      el('div', { class: 'row' }, [telInput, buscarBtn]),
    ]),
    resultados,
  ]);
  telInput.id = 'meu-pedido-tel';

  return form;
}
