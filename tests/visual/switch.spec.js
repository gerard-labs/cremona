import { test, expect } from '@playwright/test';

const VARIANTS = [
  ['light-ltr', 0],
  ['light-rtl', 1],
  ['dark-ltr', 2],
  ['dark-rtl', 3],
];

for (const [name, variantId] of VARIANTS) {
  test(`visual: switch ${name}`, async ({ page }) => {
    await page.goto(`/story/src-templates-components-switch-switch-story?variantId=${variantId}`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`switch-${name}.png`, { fullPage: true });
  });
}
