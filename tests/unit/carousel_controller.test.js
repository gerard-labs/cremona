import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import CarouselController from '../../src/js/controllers/carousel_controller.js';

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the Carousel compound's `carousel` controller (S2.8).
 *
 * Per OQ-43 (sealed S2.8 opening) :
 *  - Autoplay OFF by default ; opt-in via autoplayInterval > 0.
 *  - Pause-on-pointerenter + focusin.
 *  - Skip autoplay under prefers-reduced-motion.
 *  - Loop direction : back-to-first after last (cyclic).
 *
 * Per OQ-mini-43a : loop (not rebound).
 *
 * Coverage map (16 tests) :
 *
 *  Initial render
 *   1. connect with currentSlide=0 → first slide active, others inactive.
 *   2. connect → aria-hidden + tabindex stamped per slide.
 *   3. connect → dot pagination stamps aria-current="true" on active dot.
 *
 *  Nav actions
 *   4. next() → currentSlide increments + dispatch fires + DOM re-synced.
 *   5. prev() → currentSlide decrements.
 *   6. next() on last + loop=true → wraps to 0 (cyclic).
 *   7. next() on last + loop=false → no-op.
 *   8. prev() on first + loop=false → no-op.
 *   9. goTo() via dot click → jumps to indexed slide.
 *  10. Buttons disabled at edges when loop=false.
 *
 *  Keyboard nav
 *  11. ArrowRight → next (LTR).
 *  12. Home / End → first / last slide.
 *
 *  Autoplay (with vi.useFakeTimers AFTER mount per S2.5 bug-fix)
 *  13. autoplayInterval=1000 → ticks advance currentSlide automatically.
 *  14. autoplay paused on pointerenter, resumed on pointerleave.
 *
 *  Dispatch detail
 *  15. carousel:slide-change detail carries { currentSlide, previousSlide, totalSlides, direction }.
 *
 *  Reduced motion
 *  16. prefers-reduced-motion=true → autoplay never starts even with interval > 0.
 */
describe('CarouselController', () => {
  let app;
  let _originalMatchMedia;

  beforeEach(() => {
    _originalMatchMedia = window.matchMedia;
    // Default mock : reduced-motion FALSE (autoplay allowed).
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '',
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
    window.matchMedia = _originalMatchMedia;
    vi.useRealTimers();
  });

  async function mount({
    currentSlide = 0,
    autoplayInterval = 0,
    loop = true,
    slideCount = 4,
    withDots = true,
    withNav = true,
    withAutoplayToggle = false,
  } = {}) {
    const slides = Array.from({ length: slideCount }, (_, i) => `<article id="slide-${i}" class="cremona-carousel__slide"
      data-carousel-target="slide"
      role="group"
      aria-roledescription="slide"
      aria-label="${i + 1} sur ${slideCount}">Slide ${i + 1}</article>`).join('');
    const dots = withDots
      ? Array.from({ length: slideCount }, (_, i) => `<button id="dot-${i}" type="button"
        class="cremona-carousel__dot"
        data-carousel-target="dot"
        data-slide-index="${i}"
        data-action="click->carousel#goTo"
        aria-label="Slide ${i + 1}">·</button>`).join('')
      : '';
    const navHtml = withNav ? `
      <button id="prev" type="button" data-carousel-target="prev"
        data-action="click->carousel#prev" aria-label="Précédent">←</button>
      <button id="next" type="button" data-carousel-target="next"
        data-action="click->carousel#next" aria-label="Suivant">→</button>
    ` : '';
    const autoplayHtml = withAutoplayToggle ? `<button id="autoplay-toggle" type="button"
      data-carousel-target="autoplayToggle"
      data-action="click->carousel#toggleAutoplay"
      aria-label="Pause / Play" aria-pressed="false">⏸</button>` : '';
    document.body.innerHTML = `
      <div id="car" class="cremona-carousel"
        data-controller="carousel"
        data-carousel-current-slide-value="${currentSlide}"
        data-carousel-autoplay-interval-value="${autoplayInterval}"
        data-carousel-loop-value="${loop}"
        role="region" aria-roledescription="carousel" aria-label="Demo">
        <div class="cremona-carousel__viewport" data-carousel-target="viewport">
          <div class="cremona-carousel__track" data-carousel-target="track">${slides}</div>
        </div>
        ${navHtml}
        <div class="cremona-carousel__pagination">${dots}</div>
        ${autoplayHtml}
      </div>
    `;
    app = Application.start();
    app.register('carousel', CarouselController);
    await tick();
    await tick();
    return {
      wrap: document.getElementById('car'),
      ctrl: app.controllers.find((c) => c.identifier === 'carousel'),
      slide: (i) => document.getElementById(`slide-${i}`),
      dot: (i) => document.getElementById(`dot-${i}`),
      prev: document.getElementById('prev'),
      next: document.getElementById('next'),
      autoplayToggle: document.getElementById('autoplay-toggle'),
      viewport: document.querySelector('[data-carousel-target="viewport"]'),
    };
  }

  // 1
  it('connect with currentSlide=0 → first slide active, others inactive', async () => {
    const { slide } = await mount({ currentSlide: 0 });
    expect(slide(0).dataset.state).toBe('active');
    expect(slide(1).dataset.state).toBe('inactive');
    expect(slide(2).dataset.state).toBe('inactive');
    expect(slide(3).dataset.state).toBe('inactive');
  });

  // 2
  it('connect → aria-hidden + tabindex stamped per slide', async () => {
    const { slide } = await mount({ currentSlide: 0 });
    expect(slide(0).getAttribute('aria-hidden')).toBeNull();
    expect(slide(0).getAttribute('tabindex')).toBe('0');
    expect(slide(1).getAttribute('aria-hidden')).toBe('true');
    expect(slide(1).getAttribute('tabindex')).toBe('-1');
  });

  // 3
  it('connect → dot pagination stamps aria-current="true" on active dot', async () => {
    const { dot } = await mount({ currentSlide: 1 });
    expect(dot(0).getAttribute('aria-current')).toBeNull();
    expect(dot(1).getAttribute('aria-current')).toBe('true');
  });

  // 4
  it('next() → currentSlide increments + dispatch fires + DOM re-synced', async () => {
    const { wrap, ctrl, slide } = await mount({ currentSlide: 0 });
    const events = [];
    wrap.addEventListener('carousel:slide-change', (e) => events.push(e.detail));
    ctrl.next();
    await tick();
    expect(ctrl.currentSlideValue).toBe(1);
    expect(slide(0).dataset.state).toBe('inactive');
    expect(slide(1).dataset.state).toBe('active');
    expect(events).toHaveLength(1);
    expect(events[0].direction).toBe('next');
  });

  // 5
  it('prev() → currentSlide decrements', async () => {
    const { ctrl } = await mount({ currentSlide: 2 });
    ctrl.prev();
    await tick();
    expect(ctrl.currentSlideValue).toBe(1);
  });

  // 6
  it('next() on last + loop=true → wraps to 0 (cyclic)', async () => {
    const { ctrl } = await mount({ currentSlide: 3, slideCount: 4, loop: true });
    ctrl.next();
    await tick();
    expect(ctrl.currentSlideValue).toBe(0);
  });

  // 7
  it('next() on last + loop=false → no-op', async () => {
    const { wrap, ctrl } = await mount({ currentSlide: 3, slideCount: 4, loop: false });
    const events = [];
    wrap.addEventListener('carousel:slide-change', (e) => events.push(e.detail));
    ctrl.next();
    await tick();
    expect(ctrl.currentSlideValue).toBe(3);
    expect(events).toHaveLength(0);
  });

  // 8
  it('prev() on first + loop=false → no-op', async () => {
    const { wrap, ctrl } = await mount({ currentSlide: 0, slideCount: 4, loop: false });
    const events = [];
    wrap.addEventListener('carousel:slide-change', (e) => events.push(e.detail));
    ctrl.prev();
    await tick();
    expect(ctrl.currentSlideValue).toBe(0);
    expect(events).toHaveLength(0);
  });

  // 9
  it('goTo() via dot click → jumps to indexed slide', async () => {
    const { ctrl, dot } = await mount({ currentSlide: 0 });
    dot(2).click();
    await tick();
    expect(ctrl.currentSlideValue).toBe(2);
  });

  // 10
  it('Buttons disabled at edges when loop=false', async () => {
    const { ctrl, prev, next } = await mount({ currentSlide: 0, loop: false, slideCount: 4 });
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(false);
    ctrl.currentSlideValue = 3;
    await tick();
    expect(prev.disabled).toBe(false);
    expect(next.disabled).toBe(true);
  });

  // 11
  it('ArrowRight → next (LTR)', async () => {
    const { wrap, ctrl } = await mount({ currentSlide: 1 });
    wrap.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    await tick();
    expect(ctrl.currentSlideValue).toBe(2);
  });

  // 12
  it('Home / End → first / last slide', async () => {
    const { wrap, ctrl } = await mount({ currentSlide: 1, slideCount: 5 });
    wrap.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }));
    await tick();
    expect(ctrl.currentSlideValue).toBe(4);
    wrap.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }));
    await tick();
    expect(ctrl.currentSlideValue).toBe(0);
  });

  // 13 — autoplay
  it('autoplayInterval=1000 → ticks advance currentSlide automatically', async () => {
    // Mount with autoplay DISABLED (interval=0). Then install fake timers.
    // Then call _startAutoplay() directly after mutating the value : Stimulus's
    // value-setter uses MutationObserver microtask which doesn't drain
    // reliably under fake timers in happy-dom. The class-internal restart
    // path is what the autoplayIntervalValueChanged callback would invoke ;
    // calling it directly here sidesteps the MutationObserver scheduling
    // (cohérent S2.5 fake-timer test pattern : test the timer behavior,
    // not Stimulus's MutationObserver itself).
    const { ctrl } = await mount({ currentSlide: 0, autoplayInterval: 0, slideCount: 4 });
    vi.useFakeTimers();
    ctrl.autoplayIntervalValue = 1000;
    ctrl._startAutoplay();
    vi.advanceTimersByTime(1000);
    expect(ctrl.currentSlideValue).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(ctrl.currentSlideValue).toBe(2);
  });

  // 14
  it('autoplay paused on pointerenter, resumed on pointerleave', async () => {
    const { wrap, ctrl } = await mount({ currentSlide: 0, autoplayInterval: 0 });
    vi.useFakeTimers();
    ctrl.autoplayIntervalValue = 1000;
    ctrl._startAutoplay();
    // pointerenter → pause flag set.
    wrap.dispatchEvent(new Event('pointerenter', { bubbles: true }));
    vi.advanceTimersByTime(1000);
    expect(ctrl.currentSlideValue).toBe(0); // didn't advance — paused.
    // pointerleave → resumed.
    wrap.dispatchEvent(new Event('pointerleave', { bubbles: true }));
    vi.advanceTimersByTime(1000);
    expect(ctrl.currentSlideValue).toBe(1);
  });

  // 15
  it('carousel:slide-change detail carries { currentSlide, previousSlide, totalSlides, direction }', async () => {
    const { wrap, ctrl } = await mount({ currentSlide: 0, slideCount: 4 });
    const events = [];
    wrap.addEventListener('carousel:slide-change', (e) => events.push(e.detail));
    ctrl.next();
    await tick();
    expect(events[0]).toEqual({
      currentSlide: 1,
      previousSlide: 0,
      totalSlides: 4,
      direction: 'next',
    });
  });

  // 16
  it('prefers-reduced-motion=true → autoplay never starts even with interval > 0', async () => {
    // Re-mock matchMedia to return reduce.
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });
    const { ctrl } = await mount({ currentSlide: 0, autoplayInterval: 0, slideCount: 4 });
    vi.useFakeTimers();
    ctrl.autoplayIntervalValue = 1000;
    ctrl._startAutoplay(); // would normally start, but reduced-motion guard skips.
    vi.advanceTimersByTime(3000);
    expect(ctrl.currentSlideValue).toBe(0); // never advanced — autoplay skipped.
  });
});
