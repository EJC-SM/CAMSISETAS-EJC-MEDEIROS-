import { expect, test } from '@playwright/test';

const COORD_PASSWORD = 'coordpass123';
const DIR_PASSWORD = 'dirpass1234';

test('setup inicial + login do coordenador + visão de pedidos', async ({ page }) => {
  // O painel so e acessivel pela rota dedicada /admin (sem aba no menu).
  await page.goto('/admin');

  const setupVisible = await page
    .getByLabel('Token de setup')
    .isVisible()
    .catch(() => false);

  test.skip(!setupVisible, 'Setup já concluído neste servidor; reinicie o dev-server para um estado limpo.');

  // Configuração inicial de senhas (token vem do env do webServer no playwright.config).
  await page.getByLabel('Token de setup').fill('e2e-setup-token');
  await page.getByLabel('Senha do Coordenador').fill(COORD_PASSWORD);
  await page.getByLabel('Senha do Dirigente').fill(DIR_PASSWORD);
  await page.getByRole('button', { name: /Definir senhas e ativar/ }).click();

  // Após o setup, aparecem os formulários de login.
  await expect(page.locator('#senha-coordenador')).toBeVisible();

  await page.locator('#senha-coordenador').fill(COORD_PASSWORD);
  await page.getByRole('button', { name: 'Entrar como Coordenador' }).click();

  await expect(page.getByRole('heading', { name: /Pedidos — Etapa 1/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Área do dirigente' })).toBeVisible();
});
