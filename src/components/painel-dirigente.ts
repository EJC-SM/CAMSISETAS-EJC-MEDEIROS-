import { adminAction, atualizarConfig } from '../state/api';
import { getConfig, setConfig } from '../state/store';
import type { ConfigData, Cor, Etapa, Produto } from '../state/types';
import { clear, el } from '../utils/dom';
import { fetchAuthChallenge, hashForStorage, validatePasswordPolicy } from '../utils/password-auth';
import { toastError, toastSuccess } from '../utils/toast';

export interface PainelDirigenteProps {
  etapa: Etapa;
  onConfigChanged: () => void;
}

function precosToText(precos: Record<string, number>): string {
  return Object.entries(precos)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

function textToPrecos(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const line of text.split(/\n+/)) {
    const [k, v] = line.split('=');
    if (k?.trim() && v != null) out[k.trim()] = Number(v.trim()) || 0;
  }
  return out;
}

function csv(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function renderPainelDirigente(props: PainelDirigenteProps): HTMLElement {
  const { etapa } = props;
  const container = el('div', { class: 'stack' });

  async function save(patch: Partial<ConfigData>, okMsg: string): Promise<void> {
    const result = await atualizarConfig(etapa, patch);
    if (result.ok && result.data?.data) {
      setConfig(etapa, result.data.data);
      toastSuccess(okMsg);
      props.onConfigChanged();
      render();
    } else {
      toastError(
        result.error === 'unauthorized' ? 'Sessão de dirigente necessária.' : 'Não foi possível salvar.',
      );
    }
  }

  function renderBranding(config: ConfigData): HTMLElement {
    const nome = el('input', { class: 'input', value: config.nome_evento }) as HTMLInputElement;
    const btn = el('button', { class: 'btn btn--sm', type: 'button' }, ['Salvar identidade']);
    btn.addEventListener('click', () => void save({ nome_evento: nome.value }, 'Identidade salva.'));
    return el('section', { class: 'card stack' }, [
      el('h3', {}, ['Identidade do evento']),
      el('div', { class: 'field' }, [el('label', {}, ['Nome do evento']), nome]),
      btn,
    ]);
  }

  function renderPix(config: ConfigData): HTMLElement {
    const chave = el('input', { class: 'input', value: config.pix_chave }) as HTMLInputElement;
    const nome = el('input', { class: 'input', value: config.pix_nome }) as HTMLInputElement;
    const cidade = el('input', { class: 'input', value: config.pix_cidade }) as HTMLInputElement;
    const btn = el('button', { class: 'btn btn--sm', type: 'button' }, ['Salvar Pix']);
    btn.addEventListener(
      'click',
      () =>
        void save({ pix_chave: chave.value, pix_nome: nome.value, pix_cidade: cidade.value }, 'Pix salvo.'),
    );
    return el('section', { class: 'card stack' }, [
      el('h3', {}, ['Pagamento Pix']),
      el('div', { class: 'field' }, [el('label', {}, ['Chave Pix']), chave]),
      el('div', { class: 'field' }, [el('label', {}, ['Nome do recebedor']), nome]),
      el('div', { class: 'field' }, [el('label', {}, ['Cidade']), cidade]),
      btn,
    ]);
  }

  function renderEquipes(config: ConfigData): HTMLElement {
    const textarea = el('textarea', { class: 'textarea', rows: 8 }, [
      config.equipes.join('\n'),
    ]) as HTMLTextAreaElement;
    const btn = el('button', { class: 'btn btn--sm', type: 'button' }, ['Salvar equipes']);
    btn.addEventListener('click', () => {
      const equipes = textarea.value
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean);
      void save({ equipes }, 'Equipes salvas.');
    });
    return el('section', { class: 'card stack' }, [
      el('h3', {}, [`Equipes — Etapa ${etapa}`]),
      el('p', { class: 'hint' }, ['Uma equipe por linha.']),
      textarea,
      btn,
    ]);
  }

  function renderCores(config: ConfigData): HTMLElement {
    const cores: Cor[] = config.cores.map((c) => ({ ...c }));
    const list = el('div', { class: 'stack' });

    function renderList(): void {
      clear(list);
      cores.forEach((cor, index) => {
        const nome = el('input', {
          class: 'input grow',
          value: cor.nome,
          'aria-label': 'Nome da cor',
        }) as HTMLInputElement;
        const hex = el('input', {
          class: 'input',
          type: 'color',
          value: cor.hex,
          'aria-label': 'Cor',
        }) as HTMLInputElement;
        nome.addEventListener('input', () => {
          cor.nome = nome.value;
        });
        hex.addEventListener('input', () => {
          cor.hex = hex.value;
        });
        const remove = el('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, ['×']);
        remove.addEventListener('click', () => {
          cores.splice(index, 1);
          renderList();
        });
        list.appendChild(el('div', { class: 'row' }, [nome, hex, remove]));
      });
    }
    renderList();

    const addBtn = el('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, ['+ Cor']);
    addBtn.addEventListener('click', () => {
      cores.push({ id: '', nome: 'Nova cor', hex: '#888888' });
      renderList();
    });
    const saveBtn = el('button', { class: 'btn btn--sm', type: 'button' }, ['Salvar cores']);
    saveBtn.addEventListener('click', () => void save({ cores }, 'Cores salvas.'));

    return el('section', { class: 'card stack' }, [
      el('h3', {}, ['Cores']),
      list,
      el('div', { class: 'row' }, [addBtn, saveBtn]),
    ]);
  }

  function renderProdutos(config: ConfigData): HTMLElement {
    const produtos: Produto[] = config.produtos.map((p) => ({ ...p, precos: { ...p.precos } }));
    const list = el('div', { class: 'stack' });

    function renderList(): void {
      clear(list);
      produtos.forEach((produto, index) => {
        const tipo = el('input', {
          class: 'input',
          value: produto.tipo,
          'aria-label': 'Modelo',
        }) as HTMLInputElement;
        const tamanhos = el('input', {
          class: 'input',
          value: produto.tamanhos.join(', '),
          'aria-label': 'Tamanhos',
        }) as HTMLInputElement;
        const golas = el('input', {
          class: 'input',
          value: produto.golas.join(', '),
          'aria-label': 'Golas',
        }) as HTMLInputElement;
        const precos = el('textarea', { class: 'textarea', rows: 3, 'aria-label': 'Preços' }, [
          precosToText(produto.precos),
        ]) as HTMLTextAreaElement;
        const excl = el('input', {
          class: 'input',
          value: produto.cores_excluidas.join(', '),
          'aria-label': 'Cores excluídas',
        }) as HTMLInputElement;
        const obs = el('input', {
          class: 'input',
          value: produto.obs,
          'aria-label': 'Observação',
        }) as HTMLInputElement;

        tipo.addEventListener('input', () => {
          produto.tipo = tipo.value;
        });
        tamanhos.addEventListener('input', () => {
          produto.tamanhos = csv(tamanhos.value);
        });
        golas.addEventListener('input', () => {
          produto.golas = csv(golas.value);
        });
        precos.addEventListener('input', () => {
          produto.precos = textToPrecos(precos.value);
        });
        excl.addEventListener('input', () => {
          produto.cores_excluidas = csv(excl.value);
        });
        obs.addEventListener('input', () => {
          produto.obs = obs.value;
        });

        const remove = el('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, ['Remover modelo']);
        remove.addEventListener('click', () => {
          produtos.splice(index, 1);
          renderList();
        });

        list.appendChild(
          el('div', { class: 'item-pedido stack' }, [
            el('div', { class: 'field' }, [el('label', {}, ['Modelo']), tipo]),
            el('div', { class: 'field' }, [el('label', {}, ['Tamanhos (vírgula)']), tamanhos]),
            el('div', { class: 'field' }, [el('label', {}, ['Golas (vírgula, use — se não houver)']), golas]),
            el('div', { class: 'field' }, [
              el('label', {}, ['Preços (chave=valor por linha; "all" = preço único)']),
              precos,
            ]),
            el('div', { class: 'field' }, [el('label', {}, ['Cores excluídas (vírgula)']), excl]),
            el('div', { class: 'field' }, [el('label', {}, ['Observação']), obs]),
            remove,
          ]),
        );
      });
    }
    renderList();

    const addBtn = el('button', { class: 'btn btn--ghost btn--sm', type: 'button' }, ['+ Modelo']);
    addBtn.addEventListener('click', () => {
      produtos.push({
        id: '',
        tipo: 'Novo modelo',
        foto_key: '',
        tamanhos: ['P', 'M', 'G', 'GG'],
        golas: ['—'],
        precos: { all: 0 },
        cores_excluidas: [],
        obs: '',
      });
      renderList();
    });
    const saveBtn = el('button', { class: 'btn btn--sm', type: 'button' }, ['Salvar modelos']);
    saveBtn.addEventListener('click', () => void save({ produtos }, 'Modelos salvos.'));

    return el('section', { class: 'card stack' }, [
      el('h3', {}, ['Modelos / catálogo']),
      list,
      el('div', { class: 'row' }, [addBtn, saveBtn]),
    ]);
  }

  function renderSenhas(): HTMLElement {
    const roleSelect = el(
      'select',
      { class: 'select', 'aria-label': 'Papel' },
      [
        ['coordenador', 'Coordenador'],
        ['dirigente', 'Dirigente'],
      ].map(([v, l]) => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = l;
        return opt;
      }),
    ) as HTMLSelectElement;
    const senha = el('input', {
      class: 'input',
      type: 'password',
      autocomplete: 'new-password',
      'aria-label': 'Nova senha',
    }) as HTMLInputElement;
    const err = el('p', { class: 'field-error', role: 'alert' });
    const btn = el('button', { class: 'btn btn--sm', type: 'button' }, ['Alterar senha']);
    btn.addEventListener('click', async () => {
      err.textContent = '';
      const role = roleSelect.value as 'coordenador' | 'dirigente';
      const policyError = validatePasswordPolicy(senha.value);
      if (policyError) {
        err.textContent = policyError;
        return;
      }
      const challenge = await fetchAuthChallenge(role);
      if (!challenge) {
        err.textContent = 'Não foi possível obter parâmetros de senha.';
        return;
      }
      const hash = await hashForStorage(senha.value, challenge.salt, challenge.iterations);
      if (!hash) {
        err.textContent = 'Falha ao preparar a senha.';
        return;
      }
      const result = await adminAction({
        action: 'change_password',
        password_role: role,
        passwordHash: hash,
      });
      if (result.ok) {
        senha.value = '';
        toastSuccess('Senha alterada.');
      } else {
        err.textContent = 'Não foi possível alterar a senha.';
      }
    });

    return el('section', { class: 'card stack' }, [
      el('h3', {}, ['Senhas']),
      el('div', { class: 'field' }, [el('label', {}, ['Papel']), roleSelect]),
      el('div', { class: 'field' }, [el('label', {}, ['Nova senha']), senha]),
      err,
      btn,
    ]);
  }

  function renderResetCatalogo(): HTMLElement {
    const btn = el('button', { class: 'btn btn--danger btn--sm', type: 'button' }, [
      'Restaurar catálogo padrão',
    ]);
    btn.addEventListener('click', async () => {
      if (!window.confirm('Restaurar modelos e cores para o padrão? As edições atuais serão perdidas.'))
        return;
      const result = await adminAction({ action: 'reset_catalogo', etapa });
      if (result.ok) {
        toastSuccess('Catálogo restaurado.');
        props.onConfigChanged();
        render();
      } else {
        toastError('Ação não permitida.');
      }
    });
    return el('section', { class: 'card stack' }, [el('h3', {}, ['Restaurar']), btn]);
  }

  function render(): void {
    clear(container);
    const config = getConfig(etapa);
    container.appendChild(el('h2', {}, ['Área do dirigente']));
    container.appendChild(renderBranding(config));
    container.appendChild(renderPix(config));
    container.appendChild(renderEquipes(config));
    container.appendChild(renderCores(config));
    container.appendChild(renderProdutos(config));
    container.appendChild(renderSenhas());
    container.appendChild(renderResetCatalogo());
  }

  render();
  return container;
}
