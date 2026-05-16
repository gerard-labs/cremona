import { test, expect } from '@playwright/test';

const VARIANTS = [
  ['light-ltr', 0],
  ['light-rtl', 1],
  ['dark-ltr', 2],
  ['dark-rtl', 3],
];

for (const [name, variantId] of VARIANTS) {
  test(`visual: avatar ${name}`, async ({ page }) => {
    await page.goto(`/story/src-templates-components-avatar-avatar-story?variantId=${variantId}`);
    await page.waitForLoadState('networkidle');
    // Wait for the deliberately-broken <img> to error + the controller
    // to swap to initials so the baseline captures the post-swap state.
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot(`avatar-${name}.png`, { fullPage: true });
  });
}
