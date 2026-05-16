import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — data-table
 *
 * The controller manages sort, selection, column visibility, bulk actions
 * and filter for a feature-rich table. It emits raw CustomEvents for each
 * concern.
 *
 * Key interactions tested:
 *  - Clicking a sortable header cycles aria-sort and emits data-table:sort-change.
 *  - Checking a row checkbox selects that row (aria-selected / data-selected)
 *    and emits data-table:selection-change.
 *  - Checking the select-all header checkbox selects all visible rows and
 *    reveals the bulk-bar.
 *
 * Story slug: data-table
 * Controller identifier: data-table
 */
test.describe('data-table', () => {
  test('clicking a sortable header column sets aria-sort and emits sort-change', async ({ page }) => {
    await page.goto(sandbox('data-table'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__sortEvents = [];
      document.addEventListener('data-table:sort-change', (e) => {
        window.__sortEvents.push(e.detail);
      });
    });

    // The first data-table in the story has sortable columns.
    const table = page.locator('[data-controller~="data-table"]').first();
    await expect(table).toBeVisible();

    // Find the first sortable header (has data-sortable="true").
    const sortableTh = table.locator('thead th[data-sortable="true"]').first();
    const sortBtn = sortableTh.locator('button[data-data-table-column]');

    // Initial state: aria-sort="none".
    await expect(sortableTh).toHaveAttribute('aria-sort', 'none');

    await sortBtn.click();

    // After click: aria-sort should be "ascending".
    await expect(sortableTh).toHaveAttribute('aria-sort', 'ascending');

    const events = await page.evaluate(() => window.__sortEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].direction).toBe('ascending');

    // Click again: should become "descending".
    await sortBtn.click();
    await expect(sortableTh).toHaveAttribute('aria-sort', 'descending');
  });

  test('checking a row checkbox selects the row and emits selection-change', async ({ page }) => {
    await page.goto(sandbox('data-table'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__selectionEvents = [];
      document.addEventListener('data-table:selection-change', (e) => {
        window.__selectionEvents.push(e.detail);
      });
    });

    const table = page.locator('[data-controller~="data-table"]').first();
    const firstRowCheckbox = table.locator('[data-data-table-target="rowCheckbox"]').first();

    // Read the row-id from the checkbox to locate the corresponding <tr>.
    const rowId = await firstRowCheckbox.getAttribute('data-data-table-row-id');
    const firstRow = table.locator(`tr[data-data-table-row-id="${rowId}"]`);

    // Row should not be selected initially.
    await expect(firstRow).not.toHaveAttribute('aria-selected');

    await firstRowCheckbox.check();

    // Row should now be selected.
    await expect(firstRow).toHaveAttribute('aria-selected', 'true');
    await expect(firstRow).toHaveAttribute('data-selected', 'true');

    const events = await page.evaluate(() => window.__selectionEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].count).toBe(1);
    expect(events[0].selectedRows.length).toBe(1);
  });

  test('select-all checkbox selects all rows and shows the bulk-bar', async ({ page }) => {
    await page.goto(sandbox('data-table'));
    await page.waitForLoadState('networkidle');

    const table = page.locator('[data-controller~="data-table"]').first();
    const selectAllCb = table.locator('[data-data-table-target="selectAllCheckbox"]');
    const bulkBar = table.locator('[data-data-table-target="bulkBar"]');

    // Bulk bar should be hidden initially (no rows selected).
    await expect(bulkBar).toBeHidden();

    // Check the select-all checkbox.
    await selectAllCb.check();

    // Bulk bar becomes visible.
    await expect(bulkBar).toBeVisible();

    // All row checkboxes should now be checked.
    const rowCheckboxes = table.locator('[data-data-table-target="rowCheckbox"]');
    const count = await rowCheckboxes.count();
    for (let i = 0; i < count; i++) {
      await expect(rowCheckboxes.nth(i)).toBeChecked();
    }
  });
});
