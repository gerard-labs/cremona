import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — dialog
 *
 * The dialog controller wraps a native `<dialog>` element. A trigger button
 * (data-action="click->dialog#open") shows the modal via showModal(); inner
 * close/cancel buttons call dialog#close. Esc dismisses by default (native
 * cancel event); backdrop click also dismisses by default. The controller
 * dispatches `dialog:open` and `dialog:close` CustomEvents.
 */
test.describe('dialog', () => {
  test('trigger click opens the dialog, close button hides it', async ({ page }) => {
    await page.goto(sandbox('dialog'));
    await page.waitForLoadState('networkidle');

    // The story renders several dialogs; use the first wrap.
    const wrap = page.locator('[data-controller~="dialog"]').first();
    const triggerBtn = wrap.getByRole('button', { name: /ouvrir|open/i }).first();
    const dialog = wrap.locator('dialog[data-dialog-target="dialog"]');

    // Dialog is closed at rest.
    await expect(dialog).not.toHaveAttribute('open', { timeout: 5000 });

    // Click the trigger → dialog opens (native `open` attribute).
    await triggerBtn.click();
    await expect(dialog).toHaveAttribute('open');

    // Click the × close button inside the dialog.
    const closeBtn = dialog.getByRole('button').first();
    await closeBtn.click();
    await expect(dialog).not.toHaveAttribute('open');
  });

  test('Escape key closes the dialog', async ({ page }) => {
    await page.goto(sandbox('dialog'));
    await page.waitForLoadState('networkidle');

    const wrap = page.locator('[data-controller~="dialog"]').first();
    const triggerBtn = wrap.getByRole('button').first();
    const dialog = wrap.locator('dialog[data-dialog-target="dialog"]');

    await triggerBtn.click();
    await expect(dialog).toHaveAttribute('open');

    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveAttribute('open');
  });

  test('dialog:open and dialog:close events are dispatched', async ({ page }) => {
    await page.goto(sandbox('dialog'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__dlgEvents = [];
      document.addEventListener('dialog:open',  () => window.__dlgEvents.push('open'));
      document.addEventListener('dialog:close', () => window.__dlgEvents.push('close'));
    });

    const wrap = page.locator('[data-controller~="dialog"]').first();
    const triggerBtn = wrap.getByRole('button').first();
    const dialog = wrap.locator('dialog[data-dialog-target="dialog"]');

    await triggerBtn.click();
    await expect(dialog).toHaveAttribute('open');

    await page.keyboard.press('Escape');
    await expect(dialog).not.toHaveAttribute('open');

    const events = await page.evaluate(() => window.__dlgEvents);
    expect(events).toContain('open');
    expect(events).toContain('close');
  });
});
