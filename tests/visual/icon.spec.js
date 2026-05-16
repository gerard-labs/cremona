import { test, expect } from '@playwright/test';

/**
 * Ring 1 S1.1 — Icon primitive visual baseline.
 */

const VARIANTS = [
  ['light-ltr', 0],
  ['light-rtl', 1],
  ['dark-ltr', 2],
  ['dark-rtl', 3],
];

for (const [name, variantId] of VARIANTS) {
  test(`visual: icon ${name}`, async ({ page }) => {
    await page.goto(`/story/src-templates-components-icon-icon-story?variantId=${variantId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot(`icon-${name}.png`, { fullPage: true });
  });
}
