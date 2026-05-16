import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — number-input
 *
 * The number-input controller wires +/- stepper buttons around a native
 * <input type="number">. Clicking + increments by step, clicking - decrements.
 * At min/max boundaries the respective button becomes disabled. The controller
 * clamps the value and keeps buttons in sync via _refreshButtons().
 */
test.describe('number-input', () => {
  test('increment button increases value, decrement button decreases value', async ({ page }) => {
    await page.goto(sandbox('number-input'));
    await page.waitForLoadState('networkidle');

    // First number-input: no min/max, value starts at 1.
    const widget = page.locator('[data-controller~="number-input"]').first();
    const input = widget.locator('[data-number-input-target="input"]');
    const increment = widget.locator('[data-number-input-target="increment"]');
    const decrement = widget.locator('[data-number-input-target="decrement"]');

    await expect(input).toHaveValue('1');

    await increment.click();
    await expect(input).toHaveValue('2');

    await decrement.click();
    await expect(input).toHaveValue('1');

    await decrement.click();
    await expect(input).toHaveValue('0');
  });

  test('decrement button is disabled at min boundary, increment at max', async ({ page }) => {
    await page.goto(sandbox('number-input'));
    await page.waitForLoadState('networkidle');

    // The "at-min" bounded number-input: value=1, min=1, max=10 — found by
    // the input id="qty-at-min".
    const atMinWidget = page.locator('[data-controller~="number-input"]:has(#qty-at-min)');
    const atMinDecrement = atMinWidget.locator('[data-number-input-target="decrement"]');
    const atMinIncrement = atMinWidget.locator('[data-number-input-target="increment"]');

    await expect(atMinDecrement).toBeDisabled();
    await expect(atMinIncrement).not.toBeDisabled();

    // The "at-max" bounded number-input: value=10, min=1, max=10.
    const atMaxWidget = page.locator('[data-controller~="number-input"]:has(#qty-at-max)');
    const atMaxDecrement = atMaxWidget.locator('[data-number-input-target="decrement"]');
    const atMaxIncrement = atMaxWidget.locator('[data-number-input-target="increment"]');

    await expect(atMaxIncrement).toBeDisabled();
    await expect(atMaxDecrement).not.toBeDisabled();
  });

  test('clicking increment on a bounded input enables decrement once above min', async ({ page }) => {
    await page.goto(sandbox('number-input'));
    await page.waitForLoadState('networkidle');

    // at-min widget starts at min → decrement is disabled.
    const atMinWidget = page.locator('[data-controller~="number-input"]:has(#qty-at-min)');
    const atMinInput = atMinWidget.locator('[data-number-input-target="input"]');
    const atMinDecrement = atMinWidget.locator('[data-number-input-target="decrement"]');
    const atMinIncrement = atMinWidget.locator('[data-number-input-target="increment"]');

    await expect(atMinDecrement).toBeDisabled();

    await atMinIncrement.click();
    await expect(atMinInput).toHaveValue('2');
    // Now above min → decrement should be enabled.
    await expect(atMinDecrement).not.toBeDisabled();
  });
});
