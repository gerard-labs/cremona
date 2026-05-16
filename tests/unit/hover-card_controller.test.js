import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

// Hoisted mocks for @floating-ui/dom — popover is a co-mounted controller.
const { mockCleanup, mockComputePosition, mockAutoUpdate } = vi.hoisted(() => {
  const cleanup = vi.fn();
  return {
    mockCleanup: cleanup,
    mockComputePosition: vi.fn(() =>
      Promise.resolve({ x: 100, y: 50, placement: 'top' }),
    ),
    mockAutoUpdate: vi.fn((trigger, content, fn) => {
      fn();
      return cleanup;
    }),
  };
});

vi.mock('@floating-ui/dom', () => ({
  computePosition: mockComputePosition,
  autoUpdate: mockAutoUpdate,
  offset: vi.fn(),
  flip: vi.fn(),
  shift: vi.fn(),
}));

const { default: PopoverController } = await import('../../src/js/controllers/popover_controller.js');
const { default: HoverCardController } = await import('../../src/js/controllers/hover-card_controller.js');


/**
 * Unit tests for the HoverCard compound's `hover-card` controller,
 * co-mounted with `popover`.
 *
 * Per OQ-29 doctrine (sealed S2.3a opening): 400 ms open delay (Tooltip
 * doctrine), 200 ms close delay (anti-flash on fast pointer movement).
 * No new motion tokens — JS-side timeouts.
 *
 * Responsibilities covered (10 tests):
 *   1. enter() — schedules open after openDelay (default 400 ms).
 *   2. leave() — schedules close after closeDelay (default 200 ms).
 *   3. enter() while close timer pending — cancels close.
 *   4. leave() while open timer pending — cancels open.
 *   5. mouseenter on content — cancels close (mouse moved into popover).
 *   6. mouseleave on content — schedules close (mouse left popover).
 *   7. Custom delays via data-hover-card-{open,close}-delay-value.
 *   8. enter() while already pending open — does NOT stack timers.
 *   9. disconnect — clears pending timers (no late-fire after teardown).
 *  10. Esc closes via co-mounted popover (smoke — focus does NOT open).
 */
describe('HoverCardController', () => {
  let app;

  beforeEach(() => {
    vi.useFakeTimers();
    mockCleanup.mockClear();
    mockComputePosition.mockClear();
    mockAutoUpdate.mockClear();
    document.body.innerHTML = '';
    document.documentElement.dir = 'ltr';
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  async function mount({ openDelay = 400, closeDelay = 200 } = {}) {
    document.body.innerHTML = `
      <div id="wrap" class="cremona-popover cremona-hover-card"
        data-controller="popover hover-card"
        data-action="mouseenter->hover-card#enter mouseleave->hover-card#leave keydown.esc@window->popover#close"
        data-popover-placement-value="top"
        data-popover-offset-value="8"
        data-popover-open-value="false"
        data-hover-card-open-delay-value="${openDelay}"
        data-hover-card-close-delay-value="${closeDelay}">
        <a id="trigger" data-popover-target="trigger"
          aria-haspopup="dialog" aria-expanded="false" aria-controls="hc-content"
          href="#">@user</a>
        <div id="hc-content"
          class="cremona-popover__content cremona-hover-card__content"
          data-popover-target="content"
          data-state="closed"
          role="dialog"
          hidden>
          <div class="cremona-hover-card__body">Preview body</div>
        </div>
      </div>
    `;
    app = Application.start();
    app.register('popover', PopoverController);
    app.register('hover-card', HoverCardController);
    // Use vi.advanceTimers for the initial mount tick because we're with fake timers.
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(0);
    return {
      wrap: document.getElementById('wrap'),
      trigger: document.getElementById('trigger'),
      content: document.getElementById('hc-content'),
      hcCtrl: app.controllers.find((c) => c.identifier === 'hover-card'),
      popoverCtrl: app.controllers.find((c) => c.identifier === 'popover'),
    };
  }

  it('enter() — schedules open after openDelay (400 ms default)', async () => {
    const { hcCtrl, popoverCtrl } = await mount();
    expect(popoverCtrl.openValue).toBe(false);
    hcCtrl.enter();
    expect(popoverCtrl.openValue).toBe(false); // not yet
    await vi.advanceTimersByTimeAsync(399);
    expect(popoverCtrl.openValue).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(popoverCtrl.openValue).toBe(true);
  });

  it('leave() — schedules close after closeDelay (200 ms default)', async () => {
    const { hcCtrl, popoverCtrl } = await mount();
    hcCtrl.enter();
    await vi.advanceTimersByTimeAsync(401);
    expect(popoverCtrl.openValue).toBe(true);
    hcCtrl.leave();
    expect(popoverCtrl.openValue).toBe(true); // not yet
    await vi.advanceTimersByTimeAsync(199);
    expect(popoverCtrl.openValue).toBe(true);
    await vi.advanceTimersByTimeAsync(2);
    expect(popoverCtrl.openValue).toBe(false);
  });

  it('enter() while close timer pending — cancels close', async () => {
    const { hcCtrl, popoverCtrl } = await mount();
    hcCtrl.enter();
    await vi.advanceTimersByTimeAsync(401);
    expect(popoverCtrl.openValue).toBe(true);
    hcCtrl.leave();
    await vi.advanceTimersByTimeAsync(100); // halfway through close delay
    hcCtrl.enter(); // cancels close
    await vi.advanceTimersByTimeAsync(500); // way past both delays
    expect(popoverCtrl.openValue).toBe(true); // still open — close was cancelled
  });

  it('leave() while open timer pending — cancels open', async () => {
    const { hcCtrl, popoverCtrl } = await mount();
    hcCtrl.enter();
    await vi.advanceTimersByTimeAsync(200); // halfway through open delay
    hcCtrl.leave(); // cancels open
    await vi.advanceTimersByTimeAsync(500); // way past
    expect(popoverCtrl.openValue).toBe(false); // never opened
  });

  it('mouseenter on content — cancels pending close', async () => {
    const { content, hcCtrl, popoverCtrl } = await mount();
    hcCtrl.enter();
    await vi.advanceTimersByTimeAsync(401);
    expect(popoverCtrl.openValue).toBe(true);
    hcCtrl.leave(); // start close timer
    await vi.advanceTimersByTimeAsync(100);
    content.dispatchEvent(new Event('mouseenter'));
    await vi.advanceTimersByTimeAsync(500);
    expect(popoverCtrl.openValue).toBe(true); // close was cancelled
  });

  it('mouseleave on content — schedules close', async () => {
    const { content, hcCtrl, popoverCtrl } = await mount();
    hcCtrl.enter();
    await vi.advanceTimersByTimeAsync(401);
    expect(popoverCtrl.openValue).toBe(true);
    content.dispatchEvent(new Event('mouseleave'));
    await vi.advanceTimersByTimeAsync(201);
    expect(popoverCtrl.openValue).toBe(false);
  });

  it('custom delays via data values', async () => {
    const { hcCtrl, popoverCtrl } = await mount({ openDelay: 100, closeDelay: 50 });
    expect(hcCtrl.openDelayValue).toBe(100);
    expect(hcCtrl.closeDelayValue).toBe(50);
    hcCtrl.enter();
    await vi.advanceTimersByTimeAsync(101);
    expect(popoverCtrl.openValue).toBe(true);
    hcCtrl.leave();
    await vi.advanceTimersByTimeAsync(51);
    expect(popoverCtrl.openValue).toBe(false);
  });

  it('enter() while open timer already pending — does NOT stack timers', async () => {
    const { hcCtrl, popoverCtrl } = await mount();
    hcCtrl.enter();
    const firstTimer = hcCtrl._openTimer;
    expect(firstTimer).not.toBeNull();
    hcCtrl.enter(); // second call
    expect(hcCtrl._openTimer).toBe(firstTimer); // same timer, no stacking
    await vi.advanceTimersByTimeAsync(401);
    expect(popoverCtrl.openValue).toBe(true);
  });

  it('disconnect — clears pending timers', async () => {
    const { hcCtrl, popoverCtrl } = await mount();
    hcCtrl.enter();
    expect(hcCtrl._openTimer).not.toBeNull();
    // Call disconnect directly — fake timers + MutationObserver-driven
    // Stimulus disconnect don't interleave reliably under vi.useFakeTimers.
    // The behavior we care about is: disconnect() clears pending timers.
    hcCtrl.disconnect();
    expect(hcCtrl._openTimer).toBeNull();
    await vi.advanceTimersByTimeAsync(500);
    // Even after waiting, popover should NOT have opened (timer was cleared).
    expect(popoverCtrl.openValue).toBe(false);
  });

  it('focus on trigger does NOT open (HoverCard ≠ Tooltip per OQ-29)', async () => {
    const { trigger, popoverCtrl } = await mount();
    trigger.focus();
    await vi.advanceTimersByTimeAsync(500);
    // No mouseenter → no open. The focus-based open is intentionally absent.
    expect(popoverCtrl.openValue).toBe(false);
  });
});
