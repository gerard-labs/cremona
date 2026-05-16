import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — navigation-menu
 *
 * NavigationMenuController extends MenubarController verbatim — same roving
 * tabindex, cascading-open, ArrowLeft/Right navigation. What differs at the
 * compound level: the controller is mounted on the inner `.cremona-menubar`
 * div (data-controller="navigation-menu"), wrapped in a `<nav>` landmark;
 * submenu items are `<a href>` links (per OQ-33).
 *
 * Story slug: navigation-menu
 *
 * Opening submenus via click is unreliable in the test environment (other
 * element layers can intercept pointer events). We use keyboard navigation
 * instead — which is the primary interaction model for a menubar:
 *   1. Focus the trigger button.
 *   2. Press Enter (handled by navigation-menu#keydown → _openAt → popover.open).
 * This exercises the same Stimulus controller path a keyboard user would take.
 */
test.describe('navigation-menu', () => {
  test('navigation-menu wrap has role="menubar" and triggers have role="menuitem"', async ({ page }) => {
    await page.goto(sandbox('navigation-menu'));
    await page.waitForLoadState('networkidle');

    const navMenu = page.locator('[data-controller~="navigation-menu"]').first();
    await expect(navMenu).toHaveAttribute('role', 'menubar');

    const triggers = navMenu.locator('[data-navigation-menu-target="trigger"]');
    // Default story has 3 nav menus (Solutions / Tarifs / Ressources).
    await expect(triggers).toHaveCount(3);
    await expect(triggers.first()).toHaveAttribute('role', 'menuitem');
    await expect(triggers.first()).toHaveAttribute('aria-haspopup', 'menu');
  });

  test('keyboard Enter on a trigger opens its submenu with link items', async ({ page }) => {
    await page.goto(sandbox('navigation-menu'));
    await page.waitForLoadState('networkidle');

    const navMenu = page.locator('[data-controller~="navigation-menu"]').first();
    const firstTrigger = navMenu.locator('[data-navigation-menu-target="trigger"]').first();

    // The submenu wrap co-mounts popover + dropdown-menu and contains the
    // content panel. Locate it as the nearest ancestor with data-controller
    // containing "popover".
    const submenuWrap = page.locator('[data-controller~="popover"][data-controller~="dropdown-menu"]').first();
    const content = submenuWrap.locator('[data-popover-target="content"]');

    await expect(content).toBeHidden();

    // Focus the trigger and press Enter — the navigation-menu#keydown handler
    // receives the event (it bubbles from trigger → submenu-wrap → menubar),
    // calls _openAt(0) → popover.open() → show() → content.hidden = false.
    await firstTrigger.focus();
    await page.keyboard.press('Enter');

    await expect(content).toBeVisible();

    // Submenu items are anchor links with role="menuitem".
    const links = content.getByRole('menuitem');
    await expect(links.first()).toBeVisible();
  });

  test('Escape closes the open submenu', async ({ page }) => {
    await page.goto(sandbox('navigation-menu'));
    await page.waitForLoadState('networkidle');

    const navMenu = page.locator('[data-controller~="navigation-menu"]').first();
    const firstTrigger = navMenu.locator('[data-navigation-menu-target="trigger"]').first();
    const submenuWrap = page.locator('[data-controller~="popover"][data-controller~="dropdown-menu"]').first();
    const content = submenuWrap.locator('[data-popover-target="content"]');

    // Open via keyboard (same pattern as previous test).
    await firstTrigger.focus();
    await page.keyboard.press('Enter');
    await expect(content).toBeVisible();

    // keydown.esc@window->popover#close fires → hide() → CSS transition fires
    // → _finalize sets content.hidden = true.
    await page.keyboard.press('Escape');
    await expect(content).toBeHidden();
  });
});
