import './styles/index.css';

import { renderCatalogo } from './components/catalogo';
import { renderFormPedido } from './components/form-pedido';
import { type ViewId, renderHeader } from './components/header';
import { renderPainel } from './components/painel';
import { fetchConfig } from './state/api';
import { startPolling } from './state/firebase';
import { getConfig, getEtapa, isEtapaSelectable, setConfig, setEtapa } from './state/store';
import type { Etapa } from './state/types';
import { el } from './utils/dom';
import { fetchAuthSetupStatus } from './utils/password-auth';
import { initWebVitals } from './utils/web-vitals';

let view: ViewId = 'catalogo';
let setupComplete = true;
let loading = true;

const root = document.getElementById('app');

async function hydrateConfig(etapa: Etapa): Promise<void> {
  const data = await fetchConfig(etapa);
  if (data) setConfig(etapa, data);
}

async function hydrateAll(): Promise<void> {
  await Promise.all([hydrateConfig(1), hydrateConfig(2)]);
}

// Se a etapa atual estiver travada (etapa_locked aponta para outra etapa),
// move a seleção para a etapa liberada.
function applyEtapaLock(): void {
  const locked = getConfig(getEtapa()).etapa_locked;
  if (locked && !isEtapaSelectable(getEtapa())) {
    setEtapa(locked);
  }
}

async function refreshSetupStatus(): Promise<void> {
  const status = await fetchAuthSetupStatus();
  if (status) setupComplete = status.initialSetupComplete;
}

function setView(next: ViewId): void {
  view = next;
  render();
}

function setEtapaAndRender(etapa: Etapa): void {
  if (!isEtapaSelectable(etapa)) return;
  setEtapa(etapa);
  render();
}

function renderView(): HTMLElement {
  const etapa = getEtapa();
  const config = getConfig(etapa);

  if (view === 'catalogo') return renderCatalogo(config);
  if (view === 'pedido') {
    return renderFormPedido({ config, etapa, onSubmitted: () => setView('catalogo') });
  }
  return renderPainel({
    etapa,
    setupComplete,
    onConfigChanged: render,
    onSetupComplete: () => {
      setupComplete = true;
    },
  });
}

function renderLoading(): void {
  if (!root) return;
  const screen = el('div', { class: 'app-loading', role: 'status', 'aria-live': 'polite' }, [
    el('div', { class: 'app-loading__spinner', 'aria-hidden': 'true' }),
    el('p', { class: 'app-loading__text' }, ['Carregando…']),
  ]);
  root.replaceChildren(screen);
}

function render(): void {
  if (!root) return;
  if (loading) {
    renderLoading();
    return;
  }
  const etapa = getEtapa();

  const skip = document.createElement('a');
  skip.href = '#view-panel';
  skip.className = 'skip-link';
  skip.textContent = 'Pular para o conteúdo';

  const header = renderHeader({
    config: getConfig(etapa),
    etapa,
    view,
    onView: setView,
    onEtapa: setEtapaAndRender,
  });

  const main = document.createElement('main');
  main.id = 'view-panel';
  main.setAttribute('role', 'main');
  const container = document.createElement('div');
  container.className = 'container';
  container.appendChild(renderView());
  main.appendChild(container);

  root.replaceChildren(skip, header, main);
}

async function boot(): Promise<void> {
  render();
  await Promise.all([hydrateAll(), refreshSetupStatus()]);
  loading = false;
  applyEtapaLock();
  render();
  initWebVitals();
  startPolling(async () => {
    await hydrateConfig(getEtapa());
    applyEtapaLock();
    if (view === 'catalogo') render();
  }, 25000);
}

void boot();
