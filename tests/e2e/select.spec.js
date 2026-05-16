import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — select controller.
 *
 * Story slug: 'select'
 * Controller surface:
 *   data-controller="popover select" (co-mounted)
 *   data-select-target="button"      — the visible trigger button
 *   data-select-target="listbox"     — alias, actual content is [data-popover-target="content"]
 *   data-select-target="option"      — each role="option" element
 *   data-select-target="label"       — label span inside the trigger
 *   data-select-target="hiddenInput" — hidden form input
 *
 * open: click trigger → listbox appears (via popover).
 * select: click option → listbox closes, label updates, aria-selected set.
 * event: select:change fires on selection.
 */
test.describe('select', () => {
  test('clicking the trigger opens the listbox', async ({ page }) => {
    await page.goto(sandbox('select'));
    await page.waitForLoadState('networkidle');

    const select = page.locator('[data-controller~="select"]').first();
    const trigger = select.locator('[data-select-target="button"]');
    const listbox = select.locator('[data-popover-target="content"]');

    await expect(listbox).toBeHidden();
    await trigger.click();
    await expect(listbox).toBeVisible();
  });

  test('clicking an option closes the listbox and updates the trigger label', async ({ page }) => {
    await page.goto(sandbox('select'));
    await page.waitForLoadState('networkidle');

    const select = page.locator('[data-controller~="select"]').first();
    const trigger = select.locator('[data-select-target="button"]');
    const listbox = select.locator('[data-popover-target="content"]');
    const label = select.locator('[data-select-target="label"]');

    await trigger.click();
    await expect(listbox).toBeVisible();

    // Click the first option.
    const firstOption = listbox.locator('[data-select-target="option"]').first();
    const optionLabel = await firstOption.locator('.cremona-item__label').textContent();
    await firstOption.click();

    // Listbox closes.
    await expect(listbox).toBeHidden();
    // The trigger label is updated to the selected option's text.
    await expect(label).toHaveText(optionLabel.trim());
  });

  test('select:change event fires when an option is chosen', async ({ page }) => {
    await page.goto(sandbox('select'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__selectChangeEvents = [];
      document.addEventListener('select:change', (e) => {
        window.__selectChangeEvents.push(e.detail);
      });
    });

    const select = page.locator('[data-controller~="select"]').first();
    const trigger = select.locator('[data-select-target="button"]');
    const listbox = select.locator('[data-popover-target="content"]');

    await trigger.click();
    await expect(listbox).toBeVisible();

    const firstOption = listbox.locator('[data-select-target="option"]').first();
    await firstOption.click();

    const events = await page.evaluate(() => window.__selectChangeEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(typeof events[0].value).toBe('string');
    expect(typeof events[0].label).toBe('string');
  });
});
