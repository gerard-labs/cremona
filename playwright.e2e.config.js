import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E — drives real browser interactions against the Histoire
 * catalog: opens menus, types into fields, advances steppers, dismisses
 * toasts, etc., asserting that the Stimulus controllers behave as intended.
 *
 * Each spec navigates to a story (`/story/<id>?variantId=<n>`) and works
 * inside the story preview iframe via `page.frameLocator('iframe')`.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/e2e', open: 'never' }]],
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
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
