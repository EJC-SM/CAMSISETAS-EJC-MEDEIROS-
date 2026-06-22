import { initialSetup } from '../state/api';
import { el } from '../utils/dom';
import { fetchAuthSetupStatus, hashForStorage, validatePasswordPolicy } from '../utils/password-auth';
import { toastError, toastSuccess } from '../utils/toast';

export function renderAuthSetup(onComplete: () => void): HTMLElement {
  const errorEl = el('p', { class: 'field-error', role: 'alert', 'aria-live': 'assertive' });

  const tokenInput = el('input', {
    class: 'input',
    id: 'setup-token',
    type: 'password',
    required: true,
  }) as HTMLInputElement;
  const coordInput = el('input', {
    class: 'input',
    id: 'setup-coord',
    type: 'password',
    autocomplete: 'new-password',
    required: true,
  }) as HTMLInputElement;
  const dirInput = el('input', {
    class: 'input',
    id: 'setup-dir',
    type: 'password',
    autocomplete: 'new-password',
    required: true,
  }) as HTMLInputElement;

  const submit = el('button', { class: 'btn btn--primary btn--block', type: 'submit' }, [
    'Definir senhas e ativar',
  ]) as HTMLButtonElement;

  const form = el('form', { class: 'stack', novalidate: true }, [
    el('h2', {}, ['Configuração inicial']),
    el('p', { class: 'muted' }, [
      'Defina as senhas de Coordenador e Dirigente. Esta etapa só é feita uma vez por ambiente e exige o token de setup.',
    ]),
    el('div', { class: 'field' }, [el('label', { for: 'setup-token' }, ['Token de setup']), tokenInput]),
    el('div', { class: 'field' }, [
      el('label', { for: 'setup-coord' }, ['Senha do Coordenador']),
      coordInput,
      el('span', { class: 'hint' }, ['Mínimo de 8 caracteres.']),
    ]),
    el('div', { class: 'field' }, [
      el('label', { for: 'setup-dir' }, ['Senha do Dirigente']),
      dirInput,
      el('span', { class: 'hint' }, ['Mínimo de 8 caracteres.']),
    ]),
    errorEl,
    submit,
  ]) as HTMLFormElement;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.textContent = '';

    const policyError = validatePasswordPolicy(coordInput.value) || validatePasswordPolicy(dirInput.value);
    if (policyError) {
      errorEl.textContent = policyError;
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Processando…';

    const status = await fetchAuthSetupStatus();
    if (!status?.salts) {
      submit.disabled = false;
      submit.textContent = 'Definir senhas e ativar';
      errorEl.textContent = 'Não foi possível obter os parâmetros de setup.';
      return;
    }

    const coordHash = await hashForStorage(coordInput.value, status.salts.coord, status.iterations);
    const dirHash = await hashForStorage(dirInput.value, status.salts.dir, status.iterations);
    if (!coordHash || !dirHash) {
      submit.disabled = false;
      submit.textContent = 'Definir senhas e ativar';
      errorEl.textContent = 'Falha ao preparar as senhas.';
      return;
    }

    const result = await initialSetup(tokenInput.value, coordHash, dirHash);
    submit.disabled = false;
    submit.textContent = 'Definir senhas e ativar';

    if (result.ok) {
      toastSuccess('Senhas configuradas com sucesso.');
      onComplete();
    } else {
      const message =
        result.error === 'invalid_setup_token'
          ? 'Token de setup inválido.'
          : result.error === 'setup_already_completed'
            ? 'O setup já foi concluído neste ambiente.'
            : 'Não foi possível concluir o setup.';
      errorEl.textContent = message;
      toastError(message);
    }
  });

  return form;
}
