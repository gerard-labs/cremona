import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Ring 1 S1.1 — Icon primitive a11y gate.
 */

const VARIANTS = [
  '/story/src-templates-components-icon-icon-story?variantId=0',
  '/story/src-templates-components-icon-icon-story?variantId=1',
  '/story/src-templates-components-icon-icon-story?variantId=2',
  '/story/src-templates-components-icon-icon-story?variantId=3',
];

for (const url of VARIANTS) {
  test(`axe: icon ${url}`, async ({ page }) => {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    // Give the catalog shell + story iframe a lang attribute (axe html-has-lang).
    await page.evaluate(() => { for (const d of [document, ...[...document.querySelectorAll('iframe')].map((f) => f.contentDocument).filter(Boolean)]) { if (!d.documentElement.lang) d.documentElement.lang = 'fr'; } });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
