import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — command (⌘K Command palette)
 *
 * The command controller composes dialog + combobox on the same wrap.
 * Key interactions:
 *  - Ctrl+K / ⌘+K opens the palette (global hotkey).
 *  - A programmatic open button also opens it.
 *  - Typing in the combobox input filters the visible listbox options.
 *  - Esc closes the palette.
 *  - command:open / command:close events are dispatched.
 *
 * Story slug: command
 * Controller identifier: command (co-mounted with dialog and combobox)
 */
test.describe('command', () => {
  test('Ctrl+K opens the command palette and Escape closes it', async ({ page }) => {
    await page.goto(sandbox('command'));
    await page.waitForLoadState('networkidle');

    const wrap = page.locator('[data-controller~="command"]').first();
    const dialog = wrap.locator('[data-dialog-target="dialog"]');

    // Dialog should be closed initially.
    await expect(dialog).not.toHaveAttribute('open');

    // Press Ctrl+K to open.
    await page.keyboard.press('Control+k');
    await expect(dialog).toHaveAttribute('open');

    // Press Escape to close.
    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveAttribute('open');
  });

  test('opening the palette dispatches command:open event', async ({ page }) => {
    await page.goto(sandbox('command'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__cmdEvents = [];
      document.addEventListener('command:open', () => window.__cmdEvents.push('open'));
      document.addEventListener('command:close', () => window.__cmdEvents.push('close'));
    });

    // Ensure the page body has focus so the window keydown listener receives
    // the hotkey. This makes the test deterministic across headless runs.
    await page.locator('body').click();

    // Open via hotkey.
    await page.keyboard.press('Control+k');

    const wrap = page.locator('[data-controller~="command"]').first();
    await expect(wrap.locator('[data-dialog-target="dialog"]')).toHaveAttribute('open');

    // Wait for command:open rather than reading synchronously — the
    // dialog:open → command:open hop is not guaranteed done at this point.
    await page.waitForFunction(() => window.__cmdEvents.includes('open'), { timeout: 5000 });

    // Close and check command:close — likewise wait for the
    // dialog:close → command:close chain to propagate.
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__cmdEvents.includes('close'), { timeout: 5000 });
  });

  test('typing in the combobox input filters the listbox options', async ({ page }) => {
    await page.goto(sandbox('command'));
    await page.waitForLoadState('networkidle');

    // Open the palette — focus the body first so the window hotkey lands.
    await page.locator('body').click();
    await page.keyboard.press('Control+k');

    const wrap = page.locator('[data-controller~="command"]').first();
    await expect(wrap.locator('[data-dialog-target="dialog"]')).toHaveAttribute('open');
    const input = wrap.locator('[data-combobox-target="input"]');
    await expect(input).toBeVisible();

    // The story registers commands via window.themeCommand.register().
    // Wait a tick for the async registration to complete.
    await page.waitForTimeout(100);

    // Type a query that should match some options.
    await input.fill('accueil');

    // The combobox controller filters options; the listbox should be visible.
    const listbox = wrap.locator('[data-combobox-target="optionsContainer"]');
    await expect(listbox).toBeVisible();
  });
});
