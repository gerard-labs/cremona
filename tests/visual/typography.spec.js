import { test, expect } from '@playwright/test';

/**
 * Ring 1 S1.1 — Typography primitive visual baseline. 4 variants ×
 * playwright projects (mobile/tablet/desktop × light/dark). Baselines
 * baked by CI on first push per OQ-1 (STATE.md S1.1).
 */

const VARIANTS = [
  ['light-ltr', 0],
  ['light-rtl', 1],
  ['dark-ltr', 2],
  ['dark-rtl', 3],
];

for (const [name, variantId] of VARIANTS) {
  test(`visual: typography ${name}`, async ({ page }) => {
    await page.goto(`/story/src-templates-components-typography-typography-story?variantId=${variantId}`);
    await page.waitForLoadState('networkidle');
    // Wait one frame to let fonts settle.
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot(`typography-${name}.png`, { fullPage: true });
  });
}
