import { test, expect } from '@playwright/test';

const VARIANTS = [
  ['light-ltr', 0],
  ['light-rtl', 1],
  ['dark-ltr', 2],
  ['dark-rtl', 3],
];

for (const [name, variantId] of VARIANTS) {
  test(`visual: textarea ${name}`, async ({ page }) => {
    await page.goto(`/story/src-templates-components-textarea-textarea-story?variantId=${variantId}`);
    await page.waitForLoadState('networkidle');
    // textarea-autosize resizes pre-filled textareas in connect() — capture
    // the post-resize stable layout.
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot(`textarea-${name}.png`, { fullPage: true });
  });
}
