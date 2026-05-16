import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VARIANTS = [
  '/story/src-templates-components-textarea-textarea-story?variantId=0',
  '/story/src-templates-components-textarea-textarea-story?variantId=1',
  '/story/src-templates-components-textarea-textarea-story?variantId=2',
  '/story/src-templates-components-textarea-textarea-story?variantId=3',
];

for (const url of VARIANTS) {
  test(`axe: textarea ${url}`, async ({ page }) => {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    // Give the catalog shell + story iframe a lang attribute (axe html-has-lang).
    await page.evaluate(() => { for (const d of [document, ...[...document.querySelectorAll('iframe')].map((f) => f.contentDocument).filter(Boolean)]) { if (!d.documentElement.lang) d.documentElement.lang = 'fr'; } });
    // Give textarea-autosize a beat to resize pre-filled values on connect.
    await page.waitForTimeout(200);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      // Bare-primitive variants render <textarea> without an associated
      // <label> — Field is the composition that wires the binding (verified
      // in Field's own story). Same pattern as Input's a11y spec.
      .disableRules(['label', 'label-title-only'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
