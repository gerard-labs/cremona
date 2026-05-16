import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — avatar-fallback
 *
 * The controller listens for `error` events on the `[data-avatar-fallback-target="img"]`
 * element. When the image fails to load, it replaces the <img> with a
 * <span class="cremona-avatar__fallback"> containing the computed initials.
 *
 * The story's "broken" section uses `https://example.invalid/missing-avatar.png`
 * which will always fail, triggering the fallback. It renders as:
 *   data-avatar-fallback-name-value="Camille Petit"
 *   data-avatar-fallback-initials-value="CP"
 *
 * Story slug: avatar
 */
test.describe('avatar-fallback', () => {
  test('broken image is replaced by initials fallback span', async ({ page }) => {
    await page.goto(sandbox('avatar'));
    await page.waitForLoadState('networkidle');

    // Target the specific broken avatar (Camille Petit — invalid src URL).
    // The loaded-image avatar also has data-controller="avatar-fallback" but
    // its image succeeds, so it never triggers the fallback. We must target
    // the broken one explicitly.
    const avatar = page
      .locator('[data-controller="avatar-fallback"][data-avatar-fallback-name-value="Camille Petit"]');

    await expect(avatar).toBeVisible();

    // Wait for the fallback span to appear (the img error fires asynchronously).
    const fallback = avatar.locator('.cremona-avatar__fallback');
    await expect(fallback).toBeVisible();

    // The <img> must be gone — replaced by the span.
    const img = avatar.locator('[data-avatar-fallback-target="img"]');
    await expect(img).not.toBeAttached();
  });

  test('fallback span carries the correct initials', async ({ page }) => {
    await page.goto(sandbox('avatar'));
    await page.waitForLoadState('networkidle');

    // Locate the specific broken avatar with name "Camille Petit" → initials "CP".
    const brokenAvatar = page
      .locator('[data-controller="avatar-fallback"][data-avatar-fallback-name-value="Camille Petit"]');

    await expect(brokenAvatar).toBeVisible();

    const fallback = brokenAvatar.locator('.cremona-avatar__fallback');
    await expect(fallback).toBeVisible();
    await expect(fallback).toHaveText('CP');
  });
});
