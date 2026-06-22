import { expect, test } from '@playwright/test';

test('fluxo público: catálogo → pedido → Pix', async ({ page }) => {
  await page.goto('/');

  // Catálogo visível por padrão.
  await expect(page.getByRole('heading', { name: 'Modelos disponíveis' })).toBeVisible();

  // Ir para a aba de pedido.
  await page.getByRole('tab', { name: /Fazer pedido/ }).click();
  await expect(page.getByRole('heading', { name: 'Fazer pedido' })).toBeVisible();

  await page.getByLabel(/Nome completo/).fill('Maria Teste E2E');
  await page.getByLabel(/WhatsApp/).fill('11988887777');
  await page.getByLabel('Equipe').selectOption('Cozinha');

  // Modelo sem gola (Infantil) simplifica o fluxo.
  await page.getByLabel('Modelo').selectOption('Infantil (00–08)');
  await page.getByLabel('Tamanho').selectOption('4');
  await page.getByLabel('Cor').selectOption('Preto');
  await page.getByLabel('Quantidade').fill('2');

  await page.getByRole('button', { name: 'Fazer pedido', exact: true }).click();

  // Modal de confirmação com Pix.
  await expect(page.getByRole('heading', { name: /Pedido registrado/ })).toBeVisible();
  await expect(page.getByText(/Total a pagar/)).toBeVisible();
});
