import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — faceted-filters (search-faceted-filters compound)
 *
 * The controller aggregates checkbox / radio / range inputs inside its element
 * into a state object and dispatches `faceted-filters:change` on any input
 * change. A clear button (data-action="click->faceted-filters#clear") resets
 * all inputs and dispatches `faceted-filters:cleared`.
 *
 * Story slug: search-faceted-filters
 */
test.describe('faceted-filters', () => {
  test('checking a filter option dispatches faceted-filters:change', async ({ page }) => {
    await page.goto(sandbox('search-faceted-filters'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__ffEvents = [];
      document.addEventListener('faceted-filters:change', (e) => window.__ffEvents.push(e.detail));
    });

    // Click the first unchecked checkbox in the first faceted-filters instance.
    const filters = page.locator('[data-controller~="faceted-filters"]').first();
    const firstCheckbox = filters.locator('input[type="checkbox"]').first();

    await firstCheckbox.check();

    const events = await page.evaluate(() => window.__ffEvents);
    expect(events.length).toBeGreaterThan(0);
    // The changed property should carry the checkbox's name.
    expect(events[0]).toHaveProperty('changed');
    expect(events[0]).toHaveProperty('state');
  });

  test('clear button resets all inputs and dispatches faceted-filters:cleared', async ({ page }) => {
    await page.goto(sandbox('search-faceted-filters'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__ffCleared = [];
      document.addEventListener('faceted-filters:cleared', (e) => window.__ffCleared.push(e.detail));
    });

    const filters = page.locator('[data-controller~="faceted-filters"]').first();

    // Check one checkbox so the filters have a selection to clear.
    const firstCheckbox = filters.locator('input[type="checkbox"]').first();
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();

    // Click the clear button.
    const clearBtn = filters.getByRole('button').first();
    await clearBtn.click();

    // Checkbox should now be unchecked.
    await expect(firstCheckbox).not.toBeChecked();

    const events = await page.evaluate(() => window.__ffCleared);
    expect(events.length).toBeGreaterThan(0);
  });

  test('pre-selected variant renders with checked checkboxes', async ({ page }) => {
    await page.goto(sandbox('search-faceted-filters'));
    await page.waitForLoadState('networkidle');

    // The second faceted-filters instance in the story is the "pre-selected" one.
    const filters = page.locator('[data-controller~="faceted-filters"]').nth(1);
    const checkedBoxes = filters.locator('input[type="checkbox"]:checked');
    // Pre-selected section has 3 checked options (electronics + clothing + samsung).
    await expect(checkedBoxes).toHaveCount(3);
  });
});
