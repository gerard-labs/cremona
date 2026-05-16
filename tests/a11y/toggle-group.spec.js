import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VARIANTS = [
  '/story/src-templates-components-toggle-group-toggle-group-story?variantId=0',
  '/story/src-templates-components-toggle-group-toggle-group-story?variantId=1',
  '/story/src-templates-components-toggle-group-toggle-group-story?variantId=2',
  '/story/src-templates-components-toggle-group-toggle-group-story?variantId=3',
];

for (const url of VARIANTS) {
  test(`axe: toggle-group ${url}`, async ({ page }) => {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    // Give the catalog shell + story iframe a lang attribute (axe html-has-lang).
    await page.evaluate(() => { for (const d of [document, ...[...document.querySelectorAll('iframe')].map((f) => f.contentDocument).filter(Boolean)]) { if (!d.documentElement.lang) d.documentElement.lang = 'fr'; } });
    // ToggleGroup runs the FULL WCAG 2.1 AA rule set — no `disableRules`. The
    // group container has role="group" + aria-labelledby; every inner Toggle
    // has either a label or an aria-label.
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
