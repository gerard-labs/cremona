import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VARIANTS = [
  '/story/src-templates-components-native-select-native-select-story?variantId=0',
  '/story/src-templates-components-native-select-native-select-story?variantId=1',
  '/story/src-templates-components-native-select-native-select-story?variantId=2',
  '/story/src-templates-components-native-select-native-select-story?variantId=3',
];

for (const url of VARIANTS) {
  test(`axe: native-select ${url}`, async ({ page }) => {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    // Give the catalog shell + story iframe a lang attribute (axe html-has-lang).
    await page.evaluate(() => { for (const d of [document, ...[...document.querySelectorAll('iframe')].map((f) => f.contentDocument).filter(Boolean)]) { if (!d.documentElement.lang) d.documentElement.lang = 'fr'; } });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      // Bare-primitive variants render <select> without an associated <label>;
      // Field is the composition that wires the binding (verified in Field's
      // own story). Same pattern as Input / Textarea a11y specs.
      .disableRules(['label', 'label-title-only'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
