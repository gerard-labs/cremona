import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

// Hoisted mocks so `vi.mock`'s factory (also hoisted) can see them at the
// time the controller module is evaluated. Without `vi.hoisted`, the closure
// references would be undefined when the factory runs, and the controller
// would import the real Floating UI — which in happy-dom 15 throws on
// `autoUpdate` due to missing ResizeObserver.
const { mockCleanup, mockComputePosition, mockAutoUpdate } = vi.hoisted(() => {
  const cleanup = vi.fn();
  return {
    mockCleanup: cleanup,
    mockComputePosition: vi.fn(() =>
      Promise.resolve({ x: 100, y: 50, placement: 'bottom' }),
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
  offset: vi.fn((n) => ({ name: 'offset', options: { mainAxis: n } })),
  flip: vi.fn(() => ({ name: 'flip' })),
  shift: vi.fn(() => ({ name: 'shift' })),
}));

const { default: PopoverController } = await import('../../src/js/controllers/popover_controller.js');

/**
 * Flush microtasks. Stimulus's value-changed callbacks are observed via a
 * MutationObserver (microtask-scheduled), so DOM mutations triggered by
 * `this.openValue = ...` only land after a `await tick()`. ctrl.openValue
 * itself is sync (reads the data attribute) — only assertions against the
 * controller's DOM side effects (content.hidden, dataset.state, ARIA, event
 * dispatch) need to wait.
 */
const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the Popover compound's `popover` controller.
 *
 * Responsibilities covered:
 *   1. toggle() — closed → open flips state + ARIA + content.hidden.
 *   2. toggle() — open → closes (close transition lifecycle).
 *   3. toggle(event) — click whose target is inside the content does NOT
 *      auto-close.
 *   4. open() / close() — explicit methods.
 *   5. close() — no-op when already closed (no popover:close dispatched).
 *   6. Dispatches popover:open (bubbles, composed) with detail.placement.
 *   7. Dispatches popover:close (bubbles, composed).
 *   8. Click-outside the wrap → close() called.
 *   9. Click inside the wrap → close() NOT called.
 *  10. transitionend (opacity) sets content.hidden=true after close.
 *  11. transitionend (background-color) does NOT set content.hidden.
 *  12. Floating UI computePosition called with the resolved placement
 *      ('start' / 'end' mapped to 'left' / 'right' per document.dir).
 *  13. disconnect() — autoUpdate cleanup + doc click listener removed.
 *  14. SSR-open (data-popover-open-value="true") — opens on connect.
 *
 * Per S1.4b descriptor-binding gotcha: tests call controller methods
 * directly via app.controllers lookup rather than synthesising clicks
 * through Stimulus's action descriptors.
 */
describe('PopoverController', () => {
  let app;

  beforeEach(() => {
    mockCleanup.mockClear();
    mockComputePosition.mockClear();
    mockAutoUpdate.mockClear();
    document.body.innerHTML = '';
    document.documentElement.dir = 'ltr';
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
  });

  async function mount({
    placement = 'bottom',
    offset = 8,
    open = false,
  } = {}) {
    document.body.innerHTML = `
      <div id="wrap" class="cremona-popover"
        data-controller="popover"
        data-action="click->popover#toggle keydown.esc@window->popover#close"
        data-popover-placement-value="${placement}"
        data-popover-offset-value="${offset}"
        data-popover-open-value="${open ? 'true' : 'false'}">
        <button id="trigger" type="button" class="cremona-button"
          data-popover-target="trigger"
          aria-haspopup="dialog" aria-expanded="${open ? 'true' : 'false'}" aria-controls="pp-content">
          Open
        </button>
        <div id="pp-content" class="cremona-popover__content"
          data-popover-target="content"
          data-state="${open ? 'open' : 'closed'}"
          data-placement="${placement}"
          ${open ? '' : 'hidden'}>
          <p>Popover body</p>
          <button id="inner-btn" type="button">Inner action</button>
        </div>
      </div>
      <button id="outside" type="button">Outside</button>
    `;
    app = Application.start();
    app.register('popover', PopoverController);
    // Two awaits: the first lets Stimulus attach; the second lets the initial
    // openValueChanged callback flush its microtask (so any SSR-open
    // show() has finished by the time tests start asserting).
    await tick();
    await tick();
    return {
      wrap: document.getElementById('wrap'),
      trigger: document.getElementById('trigger'),
      content: document.getElementById('pp-content'),
      innerBtn: document.getElementById('inner-btn'),
      outside: document.getElementById('outside'),
      ctrl: app.controllers.find((c) => c.identifier === 'popover'),
    };
  }

  it('toggle() — closed → open flips state, aria-expanded, content.hidden', async () => {
    const { trigger, content, ctrl } = await mount();
    expect(content.hidden).toBe(true);
    expect(content.dataset.state).toBe('closed');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    ctrl.toggle();
    await tick();
    expect(content.hidden).toBe(false);
    expect(content.dataset.state).toBe('open');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('toggle() — open → closed flips state back', async () => {
    const { content, trigger, ctrl } = await mount({ open: true });
    expect(content.dataset.state).toBe('open');
    ctrl.toggle();
    await tick();
    expect(content.dataset.state).toBe('closed');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('toggle(event) — click target inside content does NOT toggle', async () => {
    const { content, ctrl, innerBtn } = await mount({ open: true });
    expect(content.dataset.state).toBe('open');
    ctrl.toggle({ target: innerBtn });
    await tick();
    // Still open — the click on inner button shouldn't close the popover.
    expect(content.dataset.state).toBe('open');
  });

  it('open() / close() — explicit methods drive openValue', async () => {
    const { ctrl, content, trigger } = await mount();
    ctrl.open();
    await tick();
    expect(content.dataset.state).toBe('open');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    ctrl.close();
    await tick();
    expect(content.dataset.state).toBe('closed');
  });

  it('close() — no-op when already closed (no popover:close dispatched)', async () => {
    const { wrap, ctrl } = await mount();
    let captured = false;
    wrap.addEventListener('popover:close', () => { captured = true; });
    ctrl.close();
    await tick();
    expect(captured).toBe(false);
  });

  it('dispatches popover:open (bubbles, composed) with detail.placement', async () => {
    const { wrap, ctrl } = await mount({ placement: 'top' });
    let captured = null;
    wrap.addEventListener('popover:open', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, composed: e.composed, detail: e.detail };
    });
    ctrl.open();
    await tick();
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('popover:open');
    expect(captured.bubbles).toBe(true);
    expect(captured.composed).toBe(true);
    expect(captured.detail.placement).toBe('top');
  });

  it('dispatches popover:close (bubbles, composed) on close from open', async () => {
    const { wrap, ctrl } = await mount({ open: true });
    let captured = null;
    wrap.addEventListener('popover:close', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, composed: e.composed };
    });
    ctrl.close();
    await tick();
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('popover:close');
    expect(captured.bubbles).toBe(true);
    expect(captured.composed).toBe(true);
  });

  it('_onDocClick — click outside the wrap closes the popover', async () => {
    const { ctrl, outside } = await mount();
    ctrl.open();
    await tick();
    expect(ctrl.openValue).toBe(true);
    ctrl._onDocClick({ target: outside });
    await tick();
    expect(ctrl.openValue).toBe(false);
  });

  it('_onDocClick — click inside the wrap does NOT close', async () => {
    const { ctrl, innerBtn } = await mount();
    ctrl.open();
    await tick();
    ctrl._onDocClick({ target: innerBtn });
    await tick();
    expect(ctrl.openValue).toBe(true);
  });

  it('transitionend (opacity) — sets content.hidden=true after close', async () => {
    const { ctrl, content } = await mount({ open: true });
    ctrl.close();
    await tick();
    // Not hidden yet — waiting for transitionend.
    expect(content.hidden).toBe(false);
    const evt = new Event('transitionend', { bubbles: true });
    Object.defineProperty(evt, 'propertyName', { value: 'opacity', enumerable: true });
    content.dispatchEvent(evt);
    await tick();
    expect(content.hidden).toBe(true);
  });

  it('transitionend (background-color) — does NOT set content.hidden', async () => {
    const { ctrl, content } = await mount({ open: true });
    ctrl.close();
    await tick();
    const evt = new Event('transitionend', { bubbles: true });
    Object.defineProperty(evt, 'propertyName', { value: 'background-color', enumerable: true });
    content.dispatchEvent(evt);
    await tick();
    expect(content.hidden).toBe(false);
  });

  it('computePosition is called with placement "bottom" by default (LTR)', async () => {
    const { ctrl } = await mount();
    ctrl.open();
    await tick();
    expect(mockComputePosition).toHaveBeenCalled();
    const callArgs = mockComputePosition.mock.calls[0];
    const config = callArgs[2];
    expect(config.placement).toBe('bottom');
  });

  it('placement="start" maps to physical "left" in LTR', async () => {
    const { ctrl } = await mount({ placement: 'start' });
    ctrl.open();
    await tick();
    const config = mockComputePosition.mock.calls[0][2];
    expect(config.placement).toBe('left');
  });

  it('placement="start" maps to physical "right" in RTL', async () => {
    document.documentElement.dir = 'rtl';
    const { ctrl } = await mount({ placement: 'start' });
    ctrl.open();
    await tick();
    const config = mockComputePosition.mock.calls[0][2];
    expect(config.placement).toBe('right');
  });

  it('placement="end" maps to physical "right" in LTR', async () => {
    const { ctrl } = await mount({ placement: 'end' });
    ctrl.open();
    await tick();
    const config = mockComputePosition.mock.calls[0][2];
    expect(config.placement).toBe('right');
  });

  it('disconnect() — autoUpdate cleanup is called and doc click listener removed', async () => {
    const { ctrl, wrap } = await mount();
    ctrl.open();
    await tick();
    expect(mockAutoUpdate).toHaveBeenCalled();
    expect(mockCleanup).not.toHaveBeenCalled();
    expect(ctrl._docClick).toBeTruthy();
    // Trigger Stimulus's disconnect lifecycle by removing the element.
    // `Application.stop()` does not call disconnect on individual controllers
    // in Stimulus 3.2 — it tears down the application but leaves observers
    // in place. The supported path to fire disconnect is DOM removal.
    wrap.remove();
    await tick();
    expect(mockCleanup).toHaveBeenCalled();
    expect(ctrl._docClick).toBeNull();
    expect(ctrl._cleanup).toBeNull();
  });

  it('SSR-open (open=true) — content visible + autoUpdate registered after connect', async () => {
    const { content, trigger, ctrl } = await mount({ open: true });
    expect(content.hidden).toBe(false);
    expect(content.dataset.state).toBe('open');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(mockAutoUpdate).toHaveBeenCalled();
    expect(ctrl.openValue).toBe(true);
  });
});
