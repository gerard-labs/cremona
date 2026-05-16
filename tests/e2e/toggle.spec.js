import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — toggle
 *
 * The toggle controller flips aria-pressed on click and dispatches a `toggle`
 * custom event with detail.pressed. The story boots Stimulus via onMounted(boot)
 * so every button with data-controller="toggle" is fully wired.
 *
 * Story slug: `toggle` (src/templates/components/toggle/).
 */
test.describe('toggle', () => {
  test('clicking an unpressed toggle sets aria-pressed="true"', async ({ page }) => {
    await page.goto(sandbox('toggle'));
    await page.waitForLoadState('networkidle');

    // Scope to the default section to get stable positional locators that
    // are not affected by aria-pressed re-evaluation after the click.
    const defaultSection = page.locator('[aria-labelledby="toggle-section-default"]');
    // First button in the default section starts as unpressed.
    const unpressedBtn = defaultSection.locator('[data-controller~="toggle"]').nth(0);
    await expect(unpressedBtn).toBeVisible();
    await expect(unpressedBtn).toHaveAttribute('aria-pressed', 'false');

    await unpressedBtn.click();

    await expect(unpressedBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking a pressed toggle sets aria-pressed="false"', async ({ page }) => {
    await page.goto(sandbox('toggle'));
    await page.waitForLoadState('networkidle');

    // Second button in the default section starts as pressed.
    const defaultSection = page.locator('[aria-labelledby="toggle-section-default"]');
    const pressedBtn = defaultSection.locator('[data-controller~="toggle"]').nth(1);
    await expect(pressedBtn).toBeVisible();
    await expect(pressedBtn).toHaveAttribute('aria-pressed', 'true');

    await pressedBtn.click();

    await expect(pressedBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('click dispatches a `toggle` custom event with detail.pressed', async ({ page }) => {
    await page.goto(sandbox('toggle'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__toggleEvents = [];
      document.addEventListener('toggle', (e) => window.__toggleEvents.push(e.detail));
    });

    // Use the first button in the default section (stable positional locator).
    const defaultSection = page.locator('[aria-labelledby="toggle-section-default"]');
    const btn = defaultSection.locator('[data-controller~="toggle"]').nth(0);
    await btn.click();

    const events = await page.evaluate(() => window.__toggleEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].pressed).toBe(true);
  });
});
