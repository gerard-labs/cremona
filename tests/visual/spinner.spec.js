import { test, expect } from '@playwright/test';

const VARIANTS = [
  ['light-ltr', 0],
  ['light-rtl', 1],
  ['dark-ltr', 2],
  ['dark-rtl', 3],
];

for (const [name, variantId] of VARIANTS) {
  test(`visual: spinner ${name}`, async ({ page }) => {
    await page.goto(`/story/src-templates-components-spinner-spinner-story?variantId=${variantId}`);
    await page.waitForLoadState('networkidle');
    // Wait for the spinner to be in a deterministic rotation phase before snapping.
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot(`spinner-${name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
}
