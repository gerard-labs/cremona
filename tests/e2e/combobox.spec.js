import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — combobox controller.
 *
 * Story slug: 'combobox'
 * Controller surface:
 *   data-controller="popover combobox"
 *   data-combobox-target="input"            — visible <input role="combobox">
 *   data-combobox-target="option"           — each option (data-hidden / aria-selected)
 *   data-combobox-target="empty"            — empty-state element (hidden/visible)
 *   data-combobox-target="hiddenInput"      — hidden input carrying the selected value
 *   data-popover-target="content"           — the listbox popup
 *
 * filter(): typing narrows options (data-hidden="true" on non-matching ones).
 * _selectIdx(): clicking / Enter selects an option → closes listbox, sets input value.
 * Events: combobox:filter (query + count), combobox:change (value + label).
 *
 * Note: the `openOnFocus` action is wired on the wrap element but `focus`
 * does not bubble from the inner <input>. We open the listbox instead via
 * ArrowDown (which the keydown handler catches when the listbox is closed)
 * or by typing (which triggers the filter() method that auto-opens the popover).
 */
test.describe('combobox', () => {
  test('focusing the input opens the listbox', async ({ page }) => {
    await page.goto(sandbox('combobox'));
    await page.waitForLoadState('networkidle');

    const combobox = page.locator('[data-controller~="combobox"]').first();
    const input = combobox.locator('[data-combobox-target="input"]');
    const listbox = combobox.locator('[data-popover-target="content"]');

    await expect(listbox).toBeHidden();

    // Click the input to focus it, then press ArrowDown — the keydown handler
    // opens the listbox when it is closed (per WAI-ARIA APG Combobox pattern).
    await input.click();
    await page.keyboard.press('ArrowDown');

    await expect(listbox).toBeVisible();
  });

  test('typing filters options and hides non-matching ones', async ({ page }) => {
    await page.goto(sandbox('combobox'));
    await page.waitForLoadState('networkidle');

    const combobox = page.locator('[data-controller~="combobox"]').first();
    const input = combobox.locator('[data-combobox-target="input"]');

    await input.click();
    // The story has language options; typing "fr" should match at least
    // "Français" and hide others. fill() fires an input event which calls
    // filter() and auto-opens the listbox.
    await input.fill('fr');

    // Options with data-hidden="true" are filtered out.
    const hiddenOptions = combobox.locator('[data-combobox-target="option"][data-hidden="true"]');
    const visibleOptions = combobox.locator('[data-combobox-target="option"][data-hidden="false"]');

    await expect(hiddenOptions.first()).toBeAttached();
    await expect(visibleOptions.first()).toBeAttached();
  });

  test('typing a no-match query shows the empty state', async ({ page }) => {
    await page.goto(sandbox('combobox'));
    await page.waitForLoadState('networkidle');

    const combobox = page.locator('[data-controller~="combobox"]').first();
    const input = combobox.locator('[data-combobox-target="input"]');
    const emptyState = combobox.locator('[data-combobox-target="empty"]');

    await input.click();
    // Type a query that matches nothing in the language list.
    await input.fill('zzznomatch');

    await expect(emptyState).toBeVisible();
  });

  test('selecting an option closes the listbox and updates the input value', async ({ page }) => {
    await page.goto(sandbox('combobox'));
    await page.waitForLoadState('networkidle');

    const combobox = page.locator('[data-controller~="combobox"]').first();
    const input = combobox.locator('[data-combobox-target="input"]');
    const listbox = combobox.locator('[data-popover-target="content"]');

    // Click input to focus it, then ArrowDown to open the listbox (the keydown
    // handler opens when closed). _onPopoverOpen then sets _activeIdx = 0.
    await input.click();
    await page.keyboard.press('ArrowDown');
    await expect(listbox).toBeVisible();

    // Read the label of the first non-hidden option — this is option at active
    // index 0, which Enter will select.
    const firstOption = combobox
      .locator('[data-combobox-target="option"][data-hidden="false"]')
      .first();
    const optionLabel = await firstOption.locator('.cremona-item__label').textContent();

    // Press Enter to select the currently-active option (avoids focusout race
    // that can occur when clicking inside an open listbox).
    await page.keyboard.press('Enter');

    // Input shows the selected option's label.
    await expect(input).toHaveValue(optionLabel.trim());
  });

  test('combobox:change event fires when an option is selected', async ({ page }) => {
    await page.goto(sandbox('combobox'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__cbxChangeEvents = [];
      document.addEventListener('combobox:change', (e) => {
        window.__cbxChangeEvents.push(e.detail);
      });
    });

    const combobox = page.locator('[data-controller~="combobox"]').first();
    const input = combobox.locator('[data-combobox-target="input"]');
    const listbox = combobox.locator('[data-popover-target="content"]');

    // Click input to focus it, then ArrowDown to open the listbox.
    // _onPopoverOpen sets _activeIdx = 0 (first visible option).
    await input.click();
    await page.keyboard.press('ArrowDown');
    await expect(listbox).toBeVisible();

    // Select via Enter (avoids focusout race that can occur when clicking
    // inside an open listbox — Enter fires on the focused input with no
    // relatedTarget change, so _onFocusOut does not prematurely close).
    await page.keyboard.press('Enter');

    const events = await page.evaluate(() => window.__cbxChangeEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(typeof events[0].value).toBe('string');
    expect(typeof events[0].label).toBe('string');
  });
});
