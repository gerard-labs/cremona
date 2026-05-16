import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — context-menu
 *
 * The controller inherits DropdownMenuController and adds a `contextmenu`
 * (right-click) trigger. It positions a phantom <span> at the pointer
 * coordinates and delegates to the co-mounted Popover controller to open.
 *
 * Key observables:
 *  - Right-clicking the area opens the menu content (popover content visible).
 *  - The menu content (`data-popover-target="content"`) shows/hides.
 *  - context-menu:open is dispatched with {x, y} on right-click.
 *  - Escape closes the menu.
 *
 * Story slug: context-menu
 * Controller identifier: context-menu (co-mounted with popover and dropdown-menu)
 *
 * Note: the controller element itself has zero layout dimensions (it contains
 * only a phantom <span> and hidden content). We dispatch contextmenu events
 * via page.evaluate() to avoid Playwright's "element not visible" guard.
 */

/**
 * Dispatch a synthetic contextmenu event on the first context-menu controller
 * element in the page. Returns the {x, y} used.
 */
async function rightClickControllerElement(page) {
  return page.evaluate(() => {
    const wrap = document.querySelector('[data-controller~="context-menu"]');
    if (!wrap) throw new Error('context-menu controller element not found');
    const rect = wrap.closest('.context-menu-story__area')?.getBoundingClientRect() || { left: 100, top: 100 };
    const x = rect.left + 10;
    const y = rect.top + 10;
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
    });
    wrap.dispatchEvent(event);
    return { x, y };
  });
}

test.describe('context-menu', () => {
  test('right-click opens the context menu, Escape closes it', async ({ page }) => {
    await page.goto(sandbox('context-menu'));
    await page.waitForLoadState('networkidle');

    // The first context-menu wrap in the story (default, area=self).
    const wrap = page.locator('[data-controller~="context-menu"]').first();
    const content = wrap.locator('[data-popover-target="content"]');

    await expect(content).toBeHidden();

    // Dispatch contextmenu event directly on the controller element.
    await rightClickControllerElement(page);

    await expect(content).toBeVisible();

    // Escape dismisses the menu.
    await page.keyboard.press('Escape');
    await expect(content).toBeHidden();
  });

  test('context-menu:open event fires with coordinates on right-click', async ({ page }) => {
    await page.goto(sandbox('context-menu'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__ctxEvents = [];
      document.addEventListener('context-menu:open', (e) => {
        window.__ctxEvents.push({ x: e.detail.x, y: e.detail.y });
      });
    });

    await rightClickControllerElement(page);

    // Wait for the menu to open.
    const wrap = page.locator('[data-controller~="context-menu"]').first();
    await expect(wrap.locator('[data-popover-target="content"]')).toBeVisible();

    const events = await page.evaluate(() => window.__ctxEvents);
    expect(events.length).toBeGreaterThan(0);
    // The event detail carries numeric x/y coordinates.
    expect(typeof events[0].x).toBe('number');
    expect(typeof events[0].y).toBe('number');
  });

  test('clicking a menu item closes the context menu', async ({ page }) => {
    await page.goto(sandbox('context-menu'));
    await page.waitForLoadState('networkidle');

    const wrap = page.locator('[data-controller~="context-menu"]').first();
    const content = wrap.locator('[data-popover-target="content"]');

    await rightClickControllerElement(page);
    await expect(content).toBeVisible();

    // Click the first menu item.
    const firstItem = content.locator('.cremona-item').first();
    await firstItem.click();

    await expect(content).toBeHidden();
  });
});
