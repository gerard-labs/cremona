import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — sidebar controller.
 *
 * Story slug: 'sidebar'
 * Controller surface:
 *   data-controller="sidebar"
 *   data-sidebar-target="collapseToggle" — the collapse toggle button
 *   data-sidebar-collapsed-value         — Boolean (false = expanded)
 *   data-collapsed                       — "true" | "false" on the <aside>
 *   aria-expanded on collapseToggle      — inverse of collapsed value
 *
 * toggleCollapse() — wired via click->sidebar#toggleCollapse.
 * Event: sidebar:collapse-change — detail.{ collapsed }.
 */
test.describe('sidebar', () => {
  test('sidebar is expanded by default (data-collapsed="false")', async ({ page }) => {
    await page.goto(sandbox('sidebar'));
    await page.waitForLoadState('networkidle');

    // The first sidebar in the story is the "default expanded" one.
    const sidebar = page.locator('[data-controller~="sidebar"]').first();
    await expect(sidebar).toHaveAttribute('data-collapsed', 'false');

    const toggle = sidebar.locator('[data-sidebar-target="collapseToggle"]');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  test('clicking the collapse toggle collapses the sidebar', async ({ page }) => {
    await page.goto(sandbox('sidebar'));
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('[data-controller~="sidebar"]').first();
    const toggle = sidebar.locator('[data-sidebar-target="collapseToggle"]');

    await expect(sidebar).toHaveAttribute('data-collapsed', 'false');
    await toggle.click();

    await expect(sidebar).toHaveAttribute('data-collapsed', 'true');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('sidebar:collapse-change event fires with correct collapsed value', async ({ page }) => {
    await page.goto(sandbox('sidebar'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__sidebarEvents = [];
      document.addEventListener('sidebar:collapse-change', (e) => {
        window.__sidebarEvents.push(e.detail);
      });
    });

    const sidebar = page.locator('[data-controller~="sidebar"]').first();
    const toggle = sidebar.locator('[data-sidebar-target="collapseToggle"]');
    await toggle.click();

    const events = await page.evaluate(() => window.__sidebarEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].collapsed).toBe(true);
  });
});
