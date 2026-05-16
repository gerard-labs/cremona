import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — color-picker controller.
 *
 * Story slug: 'form-color-picker'
 * Controller surface:
 *   data-controller="popover color-picker"
 *   data-color-picker-target="input"    — hex text input
 *   data-color-picker-target="trigger"  — trigger button
 *   data-color-picker-target="preview"  — swatch preview (background-color)
 *   data-color-picker-state             — "idle" on mount, "ready" after Coloris loads
 *
 * On connect():
 *   - Sets data-color-picker-state="idle"
 *   - Renders preview swatch with the defaultColor background
 *   - Dispatches color-picker:mount
 *
 * Coloris is lazy-loaded on first popover:open; the E2E only tests the
 * synchronous mount surface (preview swatch + idle state) and that clicking
 * the trigger opens the popover panel, since the heavy Coloris load is async
 * and test-environment-constrained.
 */
test.describe('color-picker', () => {
  test('mounts with data-color-picker-state="idle" and preview swatch rendered', async ({ page }) => {
    await page.goto(sandbox('form-color-picker'));
    await page.waitForLoadState('networkidle');

    const colorPicker = page.locator('[data-controller~="color-picker"]').first();

    // Controller sets state to "idle" synchronously in connect().
    await expect(colorPicker).toHaveAttribute('data-color-picker-state', 'idle');

    // Preview swatch has a background-color applied from the default color.
    const preview = colorPicker.locator('[data-color-picker-target="preview"]');
    await expect(preview).toBeVisible();
    const bgColor = await preview.evaluate((el) => el.style.backgroundColor);
    expect(bgColor).toBeTruthy();
  });

  test('dispatches color-picker:mount event on connect', async ({ page }) => {
    // Register the listener as an init script so it survives navigation and
    // is in place before the Stimulus controllers connect on every page load.
    await page.addInitScript(() => {
      window.__cpMountEvents = [];
      document.addEventListener('color-picker:mount', (e) => {
        window.__cpMountEvents.push(e.detail);
      });
    });

    await page.goto(sandbox('form-color-picker'));
    await page.waitForLoadState('networkidle');

    const events = await page.evaluate(() => window.__cpMountEvents);
    // The story renders 4 color-picker instances; expect at least one mount event.
    expect(events.length).toBeGreaterThan(0);
    expect(typeof events[0].value).toBe('string');
  });

  test('clicking the trigger button opens the popover content panel', async ({ page }) => {
    await page.goto(sandbox('form-color-picker'));
    await page.waitForLoadState('networkidle');

    const colorPicker = page.locator('[data-controller~="color-picker"]').first();
    const trigger = colorPicker.locator('[data-color-picker-target="trigger"]');
    const content = colorPicker.locator('[data-popover-target="content"]');

    // Content is hidden before interaction.
    await expect(content).toBeHidden();

    await trigger.click();

    // After click, the Popover controller opens the panel.
    await expect(content).toBeVisible();
  });
});
