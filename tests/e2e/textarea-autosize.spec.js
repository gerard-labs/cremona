import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — textarea-autosize
 *
 * The textarea-autosize controller attaches directly to <textarea> elements
 * (not a wrapper). On connect() it calls resize() immediately, so pre-filled
 * textareas are already correctly sized. On every `input` event it resizes
 * again.
 *
 * Story slug: `textarea` (src/templates/components/textarea/).
 *
 * Observations:
 *  - A pre-filled autosize textarea is taller than an empty one (connect()
 *    fired on mount).
 *  - Typing multiple lines into an empty autosize textarea increases its
 *    height beyond the initial minRows height.
 *  - A long-value autosize textarea is clamped at maxRows and has
 *    overflow-y auto (scrollable).
 */
test.describe('textarea-autosize', () => {
  test('autosize textarea exists and has data-controller attribute', async ({ page }) => {
    await page.goto(sandbox('textarea'));
    await page.waitForLoadState('networkidle');

    const autosizeTextareas = page.locator('[data-controller~="textarea-autosize"]');
    await expect(autosizeTextareas.first()).toBeVisible();
    await expect(autosizeTextareas).not.toHaveCount(0);
  });

  test('empty autosize textarea grows in height when content is typed', async ({ page }) => {
    await page.goto(sandbox('textarea'));
    await page.waitForLoadState('networkidle');

    // Target the empty autosize textarea in the default section (#demo-default-msg).
    const ta = page.locator('#demo-default-msg');
    await expect(ta).toBeVisible();

    const initialHeight = (await ta.boundingBox()).height;

    // Type enough lines to exceed minRows (2).
    await ta.click();
    await ta.type('Line 1\nLine 2\nLine 3\nLine 4\nLine 5');

    const grownHeight = (await ta.boundingBox()).height;
    expect(grownHeight).toBeGreaterThan(initialHeight);
  });

  test('pre-filled medium-content autosize textarea is taller than empty one on mount', async ({ page }) => {
    await page.goto(sandbox('textarea'));
    await page.waitForLoadState('networkidle');

    // #demo-autosize-empty vs #demo-autosize-medium — both same minRows/maxRows.
    const empty = page.locator('#demo-autosize-empty');
    const medium = page.locator('#demo-autosize-medium');

    await expect(empty).toBeVisible();
    await expect(medium).toBeVisible();

    const emptyHeight = (await empty.boundingBox()).height;
    const mediumHeight = (await medium.boundingBox()).height;

    // The medium-content textarea should be taller because connect() resized it.
    expect(mediumHeight).toBeGreaterThan(emptyHeight);
  });
});
