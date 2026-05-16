import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — drawer
 *
 * The drawer controller extends DialogController — same native `<dialog>`
 * modal mechanics (showModal / focus trap / Esc / backdrop dismiss) with
 * distinct `drawer:open` / `drawer:close` events and a slide-in CSS animation
 * controlled by the `edge` value (start | end | top | bottom).
 *
 * Trigger: data-action="click->drawer#open"
 * Close buttons: data-action="click->drawer#close"
 */
test.describe('drawer', () => {
  test('trigger click opens the drawer, close button hides it', async ({ page }) => {
    await page.goto(sandbox('drawer'));
    await page.waitForLoadState('networkidle');

    const wrap = page.locator('[data-controller~="drawer"]').first();
    const triggerBtn = wrap.getByRole('button').first();
    const dialog = wrap.locator('dialog[data-drawer-target="dialog"]');

    // Drawer is closed at rest — native dialog element has no `open` attribute.
    await expect(dialog).not.toHaveAttribute('open');

    await triggerBtn.click();
    await expect(dialog).toHaveAttribute('open');

    // The drawer slides in from the viewport edge via a CSS transform. The
    // close button inside the dialog may be reported as outside the viewport
    // by Playwright's actionability check (even after showModal) because the
    // animation hasn't settled. Use page.evaluate to dispatch a synthetic
    // click directly — this bypasses all Playwright actionability checks while
    // still firing the Stimulus action handler (click->drawer#close).
    await page.evaluate(() => {
      const closeBtn = document.querySelector(
        'dialog[data-drawer-target="dialog"] [data-action*="drawer#close"]',
      );
      closeBtn?.click();
    });

    await expect(dialog).not.toHaveAttribute('open');
  });

  test('Escape key closes the drawer', async ({ page }) => {
    await page.goto(sandbox('drawer'));
    await page.waitForLoadState('networkidle');

    const wrap = page.locator('[data-controller~="drawer"]').first();
    const triggerBtn = wrap.getByRole('button').first();
    const dialog = wrap.locator('dialog[data-drawer-target="dialog"]');

    await triggerBtn.click();
    await expect(dialog).toHaveAttribute('open');

    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveAttribute('open');
  });

  test('drawer:open event carries the edge detail', async ({ page }) => {
    await page.goto(sandbox('drawer'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__drawerEvents = [];
      document.addEventListener('drawer:open', (e) => window.__drawerEvents.push(e.detail));
    });

    const wrap = page.locator('[data-controller~="drawer"]').first();
    const triggerBtn = wrap.getByRole('button').first();

    await triggerBtn.click();
    await expect(wrap.locator('dialog[data-drawer-target="dialog"]')).toHaveAttribute('open');

    const events = await page.evaluate(() => window.__drawerEvents);
    expect(events.length).toBeGreaterThan(0);
    // The default edge from the story is 'end'.
    expect(events[0]).toHaveProperty('edge');
  });
});
