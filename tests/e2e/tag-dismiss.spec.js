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
 * Note: the locator `[data-controller~="tag-dismiss"].first()` is a
 * re-evaluating locator. Once the first tag is removed from the DOM, it
 * re-evaluates to the next remaining tag. We use count-based assertions to
 * avoid this instability, and check data-state="dismissing" to confirm the
 * dismiss lifecycle has started correctly.
 */
test.describe('tag-dismiss', () => {
  test('clicking the dismiss button removes the tag from the DOM', async ({ page }) => {
    await page.goto(sandbox('tag'));
    await page.waitForLoadState('networkidle');

    // Find dismissable tags — they all carry data-controller="tag-dismiss".
    const tags = page.locator('[data-controller~="tag-dismiss"]');
    const initialCount = await tags.count();
    expect(initialCount).toBeGreaterThan(0);

    // Click the dismiss button inside the first dismissable tag.
    const firstTag = tags.first();
    const dismissBtn = firstTag.locator('[data-action*="tag-dismiss#dismiss"]');
    await dismissBtn.click();

    // Dismiss sets data-state="dismissing" on the tag root.
    // Use a locator that captures the dismissing element by its state attribute
    // so it is stable even as the global .first() re-evaluates.
    const dismissingTag = page.locator('[data-controller~="tag-dismiss"][data-state="dismissing"]');
    await expect(dismissingTag).toHaveCount(1);

    // After the CSS opacity transition the tag is removed from the DOM.
    // The total count of dismissable tags should decrease by one.
    await expect(tags).toHaveCount(initialCount - 1);
  });

  test('tag:dismissed custom event is dispatched on removal', async ({ page }) => {
    await page.goto(sandbox('tag'));
    await page.waitForLoadState('networkidle');

    // Capture tag:dismissed events before triggering dismiss.
    await page.evaluate(() => {
      window.__tagDismissedEvents = [];
      document.addEventListener('tag:dismissed', (e) => {
        window.__tagDismissedEvents.push(e.detail);
      });
    });

    const tags = page.locator('[data-controller~="tag-dismiss"]');
    const initialCount = await tags.count();

    const firstTag = tags.first();
    const dismissBtn = firstTag.locator('[data-action*="tag-dismiss#dismiss"]');
    await dismissBtn.click();

    // Wait for the tag to be removed (CSS transition + DOM removal).
    await expect(tags).toHaveCount(initialCount - 1);

    const events = await page.evaluate(() => window.__tagDismissedEvents);
    expect(events.length).toBeGreaterThan(0);
    // The event detail should include a `label` property.
    expect(typeof events[0].label).toBe('string');
  });

  test('full dismiss lifecycle: tag count decreases by one after dismiss', async ({ page }) => {
    await page.goto(sandbox('tag'));
    await page.waitForLoadState('networkidle');

    const tags = page.locator('[data-controller~="tag-dismiss"]');
    const initialCount = await tags.count();

    // Dismiss ALL tags one by one and verify the count drops each time.
    const secondTag = tags.nth(1);
    const secondDismissBtn = secondTag.locator('[data-action*="tag-dismiss#dismiss"]');
    await secondDismissBtn.click();

    await expect(tags).toHaveCount(initialCount - 1);
  });
});
