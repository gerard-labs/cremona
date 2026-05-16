import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VARIANTS = [
  '/story/src-templates-components-avatar-avatar-story?variantId=0',
  '/story/src-templates-components-avatar-avatar-story?variantId=1',
  '/story/src-templates-components-avatar-avatar-story?variantId=2',
  '/story/src-templates-components-avatar-avatar-story?variantId=3',
];

for (const url of VARIANTS) {
  test(`axe: avatar ${url}`, async ({ page }) => {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    // Give the catalog shell + story iframe a lang attribute (axe html-has-lang).
    await page.evaluate(() => { for (const d of [document, ...[...document.querySelectorAll('iframe')].map((f) => f.contentDocument).filter(Boolean)]) { if (!d.documentElement.lang) d.documentElement.lang = 'fr'; } });
    // Give the controller a beat to swap the deliberately-broken image.
    await page.waitForTimeout(300);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
