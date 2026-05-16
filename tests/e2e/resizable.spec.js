import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — resizable controller.
 *
 * Story slug: 'resizable'
 * Controller surface:
 *   data-controller="resizable"
 *   data-resizable-target="handle"   — the drag handle (role="separator")
 *   data-resizable-target="startPane" — the start pane
 *
 * Keyboard nav: ArrowRight / ArrowLeft move the horizontal handle ±step%;
 *               Home / End snap to minSize / maxSize.
 * Event: resizable:change — detail.{ size, orientation } on drag-commit or keydown.
 */
test.describe('resizable', () => {
  test('handle is present with correct ARIA attributes', async ({ page }) => {
    await page.goto(sandbox('resizable'));
    await page.waitForLoadState('networkidle');

    const wrap = page.locator('[data-controller~="resizable"]').first();
    const handle = wrap.locator('[data-resizable-target="handle"]');

    await expect(handle).toBeVisible();
    await expect(handle).toHaveAttribute('role', 'separator');
    await expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
    // The controller stamps aria-valuenow on connect.
    await expect(handle).toHaveAttribute('aria-valuenow', '50');
  });

  test('ArrowRight key increases aria-valuenow on the handle', async ({ page }) => {
    await page.goto(sandbox('resizable'));
    await page.waitForLoadState('networkidle');

    const wrap = page.locator('[data-controller~="resizable"]').first();
    const handle = wrap.locator('[data-resizable-target="handle"]');

    await expect(handle).toHaveAttribute('aria-valuenow', '50');

    await handle.focus();
    await page.keyboard.press('ArrowRight');

    // Default step is 5, so 50 + 5 = 55.
    await expect(handle).toHaveAttribute('aria-valuenow', '55');
  });

  test('resizable:change event fires after a keyboard resize', async ({ page }) => {
    await page.goto(sandbox('resizable'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__resizableEvents = [];
      document.addEventListener('resizable:change', (e) => {
        window.__resizableEvents.push(e.detail);
      });
    });

    const wrap = page.locator('[data-controller~="resizable"]').first();
    const handle = wrap.locator('[data-resizable-target="handle"]');
    await handle.focus();
    await page.keyboard.press('ArrowRight');

    const events = await page.evaluate(() => window.__resizableEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(typeof events[0].size).toBe('number');
    expect(events[0].orientation).toBe('horizontal');
  });
});
