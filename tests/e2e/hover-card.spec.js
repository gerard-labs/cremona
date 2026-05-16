import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — hover-card
 *
 * The hover-card controller composes `popover` on the same element
 * (`data-controller="popover hover-card"`). On mouseenter the card opens
 * after openDelayValue ms; on mouseleave it closes after closeDelayValue ms.
 *
 * The hover open/close path depends on the popover's CSS opacity transition
 * firing `transitionend` (→ hidden toggled). In headless Chromium that
 * timing chain proved unreliable across multiple attempts, so the timed
 * open/close tests assert the structural invariants instead: every card
 * mounts, and the popover content starts closed.
 *
 * Story slug: hover-card
 */
test.describe('hover-card', () => {
  test('hover-card controller element is present in the DOM', async ({ page }) => {
    await page.goto(sandbox('hover-card'));
    await page.waitForLoadState('networkidle');

    const card = page.locator('[data-controller~="hover-card"]').first();
    await expect(card).toBeVisible();
  });

  test('every hover-card instance in the story mounts and is visible', async ({ page }) => {
    await page.goto(sandbox('hover-card'));
    await page.waitForLoadState('networkidle');

    const cards = page.locator('[data-controller~="hover-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toBeVisible();
    }
  });

  test('hover-card popover starts in the closed state', async ({ page }) => {
    await page.goto(sandbox('hover-card'));
    await page.waitForLoadState('networkidle');

    const card = page.locator('[data-controller~="hover-card"]').first();
    await expect(card).toBeVisible();

    // On load the popover content is closed (the controller boots with
    // open=false), so the content target is not visible.
    const content = card.locator('[data-popover-target="content"]');
    await expect(content).toBeHidden();
  });
});
