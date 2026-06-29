import { LOGO_URL } from '../assets';
import { isEtapaSelectable, isPrazoEncerrado } from '../state/store';
import type { ConfigData, Etapa } from '../state/types';
import { el } from '../utils/dom';
import { renderPrazoBanner } from './prazo-banner';

export type ViewId = 'catalogo' | 'pedido' | 'meu-pedido' | 'painel';

export interface HeaderProps {
  config: ConfigData;
  etapa: Etapa;
  view: ViewId;
  onView: (view: ViewId) => void;
  onEtapa: (etapa: Etapa) => void;
  onPrazoExpire?: () => void;
}

const TABS: Array<{ id: ViewId; label: string; icon: string }> = [
  { id: 'catalogo', label: 'Catálogo', icon: '👕' },
  { id: 'pedido', label: 'Fazer pedido', icon: '📝' },
  { id: 'meu-pedido', label: 'Meu pedido', icon: '🧾' },
];

export function renderHeader(props: HeaderProps): HTMLElement {
  const logo = el('img', {
    class: 'app-header__logo',
    src: props.config.logo || LOGO_URL,
    alt: '',
    width: 48,
    height: 48,
    loading: 'eager',
  });

  const brand = el('div', { class: 'app-header__brand' }, [
    logo,
    el('p', { class: 'app-header__title' }, [props.config.nome_evento || 'EJC Medeiros — Camisetas']),
  ]);

  const etapaSwitch = el('div', {
    class: 'seg',
    role: 'group',
    'aria-label': 'Selecionar etapa',
  });
  for (const etapa of [1, 2] as Etapa[]) {
    const selectable = isEtapaSelectable(etapa);
    const btn = el(
      'button',
      {
        class: 'seg__btn',
        type: 'button',
        'aria-pressed': props.etapa === etapa,
        disabled: !selectable,
      },
      [`Etapa ${etapa}`],
    ) as HTMLButtonElement;
    btn.addEventListener('click', () => props.onEtapa(etapa));
    etapaSwitch.appendChild(btn);
  }

  const headerInner = el('div', { class: 'app-header__inner' }, [brand, etapaSwitch]);
  const prazoBanner = renderPrazoBanner(props.config.prazo, props.onPrazoExpire);
  const header = el('header', { class: 'app-header' }, [headerInner, ...(prazoBanner ? [prazoBanner] : [])]);

  const pedidoEncerrado = isPrazoEncerrado(props.etapa);
  const nav = el('nav', { class: 'main-nav', role: 'tablist', 'aria-label': 'Seções' });
  for (const tab of TABS) {
    // O prazo so trava a aba de realizar pedido; as demais seguem acessiveis.
    const bloqueado = tab.id === 'pedido' && pedidoEncerrado;
    const label = el('span', { class: 'main-nav__label' }, [bloqueado ? 'Prazo esgotado' : tab.label]);
    const btn = el(
      'button',
      {
        class: `main-nav__item${bloqueado ? ' main-nav__item--disabled' : ''}`,
        type: 'button',
        role: 'tab',
        id: `tab-${tab.id}`,
        'aria-selected': props.view === tab.id,
        'aria-controls': 'view-panel',
        disabled: bloqueado,
        'aria-disabled': bloqueado,
        title: bloqueado ? 'O prazo para pedidos foi encerrado.' : undefined,
      },
      [el('span', { class: 'main-nav__icon', 'aria-hidden': 'true' }, [tab.icon]), label],
    ) as HTMLButtonElement;
    if (!bloqueado) btn.addEventListener('click', () => props.onView(tab.id));
    nav.appendChild(btn);
  }

  return el('div', { class: 'app-shell-head' }, [header, nav]);
}
