import { test, expect } from '@playwright/test';

const VARIANTS = [
  ['light-ltr', 0],
  ['light-rtl', 1],
  ['dark-ltr', 2],
  ['dark-rtl', 3],
];

for (const [name, variantId] of VARIANTS) {
  test(`visual: kbd ${name}`, async ({ page }) => {
    await page.goto(`/story/src-templates-components-kbd-kbd-story?variantId=${variantId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot(`kbd-${name}.png`, { fullPage: true });
  });
}
