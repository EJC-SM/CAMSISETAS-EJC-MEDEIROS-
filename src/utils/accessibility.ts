export function trapFocus(container: HTMLElement): () => void {
  const focusable = () =>
    Array.from(
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.offsetParent !== null);

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;
    const items = focusable();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  container.addEventListener('keydown', onKeyDown);
  focusable()[0]?.focus();

  return () => container.removeEventListener('keydown', onKeyDown);
}

export function announceLive(message: string, polite = true): void {
  const region = document.createElement('div');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', polite ? 'polite' : 'assertive');
  region.className = 'sr-only';
  region.textContent = message;
  document.body.appendChild(region);
  window.setTimeout(() => region.remove(), 1500);
}
