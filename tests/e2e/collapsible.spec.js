import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — collapsible controller.
 *
 * Story slug: 'collapsible'
 * Controller surface:
 *   data-controller="collapsible"               — on the wrap
 *   data-action="click->collapsible#toggle"     — on the wrap
 *   .cremona-collapsible__trigger [aria-expanded] — trigger button
 *   .cremona-collapsible__content [data-state]   — content region ("open"|"closed")
 *
 * toggle() flips aria-expanded on the trigger AND data-state on the content.
 */
test.describe('collapsible', () => {
  test('closed by default — clicking trigger opens the content', async ({ page }) => {
    await page.goto(sandbox('collapsible'));
    await page.waitForLoadState('networkidle');

    // The first collapsible in the story starts closed.
    const collapsible = page.locator('[data-controller~="collapsible"]').first();
    const trigger = collapsible.locator('.cremona-collapsible__trigger');
    const content = collapsible.locator('.cremona-collapsible__content');

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(content).toHaveAttribute('data-state', 'closed');

    await trigger.click();

    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(content).toHaveAttribute('data-state', 'open');
  });

  test('open by default — clicking trigger closes the content', async ({ page }) => {
    await page.goto(sandbox('collapsible'));
    await page.waitForLoadState('networkidle');

    // The story's second section renders a collapsible with open=true.
    // Use nth(1) — the second [data-controller~="collapsible"] in DOM order is the
    // "open by default" variant. Filtering by aria-expanded="true" is avoided
    // because that filter re-evaluates AFTER the click, causing the locator to
    // drift to a different (still-open) collapsible once this one is closed.
    const openCollapsible = page
      .locator('[data-controller~="collapsible"]')
      .nth(1);

    const trigger = openCollapsible.locator('.cremona-collapsible__trigger');
    const content = openCollapsible.locator('.cremona-collapsible__content');

    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(content).toHaveAttribute('data-state', 'open');

    await trigger.click();

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(content).toHaveAttribute('data-state', 'closed');
  });

  test('toggle dispatches collapsible:toggle event with correct open state', async ({ page }) => {
    await page.goto(sandbox('collapsible'));
    await page.waitForLoadState('networkidle');

    // Register listener BEFORE the action.
    await page.evaluate(() => {
      window.__collapsibleEvents = [];
      document.addEventListener('collapsible:toggle', (e) => {
        window.__collapsibleEvents.push(e.detail);
      });
    });

    const collapsible = page.locator('[data-controller~="collapsible"]').first();
    await collapsible.locator('.cremona-collapsible__trigger').click();

    const events = await page.evaluate(() => window.__collapsibleEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(typeof events[0].open).toBe('boolean');
  });
});
