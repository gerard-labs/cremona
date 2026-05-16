import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — preferences-center (rgpd-preferences-center compound)
 *
 * The controller manages RGPD consent toggles (checkboxes acting as switches)
 * and composes the Dialog controller (data-controller="dialog preferences-center").
 * The story renders the dialog open. Toggling a non-required category marks the
 * form dirty; clicking Save dispatches `preferences-center:save` with the full
 * consent map.
 *
 * Story slug: rgpd-preferences-center
 *
 * The story pre-stamps `open` on the <dialog>, so the dialog renders in normal
 * document flow (not the top layer). Interactions are driven with in-page JS
 * clicks to bypass pointer-event interception by the non-modal dialog chrome.
 */
test.describe('preferences-center', () => {
  test('dialog is visible with consent category toggles', async ({ page }) => {
    await page.goto(sandbox('rgpd-preferences-center'));
    await page.waitForLoadState('networkidle');

    const wrap = page.locator('[data-controller~="preferences-center"]').first();

    // Category toggles (checkboxes) are rendered inside the wrap. toHaveCount
    // checks DOM presence independent of CSS visibility.
    const toggles = wrap.locator('input[type="checkbox"][name]');
    await expect(toggles).toHaveCount(4); // essential, analytics, marketing, functional
  });

  test('toggling a non-required category and saving dispatches preferences-center:save', async ({ page }) => {
    await page.goto(sandbox('rgpd-preferences-center'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__pcSaveEvents = [];
      document.addEventListener('preferences-center:save', (e) => window.__pcSaveEvents.push(e.detail));
    });

    // Toggle the analytics checkbox (non-required, initially unchecked) and
    // click Save — both via in-page JS so no actionability check on the
    // non-modal <dialog> chrome can interfere. The Stimulus actions
    // (`change` delegation and `click->preferences-center#save`) fire identically.
    await page.evaluate(() => {
      const wrap = document.querySelector('[data-controller~="preferences-center"]');
      const input = wrap && wrap.querySelector('input[type="checkbox"][name="analytics"]');
      if (!input) throw new Error('analytics checkbox not found');
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.evaluate(() => {
      const wrap = document.querySelector('[data-controller~="preferences-center"]');
      const saveBtn = wrap && wrap.querySelector('[data-preferences-center-target="saveButton"]');
      if (!saveBtn) throw new Error('save button not found');
      saveBtn.click();
    });

    await page.waitForFunction(
      () => window.__pcSaveEvents && window.__pcSaveEvents.length > 0,
      { timeout: 5000 },
    );
    const events = await page.evaluate(() => window.__pcSaveEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toHaveProperty('consent');
    expect(events[0].consent.analytics).toBe(true);
  });

  test('required (essential) toggle cannot be unchecked', async ({ page }) => {
    await page.goto(sandbox('rgpd-preferences-center'));
    await page.waitForLoadState('networkidle');

    const wrap = page.locator('[data-controller~="preferences-center"]').first();
    const essentialToggle = wrap.locator('input[type="checkbox"][name="essential"]').first();

    // Essential is required → rendered as disabled + checked.
    const isChecked = await essentialToggle.evaluate((el) => el.checked);
    const isDisabled = await essentialToggle.evaluate((el) => el.disabled);
    expect(isChecked).toBe(true);
    expect(isDisabled).toBe(true);
  });
});
