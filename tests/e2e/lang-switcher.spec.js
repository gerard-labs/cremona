import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — lang-switcher
 *
 * The lang-switcher controller composes `popover` + `dropdown-menu` on the
 * same element. It exposes a `select()` action wired on each menu item via
 * `data-action="click->lang-switcher#select"`.
 *
 * Selecting a language:
 *   1. Updates `currentLocaleValue`.
 *   2. Updates the `data-lang-switcher-target="current"` span text (toUpperCase).
 *   3. Dispatches `lang-switcher:change` with { locale, previousLocale }.
 *   4. Persists to localStorage under the storageKey value.
 *
 * The story renders the menu content as `position: relative; display: block`
 * (always visible in the DOM, so no popover open/close interaction needed).
 * The `data-controller` attribute on each switcher instance includes only
 * `lang-switcher` (popover + dropdown-menu controllers may not be present
 * in the story's static render — the menu items are always visible).
 *
 * Note: In the story the dropdown content has `style="position: relative; display: block"`
 * making it always visible — no need to click the trigger to open it first.
 */
test.describe('lang-switcher', () => {
  test('renders the current locale label in the trigger', async ({ page }) => {
    await page.goto(sandbox('lang-switcher'));
    await page.waitForLoadState('networkidle');

    // First instance: currentLocale="fr".
    const switcher = page.locator('[data-lang-switcher-current-locale-value]').first();
    await expect(switcher).toBeVisible();

    const currentLabel = switcher.locator('[data-lang-switcher-target="current"]');
    // Controller syncs the label to the locale code in uppercase.
    await expect(currentLabel).toHaveText('FR');
  });

  test('clicking a language item updates the current locale label', async ({ page }) => {
    await page.goto(sandbox('lang-switcher'));
    await page.waitForLoadState('networkidle');

    const switcher = page.locator('[data-lang-switcher-current-locale-value]').first();
    const currentLabel = switcher.locator('[data-lang-switcher-target="current"]');

    // The menu items are always visible in the story (forced display:block).
    // Click the "en" item.
    const enItem = switcher.locator('[data-action*="lang-switcher#select"][data-locale="en"]');
    await enItem.click();

    // The current locale label should now read "EN".
    await expect(currentLabel).toHaveText('EN');
  });

  test('selecting a language dispatches lang-switcher:change event', async ({ page }) => {
    await page.goto(sandbox('lang-switcher'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__lsEvents = [];
      document.addEventListener('lang-switcher:change', (e) => window.__lsEvents.push(e.detail));
    });

    const switcher = page.locator('[data-lang-switcher-current-locale-value]').first();
    const deItem = switcher.locator('[data-action*="lang-switcher#select"][data-locale="de"]');
    await deItem.click();

    const events = await page.evaluate(() => window.__lsEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].locale).toBe('de');
    expect(events[0].previousLocale).toBe('fr');
  });
});
