import type { AuthRole } from '../state/types';
import { loginApi } from '../utils/auth';
import { el } from '../utils/dom';

export interface LoginGateOptions {
  role: AuthRole;
  title: string;
  description?: string;
  onSuccess: () => void;
}

export function renderLoginGate(options: LoginGateOptions): HTMLElement {
  const errorEl = el('p', { class: 'field-error', role: 'alert', 'aria-live': 'assertive' });
  const passwordInput = el('input', {
    class: 'input',
    type: 'password',
    id: `senha-${options.role}`,
    autocomplete: 'current-password',
    required: true,
  }) as HTMLInputElement;

  const submit = el('button', { class: 'btn btn--primary btn--block', type: 'submit' }, [
    `Entrar como ${options.role === 'coordenador' ? 'Coordenador' : 'Dirigente'}`,
  ]) as HTMLButtonElement;

  const form = el('form', { class: 'stack', novalidate: true }, [
    el('h2', {}, [options.title]),
    options.description
      ? el('p', { class: 'muted' }, [options.description])
      : el('span', { class: 'sr-only' }),
    el('div', { class: 'field' }, [el('label', { for: `senha-${options.role}` }, ['Senha']), passwordInput]),
    errorEl,
    submit,
  ]) as HTMLFormElement;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.textContent = '';
    submit.disabled = true;
    submit.textContent = 'Verificando…';
    const result = await loginApi(options.role, passwordInput.value);
    submit.disabled = false;
    submit.textContent = `Entrar como ${options.role === 'coordenador' ? 'Coordenador' : 'Dirigente'}`;
    if (result.ok) {
      options.onSuccess();
    } else {
      errorEl.textContent = result.message || 'Credenciais inválidas.';
      passwordInput.focus();
    }
  });

  return form;
}
