import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — dropdown-menu (the kit's action menu).
 *
 * Reference pattern for every spec in this folder:
 *  - `page.goto(sandbox('<story-slug>'))` loads the story standalone.
 *  - Drive a real interaction (click, type, keyboard).
 *  - Assert the controller's observable result: visibility, a `data-*`
 *    state attribute, ARIA, a dispatched CustomEvent, or the DOM.
 */
test.describe('dropdown-menu', () => {
  test('opens on trigger click, closes on Escape', async ({ page }) => {
    await page.goto(sandbox('dropdown-menu'));
    await page.waitForLoadState('networkidle');

    const menu = page.locator('[data-controller~="dropdown-menu"]').first();
    const trigger = menu.getByRole('button').first();
    const content = menu.locator('[data-popover-target="content"]');

    await expect(content).toBeHidden();
    await trigger.click();
    await expect(content).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(content).toBeHidden();
  });

  test('clicking a menu item closes the menu', async ({ page }) => {
    await page.goto(sandbox('dropdown-menu'));
    await page.waitForLoadState('networkidle');

    const menu = page.locator('[data-controller~="dropdown-menu"]').first();
    await menu.getByRole('button').first().click();
    const content = menu.locator('[data-popover-target="content"]');
    await expect(content).toBeVisible();

    await content.getByRole('menuitem').first().click();
    await expect(content).toBeHidden();
  });
});
