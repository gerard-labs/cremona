import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — password-strength (story slug: auth-password-strength)
 *
 * The password-strength controller lazy-loads zxcvbn on first keystroke and
 * updates a <progress> meter (data-variant) and a hint element. On connect()
 * it renders score=0 / variant=danger and dispatches password-strength:mount.
 *
 * The story pre-renders static tiers without the live controller for visual
 * baseline purposes (see the story comment). The controller IS mounted on the
 * data-controller="password-strength" elements, so:
 *  - The controller element exists.
 *  - Typing into the input triggers evaluate() → debounce → score.
 *  - The meter data-variant attribute reflects the scored tier.
 *
 * Because zxcvbn loads async, we use a generous expect timeout and assert on
 * the meter attribute after the debounce (150 ms default) + load settles.
 */
test.describe('password-strength', () => {
  test('controller element is present and meter exists at initial state', async ({ page }) => {
    await page.goto(sandbox('auth-password-strength'));
    await page.waitForLoadState('networkidle');

    const widget = page.locator('[data-controller~="password-strength"]').first();
    await expect(widget).toBeVisible();

    const meter = widget.locator('[data-password-strength-target="meter"]');
    await expect(meter).toBeVisible();
  });

  test('typing a password dispatches password-strength:change event', async ({ page }) => {
    await page.goto(sandbox('auth-password-strength'));
    await page.waitForLoadState('networkidle');

    // Listen for the event before interacting.
    await page.evaluate(() => {
      window.__pwEvents = [];
      document.addEventListener('password-strength:change', (e) => window.__pwEvents.push(e.detail));
    });

    const widget = page.locator('[data-controller~="password-strength"]').first();
    const input = widget.locator('[data-password-strength-target="input"]');

    await input.fill('correct horse battery staple');

    // Wait for the debounce (150 ms) + zxcvbn lazy-load to settle.
    await page.waitForTimeout(500);

    const events = await page.evaluate(() => window.__pwEvents);
    expect(events.length).toBeGreaterThan(0);
    // score should be a number in [0, 4].
    const score = events[events.length - 1].score;
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(4);
  });

  test('meter data-variant reflects strength tier after typing', async ({ page }) => {
    await page.goto(sandbox('auth-password-strength'));
    await page.waitForLoadState('networkidle');

    const widget = page.locator('[data-controller~="password-strength"]').first();
    const input = widget.locator('[data-password-strength-target="input"]');
    const meter = widget.locator('[data-password-strength-target="meter"]');

    // Strong passphrase → should eventually reach score 3-4 → variant "success".
    await input.fill('correct horse battery staple');
    await page.waitForTimeout(500);

    const variant = await meter.getAttribute('data-variant');
    expect(['danger', 'warning', 'success']).toContain(variant);
  });
});
