import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — popover
 *
 * The popover controller toggles a floating content panel anchored to a
 * trigger. On open: content becomes visible, data-state="open",
 * aria-expanded="true". On close: data-state="closed", hidden. Clicking
 * outside the popover closes it; Escape also closes it.
 */
test.describe('popover', () => {
  test('trigger click opens popover, Escape closes it', async ({ page }) => {
    await page.goto(sandbox('popover'));
    await page.waitForLoadState('networkidle');

    const popover = page.locator('[data-controller~="popover"]').first();
    const trigger = popover.locator('[data-popover-target="trigger"]');
    const content = popover.locator('[data-popover-target="content"]');

    // Initially hidden.
    await expect(content).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();

    // Content is now visible with open state.
    await expect(content).toBeVisible();
    await expect(content).toHaveAttribute('data-state', 'open');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Escape closes the popover.
    await page.keyboard.press('Escape');

    await expect(content).toHaveAttribute('data-state', 'closed');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('clicking outside the popover closes it', async ({ page }) => {
    await page.goto(sandbox('popover'));
    await page.waitForLoadState('networkidle');

    const popover = page.locator('[data-controller~="popover"]').first();
    const trigger = popover.locator('[data-popover-target="trigger"]');
    const content = popover.locator('[data-popover-target="content"]');

    await trigger.click();
    await expect(content).toBeVisible();

    // Click on a neutral area outside the popover.
    await page.mouse.click(5, 5);

    await expect(content).toHaveAttribute('data-state', 'closed');
  });

  test('popover:open event is dispatched when opening', async ({ page }) => {
    await page.goto(sandbox('popover'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__ppEvents = [];
      document.addEventListener('popover:open', (e) => window.__ppEvents.push(e.detail));
    });

    const popover = page.locator('[data-controller~="popover"]').first();
    const trigger = popover.locator('[data-popover-target="trigger"]');

    await trigger.click();

    const events = await page.evaluate(() => window.__ppEvents);
    expect(events.length).toBeGreaterThan(0);
  });
});
