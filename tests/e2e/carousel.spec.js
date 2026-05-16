import { test, expect } from '@playwright/test';
import { sandbox } from './_support.js';

/**
 * E2E — carousel
 *
 * The controller manages a slide carousel. Key observable behaviours:
 *  - Active slide has data-state="active"; others "inactive" + aria-hidden.
 *  - The next/prev buttons advance the current slide.
 *  - Pagination dots have aria-current="true" on the active dot.
 *  - carousel:slide-change event fires after a real transition.
 *
 * Story slug: carousel
 */
test.describe('carousel', () => {
  test('first slide is active on initial render', async ({ page }) => {
    await page.goto(sandbox('carousel'));
    await page.waitForLoadState('networkidle');

    const carousel = page.locator('[data-controller~="carousel"]').first();
    await expect(carousel).toBeVisible();

    const slides = carousel.locator('[data-carousel-target="slide"]');
    const firstSlide = slides.nth(0);
    const secondSlide = slides.nth(1);

    await expect(firstSlide).toHaveAttribute('data-state', 'active');
    await expect(secondSlide).toHaveAttribute('data-state', 'inactive');
    await expect(secondSlide).toHaveAttribute('aria-hidden', 'true');
  });

  test('clicking next advances to the second slide', async ({ page }) => {
    await page.goto(sandbox('carousel'));
    await page.waitForLoadState('networkidle');

    const carousel = page.locator('[data-controller~="carousel"]').first();

    // Track carousel:slide-change events.
    await page.evaluate(() => {
      window.__carEvents = [];
      document.addEventListener('carousel:slide-change', (e) => {
        window.__carEvents.push(e.detail);
      });
    });

    const nextBtn = carousel.locator('[data-carousel-target="next"]');
    await nextBtn.click();

    const slides = carousel.locator('[data-carousel-target="slide"]');
    await expect(slides.nth(1)).toHaveAttribute('data-state', 'active');
    await expect(slides.nth(0)).toHaveAttribute('data-state', 'inactive');

    const events = await page.evaluate(() => window.__carEvents);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].currentSlide).toBe(1);
    expect(events[0].direction).toBe('next');
  });

  test('active pagination dot has aria-current="true"', async ({ page }) => {
    await page.goto(sandbox('carousel'));
    await page.waitForLoadState('networkidle');

    const carousel = page.locator('[data-controller~="carousel"]').first();
    const dots = carousel.locator('[data-carousel-target="dot"]');

    // First dot is active initially.
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
    await expect(dots.nth(0)).toHaveAttribute('data-state', 'active');

    // Click next; second dot becomes active.
    await carousel.locator('[data-carousel-target="next"]').click();
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
    await expect(dots.nth(0)).not.toHaveAttribute('aria-current');
  });
});
