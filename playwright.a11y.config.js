import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright a11y — runs axe-core on every Histoire story.
 * Ring 0 scope: the palette story (4 variants).
 */
export default defineConfig({
  testDir: './tests/a11y',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/a11y', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm histoire:preview --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium-light', use: { ...devices['Desktop Chrome'], colorScheme: 'light' } },
    { name: 'chromium-dark', use: { ...devices['Desktop Chrome'], colorScheme: 'dark' } },
  ],
});
