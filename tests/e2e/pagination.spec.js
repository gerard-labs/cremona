import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — pagination
 *
 * The pagination controller manages first/prev/next/last buttons + a
 * page-size select. First/Prev are disabled on page 1; Next/Last on the
 * last page. Clicking Next advances the current page and dispatches
 * `pagination:change`.
 */
test.describe('pagination', () => {
  test('first and prev buttons are disabled on page 1', async ({ page }) => {
    await page.goto(sandbox('pagination'));
    await page.waitForLoadState('networkidle');

    // First pagination instance: page=1, totalItems=142.
    const nav = page.locator('[data-controller~="pagination"]').first();
    const firstBtn = nav.locator('[data-pagination-target="firstButton"]');
    const prevBtn = nav.locator('[data-pagination-target="prevButton"]');
    const nextBtn = nav.locator('[data-pagination-target="nextButton"]');
    const lastBtn = nav.locator('[data-pagination-target="lastButton"]');

    await expect(firstBtn).toBeDisabled();
    await expect(prevBtn).toBeDisabled();
    await expect(nextBtn).not.toBeDisabled();
    await expect(lastBtn).not.toBeDisabled();
  });

  test('clicking next enables first/prev and disables them on last page', async ({ page }) => {
    await page.goto(sandbox('pagination'));
    await page.waitForLoadState('networkidle');

    // Use the mid-pagination instance: page=3/6, all buttons enabled.
    const nav = page.locator('[data-controller~="pagination"]').nth(1);
    const firstBtn = nav.locator('[data-pagination-target="firstButton"]');
    const prevBtn = nav.locator('[data-pagination-target="prevButton"]');
    const nextBtn = nav.locator('[data-pagination-target="nextButton"]');
    const lastBtn = nav.locator('[data-pagination-target="lastButton"]');

    // At page 3 of 6 — all 4 buttons should be enabled.
    await expect(firstBtn).not.toBeDisabled();
    await expect(prevBtn).not.toBeDisabled();
    await expect(nextBtn).not.toBeDisabled();
    await expect(lastBtn).not.toBeDisabled();

    // Navigate to last page via Last button.
    await lastBtn.click();

    // Now at last page — next and last should be disabled.
    await expect(nextBtn).toBeDisabled();
    await expect(lastBtn).toBeDisabled();
    // First and prev should be enabled.
    await expect(firstBtn).not.toBeDisabled();
    await expect(prevBtn).not.toBeDisabled();
  });

  test('clicking next dispatches pagination:change event', async ({ page }) => {
    await page.goto(sandbox('pagination'));
    await page.waitForLoadState('networkidle');

    // Use the mid-pagination instance (page 3, totalItems 142).
    const nav = page.locator('[data-controller~="pagination"]').nth(1);
    const nextBtn = nav.locator('[data-pagination-target="nextButton"]');

    await page.evaluate(() => {
      window.__pgEvents = [];
      document.addEventListener('pagination:change', (e) => window.__pgEvents.push(e.detail));
    });

    await nextBtn.click();

    const events = await page.evaluate(() => window.__pgEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].page).toBe(4);
  });
});
