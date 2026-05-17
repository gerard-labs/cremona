import { Controller } from '@hotwired/stimulus';

/**
 * collapsible — toggles a single disclosure region (button + content).
 *
 * Responsibilities:
 *   1. `toggle()` — flips aria-expanded on the trigger AND data-state on the
 *      content wrapper (open/closed). The CSS handles the visual animation
 *      via grid-template-rows: 0fr ↔ 1fr.
 *   2. `toggle()` dispatches `collapsible:toggle` (bubbles + composed) with
 *      `detail = { open: boolean }`. Accordion (the orchestrator) listens
 *      for this event to enforce single-mode mutex.
 *   3. `connect()` syncs the initial data-state from aria-expanded so the
 *      CSS animation doesn't flicker on mount. The Twig template stamps
 *      both attributes consistently, but a server-side render that only
 *      knows one source of truth (aria-expanded) is still safe.
 *
 * No targets — the controller queries the trigger via `.cremona-collapsible__trigger`
 * and the content via `.cremona-collapsible__content` (CSS class selectors).
 * This avoids polluting the Twig with data-target attributes when the wrapper
 * is the controller scope.
 *
 * Values:
 *   open (Boolean, default false) — initial state. Read by `connect()` to
 *                                    sync if the trigger / content attributes
 *                                    are not yet rendered (rare edge case).
 */
export default class CollapsibleController extends Controller {
  connect() {
    const trigger = this.trigger;
    const content = this.content;
    if (!trigger || !content) return;
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    content.dataset.state = isOpen ? 'open' : 'closed';
  }

  /**
   * Wired via `click->collapsible#toggle` on the wrapper element. The click
   * bubbles up from the trigger button. When invoked with an event, the
   * controller filters to ensure the click came from the trigger (a click on
   * the content area, when open, should NOT re-close).
   */
  toggle(event) {
    const trigger = this.trigger;
    const content = this.content;
    if (!trigger || !content) return;
    // Filter: only the trigger button's click should toggle (not clicks on
    // the content area when open).
    if (event && !trigger.contains(event.target)) return;
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    const nextOpen = !isOpen;
    trigger.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
    content.dataset.state = nextOpen ? 'open' : 'closed';
    this.element.dispatchEvent(
      new CustomEvent('collapsible:toggle', {
        bubbles: true,
        composed: true,
        detail: { open: nextOpen },
      }),
    );
  }

  get trigger() {
    return this.element.querySelector('.cremona-collapsible__trigger');
  }

  get content() {
    return this.element.querySelector('.cremona-collapsible__content');
  }
}
