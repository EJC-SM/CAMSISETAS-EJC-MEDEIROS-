// Extrai as imagens base64 embutidas no App.jsx legado para arquivos em src/assets/.
// Uso: node scripts/extract-assets.cjs
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'legacy', 'App.jsx.reference');
const OUT_PRODUTOS = path.join(ROOT, 'src', 'assets', 'produtos');
const OUT_ASSETS = path.join(ROOT, 'src', 'assets');

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

function slugify(value) {
  return String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function writeDataUrl(dataUrl, baseName, outDir) {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) return null;
  const mime = match[1];
  const ext = EXT_BY_MIME[mime] || 'bin';
  const buffer = Buffer.from(match[2], 'base64');
  fs.mkdirSync(outDir, { recursive: true });
  const filename = `${baseName}.${ext}`;
  fs.writeFileSync(path.join(outDir, filename), buffer);
  return filename;
}

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`Fonte nao encontrada: ${SOURCE}`);
    process.exit(1);
  }
  const src = fs.readFileSync(SOURCE, 'utf8');
  const manifest = {};

  // FOTOS = { "Chave": "data:image/...;base64,....", ... }
  const fotoEntry = /"([^"]+)"\s*:\s*"(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)"/g;
  let count = 0;
  for (;;) {
    const m = fotoEntry.exec(src);
    if (m === null) break;
    const slug = slugify(m[1]);
    if (!slug) continue;
    const filename = writeDataUrl(m[2], slug, OUT_PRODUTOS);
    if (filename) {
      manifest[slug] = filename;
      count += 1;
    }
  }

  // LOGO = "data:image/...;base64,...."
  const logoMatch = /const\s+LOGO\s*=\s*"(data:image\/[^;]+;base64,[A-Za-z0-9+/=]+)"/.exec(src);
  if (logoMatch) {
    const filename = writeDataUrl(logoMatch[1], 'logo', OUT_ASSETS);
    if (filename) manifest.__logo = filename;
  }

  fs.writeFileSync(path.join(OUT_PRODUTOS, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Extraidas ${count} imagens de produto + ${logoMatch ? 1 : 0} logo.`);
  console.log('Manifest:', JSON.stringify(manifest, null, 2));
}

main();
