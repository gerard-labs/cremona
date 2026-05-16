import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — input-group
 *
 * The input-group controller handles:
 *   1. Focus delegation — clicking a non-button affix area focuses the inner
 *      input (the `delegateClick` action on the wrapper).
 *   2. clear() — wipes the input value and refocuses the input.
 *
 * The story has a "button-affix" section with id="demo-clear" pre-filled with
 * "préremplie pour le clear". A clear button inside the suffix is wired via
 * `data-action="click->input-group#clear"`.
 *
 * There is also a "search + clear" row (id="demo-search-clear") with value
 * "samurai" and a clear button.
 */
test.describe('input-group', () => {
  test('controller mounts and input group is rendered', async ({ page }) => {
    await page.goto(sandbox('input-group'));
    await page.waitForLoadState('networkidle');

    const group = page.locator('[data-controller~="input-group"]').first();
    await expect(group).toBeVisible();
  });

  test('clicking the clear button wipes the input value', async ({ page }) => {
    await page.goto(sandbox('input-group'));
    await page.waitForLoadState('networkidle');

    // Target the clearable input group (demo-clear, pre-filled value).
    const input = page.locator('#demo-clear');
    await expect(input).toHaveValue('préremplie pour le clear');

    // Find the clear button inside the same input-group wrapper.
    const clearBtn = page.locator('[data-controller~="input-group"]')
      .filter({ has: page.locator('#demo-clear') })
      .locator('[data-action*="input-group#clear"]');

    await clearBtn.click();

    // After clearing, the input value should be empty.
    await expect(input).toHaveValue('');
  });

  test('clicking the prefix affix area delegates focus to the inner input', async ({ page }) => {
    await page.goto(sandbox('input-group'));
    await page.waitForLoadState('networkidle');

    // Click the prefix span of the first input group (url, prefix="https://").
    const firstGroup = page.locator('[data-controller~="input-group"]').first();
    const prefix = firstGroup.locator('[data-input-group-target="prefix"]');

    await prefix.click();

    // The inner input should now be focused.
    const input = firstGroup.locator('.cremona-input');
    await expect(input).toBeFocused();
  });
});
