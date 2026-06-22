// Camada de "tempo real" leve baseada em polling da API.
//
// Diferente do app de doacoes, os pedidos de camisetas contem dados pessoais
// (WhatsApp), entao NAO sao expostos ao SDK do Firebase no cliente — as regras
// do banco bloqueiam leitura publica de `camisetas/pedidos`. Em vez de assinar
// o RTDB no navegador, re-hidratamos via API em intervalos, o que mantem o PII
// no servidor e evita bundlar o SDK do Firebase.

type PollHandler = () => void | Promise<void>;

let timer: number | null = null;

export function startPolling(handler: PollHandler, intervalMs = 20000): () => void {
  stopPolling();
  timer = window.setInterval(() => {
    if (document.visibilityState === 'visible') void handler();
  }, intervalMs);

  const onVisible = (): void => {
    if (document.visibilityState === 'visible') void handler();
  };
  document.addEventListener('visibilitychange', onVisible);

  return () => {
    stopPolling();
    document.removeEventListener('visibilitychange', onVisible);
  };
}

export function stopPolling(): void {
  if (timer != null) {
    window.clearInterval(timer);
    timer = null;
  }
}
