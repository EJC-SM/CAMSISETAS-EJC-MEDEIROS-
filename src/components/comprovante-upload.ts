import { enviarComprovante } from '../state/api';
import type { Etapa } from '../state/types';
import { announceLive } from '../utils/accessibility';
import { prepareComprovante } from '../utils/comprovante';
import { el } from '../utils/dom';
import { toastError, toastSuccess } from '../utils/toast';

export interface ComprovanteUploaderProps {
  etapa: Etapa;
  id: number;
  tel: string;
  onUploaded?: () => void;
}

const PLACEHOLDER_TITLE = 'Escolher anexo';
const ACCEPTED_HINT = 'Formatos aceitos: PDF, JPG, PNG, WEBP';

export function renderComprovanteUploader(props: ComprovanteUploaderProps): HTMLElement {
  let selectedFile: File | null = null;

  const fileInput = el('input', {
    class: 'dropzone__input',
    id: `comprovante-input-${props.id}`,
    type: 'file',
    accept: 'image/jpeg,image/png,image/webp,application/pdf',
    'aria-label': 'Selecionar comprovante',
  }) as HTMLInputElement;

  const icon = el('span', { class: 'dropzone__icon', 'aria-hidden': 'true' });
  const title = el('span', { class: 'dropzone__title' }, [PLACEHOLDER_TITLE]);
  const hint = el('span', { class: 'dropzone__hint' }, [ACCEPTED_HINT]);

  const dropzone = el('label', { class: 'dropzone', for: fileInput.id }, [
    fileInput,
    icon,
    title,
    hint,
  ]) as HTMLLabelElement;

  const status = el('p', { class: 'muted', role: 'status', 'aria-live': 'polite' });

  const sendBtn = el('button', { class: 'btn btn--primary btn--block', type: 'button' }, [
    'Enviar comprovante',
  ]) as HTMLButtonElement;
  sendBtn.disabled = true;

  function selectFile(file: File | null): void {
    selectedFile = file;
    if (file) {
      title.textContent = file.name;
      dropzone.classList.add('has-file');
    } else {
      title.textContent = PLACEHOLDER_TITLE;
      dropzone.classList.remove('has-file');
    }
    sendBtn.disabled = !file;
    sendBtn.textContent = 'Enviar comprovante';
    status.textContent = '';
  }

  fileInput.addEventListener('change', () => {
    selectFile(fileInput.files?.[0] ?? null);
  });

  // Arrastar-e-soltar.
  for (const evt of ['dragenter', 'dragover'] as const) {
    dropzone.addEventListener(evt, (event) => {
      event.preventDefault();
      dropzone.classList.add('is-dragover');
    });
  }
  for (const evt of ['dragleave', 'dragend'] as const) {
    dropzone.addEventListener(evt, () => dropzone.classList.remove('is-dragover'));
  }
  dropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropzone.classList.remove('is-dragover');
    const file = event.dataTransfer?.files?.[0];
    if (file) selectFile(file);
  });

  sendBtn.addEventListener('click', async () => {
    const file = selectedFile;
    if (!file) return;

    sendBtn.disabled = true;
    sendBtn.textContent = 'Processando…';
    status.textContent = 'Preparando o arquivo…';

    const prepared = await prepareComprovante(file);
    if (!prepared.ok) {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Enviar comprovante';
      status.textContent = prepared.message;
      announceLive(prepared.message, false);
      toastError(prepared.message);
      return;
    }

    sendBtn.textContent = 'Enviando…';
    const result = await enviarComprovante(props.etapa, props.id, props.tel, prepared.payload);

    if (result.ok) {
      status.textContent = 'Comprovante enviado! ✅';
      sendBtn.textContent = 'Enviado';
      selectedFile = null;
      fileInput.value = '';
      dropzone.classList.remove('has-file');
      title.textContent = PLACEHOLDER_TITLE;
      toastSuccess('Comprovante enviado!');
      props.onUploaded?.();
    } else {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Enviar comprovante';
      const message =
        result.error === 'tel_mismatch'
          ? 'O telefone não confere com o do pedido.'
          : result.error === 'rate_limit_exceeded'
            ? 'Muitas tentativas. Aguarde um instante.'
            : result.error === 'arquivo muito grande'
              ? 'Arquivo muito grande.'
              : 'Não foi possível enviar o comprovante.';
      status.textContent = message;
      toastError(message);
    }
  });

  return el('div', { class: 'stack comprovante-uploader' }, [dropzone, sendBtn, status]);
}
