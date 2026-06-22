# Lições aprendidas

- **Banco compartilhado exige namespace + rules unificadas.** Prefixar tudo com
  `camisetas/` em um único ponto (`firebase-rest.cjs`) manteve os handlers idênticos
  aos do doações e garantiu isolamento. As rules precisam conter os dois subtrees.

- **PII muda o desenho de segurança.** Diferente do doações (lista pública), pedidos
  de camisetas têm WhatsApp. Por isso `pedidos` tem leitura pública desabilitada e
  `GET /api/pedidos` exige sessão — em vez de assinar o RTDB no cliente, usamos polling
  via API mantendo o PII no servidor.

- **Reutilizar segredos entre apps = escalonamento.** Como a sessão é HMAC com
  `ADMIN_API_TOKEN`/`SESSION_SECRET`, compartilhá-los faria uma sessão de um app valer
  no outro. Segredos próprios por app são obrigatórios.

- **Paridade dev/prod via dispatch único.** O `dev-server.cjs` adapta req/res e chama os
  mesmos handlers das Vercel Functions, eliminando divergência de comportamento.

- **Fallback de memória no acesso ao banco** simplificou testes/E2E e permitiu um smoke
  test 100% em Node, sem dependências npm.

- **Preço sempre no servidor.** Calcular `total` a partir do catálogo do servidor impede
  manipulação pelo cliente.

- **Imagens base64 → assets.** Extração programática (sem ler base64 no editor) reduziu o
  peso e habilitou cache-busting/lazy-loading pelo Vite.

- **`npm audit`: ler a cadeia antes de "consertar".** As 5 vulnerabilidades (3 moderate,
  1 high, 1 critical) eram **uma única causa** (esbuild ≤0.24.2) propagada por vite/vitest —
  tudo tooling de build/teste, sem exposição em produção. A correção certa foi upgrade
  controlado (Vite 5→8, Vitest 2→4) + revalidar o gate, e **não** `npm audit fix --force`,
  que subiria majors às cegas.

- **Rodar a suíte cedo revela bugs latentes.** Como o ambiente inicial não tinha rede para
  `npm install`, a primeira execução real do Vitest expôs um bug no `formatPhoneBr`
  (`(11) 98888 -7777`, espaço antes do traço) e ~30 apontamentos do Biome nunca aplicados.
