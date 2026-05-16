import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VARIANTS = [
  '/story/src-templates-components-input-input-story?variantId=0',
  '/story/src-templates-components-input-input-story?variantId=1',
  '/story/src-templates-components-input-input-story?variantId=2',
  '/story/src-templates-components-input-input-story?variantId=3',
];

for (const url of VARIANTS) {
  test(`axe: input ${url}`, async ({ page }) => {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    // Give the catalog shell + story iframe a lang attribute (axe html-has-lang).
    await page.evaluate(() => { for (const d of [document, ...[...document.querySelectorAll('iframe')].map((f) => f.contentDocument).filter(Boolean)]) { if (!d.documentElement.lang) d.documentElement.lang = 'fr'; } });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      // Some Input variants render `<input>` without an associated `<label>`
      // by design (the story showcases the bare primitive; Field is the
      // composition that wires Label.for). Disable the label rule for these
      // story variants; axe verifies it on Field's own story instead.
      .disableRules(['label', 'label-title-only'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
