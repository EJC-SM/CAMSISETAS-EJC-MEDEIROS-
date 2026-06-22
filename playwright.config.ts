import { defineConfig, devices } from '@playwright/test';

const PORT = 4317;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Force the dev API into in-memory mode so E2E never touches the shared Firebase DB.
    // ADMIN_API_TOKEN definido garante que o gate de sessao admin fique ativo no E2E.
    env: {
      FIREBASE_DATABASE_URL: '',
      FIREBASE_API_KEY: '',
      AUTH_SETUP_TOKEN: 'e2e-setup-token',
      ADMIN_API_TOKEN: 'e2e-admin-token',
      SESSION_SECRET: 'e2e-session-secret',
    },
  },
});
