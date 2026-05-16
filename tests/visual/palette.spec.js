import { test, expect } from '@playwright/test';

/**
 * Ring 0 visual baseline — palette story × 4 variants × viewport projects.
 * Baselines are committed under tests/visual/palette.spec.js-snapshots/.
 */

const VARIANTS = [
  ['light-ltr', 0],
  ['light-rtl', 1],
  ['dark-ltr', 2],
  ['dark-rtl', 3],
];

for (const [name, variantId] of VARIANTS) {
  test(`visual: palette ${name}`, async ({ page }) => {
    await page.goto(`/story/src-templates-palette-palette-story?variantId=${variantId}`);
    await page.waitForLoadState('networkidle');
    // Wait one frame to let any fonts settle.
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot(`palette-${name}.png`, { fullPage: true });
  });
}
