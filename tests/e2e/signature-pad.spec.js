import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — signature-pad controller.
 *
 * Story slug: 'form-signature'
 * Controller surface:
 *   data-controller="signature-pad"
 *   data-signature-pad-target="canvas"      — the drawing canvas (role="img")
 *   data-signature-pad-target="clearBtn"    — the Clear button
 *   data-signature-pad-target="hiddenInput" — hidden form input
 *   data-signature-pad-state               — "idle" on connect, "ready" after lazy load
 *
 * Events: signature-pad:mount (on connect), signature-pad:ready (after lazy load),
 *         signature-pad:change (on end stroke), signature-pad:clear (on clear).
 *
 * The library (signature_pad v5) is lazy-loaded on first pointerdown.
 * The canvas + clear button must be present immediately on connect.
 */
test.describe('signature-pad', () => {
  test('canvas and clear button are present and the controller mounted', async ({ page }) => {
    await page.goto(sandbox('form-signature'));
    await page.waitForLoadState('networkidle');

    const pad = page.locator('[data-controller~="signature-pad"]').first();
    await expect(pad).toBeAttached();

    // Controller stamps data-signature-pad-state="idle" on connect.
    await expect(pad).toHaveAttribute('data-signature-pad-state', 'idle');

    const canvas = pad.locator('[data-signature-pad-target="canvas"]');
    await expect(canvas).toBeVisible();
    // The controller stamps role="img" on the canvas.
    await expect(canvas).toHaveAttribute('role', 'img');

    const clearBtn = pad.locator('[data-signature-pad-target="clearBtn"]');
    await expect(clearBtn).toBeVisible();
  });

  test('signature-pad:mount event fires on connect', async ({ page }) => {
    // addInitScript injects the counter BEFORE the page scripts run, so
    // the listener is in place when Stimulus controllers connect on load.
    await page.addInitScript(() => {
      window.__sigPadMounted = 0;
      document.addEventListener('signature-pad:mount', () => {
        window.__sigPadMounted++;
      });
    });

    await page.goto(sandbox('form-signature'));
    await page.waitForLoadState('networkidle');

    // Poll for the mount event — the controller may connect after
    // networkidle resolves on a slow runner.
    await page.waitForFunction(() => window.__sigPadMounted > 0, { timeout: 10000 });
    const mounted = await page.evaluate(() => window.__sigPadMounted);
    expect(mounted).toBeGreaterThan(0);
  });

  test('hidden input is present for form integration', async ({ page }) => {
    await page.goto(sandbox('form-signature'));
    await page.waitForLoadState('networkidle');

    const pad = page.locator('[data-controller~="signature-pad"]').first();
    const hiddenInput = pad.locator('[data-signature-pad-target="hiddenInput"]');
    await expect(hiddenInput).toBeAttached();
    // Initially empty.
    await expect(hiddenInput).toHaveValue('');
  });
});
