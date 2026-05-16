import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — accordion
 *
 * The accordion orchestrates N collapsible children. Single-mode enforces
 * mutex (opening one closes others). The controller listens for
 * `collapsible:toggle` events from inner Collapsibles and manages roving
 * tabindex + Arrow/Home/End keyboard navigation.
 */
test.describe('accordion', () => {
  test('clicking a closed trigger expands that panel', async ({ page }) => {
    await page.goto(sandbox('accordion'));
    await page.waitForLoadState('networkidle');

    // The first accordion on the page (single mode) has its first item pre-opened.
    // Click the SECOND trigger to open it.
    const accordion = page.locator('[data-controller~="accordion"]').first();
    const triggers = accordion.locator('.cremona-collapsible__trigger');
    const secondTrigger = triggers.nth(1);
    const secondContent = accordion.locator('.cremona-collapsible__content').nth(1);

    await expect(secondTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(secondContent).toHaveAttribute('data-state', 'closed');

    await secondTrigger.click();

    await expect(secondTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(secondContent).toHaveAttribute('data-state', 'open');
  });

  test('single-mode: opening a new panel closes the previously open one', async ({ page }) => {
    await page.goto(sandbox('accordion'));
    await page.waitForLoadState('networkidle');

    const accordion = page.locator('[data-controller~="accordion"]').first();
    const triggers = accordion.locator('.cremona-collapsible__trigger');
    const contents = accordion.locator('.cremona-collapsible__content');

    // First item is pre-opened.
    await expect(triggers.nth(0)).toHaveAttribute('aria-expanded', 'true');
    await expect(contents.nth(0)).toHaveAttribute('data-state', 'open');

    // Open the second item — first should close.
    await triggers.nth(1).click();

    await expect(triggers.nth(1)).toHaveAttribute('aria-expanded', 'true');
    await expect(contents.nth(1)).toHaveAttribute('data-state', 'open');

    await expect(triggers.nth(0)).toHaveAttribute('aria-expanded', 'false');
    await expect(contents.nth(0)).toHaveAttribute('data-state', 'closed');
  });

  test('ArrowDown moves focus to next trigger, ArrowUp back', async ({ page }) => {
    await page.goto(sandbox('accordion'));
    await page.waitForLoadState('networkidle');

    const accordion = page.locator('[data-controller~="accordion"]').first();
    const triggers = accordion.locator('.cremona-collapsible__trigger');

    // Focus the first trigger and press ArrowDown.
    await triggers.nth(0).focus();
    await page.keyboard.press('ArrowDown');
    await expect(triggers.nth(1)).toBeFocused();

    // ArrowUp from second → back to first.
    await page.keyboard.press('ArrowUp');
    await expect(triggers.nth(0)).toBeFocused();
  });
});
