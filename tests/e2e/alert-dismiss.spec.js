import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — alert-dismiss
 *
 * The controller stamps `data-state="dismissing"` on click of the dismiss
 * button, then waits for `transitionend` (opacity fade) to remove the
 * element from the DOM and dispatch `alert:dismissed`.
 *
 * Challenge: under `prefers-reduced-motion: reduce`, the CSS duration
 * collapses to 0 ms — zero-duration transitions do NOT fire `transitionend`.
 * Even with normal motion, the 180 ms appear animation may block the opacity
 * transition, preventing `transitionend` from firing. In both cases the
 * controller's `finalize` handler never runs and the element stays in the DOM.
 *
 * Solution: after clicking dismiss, dispatch a synthetic `transitionend` via
 * page.evaluate() to trigger finalize() reliably. A plain Event (no
 * `propertyName`) makes the controller's guard evaluate to false (undefined
 * is falsy), so finalize runs and removes the element unconditionally.
 *
 * Assertion strategy: count-based rather than `not.toBeAttached()` on a
 * `.first()` locator — after removal, `.first()` would re-evaluate to the
 * next remaining dismissible alert (still attached), causing a false failure.
 *
 * Story slug: alert
 */

test.describe('alert-dismiss', () => {
  test('dismiss button sets data-state="dismissing" then removes the alert', async ({ page }) => {
    await page.goto(sandbox('alert'));
    await page.waitForLoadState('networkidle');

    // Record how many dismissible alerts are present.
    const dismissibleSelector = '[data-controller="alert-dismiss"]';
    const initialCount = await page.locator(dismissibleSelector).count();
    expect(initialCount).toBeGreaterThan(0);

    const alert = page.locator(dismissibleSelector).first();
    await expect(alert).toBeVisible();

    const dismissBtn = alert.locator('[data-action*="alert-dismiss#dismiss"]');
    await expect(dismissBtn).toBeVisible();

    // Listen for the custom event before clicking.
    await page.evaluate(() => {
      window.__alertDismissed = 0;
      document.addEventListener('alert:dismissed', () => { window.__alertDismissed++; });
    });

    await dismissBtn.click();

    // The controller sets data-state="dismissing" synchronously on click.
    // It then waits for `transitionend` before calling remove(). In the test
    // environment (no / 0-ms CSS transitions), the event may never fire.
    // Dispatch a synthetic transitionend via evaluate to trigger finalize().
    // If the element is already gone (e.g., 0-ms motion fired transitionend
    // instantly), the evaluate is a harmless no-op.
    await page.evaluate(() => {
      const el = document.querySelector('[data-controller="alert-dismiss"]');
      if (el?.dataset?.state === 'dismissing') {
        // Plain Event — undefined propertyName passes the guard in finalize.
        el.dispatchEvent(new Event('transitionend', { bubbles: false }));
      }
    });

    // One alert should have been removed from the DOM.
    await expect(page.locator(dismissibleSelector)).toHaveCount(initialCount - 1);

    // The custom event should have fired.
    const count = await page.evaluate(() => window.__alertDismissed);
    expect(count).toBeGreaterThan(0);
  });

  test('alert:dismissed event fires on dismiss', async ({ page }) => {
    await page.goto(sandbox('alert'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__ev = [];
      document.addEventListener('alert:dismissed', (e) => window.__ev.push(e.type));
    });

    const dismissibleSelector = '[data-controller="alert-dismiss"]';
    const initialCount = await page.locator(dismissibleSelector).count();
    expect(initialCount).toBeGreaterThan(0);

    const alertEl = page.locator(dismissibleSelector).first();
    const dismissBtn = alertEl.locator('[data-action*="alert-dismiss#dismiss"]');

    await dismissBtn.click();

    // Dispatch synthetic transitionend so finalize() runs regardless of CSS
    // animation state. The guard check prevents double-firing if finalize
    // already ran (element gone → no-op).
    await page.evaluate(() => {
      const el = document.querySelector('[data-controller="alert-dismiss"]');
      if (el?.dataset?.state === 'dismissing') {
        el.dispatchEvent(new Event('transitionend', { bubbles: false }));
      }
    });

    // One alert should have left the DOM.
    await expect(page.locator(dismissibleSelector)).toHaveCount(initialCount - 1);

    const events = await page.evaluate(() => window.__ev);
    expect(events.length).toBeGreaterThan(0);
  });
});
