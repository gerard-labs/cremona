import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — calendar
 *
 * The controller renders a 7-column month grid imperatively on connect().
 * Key observable behaviours:
 *  - Month label is set by Intl.DateTimeFormat.
 *  - Day cells have role="gridcell", data-iso, data-state.
 *  - Clicking a day fires `calendar:select` and sets aria-selected="true".
 *  - prev/next month buttons update the displayed month.
 *
 * Story slug: calendar
 */
test.describe('calendar', () => {
  test('renders the month grid with day cells after connect', async ({ page }) => {
    await page.goto(sandbox('calendar'));
    await page.waitForLoadState('networkidle');

    const calendar = page.locator('[data-controller~="calendar"]').first();
    await expect(calendar).toBeVisible();

    // The month label should be populated by Intl.DateTimeFormat.
    const monthLabel = calendar.locator('[data-calendar-target="monthLabel"]');
    await expect(monthLabel).not.toBeEmpty();

    // The grid should contain day cells (role="gridcell").
    const grid = calendar.locator('[data-calendar-target="grid"]');
    const dayCells = grid.locator('[role="gridcell"]');
    // A month grid has at least 28 cells (4 rows × 7).
    const count = await dayCells.count();
    expect(count).toBeGreaterThanOrEqual(28);
  });

  test('clicking a day cell selects it (aria-selected="true")', async ({ page }) => {
    await page.goto(sandbox('calendar'));
    await page.waitForLoadState('networkidle');

    const calendar = page.locator('[data-controller~="calendar"]').first();
    const grid = calendar.locator('[data-calendar-target="grid"]');

    // Find the first non-disabled, current-month day cell.
    // Exclude other-month cells (data-state="other-month") — clicking them
    // navigates the display month, which re-renders the grid and detaches the
    // original cell element, breaking the aria-selected assertion.
    // Current-month cells have data-state="default" or "today".
    const clickableDay = grid
      .locator('[role="gridcell"]:not([aria-disabled="true"]):not([data-state="other-month"])')
      .first();

    await expect(clickableDay).toBeVisible();
    await clickableDay.click();

    await expect(clickableDay).toHaveAttribute('aria-selected', 'true');
    await expect(clickableDay).toHaveAttribute('data-state', 'selected');
  });

  test('clicking next month button advances the displayed month', async ({ page }) => {
    await page.goto(sandbox('calendar'));
    await page.waitForLoadState('networkidle');

    const calendar = page.locator('[data-controller~="calendar"]').first();
    const monthLabel = calendar.locator('[data-calendar-target="monthLabel"]');
    const nextBtn = calendar.locator('[data-calendar-target="nextButton"]');

    const initialMonth = await monthLabel.textContent();

    // Capture calendar:display-month-change event.
    await page.evaluate(() => {
      window.__calEvents = [];
      document.addEventListener('calendar:display-month-change', (e) => {
        window.__calEvents.push(e.detail.month);
      });
    });

    await nextBtn.click();

    const newMonth = await monthLabel.textContent();
    expect(newMonth).not.toBe(initialMonth);

    const events = await page.evaluate(() => window.__calEvents);
    expect(events.length).toBeGreaterThan(0);
  });
});
