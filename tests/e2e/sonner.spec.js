import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — sonner controller (toast queue engine).
 *
 * Story slug: 'sonner'
 * Controller surface:
 *   data-controller="sonner"             — on the viewport element
 *   data-sonner-target="indicator"       — queue overflow indicator button
 *   window.themeToast.show({ variant, message, ... }) — global consumer API
 *   document.dispatchEvent(new CustomEvent('theme:toast:show', { detail }))
 *
 * The story's trigger buttons carry data-sonner-demo="success|info|…" and a
 * document-delegated click listener calls window.themeToast.show().
 * The sonner controller renders toast elements (<output> or <div role="alert">)
 * into its viewport element with data-state="entering" → "visible".
 *
 * Events: sonner:show, sonner:dismiss (bubbles from the viewport element).
 */
test.describe('sonner', () => {
  test('clicking a success trigger shows a toast in the viewport', async ({ page }) => {
    await page.goto(sandbox('sonner'));
    await page.waitForLoadState('networkidle');

    // The sonner viewport is injected by boot() / ensureSonnerViewport().
    const viewport = page.locator('[data-controller~="sonner"]').first();
    await expect(viewport).toBeAttached();

    // Trigger a success toast via the story's delegated listener.
    const trigger = page.locator('[data-sonner-demo="success"]').first();
    await trigger.click();

    // A toast element must appear inside the viewport.
    const toast = viewport.locator('.cremona-sonner__toast').first();
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute('data-variant', 'success');
  });

  test('dismiss button on a toast removes it from the viewport', async ({ page }) => {
    await page.goto(sandbox('sonner'));
    await page.waitForLoadState('networkidle');

    const viewport = page.locator('[data-controller~="sonner"]').first();

    // Show a persistent danger toast (duration=null) so it doesn't auto-dismiss.
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent('theme:toast:show', {
        detail: { variant: 'danger', message: 'Test dismiss', duration: null },
      }));
    });

    const toast = viewport.locator('.cremona-sonner__toast').first();
    await expect(toast).toBeVisible();

    // Click the dismiss (×) button.
    const dismissBtn = toast.locator('.cremona-sonner__dismiss');
    await dismissBtn.click();

    // The toast transitions to data-state="exiting" and is eventually removed.
    await expect(toast).toBeHidden();
  });

  test('sonner:show event fires when a toast is triggered', async ({ page }) => {
    await page.goto(sandbox('sonner'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__sonnerShowEvents = [];
      document.addEventListener('sonner:show', (e) => {
        window.__sonnerShowEvents.push(e.detail);
      });
    });

    // Use the story trigger button (goes through the delegated listener).
    const trigger = page.locator('[data-sonner-demo="success"]').first();
    await trigger.click();

    const events = await page.evaluate(() => window.__sonnerShowEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].variant).toBe('success');
    expect(typeof events[0].message).toBe('string');
  });
});
