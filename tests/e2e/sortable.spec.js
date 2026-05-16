import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — sortable
 *
 * The sortable controller has no standalone catalog story. It is composed
 * into the data-table story via `controllerExtras: ['sortable']`, which
 * renders data-controller="data-table sortable" on the wrapper element.
 * In this compound context the data-table rows do NOT carry
 * data-sortable-target="item", so itemTargets is empty — the story functions
 * as a structural smoke test only.
 *
 * A full keyboard-reorder test would require a standalone story with
 * data-sortable-target="list" + data-sortable-target="item" elements.
 *
 * What we assert:
 *  - The compound element with data-controller="data-table sortable" exists.
 *  - On connect(), the sortable controller stamps data-sortable-state on it
 *    ("idle" or "ready" depending on whether Sortable.js async chunk resolved).
 *  - The sortable:mount custom event fires on connect (captured via addInitScript).
 */
test.describe('sortable', () => {
  test('compound element with sortable controller is present in the story', async ({ page }) => {
    await page.goto(sandbox('data-table'));
    await page.waitForLoadState('networkidle');

    const sortableEl = page.locator('[data-controller~="sortable"]').first();
    await expect(sortableEl).toBeVisible();
  });

  test('controller sets data-sortable-state on connect', async ({ page }) => {
    await page.goto(sandbox('data-table'));
    await page.waitForLoadState('networkidle');

    const sortableEl = page.locator('[data-controller~="sortable"]').first();
    await expect(sortableEl).toBeVisible();

    // connect() always stamps data-sortable-state — "idle" before/while
    // Sortable.js loads, or "ready" once it initialises.
    const state = await sortableEl.getAttribute('data-sortable-state');
    expect(['idle', 'ready']).toContain(state);
  });

  test('sortable:mount event fires on connect', async ({ page }) => {
    // Install the listener before the page JS runs so no event is missed.
    await page.addInitScript(() => {
      window.__sortableMountEvents = [];
      document.addEventListener('sortable:mount', (e) => {
        window.__sortableMountEvents.push(e.detail);
      });
    });

    await page.goto(sandbox('data-table'));
    await page.waitForLoadState('networkidle');

    const events = await page.evaluate(() => window.__sortableMountEvents);
    // sortable:mount fires on connect() with { group, itemCount }.
    expect(events.length).toBeGreaterThan(0);
    expect(typeof events[0].itemCount).toBe('number');
  });
});
