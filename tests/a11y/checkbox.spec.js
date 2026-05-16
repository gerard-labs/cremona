import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VARIANTS = [
  '/story/src-templates-components-checkbox-checkbox-story?variantId=0',
  '/story/src-templates-components-checkbox-checkbox-story?variantId=1',
  '/story/src-templates-components-checkbox-checkbox-story?variantId=2',
  '/story/src-templates-components-checkbox-checkbox-story?variantId=3',
];

for (const url of VARIANTS) {
  test(`axe: checkbox ${url}`, async ({ page }) => {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    // Give the catalog shell + story iframe a lang attribute (axe html-has-lang).
    await page.evaluate(() => { for (const d of [document, ...[...document.querySelectorAll('iframe')].map((f) => f.contentDocument).filter(Boolean)]) { if (!d.documentElement.lang) d.documentElement.lang = 'fr'; } });
    // Checkbox runs the FULL WCAG 2.1 AA rule set — no `disableRules`. The
    // row-mode variants wrap the input in a <label> (native association); the
    // bare-mode variants set aria-label on the input directly; the in-Field
    // section uses external <label for=...>. All paths produce a non-empty
    // accessible name, so the `label` / `label-title-only` rules must pass.
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
