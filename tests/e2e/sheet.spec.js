import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — sheet controller (extends drawer, which extends dialog).
 *
 * Story slug: 'sheet'
 * Controller surface:
 *   data-controller="sheet"
 *   data-sheet-target="dialog"  — the native <dialog> element
 *   data-action="click->sheet#open"    — on the trigger button
 *   data-action="click->sheet#close"   — on close buttons / footer buttons
 *   data-sheet-open-value              — Boolean; controller calls showModal()
 *   data-sheet-edge-value              — start | end | top | bottom
 *
 * Events: sheet:open (detail.edge), sheet:close.
 */
test.describe('sheet', () => {
  test('trigger button opens the sheet dialog', async ({ page }) => {
    await page.goto(sandbox('sheet'));
    await page.waitForLoadState('networkidle');

    const sheetWrap = page.locator('[data-controller~="sheet"]').first();
    const dialog = sheetWrap.locator('[data-sheet-target="dialog"]');
    const trigger = sheetWrap.locator('[data-action*="sheet#open"]').first();

    // Dialog is closed initially.
    await expect(dialog).not.toHaveAttribute('open', '');

    await trigger.click();

    // Native showModal() sets the `open` attribute on the <dialog>.
    await expect(dialog).toHaveAttribute('open', '');
  });

  test('close button dismisses the sheet', async ({ page }) => {
    await page.goto(sandbox('sheet'));
    await page.waitForLoadState('networkidle');

    const sheetWrap = page.locator('[data-controller~="sheet"]').first();
    const dialog = sheetWrap.locator('[data-sheet-target="dialog"]');
    const trigger = sheetWrap.locator('[data-action*="sheet#open"]').first();

    await trigger.click();
    await expect(dialog).toHaveAttribute('open', '');

    // The sheet slides in via a CSS transform and the close button may be
    // reported as outside the viewport by Playwright's actionability check
    // before the animation settles. Use page.evaluate to dispatch a synthetic
    // click directly on the close button — this bypasses Playwright's
    // actionability checks while still firing the Stimulus action handler
    // (click->sheet#close).
    await page.evaluate(() => {
      const closeBtn = document.querySelector(
        '[data-sheet-target="dialog"] [data-action*="sheet#close"]',
      );
      closeBtn?.click();
    });

    await expect(dialog).not.toHaveAttribute('open', '');
  });

  test('sheet:open event fires when the sheet opens', async ({ page }) => {
    await page.goto(sandbox('sheet'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__sheetOpenEvents = [];
      document.addEventListener('sheet:open', (e) => {
        window.__sheetOpenEvents.push(e.detail);
      });
    });

    const sheetWrap = page.locator('[data-controller~="sheet"]').first();
    const trigger = sheetWrap.locator('[data-action*="sheet#open"]').first();
    await trigger.click();

    const events = await page.evaluate(() => window.__sheetOpenEvents);
    expect(events.length).toBeGreaterThan(0);
    // The event carries an edge value.
    expect(typeof events[0].edge).toBe('string');
  });
});
