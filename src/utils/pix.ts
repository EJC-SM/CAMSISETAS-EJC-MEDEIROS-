// Geracao de payload Pix "copia e cola" (BR Code estatico) + URL de QR Code.
// Portado da logica do app legado, agora tipado e testavel.

function field(id: string, value: string): string {
  const len = String(value).length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (const ch of payload) {
    crc ^= ch.charCodeAt(0) << 8;
    for (let i = 0; i < 8; i += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function pixPayload(chave: string, nome: string, cidade: string): string {
  const safeNome = (nome || 'EJC').slice(0, 25);
  const safeCidade = (cidade || 'BRASIL').slice(0, 15);
  const merchantAccount = `${field('00', 'BR.GOV.BCB.PIX')}${field('01', chave)}`;
  const base = [
    field('00', '01'),
    field('26', merchantAccount),
    '52040000',
    '5303986',
    '5802BR',
    field('59', safeNome),
    field('60', safeCidade),
    field('62', field('05', '***')),
    '6304',
  ].join('');
  return `${base}${crc16(base)}`;
}

export function pixQrUrl(payload: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payload)}`;
}
