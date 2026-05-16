import { Controller } from '@hotwired/stimulus';

/**
 * toggle-group — orchestrates N Toggle children with roving tabindex +
 * optional mutex (single) / independent (multi) selection.
 *
 * Responsibilities:
 *   1. Listen for the `toggle` custom event bubbling from inner Toggles.
 *      In `mode: single` (radio-like), forces aria-pressed="false" on every
 *      Toggle that is NOT the one that just dispatched. In `mode: multi`
 *      (checkbox-like), no-op on `toggle`.
 *   2. Manage roving tabindex — only ONE Toggle has tabindex=0 at a time;
 *      arrow nav (Left/Right or Up/Down per orientation) moves the active
 *      one. Home / End jump to first / last.
 *
 * The inner Toggles each carry their own `toggle` controller — this group
 * controller does NOT touch their toggle behavior, only listens for the
 * resulting custom event.
 *
 * The group queries inner toggles via .theme-toggle (CSS class selector)
 * rather than via a Stimulus target, to avoid stamping every option's
 * Twig partial with a parent-scoped data-target attribute.
 */
export default class ToggleGroupController extends Controller {
  static values = {
    mode: { type: String, default: 'single' },
    orientation: { type: String, default: 'horizontal' },
  };

  connect() {
    this.setRovingTabindex();
  }

  /** Read the current set of Toggles (re-queried each call — supports dynamic DOM). */
  get toggles() {
    return Array.from(this.element.querySelectorAll('.theme-toggle'));
  }

  /**
   * Set roving tabindex: in single mode, the currently-pressed Toggle gets
   * tabindex=0 (so it's the entry point on Tab); in multi mode, the first
   * non-disabled Toggle gets it. All others get tabindex=-1.
   */
  setRovingTabindex() {
    const toggles = this.toggles;
    if (toggles.length === 0) return;
    let activeIndex = toggles.findIndex((t) => !t.disabled);
    if (this.modeValue === 'single') {
      const pressedIndex = toggles.findIndex(
        (t) => t.getAttribute('aria-pressed') === 'true' && !t.disabled,
      );
      if (pressedIndex >= 0) activeIndex = pressedIndex;
    }
    toggles.forEach((t, i) => {
      t.tabIndex = i === activeIndex ? 0 : -1;
    });
  }

  /**
   * Handler for the `toggle` event bubbling from inner Toggles. Single-mode:
   * unpress every other Toggle so only one stays pressed. The originating
   * Toggle has already flipped its own aria-pressed (its own controller
   * ran first).
   */
  onToggle(event) {
    if (this.modeValue !== 'single') return;
    const origin = event.target;
    if (!origin.classList.contains('theme-toggle')) return;
    // Only enforce mutex when the event is a "press" (detail.pressed === true).
    // A user-unpress in single mode is allowed (group can be fully empty).
    if (event.detail && event.detail.pressed !== true) return;
    this.toggles.forEach((t) => {
      if (t !== origin && t.getAttribute('aria-pressed') === 'true') {
        t.setAttribute('aria-pressed', 'false');
      }
    });
    this.setRovingTabindex();
  }

  /**
   * Arrow-key roving focus + Home/End jumps. Native button click handles
   * Enter/Space — we don't override.
   */
  keydown(event) {
    const toggles = this.toggles.filter((t) => !t.disabled);
    if (toggles.length === 0) return;
    const currentIdx = toggles.indexOf(document.activeElement);
    if (currentIdx === -1) return;

    const isHorizontal = this.orientationValue === 'horizontal';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

    let nextIdx = -1;
    switch (event.key) {
      case prevKey:
        nextIdx = (currentIdx - 1 + toggles.length) % toggles.length;
        break;
      case nextKey:
        nextIdx = (currentIdx + 1) % toggles.length;
        break;
      case 'Home':
        nextIdx = 0;
        break;
      case 'End':
        nextIdx = toggles.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    toggles[currentIdx].tabIndex = -1;
    toggles[nextIdx].tabIndex = 0;
    toggles[nextIdx].focus();
  }
}
