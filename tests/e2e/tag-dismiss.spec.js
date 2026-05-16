import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — tag-dismiss
 *
 * The tag-dismiss controller is exercised in the `tag` story. Dismissable
 * tags carry data-controller="tag-dismiss" and a dismiss button with
 * data-action="click->tag-dismiss#dismiss". Clicking the button stamps
 * data-state="dismissing" on the tag root, waits for the CSS opacity
 * transition to end, then removes the element from the DOM and dispatches
 * `tag:dismissed`.
 *
 * Every test waits for the first tag to render before counting — on a slow
 * runner the Histoire story can mount after `networkidle` resolves, so
 * reading the count too early would see zero tags.
 */
test.describe('tag-dismiss', () => {
  test('clicking the dismiss button removes the tag from the DOM', async ({ page }) => {
    await page.goto(sandbox('tag'));
    await page.waitForLoadState('networkidle');

    // Dismissable tags all carry data-controller="tag-dismiss".
    const tags = page.locator('[data-controller~="tag-dismiss"]');
    await expect(tags.first()).toBeVisible();
    const initialCount = await tags.count();
    expect(initialCount).toBeGreaterThan(0);

    // Click the dismiss button inside the first dismissable tag.
    const dismissBtn = tags.first().locator('[data-action*="tag-dismiss#dismiss"]');
    await dismissBtn.click();

    // Dismiss stamps data-state="dismissing" on the tag root — capture it by
    // that state attribute so the locator stays stable as .first() shifts.
    const dismissingTag = page.locator('[data-controller~="tag-dismiss"][data-state="dismissing"]');
    await expect(dismissingTag).toHaveCount(1);

    // After the CSS opacity transition the tag is removed from the DOM.
    await expect(tags).toHaveCount(initialCount - 1, { timeout: 10000 });
  });

  test('tag:dismissed custom event is dispatched on removal', async ({ page }) => {
    await page.goto(sandbox('tag'));
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      window.__tagDismissedEvents = [];
      document.addEventListener('tag:dismissed', (e) => {
        window.__tagDismissedEvents.push(e.detail);
      });
    });

    const tags = page.locator('[data-controller~="tag-dismiss"]');
    await expect(tags.first()).toBeVisible();
    const initialCount = await tags.count();

    const dismissBtn = tags.first().locator('[data-action*="tag-dismiss#dismiss"]');
    await dismissBtn.click();

    // Wait for the tag to be removed (CSS transition + DOM removal).
    await expect(tags).toHaveCount(initialCount - 1, { timeout: 10000 });

    await page.waitForFunction(
      () => window.__tagDismissedEvents && window.__tagDismissedEvents.length > 0,
      { timeout: 5000 },
    );
    const events = await page.evaluate(() => window.__tagDismissedEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(typeof events[0].label).toBe('string');
  });

  test('full dismiss lifecycle: tag count decreases by one after dismiss', async ({ page }) => {
    await page.goto(sandbox('tag'));
    await page.waitForLoadState('networkidle');

    const tags = page.locator('[data-controller~="tag-dismiss"]');
    // Wait for the story to render at least two dismissable tags.
    await expect(tags.nth(1)).toBeVisible();
    const initialCount = await tags.count();
    expect(initialCount).toBeGreaterThan(1);

    const dismissBtn = tags.nth(1).locator('[data-action*="tag-dismiss#dismiss"]');
    await dismissBtn.click();

    await expect(tags).toHaveCount(initialCount - 1, { timeout: 10000 });
  });
});
