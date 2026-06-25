import type { ConfigData } from '../state/types';
import { el } from '../utils/dom';
import { pixPayload, pixQrUrl } from '../utils/pix';
import { toastError, toastSuccess } from '../utils/toast';

// Bloco reutilizavel do Pix: QR Code (com o valor embutido), chave e codigo
// copia-e-cola. Usado no modal pos-pedido e na aba "Meu pedido".
export function renderPixBox(config: ConfigData, total: number): HTMLElement {
  const payload = config.pix_chave
    ? pixPayload(config.pix_chave, config.pix_nome || 'EJC', config.pix_cidade || 'BRASIL', total)
    : '';
  // Com valor embutido o QR precisa ser gerado do payload; a imagem estatica de
  // config.pix_qr nao carrega o valor, entao so e usada quando nao ha payload.
  const qrSrc = payload ? pixQrUrl(payload) : config.pix_qr || '';

  const children: Array<Node | string> = [];
  if (qrSrc) {
    children.push(el('img', { src: qrSrc, alt: 'QR Code Pix', width: 220, height: 220 }));
  }
  if (config.pix_chave) {
    children.push(el('p', {}, ['Chave Pix: ', el('b', {}, [config.pix_chave])]));
  }
  if (payload) {
    const copyBtn = el('button', { class: 'btn btn--ghost btn--block', type: 'button' }, [
      'Copiar código Pix',
    ]) as HTMLButtonElement;
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(payload);
        toastSuccess('Código Pix copiado!');
      } catch {
        toastError('Não foi possível copiar.');
      }
    });
    children.push(el('div', { class: 'pix-copia' }, [payload]), copyBtn);
  }

  return el('div', { class: 'stack pix-box' }, children);
}
