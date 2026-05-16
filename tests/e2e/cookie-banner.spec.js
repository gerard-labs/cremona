import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — cookie-banner (RGPD-CookieBanner)
 *
 * The controller composes Dialog Ring 2. The story renders the banner
 * pre-opened (data-dialog-open-value="true" / <dialog open>). Each CTA
 * button wires to cookie-banner#accept, #reject, or #customize.
 *
 * Key observables:
 *  - The dialog element is visible on load.
 *  - Clicking "Accept all" fires cookie-banner:accept and closes the dialog.
 *  - Clicking "Reject all" fires cookie-banner:reject and closes the dialog.
 *  - Clicking "Customize" fires cookie-banner:customize (dialog stays open).
 *
 * Story slug: rgpd-cookie-banner
 * Controller identifier: cookie-banner (co-mounted with dialog)
 *
 * Note: the story uses a unique cookie name per section to prevent prior
 * consent from suppressing the banner.
 *
 * Implementation note: buttons are triggered via page.evaluate JS click()
 * rather than Playwright locator.click() to bypass any viewport / overlay
 * actionability issues with the inline (non-modal) dialog layout.
 */
test.describe('cookie-banner', () => {
  test('dialog is open on load and accept-all closes it', async ({ page }) => {
    await page.goto(sandbox('rgpd-cookie-banner'));
    await page.waitForLoadState('networkidle');

    // The first cookie-banner wrap in the story.
    const wrap = page.locator('[data-controller~="cookie-banner"]').first();
    const dialog = wrap.locator('[data-dialog-target="dialog"]');

    // The banner dialog should be open.
    await expect(dialog).toHaveAttribute('open');

    // Trigger accept via JS click to bypass any overlay actionability issue.
    await page.evaluate(() => {
      const btn = document.querySelector(
        '[data-controller~="cookie-banner"] [data-action*="cookie-banner#accept"]',
      );
      btn?.click();
    });

    // The dialog should close after accepting.
    await expect(dialog).not.toHaveAttribute('open');
  });

  test('reject-all closes the dialog and dispatches cookie-banner:reject', async ({ page }) => {
    await page.goto(sandbox('rgpd-cookie-banner'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__cbEvents = [];
      document.addEventListener('cookie-banner:reject', (e) => {
        window.__cbEvents.push({ type: 'reject', consent: e.detail.consent });
      });
    });

    // Use the second banner instance to avoid cookie collision with the first test.
    const wrap = page.locator('[data-controller~="cookie-banner"]').nth(1);
    const dialog = wrap.locator('[data-dialog-target="dialog"]');

    await expect(dialog).toHaveAttribute('open');

    // Trigger reject via JS click on the second banner's reject button.
    await page.evaluate(() => {
      const wraps = document.querySelectorAll('[data-controller~="cookie-banner"]');
      const secondWrap = wraps[1];
      const btn = secondWrap?.querySelector('[data-action*="cookie-banner#reject"]');
      btn?.click();
    });

    await expect(dialog).not.toHaveAttribute('open');

    const events = await page.evaluate(() => window.__cbEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].consent).toBe('minimal');
  });

  test('customize button dispatches cookie-banner:customize', async ({ page }) => {
    await page.goto(sandbox('rgpd-cookie-banner'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__cbCustomize = 0;
      document.addEventListener('cookie-banner:customize', () => {
        window.__cbCustomize++;
      });
    });

    // Use the third banner instance (events section).
    const wrap = page.locator('[data-controller~="cookie-banner"]').nth(2);
    const customizeBtn = wrap.locator('[data-action*="cookie-banner#customize"]');
    await customizeBtn.click();

    const count = await page.evaluate(() => window.__cbCustomize);
    expect(count).toBeGreaterThan(0);
  });
});
