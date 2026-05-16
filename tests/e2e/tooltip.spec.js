import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — tooltip
 *
 * The tooltip controller handles a single ARIA APG requirement: Escape dismisses
 * the tooltip while the trigger is focused. Visibility itself is CSS-only
 * (:hover / :focus-within with a 400 ms show delay).
 *
 * On Escape:  sets data-state="dismissed" on the wrap → CSS forces opacity:0.
 * On focusout (focus truly left the wrap): removes data-state so the tooltip
 *   can show again on the next focus session.
 *
 * Story slug: `tooltip` (src/templates/components/tooltip/).
 * Stimulus boots via onMounted(boot).
 *
 * Note: The CSS 400 ms show-delay is in effect, so we focus the trigger and
 * test the Escape dismiss path without relying on the tooltip being visually
 * revealed (opacity / transition are not reliable in headless environments with
 * the animation delay). Instead we test the data-state attribute directly.
 */
test.describe('tooltip', () => {
  test('tooltip wrap element exists with correct data-controller', async ({ page }) => {
    await page.goto(sandbox('tooltip'));
    await page.waitForLoadState('networkidle');

    const wraps = page.locator('[data-controller~="tooltip"]');
    await expect(wraps.first()).toBeVisible();
    await expect(wraps).not.toHaveCount(0);
  });

  test('pressing Escape while trigger is focused stamps data-state="dismissed"', async ({ page }) => {
    await page.goto(sandbox('tooltip'));
    await page.waitForLoadState('networkidle');

    // The first tooltip wrap in the default section.
    const wrap = page.locator('[data-controller~="tooltip"]').first();
    // The trigger button inside the wrap.
    const trigger = wrap.locator('button').first();

    // Focus the trigger to enter the tooltip wrap's focus-within scope.
    await trigger.focus();

    // Press Escape — the controller's dismiss() action fires.
    await page.keyboard.press('Escape');

    // The wrap should now have data-state="dismissed".
    await expect(wrap).toHaveAttribute('data-state', 'dismissed');
  });

  test('moving focus out of the wrap resets data-state (tooltip can show again)', async ({ page }) => {
    await page.goto(sandbox('tooltip'));
    await page.waitForLoadState('networkidle');

    const wraps = page.locator('[data-controller~="tooltip"]');
    const firstWrap  = wraps.nth(0);
    const secondWrap = wraps.nth(1);

    const firstTrigger = firstWrap.locator('button').first();
    const secondTrigger = secondWrap.locator('button').first();

    // Focus first trigger, dismiss with Escape.
    await firstTrigger.focus();
    await page.keyboard.press('Escape');
    await expect(firstWrap).toHaveAttribute('data-state', 'dismissed');

    // Move focus to a different tooltip wrap — the focusout handler on the
    // first wrap should fire and clear data-state.
    await secondTrigger.focus();
    await expect(firstWrap).not.toHaveAttribute('data-state', 'dismissed');
  });
});
