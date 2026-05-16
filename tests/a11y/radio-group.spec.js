import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VARIANTS = [
  '/story/src-templates-components-radio-group-radio-group-story?variantId=0',
  '/story/src-templates-components-radio-group-radio-group-story?variantId=1',
  '/story/src-templates-components-radio-group-radio-group-story?variantId=2',
  '/story/src-templates-components-radio-group-radio-group-story?variantId=3',
];

for (const url of VARIANTS) {
  test(`axe: radio-group ${url}`, async ({ page }) => {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    // Give the catalog shell + story iframe a lang attribute (axe html-has-lang).
    await page.evaluate(() => { for (const d of [document, ...[...document.querySelectorAll('iframe')].map((f) => f.contentDocument).filter(Boolean)]) { if (!d.documentElement.lang) d.documentElement.lang = 'fr'; } });
    // RadioGroup runs the FULL WCAG 2.1 AA rule set — no `disableRules`. Every
    // radio is wrapped in a <label> (native association), the group has a
    // <fieldset><legend> (group accessible name), and required / invalid /
    // describedBy all flow through. The full label / labelledby chain produces
    // a complete accessible name for every radio.
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
