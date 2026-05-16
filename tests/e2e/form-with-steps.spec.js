import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — form-with-steps
 *
 * The story renders multiple stepper instances. The first section
 * ("story-step-1") starts at step 1 of 3:
 *   - Step 1 fieldset is visible (no `hidden` attribute).
 *   - Steps 2 and 3 are hidden.
 *   - "Previous" button is hidden (we're on step 1).
 *   - "Next" button is visible.
 *   - "Submit" button is hidden (not on last step).
 *
 * Clicking "Next" advances to step 2:
 *   - Step 1 becomes hidden, step 2 becomes visible.
 *   - "Previous" button appears, "Next" still visible.
 *   - "Submit" button is still hidden.
 *
 * The controller sets/removes the `hidden` attribute on step fieldsets and
 * CTA buttons as it advances.
 */
test.describe('form-with-steps', () => {
  test('step 1 is visible and step 2 is hidden on initial render', async ({ page }) => {
    await page.goto(sandbox('form-with-steps'));
    await page.waitForLoadState('networkidle');

    // First form-with-steps instance — id="story-step-1", currentStep=1.
    const form = page.locator('[data-controller~="form-with-steps"]').first();

    const step1 = form.locator('[data-form-with-steps-target="step"][data-step-index="1"]');
    const step2 = form.locator('[data-form-with-steps-target="step"][data-step-index="2"]');

    await expect(step1).not.toHaveAttribute('hidden', /.*/);
    await expect(step2).toHaveAttribute('hidden', /.*/);
  });

  test('clicking Next advances from step 1 to step 2', async ({ page }) => {
    await page.goto(sandbox('form-with-steps'));
    await page.waitForLoadState('networkidle');

    const form = page.locator('[data-controller~="form-with-steps"]').first();
    const step1 = form.locator('[data-form-with-steps-target="step"][data-step-index="1"]');
    const step2 = form.locator('[data-form-with-steps-target="step"][data-step-index="2"]');
    const nextBtn = form.locator('[data-form-with-steps-target="nextBtn"]');
    const prevBtn = form.locator('[data-form-with-steps-target="prevBtn"]');

    // Initially Previous is hidden, Next is visible.
    await expect(prevBtn).toHaveAttribute('hidden', /.*/);
    await expect(nextBtn).not.toHaveAttribute('hidden', /.*/);

    // Click Next.
    await nextBtn.click();

    // Step 2 is now active; step 1 is hidden.
    await expect(step2).not.toHaveAttribute('hidden', /.*/);
    await expect(step1).toHaveAttribute('hidden', /.*/);

    // Previous becomes visible after advancing.
    await expect(prevBtn).not.toHaveAttribute('hidden', /.*/);
  });

  test('Submit button is visible only on the last step', async ({ page }) => {
    await page.goto(sandbox('form-with-steps'));
    await page.waitForLoadState('networkidle');

    // The third section in the story renders at currentStep=3 (last step).
    // id="story-step-3" — locate by its unique step context.
    const lastStepForm = page.locator('[data-controller~="form-with-steps"]').nth(2);
    const submitBtn = lastStepForm.locator('[data-form-with-steps-target="submitBtn"]');
    const nextBtn = lastStepForm.locator('[data-form-with-steps-target="nextBtn"]');

    // On the last step: Submit visible, Next hidden.
    await expect(submitBtn).not.toHaveAttribute('hidden', /.*/);
    await expect(nextBtn).toHaveAttribute('hidden', /.*/);
  });
});
