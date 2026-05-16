import { Controller } from '@hotwired/stimulus';

/**
 * popover — floating panel anchored to a trigger.
 *
 * The kit's Ring 2 overlay foundation. Provides JS-positioned, viewport-aware
 * positioning (collision detection via `flip` + `shift`) on top of the trigger.
 * Per OQ-19 doctrine ([ADR-0009]): Floating UI v1.7 over Popper.js v2
 * (maintenance) or hand-rolled math (brittle). CSS native `position-anchor`
 * is the future Baseline (Chrome 125+ shipped Q1 2025, FF + Safari Q4 2025,
 * Baseline target ~2026-08) — the controller's API will absorb the swap
 * behind closed doors when Baseline lands.
 *
 * **Floating UI is lazy-loaded** per ADR-0011
 * (S2.7 mid-session amend, triggered by Calendar busting the 30 kB ceiling).
 * The module is fetched on the first popover `show()` and cached for the
 * rest of the session. On first open, the popover content appears
 * immediately (visibility + ARIA stamps + `popover:open` event fire
 * synchronously) ; positioning catches up after the chunk arrives (5-200 ms
 * on broadband, perceptible-but-acceptable on 3G). Subsequent opens are
 * fully sync.
 *
 * The Popover is non-modal: the trigger keeps focus by default. Tabbing into
 * the content is the consumer's call (the popover content's tabbable
 * descendants are reachable via Tab from the trigger). On close, focus
 * returns to the trigger ONLY if focus was inside the content at close time
 * (avoids jolting focus away from the user's current task).
 *
 * Esc dismiss is window-scoped (`keydown.esc@window`): pressing Esc anywhere
 * closes an open popover. Click-outside dismiss uses document-level capture
 * phase so React-style `stopPropagation` inside the popover content doesn't
 * break the dismiss path.
 *
 * Targets:
 *   trigger (required) — the element that toggles the popover. Stimulus
 *                        action `click->popover#toggle` is on the wrapper
 *                        (per S1.4b descriptor-binding gotcha — see
 *                        Collapsible.md §2). The controller filters
 *                        clicks on content via event.target.
 *   content (required) — the floating panel.
 *
 * Values:
 *   placement (String, default 'bottom') — top | bottom | start | end. The
 *                                          logical 'start' / 'end' aliases
 *                                          are converted to Floating UI's
 *                                          physical 'left' / 'right' per
 *                                          `document.documentElement.dir`.
 *                                          Floating UI returns the resolved
 *                                          placement after flip — used to
 *                                          set transform-origin.
 *   offset (Number, default 8) — gap from the trigger in CSS pixels.
 *   open (Boolean, default false) — initial state. SSR-open popovers set
 *                                   this to true via `data-popover-open-value`.
 *
 * Events emitted (raw CustomEvent — mirrors Collapsible / Toggle pattern;
 *                  avoids Stimulus's `dispatch()` prefix interpretation):
 *   popover:open — bubbles + composed. detail = { placement } (resolved).
 *   popover:close — bubbles + composed.
 */

// Module-scoped Floating UI cache. First popover open in a session triggers
// the dynamic import ; subsequent opens reuse the cached module. The
// promise cache prevents duplicate fetches when multiple popovers open in
// rapid succession during the loading window.
let _floatingUi = null;
let _floatingUiPromise = null;

function loadFloatingUi() {
  if (_floatingUi) return Promise.resolve(_floatingUi);
  if (_floatingUiPromise) return _floatingUiPromise;
  _floatingUiPromise = import('@floating-ui/dom').then((mod) => {
    _floatingUi = mod;
    return mod;
  });
  return _floatingUiPromise;
}

/**
 * Test-only hook to reset the module-level cache between tests so each test
 * can verify the cold-load path (import-then-position) independently. Not
 * exported from index.js (consumers don't touch this).
 */
export function __resetFloatingUiCache() {
  _floatingUi = null;
  _floatingUiPromise = null;
}

export default class PopoverController extends Controller {
  static targets = ['trigger', 'content'];

  static values = {
    placement: { type: String, default: 'bottom' },
    offset: { type: Number, default: 8 },
    open: { type: Boolean, default: false },
  };

  connect() {
    // openValueChanged fires AFTER connect with the initial value (false in
    // the default case); we don't need to sync here. If the consumer mounts
    // with openValue=true (SSR-open), openValueChanged will call show().
  }

  disconnect() {
    this._cleanupFloating();
    this._removeDocClickListener();
  }

  /**
   * Wired via `click->popover#toggle` on the wrapper. Filters clicks on the
   * content area so they don't auto-close while interacting (only clicks on
   * the trigger or outside the content should toggle / dismiss).
   */
  toggle(event) {
    if (event && this.hasContentTarget && this.contentTarget.contains(event.target)) return;
    this.openValue = !this.openValue;
  }

  /** Explicit open — for consumers wiring their own trigger semantics. */
  open() {
    this.openValue = true;
  }

  /**
   * Explicit close. Wired via `keydown.esc@window->popover#close`. No-op if
   * already closed (the @window binding fires on every popover, but only
   * open ones do work).
   */
  close(event) {
    if (!this.openValue) return;
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    this.openValue = false;
  }

  /**
   * Stimulus calls this on every openValue change, including the initial
   * (with previous=undefined). We only act when the value actually flips —
   * on initial, only if openValue is true (SSR-open).
   */
  openValueChanged(open, previous) {
    if (previous === undefined) {
      if (open) this.show();
      return;
    }
    if (open === previous) return;
    if (open) this.show();
    else this.hide();
  }

  /**
   * Sync part : visibility + ARIA stamps + event dispatch happen
   * immediately. Positioning is sync if Floating UI is already loaded,
   * async otherwise (5-200 ms first-open delay per [ADR-0011]).
   */
  show() {
    if (!this.hasTriggerTarget || !this.hasContentTarget) return;
    const trigger = this.triggerTarget;
    const content = this.contentTarget;

    content.hidden = false;
    content.dataset.state = 'open';
    trigger.setAttribute('aria-expanded', 'true');

    this._removeDocClickListener();
    this._docClick = (e) => this._onDocClick(e);
    document.addEventListener('click', this._docClick, true);

    this.element.dispatchEvent(
      new CustomEvent('popover:open', {
        bubbles: true,
        composed: true,
        detail: { placement: this.placementValue },
      }),
    );

    // Positioning : sync if loaded, async otherwise. The popover content is
    // already visible at this point ; the position snap happens when the
    // chunk arrives.
    if (_floatingUi) {
      this._beginPositioning(_floatingUi);
    } else {
      loadFloatingUi().then((fui) => {
        // Race check : the popover may have been closed during the async
        // load (very fast click+Esc on slow connection). Skip positioning
        // to avoid stamping on a now-closed popover.
        if (this.openValue) this._beginPositioning(fui);
      });
    }
  }

  hide() {
    if (!this.hasTriggerTarget || !this.hasContentTarget) return;
    const trigger = this.triggerTarget;
    const content = this.contentTarget;

    content.dataset.state = 'closed';
    trigger.setAttribute('aria-expanded', 'false');

    this._cleanupFloating();
    this._removeDocClickListener();

    content.addEventListener('transitionend', this._finalize, { once: true });

    this.element.dispatchEvent(
      new CustomEvent('popover:close', {
        bubbles: true,
        composed: true,
      }),
    );

    if (content.contains(document.activeElement)) {
      trigger.focus();
    }
  }

  /**
   * Begin Floating UI's autoUpdate cycle. The module is passed in (loaded
   * either eagerly from the cache or fresh from the dynamic import).
   */
  _beginPositioning(fui) {
    if (!this.hasTriggerTarget || !this.hasContentTarget) return;
    this._cleanupFloating();
    this._cleanup = fui.autoUpdate(this.triggerTarget, this.contentTarget, () => this._position(fui));
  }

  /**
   * Computes position via Floating UI. Called by `_beginPositioning` and on
   * every autoUpdate tick (scroll, resize, ancestor scroll). Sets inline
   * `left` / `top` (physical — Floating UI handles RTL internally),
   * `data-placement` (resolved after flip), and `--theme-popover-origin`
   * (for transform-origin so the scale animation grows from the trigger
   * direction).
   */
  _position(fui) {
    if (!this.hasTriggerTarget || !this.hasContentTarget) return;
    const trigger = this.triggerTarget;
    const content = this.contentTarget;
    fui.computePosition(trigger, content, {
      placement: this._effectivePlacement(),
      middleware: [
        fui.offset(this.offsetValue),
        fui.flip(),
        fui.shift({ padding: 8 }),
      ],
    }).then(({ x, y, placement }) => {
      content.style.left = `${x}px`;
      content.style.top = `${y}px`;
      content.dataset.placement = placement;
      content.style.setProperty('--theme-popover-origin', this._originFor(placement));
    });
  }

  /**
   * Maps the kit's logical placement ('start' / 'end') to Floating UI's
   * physical placement ('left' / 'right') based on document direction. The
   * physical placements ('top' / 'bottom' / 'left' / 'right') pass through.
   */
  _effectivePlacement() {
    const p = this.placementValue;
    const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
    if (p === 'start') return isRtl ? 'right' : 'left';
    if (p === 'end') return isRtl ? 'left' : 'right';
    return p;
  }

  /**
   * The transform-origin per placement — popover scales from the edge
   * closest to the trigger. After Floating UI's `flip`, the actual rendered
   * placement may differ from the requested one; we use the resolved value.
   */
  _originFor(placement) {
    const main = placement.split('-')[0];
    switch (main) {
      case 'top':
        return '50% 100%';
      case 'bottom':
        return '50% 0%';
      case 'left':
        return '100% 50%';
      case 'right':
        return '0% 50%';
      default:
        return '50% 0%';
    }
  }

  _finalize = (event) => {
    // Filter to the opacity transition so concurrent transforms don't trigger
    // the cleanup early. Mirrors the alert-dismiss pattern.
    if (event && event.propertyName && event.propertyName !== 'opacity') {
      this.contentTarget?.addEventListener('transitionend', this._finalize, { once: true });
      return;
    }
    // Race protection: only set hidden=true if we're still closed (a fast
    // re-open shouldn't be undone by a stale finalize).
    if (this.hasContentTarget && this.contentTarget.dataset.state === 'closed') {
      this.contentTarget.hidden = true;
    }
  };

  _onDocClick(event) {
    if (!this.element.contains(event.target)) this.close();
  }

  _cleanupFloating() {
    if (this._cleanup) {
      this._cleanup();
      this._cleanup = null;
    }
  }

  _removeDocClickListener() {
    if (this._docClick) {
      document.removeEventListener('click', this._docClick, true);
      this._docClick = null;
    }
  }
}
