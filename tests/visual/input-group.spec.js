import { test, expect } from '@playwright/test';

const VARIANTS = [
  ['light-ltr', 0],
  ['light-rtl', 1],
  ['dark-ltr', 2],
  ['dark-rtl', 3],
];

for (const [name, variantId] of VARIANTS) {
  test(`visual: input-group ${name}`, async ({ page }) => {
    await page.goto(`/story/src-templates-components-input-group-input-group-story?variantId=${variantId}`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`input-group-${name}.png`, { fullPage: true });
  });
}
