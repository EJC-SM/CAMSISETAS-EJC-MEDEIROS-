import logoUrl from './logo.jpg';

// Vite resolve cada imagem para uma URL com hash (cache-busting + lazy via <img loading>).
const produtoModules = import.meta.glob('./produtos/*.{png,jpg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const fotoByKey: Record<string, string> = {};
for (const [filePath, url] of Object.entries(produtoModules)) {
  const slug = filePath.replace(/^.*\/produtos\//, '').replace(/\.[a-z]+$/i, '');
  fotoByKey[slug] = url;
}

export const LOGO_URL = logoUrl;

export function fotoProduto(fotoKey: string): string | null {
  return fotoByKey[fotoKey] ?? null;
}

export function fotoFallback(): string | null {
  return fotoByKey['ejc-frente'] ?? null;
}
