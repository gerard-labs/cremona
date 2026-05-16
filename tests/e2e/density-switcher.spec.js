import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — density-switcher controller.
 *
 * The story now stamps `data-controller="toggle-group density-switcher"` on
 * the inner group div, with `data-density-switcher-target-value="self"` so the
 * controller writes `data-density` back to its own element (catalog isolation).
 *
 * Controller behaviour:
 *   - connect() applies current density to the target element.
 *   - Clicking a density toggle dispatches density-switcher:change.
 *   - data-density attribute on the target element reflects the new density.
 *   - aria-pressed updates on the toggled buttons.
 *
 * Story slug: density-switcher
 * Variants: 0 = Light · LTR (default, currentDensity="comfortable")
 */
test.describe('density-switcher', () => {
  test('controller connects: group carries data-controller="toggle-group density-switcher"', async ({ page }) => {
    await page.goto(sandbox('density-switcher'));
    await page.waitForLoadState('networkidle');

    const group = page.locator('[data-controller~="density-switcher"]').first();
    await expect(group).toBeAttached();
  });

  test('clicking cozy button dispatches density-switcher:change with density="cozy"', async ({ page }) => {
    await page.goto(sandbox('density-switcher'));
    await page.waitForLoadState('networkidle');

    // Capture density-switcher:change events.
    await page.evaluate(() => {
      window.__densityChangeEvents = [];
      document.addEventListener('density-switcher:change', (e) => {
        window.__densityChangeEvents.push(e.detail);
      });
    });

    // First section uses currentDensity="comfortable"; target="self".
    const firstGroup = page.locator('[data-controller~="density-switcher"]').first();
    const cozyBtn = firstGroup.locator('[data-density="cozy"]');
    await cozyBtn.click();

    // density-switcher:change event must have fired.
    const events = await page.evaluate(() => window.__densityChangeEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].density).toBe('cozy');
    expect(events[0].previousDensity).toBe('comfortable');
  });

  test('clicking a density toggle updates data-density on the target element', async ({ page }) => {
    await page.goto(sandbox('density-switcher'));
    await page.waitForLoadState('networkidle');

    // First section: target="self" → data-density stamped on the group element itself.
    const firstGroup = page.locator('[data-controller~="density-switcher"]').first();
    const compactBtn = firstGroup.locator('[data-density="compact"]');
    await compactBtn.click();

    // The group element should now carry data-density="compact".
    await expect(firstGroup).toHaveAttribute('data-density', 'compact');
  });

  test('clicking a density button makes it aria-pressed="true" and others "false"', async ({ page }) => {
    await page.goto(sandbox('density-switcher'));
    await page.waitForLoadState('networkidle');

    const firstGroup = page.locator('[data-controller~="density-switcher"]').first();
    const comfortableBtn = firstGroup.locator('[data-density="comfortable"]');
    const cozyBtn = firstGroup.locator('[data-density="cozy"]');
    const compactBtn = firstGroup.locator('[data-density="compact"]');

    // Comfortable is the initial pressed button.
    await expect(comfortableBtn).toHaveAttribute('aria-pressed', 'true');

    // Click compact.
    await compactBtn.click();

    // Compact must now be pressed; others unpressed.
    await expect(compactBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(comfortableBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(cozyBtn).toHaveAttribute('aria-pressed', 'false');
  });
});
