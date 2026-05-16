import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — phone-input (story slug: form-phone-input)
 *
 * The phone-input controller lazy-loads intl-tel-input on first focus and
 * transitions data-phone-input-state from "idle" → "ready". On connect() it
 * stamps state="idle" and dispatches phone-input:mount.
 */
test.describe('phone-input', () => {
  test('controller element renders in idle state on load', async ({ page }) => {
    await page.goto(sandbox('form-phone-input'));
    await page.waitForLoadState('networkidle');

    const widget = page.locator('[data-controller~="phone-input"]').first();
    await expect(widget).toBeVisible();
    await expect(widget).toHaveAttribute('data-phone-input-state', 'idle');
  });

  test('focusing the input transitions state to ready and dispatches phone-input:ready', async ({ page }) => {
    await page.goto(sandbox('form-phone-input'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__phoneEvents = [];
      document.addEventListener('phone-input:ready', (e) => window.__phoneEvents.push(e.detail));
    });

    const widget = page.locator('[data-controller~="phone-input"]').first();
    const input = widget.locator('[data-phone-input-target="input"]');

    await input.click();

    // intl-tel-input lazy-loads; wait for the ready transition.
    await expect(widget).toHaveAttribute('data-phone-input-state', 'ready', { timeout: 5000 });

    const events = await page.evaluate(() => window.__phoneEvents);
    expect(events.length).toBeGreaterThan(0);
  });

  test('phone-input:mount event is dispatched on page load', async ({ page }) => {
    // Register the listener before the page renders — use page.addInitScript.
    await page.addInitScript(() => {
      window.__mountEvents = [];
      document.addEventListener('phone-input:mount', (e) => window.__mountEvents.push(e.detail));
    });

    await page.goto(sandbox('form-phone-input'));
    await page.waitForLoadState('networkidle');

    const mountCount = await page.evaluate(() => window.__mountEvents.length);
    expect(mountCount).toBeGreaterThan(0);
  });
});
