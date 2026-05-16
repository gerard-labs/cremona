import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright visual regression — captures Histoire stories at multiple
 * viewports × themes × directions, diffs against committed PNG baselines.
 */
export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/visual', open: 'never' }]],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.001 },
  },
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
    { name: 'mobile-light', use: { ...devices['iPhone 13'], colorScheme: 'light' } },
    { name: 'mobile-dark', use: { ...devices['iPhone 13'], colorScheme: 'dark' } },
    { name: 'tablet-light', use: { ...devices['iPad Pro 11'], colorScheme: 'light' } },
    { name: 'desktop-light', use: { ...devices['Desktop Chrome'], colorScheme: 'light' } },
    { name: 'desktop-dark', use: { ...devices['Desktop Chrome'], colorScheme: 'dark' } },
  ],
});
