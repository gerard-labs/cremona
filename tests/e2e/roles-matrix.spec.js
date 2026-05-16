import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — roles-matrix controller.
 *
 * The story now stamps `data-controller="roles-matrix"` on the outer div,
 * with data-roles-matrix-target="cell" + data-action on each cell, and
 * data-roles-matrix-target="bulkEditToggle" + data-action on the toolbar button.
 *
 * Controller behaviour:
 *   - Clicking a cell opens an inline <select> editor.
 *   - Changing the select commits the new role (badge updates + cell-edit-commit fires).
 *   - Pressing Escape inside the select cancels the edit.
 *   - Clicking the bulk-edit toggle flips aria-pressed and dispatches
 *     roles-matrix:bulk-edit-toggle.
 *
 * Story slug: roles-matrix
 * Variants: 0 = Default — Light · LTR
 */
test.describe('roles-matrix', () => {
  test('controller connects: outer div carries data-controller="roles-matrix"', async ({ page }) => {
    await page.goto(sandbox('roles-matrix'));
    await page.waitForLoadState('networkidle');

    const matrix = page.locator('[data-controller~="roles-matrix"]').first();
    await expect(matrix).toBeAttached();
  });

  test('clicking a cell opens an inline select editor', async ({ page }) => {
    await page.goto(sandbox('roles-matrix'));
    await page.waitForLoadState('networkidle');

    const firstCell = page.locator('[data-roles-matrix-target="cell"]').first();
    await expect(firstCell).toBeVisible();

    // Before click: cell contains a badge, not a select.
    await expect(firstCell.locator('.cremona-badge')).toBeVisible();
    await expect(firstCell.locator('select')).toBeHidden();

    // Click the cell to open the editor.
    await firstCell.click();

    // After click: a select element must appear inside the cell.
    const select = firstCell.locator('select.cremona-roles-matrix__cell-select');
    await expect(select).toBeVisible();
  });

  test('pressing Escape on the select cancels the edit and restores the badge', async ({ page }) => {
    await page.goto(sandbox('roles-matrix'));
    await page.waitForLoadState('networkidle');

    const firstCell = page.locator('[data-roles-matrix-target="cell"]').first();
    await firstCell.click();
    const select = firstCell.locator('select.cremona-roles-matrix__cell-select');
    await expect(select).toBeVisible();

    // Press Escape — controller calls _cancelEdit().
    await page.keyboard.press('Escape');

    // Select is gone; badge is restored.
    await expect(firstCell.locator('select')).toBeHidden();
    await expect(firstCell.locator('.cremona-badge')).toBeVisible();
  });

  test('changing the select commits the edit and dispatches roles-matrix:cell-edit-commit', async ({ page }) => {
    await page.goto(sandbox('roles-matrix'));
    await page.waitForLoadState('networkidle');

    // Capture the commit event.
    await page.evaluate(() => {
      window.__rmCommitEvents = [];
      document.addEventListener('roles-matrix:cell-edit-commit', (e) => {
        window.__rmCommitEvents.push(e.detail);
      });
    });

    // Open the editor on the first cell.
    const firstCell = page.locator('[data-roles-matrix-target="cell"]').first();
    await firstCell.click();
    const select = firstCell.locator('select.cremona-roles-matrix__cell-select');
    await expect(select).toBeVisible();

    // Get available options and pick one different from the current selection.
    const options = await select.locator('option').all();
    const firstOptionValue = await options[0].getAttribute('value');
    const targetOptionValue = await options[options.length - 1].getAttribute('value');

    // Select the last option (if different from current, it commits).
    if (firstOptionValue !== targetOptionValue) {
      await select.selectOption(targetOptionValue);

      // Cell returns to badge display.
      await expect(firstCell.locator('select')).toBeHidden();
      await expect(firstCell.locator('.cremona-badge')).toBeVisible();

      // commit event must have fired.
      const events = await page.evaluate(() => window.__rmCommitEvents);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].newRole).toBe(targetOptionValue);
    } else {
      // If only one option exists, just verify the badge is restored.
      await page.keyboard.press('Escape');
      await expect(firstCell.locator('.cremona-badge')).toBeVisible();
    }
  });

  test('bulk-edit toggle button flips aria-pressed and dispatches roles-matrix:bulk-edit-toggle', async ({ page }) => {
    await page.goto(sandbox('roles-matrix'));
    await page.waitForLoadState('networkidle');

    // Capture the bulk-edit toggle event.
    await page.evaluate(() => {
      window.__rmBulkToggleEvents = [];
      document.addEventListener('roles-matrix:bulk-edit-toggle', (e) => {
        window.__rmBulkToggleEvents.push(e.detail);
      });
    });

    const toggleBtn = page.locator('[data-roles-matrix-target="bulkEditToggle"]').first();
    // Initial state: aria-pressed="false" (bulkEdit=false in default variant).
    await expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');

    await toggleBtn.click();

    // aria-pressed must flip to "true".
    await expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');

    // Event must have fired.
    const events = await page.evaluate(() => window.__rmBulkToggleEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].bulkEdit).toBe(true);
  });
});
