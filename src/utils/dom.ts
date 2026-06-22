// Helpers de construcao de DOM type-safe. Evitam innerHTML com dados do usuario
// (prevencao de XSS): todo texto entra via textContent.

type Attrs = Record<string, string | number | boolean | undefined>;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = String(value);
    else if (key === 'text') node.textContent = String(value);
    else if (key === 'html') throw new Error('html attr is forbidden; use text');
    else if (key.startsWith('data-') || key.startsWith('aria-')) node.setAttribute(key, String(value));
    else node.setAttribute(key, String(value));
  }
  for (const child of children) {
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function clear(node: HTMLElement): void {
  node.replaceChildren();
}

export function option(value: string, label: string, selected = false): HTMLOptionElement {
  const opt = document.createElement('option');
  opt.value = value;
  opt.textContent = label;
  if (selected) opt.selected = true;
  return opt;
}
