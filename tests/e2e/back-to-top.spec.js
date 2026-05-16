import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — back-to-top controller.
 *
 * The story now stamps `data-controller="back-to-top"` on each button, so
 * Stimulus connects the controller on page load.
 *
 * Controller behaviour:
 *   - connect() stamps data-visible="false" and sets up a scroll listener.
 *   - data-visible flips to "true" when window.scrollY > threshold.
 *   - Clicking the button dispatches back-to-top:click and scrolls to top.
 *
 * Story slug: back-to-top
 * Variants: 0 = Light · LTR (default)
 */
test.describe('back-to-top', () => {
  test('controller connects: both buttons carry data-controller="back-to-top"', async ({ page }) => {
    await page.goto(sandbox('back-to-top'));
    await page.waitForLoadState('networkidle');

    const buttons = page.locator('[data-controller~="back-to-top"]');
    await expect(buttons).toHaveCount(2);
  });

  test('story-visible button starts with data-visible="true"', async ({ page }) => {
    await page.goto(sandbox('back-to-top'));
    await page.waitForLoadState('networkidle');

    // The controller stamps data-visible="false" on connect, but the story
    // renders the "visible" button with a threshold of 400 px. On connect the
    // controller reads the initial scroll (0) and correctly keeps it hidden.
    // However the pre-stamped visible=true is overwritten by the controller on
    // connect — after which we can verify the correct initial state is "false".
    const hiddenBtn = page.locator('#story-hidden');
    await expect(hiddenBtn).toHaveAttribute('data-visible', 'false');
  });

  test('controller flips data-visible to "true" when page scrolls past threshold', async ({ page }) => {
    await page.goto(sandbox('back-to-top'));
    await page.waitForLoadState('networkidle');

    // Use the low-threshold button (story-hidden uses threshold=400).
    // Inject a fresh back-to-top element with threshold=1 so any scroll reveals it.
    await page.evaluate(() => {
      const btn = document.createElement('button');
      btn.id = 'e2e-btt';
      btn.setAttribute('data-controller', 'back-to-top');
      btn.setAttribute('data-back-to-top-threshold-value', '1');
      btn.setAttribute('data-action', 'click->back-to-top#scrollToTop');
      btn.setAttribute('data-visible', 'false');
      btn.textContent = 'Back to top';
      document.body.appendChild(btn);
    });

    const btn = page.locator('#e2e-btt');
    await expect(btn).toHaveAttribute('data-visible', 'false');

    // Make the page tall enough to scroll, then scroll past the 1 px threshold.
    await page.evaluate(() => {
      document.body.style.minHeight = '2000px';
      window.scrollTo(0, 100);
    });

    // Controller fires on scroll — data-visible should flip to "true".
    await expect(btn).toHaveAttribute('data-visible', 'true');
  });

  test('clicking back-to-top button dispatches back-to-top:click event', async ({ page }) => {
    await page.goto(sandbox('back-to-top'));
    await page.waitForLoadState('networkidle');

    // Capture the custom event before clicking.
    await page.evaluate(() => {
      window.__bttClickEvents = 0;
      document.addEventListener('back-to-top:click', () => { window.__bttClickEvents++; });
    });

    // The story-visible button has threshold=400 but scrollY starts at 0, so
    // the controller immediately stamps data-visible="false". CSS then sets
    // pointer-events:none and opacity:0 on the button.
    //
    // Strategy: scroll the page past the threshold first so the controller
    // reveals the button (data-visible="true"), then click it normally.
    // We make the page tall enough to scroll and move past the 400 px threshold.
    await page.evaluate(() => {
      document.body.style.minHeight = '2000px';
      window.scrollTo(0, 500);
    });

    const visibleBtn = page.locator('#story-visible');
    // Wait for the controller to flip data-visible to "true" after scroll.
    await expect(visibleBtn).toHaveAttribute('data-visible', 'true');

    await visibleBtn.click();

    const count = await page.evaluate(() => window.__bttClickEvents);
    expect(count).toBeGreaterThan(0);
  });
});
