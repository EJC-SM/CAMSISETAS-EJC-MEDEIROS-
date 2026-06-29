import type { Etapa } from '../state/types';
import { isLoggedIn, logout } from '../utils/auth';
import { clear, el } from '../utils/dom';
import { renderAuthSetup } from './auth-setup';
import { renderLoginGate } from './login-gate';
import { renderPainelCoordenador } from './painel-coordenador';
import { renderPainelDirigente } from './painel-dirigente';

export interface PainelProps {
  etapa: Etapa;
  setupComplete: boolean;
  onConfigChanged: () => void;
  onSetupComplete: () => void;
}

export function renderPainel(props: PainelProps): HTMLElement {
  const container = el('div', { class: 'stack' });
  let mode: 'coordenador' | 'dirigente' = isLoggedIn('dirigente') ? 'dirigente' : 'coordenador';
  // Estado local para refletir a conclusao do setup sem depender de um novo render do app.
  let setupComplete = props.setupComplete;

  function render(): void {
    clear(container);

    if (!setupComplete) {
      container.appendChild(
        el('section', { class: 'card' }, [
          renderAuthSetup(() => {
            setupComplete = true;
            props.onSetupComplete();
            render();
          }),
        ]),
      );
      return;
    }

    if (!isLoggedIn('coordenador')) {
      container.appendChild(
        el('section', { class: 'card' }, [
          renderLoginGate({
            role: 'coordenador',
            title: 'Acesso restrito',
            description: 'Coordenadores e dirigentes acessam o painel com a senha.',
            onSuccess: render,
          }),
        ]),
      );
      container.appendChild(
        el('section', { class: 'card' }, [
          renderLoginGate({
            role: 'dirigente',
            title: 'Sou dirigente',
            description: 'Acesso completo ao catálogo, equipes e senhas.',
            onSuccess: () => {
              mode = 'dirigente';
              render();
            },
          }),
        ]),
      );
      return;
    }

    const logoutBtn = el('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, ['Sair']);
    logoutBtn.addEventListener('click', () => {
      logout();
      mode = 'coordenador';
      render();
    });
    container.appendChild(el('div', { class: 'row' }, [el('span', { class: 'grow' }), logoutBtn]));

    if (mode === 'dirigente' && isLoggedIn('dirigente')) {
      const back = el('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, [
        '← Voltar aos pedidos',
      ]);
      back.addEventListener('click', () => {
        mode = 'coordenador';
        render();
      });
      container.appendChild(back);
      container.appendChild(
        renderPainelDirigente({ etapa: props.etapa, onConfigChanged: props.onConfigChanged }),
      );
      return;
    }

    container.appendChild(
      renderPainelCoordenador({
        etapa: props.etapa,
        onConfigChanged: props.onConfigChanged,
        onAbrirDirigente: () => {
          if (isLoggedIn('dirigente')) {
            mode = 'dirigente';
            render();
          } else {
            promptDirigente();
          }
        },
      }),
    );
  }

  function promptDirigente(): void {
    clear(container);
    const back = el('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, ['← Voltar']);
    back.addEventListener('click', render);
    container.appendChild(back);
    container.appendChild(
      el('section', { class: 'card' }, [
        renderLoginGate({
          role: 'dirigente',
          title: 'Acesso do dirigente',
          description: 'Confirme a senha de dirigente para editar o catálogo.',
          onSuccess: () => {
            mode = 'dirigente';
            render();
          },
        }),
      ]),
    );
  }

  render();
  return container;
}
