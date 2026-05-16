import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — theme-switcher controller.
 *
 * The story now stamps `data-controller="toggle-group theme-switcher"` on
 * the inner group div, with `data-theme-switcher-target-value="self"` so the
 * controller writes `data-theme` back to its own element (catalog isolation).
 *
 * Controller behaviour:
 *   - connect() applies resolved theme to the target element.
 *   - Clicking a mode toggle dispatches theme-switcher:change with the new mode.
 *   - data-theme attribute is updated on the target element.
 *   - aria-pressed updates on the toggled buttons (mutex: one pressed at a time).
 *
 * Story slug: theme-switcher
 * Variants: 0 = Light · LTR (default)
 */
test.describe('theme-switcher', () => {
  test('controller connects: group carries data-controller="toggle-group theme-switcher"', async ({ page }) => {
    await page.goto(sandbox('theme-switcher'));
    await page.waitForLoadState('networkidle');

    const group = page.locator('[data-controller~="theme-switcher"]').first();
    await expect(group).toBeAttached();
  });

  test('first section (system mode): system button is aria-pressed="true"', async ({ page }) => {
    await page.goto(sandbox('theme-switcher'));
    await page.waitForLoadState('networkidle');

    const firstGroup = page.locator('[data-controller~="theme-switcher"]').first();
    const sysBtn   = firstGroup.locator('[data-theme-mode="system"]');
    const lightBtn = firstGroup.locator('[data-theme-mode="light"]');
    const darkBtn  = firstGroup.locator('[data-theme-mode="dark"]');

    await expect(sysBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(lightBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(darkBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking "dark" mode sets data-theme="dark" on the target element and dispatches theme-switcher:change', async ({ page }) => {
    await page.goto(sandbox('theme-switcher'));
    await page.waitForLoadState('networkidle');

    // Capture theme-switcher:change events.
    await page.evaluate(() => {
      window.__themeChangeEvents = [];
      document.addEventListener('theme-switcher:change', (e) => {
        window.__themeChangeEvents.push(e.detail);
      });
    });

    // First group: currentMode="system", target="self".
    const firstGroup = page.locator('[data-controller~="theme-switcher"]').first();
    const darkBtn = firstGroup.locator('[data-theme-mode="dark"]');
    await darkBtn.click();

    // dark mode → data-theme="dark" on the group element (target="self").
    await expect(firstGroup).toHaveAttribute('data-theme', 'dark');

    // theme-switcher:change event must have fired.
    const events = await page.evaluate(() => window.__themeChangeEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].mode).toBe('dark');
    expect(events[0].resolvedTheme).toBe('dark');
  });

  test('clicking "light" mode removes data-theme attribute (light is the default)', async ({ page }) => {
    await page.goto(sandbox('theme-switcher'));
    await page.waitForLoadState('networkidle');

    // Start by switching to dark first.
    const firstGroup = page.locator('[data-controller~="theme-switcher"]').first();
    await firstGroup.locator('[data-theme-mode="dark"]').click();
    await expect(firstGroup).toHaveAttribute('data-theme', 'dark');

    // Now click light.
    await firstGroup.locator('[data-theme-mode="light"]').click();
    // Light mode removes the data-theme attribute.
    await expect(firstGroup).not.toHaveAttribute('data-theme', 'dark');
  });

  test('clicking a mode button makes it aria-pressed="true" and others "false"', async ({ page }) => {
    await page.goto(sandbox('theme-switcher'));
    await page.waitForLoadState('networkidle');

    const firstGroup = page.locator('[data-controller~="theme-switcher"]').first();
    const lightBtn = firstGroup.locator('[data-theme-mode="light"]');
    const darkBtn  = firstGroup.locator('[data-theme-mode="dark"]');
    const sysBtn   = firstGroup.locator('[data-theme-mode="system"]');

    await lightBtn.click();

    await expect(lightBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(darkBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(sysBtn).toHaveAttribute('aria-pressed', 'false');
  });
});
