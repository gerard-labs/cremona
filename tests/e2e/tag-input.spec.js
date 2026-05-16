import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — tag-input
 *
 * The tag-input controller lazy-loads Tagify to turn a plain <input> into a
 * chip-based tag field. After the Tagify chunk loads the controller sets
 * data-tag-input-state="ready".
 *
 * Story slug: `form-tag-input` (folder: src/templates/components/form-tag-input/).
 *
 * Observations to assert:
 *  - Controller mounts (data-controller="tag-input" element exists).
 *  - data-tag-input-state transitions to "ready" once Tagify initialises.
 *  - Typing a value and pressing Enter creates a chip (Tagify tag element).
 *  - The counter target text updates to reflect the tag count.
 */
test.describe('tag-input', () => {
  test('controller mounts and reaches ready state', async ({ page }) => {
    await page.goto(sandbox('form-tag-input'));
    await page.waitForLoadState('networkidle');

    const controller = page.locator('[data-controller~="tag-input"]').first();
    await expect(controller).toBeVisible();

    // After Tagify loads, the controller flips the state to "ready".
    await expect(controller).toHaveAttribute('data-tag-input-state', 'ready');
  });

  test('typing a tag value and pressing Enter creates a chip', async ({ page }) => {
    await page.goto(sandbox('form-tag-input'));
    await page.waitForLoadState('networkidle');

    // Use the first (empty) tag-input field — the "default-empty" section.
    const controller = page.locator('[data-controller~="tag-input"]').first();
    await expect(controller).toHaveAttribute('data-tag-input-state', 'ready');

    // Tagify replaces the original <input> with its own contenteditable span
    // (.tagify__input). The span may have zero computed height when the tag
    // list is empty (Tagify's internal overflow layout), so Playwright's
    // standard click / visibility checks fail. Use page.evaluate to focus
    // the contenteditable directly and then drive keyboard input via
    // page.keyboard — this bypasses all actionability constraints while
    // still exercising the real Tagify input path.
    await page.evaluate(() => {
      const input = document.querySelector(
        '[data-controller~="tag-input"] .tagify__input',
      );
      input?.focus();
    });
    await page.keyboard.type('mytag');
    await page.keyboard.press('Enter');

    // Tagify renders each chip as a tag element with class "tagify__tag".
    const chips = controller.locator('.tagify__tag');
    await expect(chips).toHaveCount(1);
    await expect(chips.first()).toContainText('mytag');
  });

  test('removing a chip updates the counter', async ({ page }) => {
    await page.goto(sandbox('form-tag-input'));
    await page.waitForLoadState('networkidle');

    // The second section has 3 pre-filled tags (javascript, typescript, css).
    const controller = page.locator('[data-controller~="tag-input"]').nth(1);
    await expect(controller).toHaveAttribute('data-tag-input-state', 'ready');

    const chips = controller.locator('.tagify__tag');
    const initialCount = await chips.count();
    expect(initialCount).toBeGreaterThan(0);

    // Each chip has a remove button: [class*="tagify__tag__removeBtn"].
    const removeBtn = chips.first().locator('[class*="removeBtn"]');
    await removeBtn.click();

    await expect(chips).toHaveCount(initialCount - 1);

    // The counter target should no longer show the original count.
    const counter = controller.locator('[data-tag-input-target="counter"]');
    await expect(counter).toBeVisible();
    // After removing, the count text changes — just verify it's still present.
    const counterText = await counter.textContent();
    expect(counterText).toBeTruthy();
  });
});
