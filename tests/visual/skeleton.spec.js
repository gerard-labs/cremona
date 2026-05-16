import { test, expect } from '@playwright/test';

const VARIANTS = [
  ['light-ltr', 0],
  ['light-rtl', 1],
  ['dark-ltr', 2],
  ['dark-rtl', 3],
];

for (const [name, variantId] of VARIANTS) {
  test(`visual: skeleton ${name}`, async ({ page }) => {
    await page.goto(`/story/src-templates-components-skeleton-skeleton-story?variantId=${variantId}`);
    await page.waitForLoadState('networkidle');
    // Wait extra for the shimmer animation to reach a stable phase before snapping.
    await page.waitForTimeout(750);
    await expect(page).toHaveScreenshot(`skeleton-${name}.png`, {
      fullPage: true,
      // Allow more tolerance because the shimmer animation is at an arbitrary frame.
      maxDiffPixelRatio: 0.02,
    });
  });
}
