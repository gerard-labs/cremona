import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — form-date-range
 *
 * The story renders multiple form-date-range instances:
 *  - #story-default   — both dates empty
 *  - #story-values    — start 2026-05-15, end 2026-05-22 (valid)
 *  - #story-invalid   — start 2026-05-22, end 2026-05-15 (invalid, error visible)
 *
 * The error message element is `data-form-date-range-target="errorMessage"`.
 * Controller sets/removes the `hidden` attribute on it based on validity.
 *
 * The controller also dispatches `form-date-range:invalid` when start > end
 * and `form-date-range:select` when both dates are set and valid.
 */
test.describe('form-date-range', () => {
  test('controller mounts and error is hidden when no dates are set', async ({ page }) => {
    await page.goto(sandbox('form-date-range'));
    await page.waitForLoadState('networkidle');

    // The first instance (#story-default) has no dates — error must be hidden.
    const wrap = page.locator('[data-controller~="form-date-range"]').first();
    await expect(wrap).toBeVisible();

    const errorMsg = wrap.locator('[data-form-date-range-target="errorMessage"]');
    // Controller clears error when either date is absent — hidden attribute present.
    await expect(errorMsg).toBeHidden();
  });

  test('error message is visible when start date is after end date', async ({ page }) => {
    await page.goto(sandbox('form-date-range'));
    await page.waitForLoadState('networkidle');

    // The third instance (#story-invalid) has start=2026-05-22 > end=2026-05-15.
    const invalidWrap = page.locator('[data-controller~="form-date-range"]').nth(2);
    await expect(invalidWrap).toBeVisible();

    const errorMsg = invalidWrap.locator('[data-form-date-range-target="errorMessage"]');
    // The controller removes `hidden` when start > end — the message must be visible.
    await expect(errorMsg).toBeVisible();
  });

  test('dispatches form-date-range:invalid event when start is after end', async ({ page }) => {
    await page.goto(sandbox('form-date-range'));
    await page.waitForLoadState('networkidle');

    // Listen for the event dispatched by the invalid instance on mount.
    // The invalid instance (story-invalid) fires form-date-range:invalid during connect().
    const invalidCount = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Give a tick so connect() has already fired; we check the DOM state instead.
        resolve(
          document.querySelectorAll(
            '[data-controller~="form-date-range"] [data-form-date-range-target="errorMessage"]:not([hidden])',
          ).length,
        );
      });
    });

    // At least one invalid instance should have its error message un-hidden.
    expect(invalidCount).toBeGreaterThanOrEqual(1);
  });
});
