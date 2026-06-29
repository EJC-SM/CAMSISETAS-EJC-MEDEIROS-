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
  // Tamanho e cor agora são badges (botões de rádio).
  await page.getByRole('radio', { name: '4', exact: true }).click();
  await page.getByRole('radio', { name: 'Preto', exact: true }).click();
  // O campo numerico de quantidade tem role spinbutton; evita casar com os botoes +/-.
  await page.getByRole('spinbutton', { name: 'Quantidade' }).fill('2');

  await page.getByRole('button', { name: 'Fazer pedido', exact: true }).click();

  // Modal de confirmação com Pix.
  await expect(page.getByRole('heading', { name: /Pedido registrado/ })).toBeVisible();
  await expect(page.getByText(/Total a pagar/)).toBeVisible();
});

test('clicar na foto do catálogo abre o pedido com o modelo selecionado', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Modelos disponíveis' })).toBeVisible();

  // Clicar na foto do modelo Infantil leva ao pedido já selecionado.
  await page.getByRole('button', { name: 'Fazer pedido de Infantil (00–08)' }).click();

  await expect(page.getByRole('heading', { name: 'Fazer pedido' })).toBeVisible();
  await expect(page.getByLabel('Modelo')).toHaveValue('Infantil (00–08)');
});
