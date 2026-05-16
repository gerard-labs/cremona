import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — menubar
 *
 * The menubar controller orchestrates N DropdownMenu submenus along a
 * horizontal bar. It stamps role="menubar" on the wrap and role="menuitem" +
 * aria-haspopup="menu" on each trigger. Each trigger opens its submenu on
 * click (via the co-mounted popover controller). ArrowRight/Left navigate
 * between triggers; if a menu is open, navigation cascades (closes source,
 * opens destination).
 *
 * Story slug: menubar
 */
test.describe('menubar', () => {
  test('menubar wrap has role="menubar" and triggers have role="menuitem"', async ({ page }) => {
    await page.goto(sandbox('menubar'));
    await page.waitForLoadState('networkidle');

    const menubar = page.locator('[data-controller~="menubar"]').first();
    await expect(menubar).toHaveAttribute('role', 'menubar');

    const triggers = menubar.locator('[data-menubar-target="trigger"]');
    // Default story has 4 menus (Fichier / Édition / Vue / Aide).
    await expect(triggers).toHaveCount(4);
    await expect(triggers.first()).toHaveAttribute('role', 'menuitem');
    await expect(triggers.first()).toHaveAttribute('aria-haspopup', 'menu');
  });

  test('clicking a trigger opens its submenu', async ({ page }) => {
    await page.goto(sandbox('menubar'));
    await page.waitForLoadState('networkidle');

    const menubar = page.locator('[data-controller~="menubar"]').first();
    const firstTrigger = menubar.locator('[data-menubar-target="trigger"]').first();

    // Find the co-mounted popover content for this trigger's submenu.
    const submenuWrap = firstTrigger.locator('xpath=ancestor::*[@data-controller and contains(@data-controller,"popover")]').first();
    const content = submenuWrap.locator('[data-popover-target="content"]');

    await expect(content).toBeHidden();
    await firstTrigger.click();
    await expect(content).toBeVisible();
  });

  test('Escape closes an open submenu', async ({ page }) => {
    await page.goto(sandbox('menubar'));
    await page.waitForLoadState('networkidle');

    const menubar = page.locator('[data-controller~="menubar"]').first();
    const firstTrigger = menubar.locator('[data-menubar-target="trigger"]').first();
    const submenuWrap = firstTrigger.locator('xpath=ancestor::*[@data-controller and contains(@data-controller,"popover")]').first();
    const content = submenuWrap.locator('[data-popover-target="content"]');

    await firstTrigger.click();
    await expect(content).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(content).toBeHidden();
  });
});
