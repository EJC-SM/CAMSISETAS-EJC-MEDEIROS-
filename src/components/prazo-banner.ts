import { el } from '../utils/dom';
import { countdown, formatPrazoLongo } from '../utils/format';

// Banner de prazo com contagem regressiva ao vivo, exibido no cabecalho em
// todas as telas. Como o app re-renderiza substituindo o cabecalho, mantemos um
// unico timer em nivel de modulo e o reiniciamos a cada render para evitar
// multiplos intervalos vazando em nodes ja descartados.
let tickTimer: number | null = null;

function stopTick(): void {
  if (tickTimer != null) {
    window.clearInterval(tickTimer);
    tickTimer = null;
  }
}

export function renderPrazoBanner(prazoIso: string, onExpire?: () => void): HTMLElement | null {
  stopTick();
  if (!prazoIso) return null;
  const deadline = new Date(prazoIso).getTime();
  if (!Number.isFinite(deadline)) return null;

  const encerrado = Date.now() >= deadline;

  const label = el('span', { class: 'prazo-banner__label' }, [
    encerrado ? 'Pedidos encerrados' : 'Prazo para pedidos',
  ]);
  const data = el('span', { class: 'prazo-banner__data' }, [formatPrazoLongo(prazoIso)]);
  const timer = el('span', { class: 'prazo-banner__timer', role: 'timer' }, [countdown(prazoIso)]);

  const banner = el('div', { class: `prazo-banner${encerrado ? ' is-encerrado' : ''}` }, [
    el('span', { class: 'prazo-banner__icon', 'aria-hidden': 'true' }, ['⏳']),
    el('div', { class: 'prazo-banner__text' }, [label, data]),
    timer,
  ]);

  if (!encerrado) {
    tickTimer = window.setInterval(() => {
      const remaining = countdown(prazoIso);
      timer.textContent = remaining;
      if (remaining === 'Encerrado') {
        banner.classList.add('is-encerrado');
        label.textContent = 'Pedidos encerrados';
        stopTick();
        // Avisa o app para re-renderizar (trava a aba de pedido na hora).
        onExpire?.();
      }
    }, 1000);
  }

  return banner;
}
