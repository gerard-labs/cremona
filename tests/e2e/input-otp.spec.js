import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — input-otp
 *
 * The input-otp controller manages a cluster of N single-digit <input>s.
 * Key behaviors:
 *   - Typing a digit in cell N auto-tabs to cell N+1.
 *   - Pasting a digit string distributes one digit per cell.
 *   - The aggregate value is mirrored on the hidden input target.
 *   - `input-otp:complete` is dispatched when all cells are filled.
 *
 * The story's first section (id="otp-default") renders a 6-cell OTP with
 * a hidden input (name="code-6").
 * The second section (id="otp-4") renders a 4-cell PIN.
 */
test.describe('input-otp', () => {
  test('renders the correct number of cell inputs', async ({ page }) => {
    await page.goto(sandbox('input-otp'));
    await page.waitForLoadState('networkidle');

    // The default 6-digit OTP cluster.
    const cluster = page.locator('[data-controller~="input-otp"]').first();
    await expect(cluster).toBeVisible();

    const cells = cluster.locator('[data-input-otp-target="input"]');
    await expect(cells).toHaveCount(6);
  });

  test('typing a digit auto-tabs focus to the next cell', async ({ page }) => {
    await page.goto(sandbox('input-otp'));
    await page.waitForLoadState('networkidle');

    const cluster = page.locator('[data-controller~="input-otp"]').first();
    const cells = cluster.locator('[data-input-otp-target="input"]');

    // Focus the first cell and type a digit.
    await cells.nth(0).click();
    await page.keyboard.type('3');

    // After typing, focus should have moved to cell index 1.
    await expect(cells.nth(1)).toBeFocused();

    // The first cell should contain the typed digit.
    await expect(cells.nth(0)).toHaveValue('3');
  });

  test('pasting a digit string distributes across cells and fires input-otp:complete', async ({ page }) => {
    await page.goto(sandbox('input-otp'));
    await page.waitForLoadState('networkidle');

    // Set up event capture before interacting.
    await page.evaluate(() => {
      window.__otpComplete = [];
      document.addEventListener('input-otp:complete', (e) => window.__otpComplete.push(e.detail));
    });

    const cluster = page.locator('[data-controller~="input-otp"]').first();
    const cells = cluster.locator('[data-input-otp-target="input"]');

    // Focus the first cell and paste a 6-digit code.
    await cells.nth(0).click();

    // Simulate paste via the clipboard API.
    await page.evaluate(() => {
      const input = document.querySelector('[data-controller~="input-otp"] [data-input-otp-target="input"]');
      const dt = new DataTransfer();
      dt.setData('text', '123456');
      const pasteEvent = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true });
      input.dispatchEvent(pasteEvent);
    });

    // All 6 cells should now contain the pasted digits.
    await expect(cells.nth(0)).toHaveValue('1');
    await expect(cells.nth(1)).toHaveValue('2');
    await expect(cells.nth(5)).toHaveValue('6');

    // The hidden input (if present) should reflect the aggregate.
    const hiddenInput = cluster.locator('[data-input-otp-target="hiddenInput"]');
    const hiddenCount = await hiddenInput.count();
    if (hiddenCount > 0) {
      await expect(hiddenInput).toHaveValue('123456');
    }

    // The complete event should have been fired.
    const completeEvents = await page.evaluate(() => window.__otpComplete);
    expect(completeEvents.length).toBeGreaterThan(0);
    expect(completeEvents[0].code).toBe('123456');
  });
});
