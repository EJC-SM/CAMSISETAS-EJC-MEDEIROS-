// Preparo do comprovante de pagamento antes de enviar para a API.
// Imagens sao redimensionadas/comprimidas no navegador (canvas) para reduzir o
// tamanho; PDFs sao enviados como estao, com teto de tamanho. O resultado e o
// base64 puro (sem o prefixo data:), que a API guarda no Realtime DB.

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const PDF_TYPE = 'application/pdf';
export const ALLOWED_TYPES: readonly string[] = [...IMAGE_TYPES, PDF_TYPE];

// Teto do arquivo original aceito do usuario (imagens grandes ainda serao
// comprimidas antes do envio; PDFs vao direto).
export const MAX_IMAGE_INPUT_BYTES = 12 * 1024 * 1024;
export const MAX_PDF_BYTES = 3 * 1024 * 1024;

const IMAGE_MAX_DIMENSION = 1280;
const IMAGE_QUALITY = 0.7;

export interface ComprovantePayload {
  name: string;
  type: string;
  dataBase64: string;
}

export type PrepareResult = { ok: true; payload: ComprovantePayload } | { ok: false; message: string };

export interface FileMeta {
  type: string;
  size: number;
}

// Validacao pura (sem DOM) — testavel e reutilizada pelo prepareComprovante.
export function validateComprovanteMeta(file: FileMeta): { valid: boolean; message?: string } {
  if (!file || !ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, message: 'Envie uma imagem (JPG, PNG, WEBP) ou um PDF.' };
  }
  if (file.type === PDF_TYPE) {
    if (file.size > MAX_PDF_BYTES) {
      return { valid: false, message: 'PDF muito grande (máximo 3 MB).' };
    }
  } else if (file.size > MAX_IMAGE_INPUT_BYTES) {
    return { valid: false, message: 'Imagem muito grande (máximo 12 MB).' };
  }
  return { valid: true };
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('read_failed'));
    reader.readAsDataURL(blob);
  });
}

function stripDataUrlPrefix(dataUrl: string): string {
  const comma = dataUrl.indexOf(',');
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image_load_failed'));
    img.src = src;
  });
}

function scaleDimensions(width: number, height: number, max: number): { width: number; height: number } {
  if (width <= max && height <= max) return { width, height };
  const ratio = width > height ? max / width : max / height;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

async function compressImage(file: File): Promise<ComprovantePayload> {
  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const { width, height } = scaleDimensions(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    IMAGE_MAX_DIMENSION,
  );
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');
  ctx.drawImage(img, 0, 0, width, height);
  const compressed = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
  return {
    name: `${file.name.replace(/\.[^.]+$/, '')}.jpg`,
    type: 'image/jpeg',
    dataBase64: stripDataUrlPrefix(compressed),
  };
}

export async function prepareComprovante(file: File): Promise<PrepareResult> {
  const meta = validateComprovanteMeta({ type: file.type, size: file.size });
  if (!meta.valid) return { ok: false, message: meta.message! };

  try {
    if (file.type === PDF_TYPE) {
      const dataUrl = await readAsDataUrl(file);
      return {
        ok: true,
        payload: { name: file.name, type: PDF_TYPE, dataBase64: stripDataUrlPrefix(dataUrl) },
      };
    }
    const payload = await compressImage(file);
    return { ok: true, payload };
  } catch {
    return { ok: false, message: 'Não foi possível processar o arquivo. Tente outra imagem.' };
  }
}
