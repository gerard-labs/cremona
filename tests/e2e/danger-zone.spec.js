import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — danger-zone controller.
 *
 * The story now stamps `data-controller="danger-zone"` on the inline variant
 * article, with data-danger-zone-target="input" on the text field and
 * data-danger-zone-target="button" on the destructive button.
 *
 * Controller behaviour:
 *   - On connect: button is disabled; data-danger-zone-state="idle".
 *   - When the user types the expected string exactly: button enables,
 *     state flips to "armed", danger-zone:match-change fires.
 *   - When the user clears the input: button re-disables, state back to "idle".
 *
 * Story slug: danger-zone
 * Expected confirmation string (story default): "SUPPRIMER"
 */
test.describe('danger-zone', () => {
  test('controller connects: inline article carries data-controller="danger-zone"', async ({ page }) => {
    await page.goto(sandbox('danger-zone'));
    await page.waitForLoadState('networkidle');

    const controller = page.locator('[data-controller~="danger-zone"]').first();
    await expect(controller).toBeAttached();
  });

  test('idle state: destructive button is disabled before any input', async ({ page }) => {
    await page.goto(sandbox('danger-zone'));
    await page.waitForLoadState('networkidle');

    const idleArticle = page.locator('[data-controller~="danger-zone"]').first();
    await expect(idleArticle).toHaveAttribute('data-danger-zone-state', 'idle');

    const btn = idleArticle.locator('[data-danger-zone-target="button"]');
    await expect(btn).toBeDisabled();
    await expect(btn).toHaveAttribute('aria-disabled', 'true');
  });

  test('typing the correct string arms the button and fires danger-zone:match-change', async ({ page }) => {
    await page.goto(sandbox('danger-zone'));
    await page.waitForLoadState('networkidle');

    // Capture the match-change event.
    await page.evaluate(() => {
      window.__dzMatchChangeEvents = [];
      document.addEventListener('danger-zone:match-change', (e) => {
        window.__dzMatchChangeEvents.push(e.detail);
      });
    });

    const idleArticle = page.locator('[data-controller~="danger-zone"]').first();
    const input = idleArticle.locator('[data-danger-zone-target="input"]');
    const btn = idleArticle.locator('[data-danger-zone-target="button"]');

    // Type the correct expected value.
    await input.fill('SUPPRIMER');

    // Button must now be enabled.
    await expect(btn).toBeEnabled();
    await expect(btn).toHaveAttribute('aria-disabled', 'false');
    // State attribute must flip to "armed".
    await expect(idleArticle).toHaveAttribute('data-danger-zone-state', 'armed');

    // The match-change event must have fired with matches=true.
    const events = await page.evaluate(() => window.__dzMatchChangeEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(events[events.length - 1].matches).toBe(true);
    expect(events[events.length - 1].typed).toBe('SUPPRIMER');
  });

  test('clearing the input after arming re-disables the button', async ({ page }) => {
    await page.goto(sandbox('danger-zone'));
    await page.waitForLoadState('networkidle');

    const idleArticle = page.locator('[data-controller~="danger-zone"]').first();
    const input = idleArticle.locator('[data-danger-zone-target="input"]');
    const btn = idleArticle.locator('[data-danger-zone-target="button"]');

    // Arm first.
    await input.fill('SUPPRIMER');
    await expect(btn).toBeEnabled();

    // Then clear — button must disable again.
    await input.fill('');
    await expect(btn).toBeDisabled();
    await expect(idleArticle).toHaveAttribute('data-danger-zone-state', 'idle');
  });

  test('partial match does not arm the button', async ({ page }) => {
    await page.goto(sandbox('danger-zone'));
    await page.waitForLoadState('networkidle');

    const idleArticle = page.locator('[data-controller~="danger-zone"]').first();
    const input = idleArticle.locator('[data-danger-zone-target="input"]');
    const btn = idleArticle.locator('[data-danger-zone-target="button"]');

    // Type a partial / wrong-case match.
    await input.fill('supprimer');
    await expect(btn).toBeDisabled();
    await expect(idleArticle).toHaveAttribute('data-danger-zone-state', 'idle');
  });
});
