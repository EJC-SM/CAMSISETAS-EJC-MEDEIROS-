import { trapFocus } from '../utils/accessibility';
import { clear, el } from '../utils/dom';

export interface ModalHandle {
  close: () => void;
  root: HTMLElement;
}

export function openModal(
  content: HTMLElement,
  options: { labelledBy?: string; onClose?: () => void } = {},
): ModalHandle {
  const previousFocus = document.activeElement as HTMLElement | null;
  const dialog = el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' });
  if (options.labelledBy) dialog.setAttribute('aria-labelledby', options.labelledBy);
  dialog.appendChild(content);

  const backdrop = el('div', { class: 'modal-backdrop' }, [dialog]);
  document.body.appendChild(backdrop);
  document.body.style.overflow = 'hidden';

  const releaseFocus = trapFocus(dialog);

  function close(): void {
    releaseFocus();
    backdrop.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    previousFocus?.focus?.();
    options.onClose?.();
  }

  function onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') close();
  }

  backdrop.addEventListener('mousedown', (event) => {
    if (event.target === backdrop) close();
  });
  document.addEventListener('keydown', onKey);

  return { close, root: dialog };
}

export function modalHeader(title: string, id: string): HTMLElement {
  return el('h2', { id, class: 'modal__title' }, [title]);
}

export function replaceModalContent(handle: ModalHandle, content: HTMLElement): void {
  clear(handle.root);
  handle.root.appendChild(content);
}
