import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VARIANTS = [
  '/story/src-templates-components-field-field-story?variantId=0',
  '/story/src-templates-components-field-field-story?variantId=1',
  '/story/src-templates-components-field-field-story?variantId=2',
  '/story/src-templates-components-field-field-story?variantId=3',
];

for (const url of VARIANTS) {
  test(`axe: field ${url}`, async ({ page }) => {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    // Give the catalog shell + story iframe a lang attribute (axe html-has-lang).
    await page.evaluate(() => { for (const d of [document, ...[...document.querySelectorAll('iframe')].map((f) => f.contentDocument).filter(Boolean)]) { if (!d.documentElement.lang) d.documentElement.lang = 'fr'; } });
    // textarea-autosize resizes on connect — give it a beat.
    await page.waitForTimeout(200);
    // No `disableRules` here — Field's whole job is to wire <label for> +
    // aria-describedby + aria-invalid + aria-required correctly. axe MUST
    // pass the full rule set including `label` and `label-title-only`.
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
