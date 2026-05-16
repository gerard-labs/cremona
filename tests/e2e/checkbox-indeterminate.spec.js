import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — checkbox-indeterminate controller.
 *
 * Story slug: 'checkbox'
 * Controller surface:
 *   data-controller="checkbox-indeterminate"  — applied directly to <input>
 *   data-indeterminate="true"                 — read by connect() to set el.indeterminate
 *   data-action="change->checkbox-indeterminate#clear" — clears the attribute on user toggle
 *
 * The controller sets the DOM property `indeterminate = true` on connect(),
 * which cannot be read as an HTML attribute. We verify it via page.evaluate().
 * On change, clear() sets data-indeterminate="false" so a future reconnect
 * does not resurrect the state.
 */
test.describe('checkbox-indeterminate', () => {
  test('connect() sets the indeterminate DOM property on a checkbox stamped with data-indeterminate="true"', async ({ page }) => {
    await page.goto(sandbox('checkbox'));
    await page.waitForLoadState('networkidle');

    // The story renders multiple indeterminate checkboxes; target the first one.
    const indeterminateCheckbox = page
      .locator('[data-controller~="checkbox-indeterminate"]')
      .first();

    await expect(indeterminateCheckbox).toBeAttached();

    // The DOM property `indeterminate` is not reflected as an attribute, so we
    // read it via evaluate().
    const isIndeterminate = await indeterminateCheckbox.evaluate((el) => el.indeterminate);
    expect(isIndeterminate).toBe(true);
  });

  test('clear() sets data-indeterminate="false" after the user toggles the checkbox', async ({ page }) => {
    await page.goto(sandbox('checkbox'));
    await page.waitForLoadState('networkidle');

    const indeterminateCheckbox = page
      .locator('[data-controller~="checkbox-indeterminate"]')
      .first();

    // Clicking triggers the native `change` event → clear() is called.
    await indeterminateCheckbox.click();

    // After clear() the marker attribute must be "false" so a reconnect won't
    // resurrect the indeterminate state.
    await expect(indeterminateCheckbox).toHaveAttribute('data-indeterminate', 'false');

    // The DOM indeterminate property is cleared by the browser on user click.
    const isIndeterminate = await indeterminateCheckbox.evaluate((el) => el.indeterminate);
    expect(isIndeterminate).toBe(false);
  });
});
