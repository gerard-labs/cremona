import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — toggle-group
 *
 * The toggle-group controller orchestrates N child Toggle buttons with:
 *  - Roving tabindex (one Toggle is tabindex=0 at a time).
 *  - Single-mode mutex: pressing one Toggle forces all others to aria-pressed="false".
 *  - Multi-mode: no mutex — each Toggle flips independently.
 *  - Arrow-key navigation (Left/Right for horizontal, Up/Down for vertical).
 *
 * Story slug: `toggle-group` (src/templates/components/toggle-group/).
 * Stimulus boots via onMounted(boot).
 */
test.describe('toggle-group', () => {
  test('single-mode: pressing one toggle unpresses the previously-pressed one', async ({ page }) => {
    await page.goto(sandbox('toggle-group'));
    await page.waitForLoadState('networkidle');

    // First group is the "view switcher" in single mode — first item is pressed.
    const group = page.locator('[data-controller~="toggle-group"]').first();
    const toggles = group.locator('.cremona-toggle');

    // Confirm initial state: first toggle is pressed.
    await expect(toggles.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(toggles.nth(1)).toHaveAttribute('aria-pressed', 'false');

    // Click the second toggle.
    await toggles.nth(1).click();

    // Single-mode mutex: second is now pressed, first is unpressed.
    await expect(toggles.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(toggles.nth(0)).toHaveAttribute('aria-pressed', 'false');
  });

  test('multi-mode: pressing one toggle does not affect others', async ({ page }) => {
    await page.goto(sandbox('toggle-group'));
    await page.waitForLoadState('networkidle');

    // Find the multi-mode group — data-toggle-group-mode-value="multi".
    const multiGroup = page.locator('[data-toggle-group-mode-value="multi"]').first();
    const toggles = multiGroup.locator('.cremona-toggle');

    // In the story, bold and italic start pressed, underline is unpressed.
    const bold      = toggles.nth(0);
    const italic    = toggles.nth(1);
    const underline = toggles.nth(2);

    await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await expect(italic).toHaveAttribute('aria-pressed', 'true');
    await expect(underline).toHaveAttribute('aria-pressed', 'false');

    // Press underline — multi-mode should not affect bold or italic.
    await underline.click();

    await expect(underline).toHaveAttribute('aria-pressed', 'true');
    await expect(bold).toHaveAttribute('aria-pressed', 'true');
    await expect(italic).toHaveAttribute('aria-pressed', 'true');
  });

  test('ArrowRight moves roving focus to the next toggle in horizontal group', async ({ page }) => {
    await page.goto(sandbox('toggle-group'));
    await page.waitForLoadState('networkidle');

    // Use the density group (first single-mode, text labels, horizontal).
    // The density group is the second group in the first section.
    const group = page.locator('[data-controller~="toggle-group"][data-toggle-group-orientation-value="horizontal"]').first();
    const toggles = group.locator('.cremona-toggle');

    // Focus the tab-order entry point (the pressed toggle gets tabindex=0).
    await toggles.first().focus();

    // ArrowRight moves focus to the next toggle.
    await page.keyboard.press('ArrowRight');
    await expect(toggles.nth(1)).toBeFocused();
  });
});
