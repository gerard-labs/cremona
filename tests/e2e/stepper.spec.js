import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — stepper
 *
 * The stepper is declarative: the consumer drives `currentStepValue`. The
 * story's interactive demo wires prev/next buttons that mutate the controller
 * value. We assert the `data-state` + `aria-current` stamps the controller
 * sets on each step element.
 */
test.describe('stepper', () => {
  test('renders with correct initial data-state on each step', async ({ page }) => {
    await page.goto(sandbox('stepper'));
    await page.waitForLoadState('networkidle');

    // The first stepper on the page has currentStep=2, 4 items.
    const stepper = page.locator('[data-controller~="stepper"]').first();

    const steps = stepper.locator('[data-stepper-target="step"]');
    await expect(steps).toHaveCount(4);

    // Step 1 should be completed (idx 1 < currentStep 2).
    await expect(steps.nth(0)).toHaveAttribute('data-state', 'completed');
    // Step 2 should be current.
    await expect(steps.nth(1)).toHaveAttribute('data-state', 'current');
    await expect(steps.nth(1)).toHaveAttribute('aria-current', 'step');
    // Steps 3 and 4 should be upcoming.
    await expect(steps.nth(2)).toHaveAttribute('data-state', 'upcoming');
    await expect(steps.nth(3)).toHaveAttribute('data-state', 'upcoming');
  });

  test('interactive demo: next button advances the active step', async ({ page }) => {
    await page.goto(sandbox('stepper'));
    await page.waitForLoadState('networkidle');

    // The interactive demo stepper starts at step 1.
    const interactiveStepper = page.locator('#stp-interactive');
    const steps = interactiveStepper.locator('[data-stepper-target="step"]');

    // Verify initial state: step 1 is current, step 2 is upcoming.
    await expect(steps.nth(0)).toHaveAttribute('data-state', 'current');
    await expect(steps.nth(0)).toHaveAttribute('aria-current', 'step');
    await expect(steps.nth(1)).toHaveAttribute('data-state', 'upcoming');

    // Click the next button.
    await page.locator('[data-demo-next]').click();

    // Step 1 should now be completed, step 2 should be current.
    await expect(steps.nth(0)).toHaveAttribute('data-state', 'completed');
    await expect(steps.nth(1)).toHaveAttribute('data-state', 'current');
    await expect(steps.nth(1)).toHaveAttribute('aria-current', 'step');
  });

  test('interactive demo: prev button moves back, next and prev together', async ({ page }) => {
    await page.goto(sandbox('stepper'));
    await page.waitForLoadState('networkidle');

    const interactiveStepper = page.locator('#stp-interactive');
    const steps = interactiveStepper.locator('[data-stepper-target="step"]');

    // Advance two steps forward.
    await page.locator('[data-demo-next]').click();
    await page.locator('[data-demo-next]').click();

    // Step 1 and 2 completed, step 3 current.
    await expect(steps.nth(0)).toHaveAttribute('data-state', 'completed');
    await expect(steps.nth(1)).toHaveAttribute('data-state', 'completed');
    await expect(steps.nth(2)).toHaveAttribute('data-state', 'current');
    await expect(steps.nth(2)).toHaveAttribute('aria-current', 'step');

    // Go back one step.
    await page.locator('[data-demo-prev]').click();

    // Step 2 should be current again, step 3 upcoming.
    await expect(steps.nth(1)).toHaveAttribute('data-state', 'current');
    await expect(steps.nth(1)).toHaveAttribute('aria-current', 'step');
    await expect(steps.nth(2)).toHaveAttribute('data-state', 'upcoming');
  });
});
