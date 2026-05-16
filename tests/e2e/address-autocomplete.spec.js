import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — address-autocomplete
 *
 * The controller debounces input and dispatches `address-autocomplete:fetch`
 * (cancellable) so a consumer adapter can perform the lookup and feed results
 * back via `address-autocomplete:suggestions`. The "with-suggestions" variant
 * in the story pre-renders suggestion items so the list can be inspected
 * without a live API.
 *
 * Story slug: form-address-autocomplete
 */
test.describe('address-autocomplete', () => {
  test('renders the address input and controller element', async ({ page }) => {
    await page.goto(sandbox('form-address-autocomplete'));
    await page.waitForLoadState('networkidle');

    const controller = page.locator('[data-controller~="address-autocomplete"]').first();
    await expect(controller).toBeVisible();

    const input = controller.locator('[data-address-autocomplete-target="input"]');
    await expect(input).toBeVisible();
  });

  test('pre-rendered suggestions list is visible in the with-suggestions variant', async ({ page }) => {
    await page.goto(sandbox('form-address-autocomplete'));
    await page.waitForLoadState('networkidle');

    // The second form address block has withSuggestions: true — its
    // suggestionsList has 3 items and is NOT hidden.
    const suggestionsList = page
      .locator('[data-address-autocomplete-target="suggestionsList"]:not([hidden])')
      .first();

    await expect(suggestionsList).toBeVisible();

    const items = suggestionsList.locator('[data-address-autocomplete-target="suggestionItem"]');
    await expect(items).toHaveCount(3);
  });

  test('typing in the address input dispatches the cancellable fetch event', async ({ page }) => {
    await page.goto(sandbox('form-address-autocomplete'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__aaFetch = 0;
      document.addEventListener('address-autocomplete:fetch', () => {
        window.__aaFetch += 1;
      });
    });

    // Typing a query runs the controller's debounced lookup, which dispatches
    // the cancellable `address-autocomplete:fetch` event for a consumer
    // adapter to act on (the kit ships no live geocoder).
    const input = page.locator('[data-address-autocomplete-target="input"]').first();
    await input.click();
    await input.fill('15 rue de la République, Paris');

    await page.waitForFunction(() => window.__aaFetch > 0, { timeout: 6000 });
    expect(await page.evaluate(() => window.__aaFetch)).toBeGreaterThan(0);
  });
});
