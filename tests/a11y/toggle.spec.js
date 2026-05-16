import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VARIANTS = [
  '/story/src-templates-components-toggle-toggle-story?variantId=0',
  '/story/src-templates-components-toggle-toggle-story?variantId=1',
  '/story/src-templates-components-toggle-toggle-story?variantId=2',
  '/story/src-templates-components-toggle-toggle-story?variantId=3',
];

for (const url of VARIANTS) {
  test(`axe: toggle ${url}`, async ({ page }) => {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    // Give the catalog shell + story iframe a lang attribute (axe html-has-lang).
    await page.evaluate(() => { for (const d of [document, ...[...document.querySelectorAll('iframe')].map((f) => f.contentDocument).filter(Boolean)]) { if (!d.documentElement.lang) d.documentElement.lang = 'fr'; } });
    // Toggle runs the FULL WCAG 2.1 AA rule set — no `disableRules`. Every
    // toggle has either an inline label OR an aria-label (icon-only variants),
    // so `button-name` always resolves.
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
