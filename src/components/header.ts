import { LOGO_URL } from '../assets';
import { isEtapaSelectable } from '../state/store';
import type { ConfigData, Etapa } from '../state/types';
import { el } from '../utils/dom';

export type ViewId = 'catalogo' | 'pedido' | 'painel';

export interface HeaderProps {
  config: ConfigData;
  etapa: Etapa;
  view: ViewId;
  onView: (view: ViewId) => void;
  onEtapa: (etapa: Etapa) => void;
}

const TABS: Array<{ id: ViewId; label: string; icon: string }> = [
  { id: 'catalogo', label: 'Catálogo', icon: '👕' },
  { id: 'pedido', label: 'Fazer pedido', icon: '📝' },
  { id: 'painel', label: 'Painel', icon: '🔐' },
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
  const header = el('header', { class: 'app-header' }, [headerInner]);

  const nav = el('nav', { class: 'main-nav', role: 'tablist', 'aria-label': 'Seções' });
  for (const tab of TABS) {
    const btn = el(
      'button',
      {
        class: 'main-nav__item',
        type: 'button',
        role: 'tab',
        id: `tab-${tab.id}`,
        'aria-selected': props.view === tab.id,
        'aria-controls': 'view-panel',
      },
      [
        el('span', { class: 'main-nav__icon', 'aria-hidden': 'true' }, [tab.icon]),
        el('span', { class: 'main-nav__label' }, [tab.label]),
      ],
    ) as HTMLButtonElement;
    btn.addEventListener('click', () => props.onView(tab.id));
    nav.appendChild(btn);
  }

  return el('div', { class: 'app-shell-head' }, [header, nav]);
}
