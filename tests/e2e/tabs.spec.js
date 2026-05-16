import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — tabs
 *
 * The tabs controller manages WAI-ARIA APG "Tabs" semantics: aria-selected,
 * tabindex roving, panel hidden/visible, and the `tabs:change` custom event.
 * Default activation mode is `automatic` (click or arrow activates immediately).
 */
test.describe('tabs', () => {
  test('clicking a tab activates it and shows its panel', async ({ page }) => {
    await page.goto(sandbox('tabs'));
    await page.waitForLoadState('networkidle');

    // First tabs component on the page has 4 items; first tab is active.
    const tabs = page.locator('[data-controller~="tabs"]').first();
    const triggers = tabs.locator('[data-tabs-target="trigger"]');
    const panels = tabs.locator('[data-tabs-target="panel"]');

    // Initial state: first tab active, others inactive.
    await expect(triggers.nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(panels.nth(0)).toBeVisible();
    await expect(panels.nth(1)).toBeHidden();

    // Click the second tab.
    await triggers.nth(1).click();

    await expect(triggers.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(triggers.nth(0)).toHaveAttribute('aria-selected', 'false');
    await expect(panels.nth(1)).toBeVisible();
    await expect(panels.nth(0)).toBeHidden();
  });

  test('clicking a tab sets data-state=active on trigger and panel', async ({ page }) => {
    await page.goto(sandbox('tabs'));
    await page.waitForLoadState('networkidle');

    const tabs = page.locator('[data-controller~="tabs"]').first();
    const triggers = tabs.locator('[data-tabs-target="trigger"]');
    const panels = tabs.locator('[data-tabs-target="panel"]');

    await triggers.nth(2).click();

    await expect(triggers.nth(2)).toHaveAttribute('data-state', 'active');
    await expect(panels.nth(2)).toHaveAttribute('data-state', 'active');
    await expect(triggers.nth(0)).toHaveAttribute('data-state', 'inactive');
    await expect(panels.nth(0)).toHaveAttribute('data-state', 'inactive');
  });

  test('ArrowRight moves to the next tab in automatic mode', async ({ page }) => {
    await page.goto(sandbox('tabs'));
    await page.waitForLoadState('networkidle');

    const tabs = page.locator('[data-controller~="tabs"]').first();
    const triggers = tabs.locator('[data-tabs-target="trigger"]');
    const panels = tabs.locator('[data-tabs-target="panel"]');

    // Focus the first (active) trigger and press ArrowRight.
    await triggers.nth(0).focus();
    await page.keyboard.press('ArrowRight');

    // In automatic mode, ArrowRight both focuses and activates the next tab.
    await expect(triggers.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(panels.nth(1)).toBeVisible();
    await expect(panels.nth(0)).toBeHidden();
  });
});
