import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — session-timeout-countdown controller.
 *
 * Story slug: 'auth-session-timeout-modal'
 * Controller surface:
 *   data-controller="dialog session-timeout-countdown" (co-mounted)
 *   data-session-timeout-countdown-target="countdown" — the live countdown span
 *   data-session-timeout-countdown-remaining-seconds-value — initial seconds
 *   data-session-timeout-countdown-warning-threshold-seconds-value — warning threshold
 *
 * connect(): renders a formatted countdown string into the countdown target
 *            and starts a setInterval tick.
 * Events: session-timeout:warning (once, at threshold crossing),
 *         session-timeout:expired (once, at 0).
 *
 * The story renders the dialog open (the <dialog> has `open` attribute at
 * SSR time and the controller is co-mounted with dialog). The countdown target
 * contains the formatted time string stamped by the controller on connect().
 */
test.describe('session-timeout-countdown', () => {
  test('countdown target is rendered with a non-empty time string', async ({ page }) => {
    await page.goto(sandbox('auth-session-timeout-modal'));
    await page.waitForLoadState('networkidle');

    // The first modal section has remainingSeconds=60, so the countdown
    // target should show a non-empty string (minutes or seconds format).
    const countdown = page
      .locator('[data-controller~="session-timeout-countdown"]')
      .first()
      .locator('.cremona-auth-session-timeout-modal__countdown');

    await expect(countdown).toBeVisible();
    const text = await countdown.textContent();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('the controller element has the correct data-controller attribute', async ({ page }) => {
    await page.goto(sandbox('auth-session-timeout-modal'));
    await page.waitForLoadState('networkidle');

    const wrap = page.locator('[data-controller~="session-timeout-countdown"]').first();
    await expect(wrap).toBeAttached();
    // Confirm it also carries the co-mounted dialog controller.
    await expect(wrap).toHaveAttribute('data-controller', /dialog/);
  });

  test('countdown ticks: text changes after one second', async ({ page }) => {
    await page.goto(sandbox('auth-session-timeout-modal'));
    await page.waitForLoadState('networkidle');

    const countdown = page
      .locator('[data-controller~="session-timeout-countdown"]')
      .first()
      .locator('.cremona-auth-session-timeout-modal__countdown');

    await expect(countdown).toBeVisible();
    const before = await countdown.textContent();

    // Wait slightly longer than one tick (tickMs default = 1000 ms).
    await page.waitForTimeout(1200);

    const after = await countdown.textContent();
    // The countdown must have ticked — the text should differ.
    expect(after).not.toBe(before);
  });
});
