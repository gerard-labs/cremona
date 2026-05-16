import { Controller } from '@hotwired/stimulus';

/**
 * accordion — orchestrates N Collapsible children.
 *
 * Two responsibilities (mirrors ToggleGroup's relationship with Toggle):
 *
 *   1. **Mutex enforcement (single mode)** — listens for the
 *      `collapsible:toggle` event bubbling from inner Collapsibles. When
 *      one opens (`event.detail.open === true`), all OTHER open
 *      Collapsibles are forced closed. State mutation is done directly
 *      (aria-expanded + data-state) to avoid the closing items re-firing
 *      `collapsible:toggle` and creating a feedback loop.
 *
 *      In `mode: multi`, the listener is a no-op (each child manages its
 *      own state independently).
 *
 *   2. **Roving tabindex + Arrow / Home / End nav** — exactly ONE trigger
 *      is tab-reachable at a time (`tabindex=0`); arrow keys (Up / Down)
 *      cycle, Home / End jump, Enter / Space activate (native).
 *
 *      In single mode, the active trigger is the currently-open one (if
 *      any) so Tab into the group lands on it. In multi mode (or single
 *      with nothing open), the active trigger is the first non-disabled
 *      one.
 *
 * The Accordion never touches the inner ARIA contract beyond aria-expanded
 * on the trigger — the inner Collapsible's role="region", aria-controls,
 * aria-labelledby chain stays intact and authoritative.
 *
 * Values:
 *   mode (String, default 'single') — single (mutex) | multi (independent).
 */
export default class AccordionController extends Controller {
  static values = {
    mode: { type: String, default: 'single' },
  };

  connect() {
    this.setRovingTabindex();
  }

  /** Re-queried each call so dynamically added/removed Collapsibles work. */
  get collapsibles() {
    return Array.from(this.element.querySelectorAll('.cremona-collapsible'));
  }

  get triggers() {
    return Array.from(this.element.querySelectorAll('.cremona-collapsible__trigger'));
  }

  /**
   * Set roving tabindex: single mode → currently-open trigger gets
   * tabindex=0; multi mode (or no open trigger) → first non-disabled.
   */
  setRovingTabindex() {
    const triggers = this.triggers;
    if (triggers.length === 0) return;
    let activeIdx = triggers.findIndex((t) => !t.disabled);
    if (this.modeValue === 'single') {
      const openIdx = triggers.findIndex(
        (t) => t.getAttribute('aria-expanded') === 'true' && !t.disabled,
      );
      if (openIdx >= 0) activeIdx = openIdx;
    }
    triggers.forEach((t, i) => {
      t.tabIndex = i === activeIdx ? 0 : -1;
    });
  }

  /**
   * Listens for `collapsible:toggle` bubbling from inner Collapsibles. In
   * `single` mode, when one opens we close all the others by mutating
   * their aria-expanded + data-state directly. Their dispatch already
   * fired for the opening one; we skip dispatching for the closing ones
   * (would create a feedback loop with no useful signal — consumers can
   * observe each Collapsible directly if they need close-events).
   */
  onChildToggle(event) {
    if (this.modeValue !== 'single') return;
    if (!event.detail || event.detail.open !== true) {
      // A close — still update roving tabindex (the active trigger may have
      // changed) but no mutex work to do.
      this.setRovingTabindex();
      return;
    }
    const opened = event.target; // .cremona-collapsible wrapper
    this.collapsibles.forEach((c) => {
      if (c === opened) return;
      const trigger = c.querySelector('.cremona-collapsible__trigger');
      const content = c.querySelector('.cremona-collapsible__content');
      if (!trigger || !content) return;
      if (trigger.getAttribute('aria-expanded') === 'true') {
        trigger.setAttribute('aria-expanded', 'false');
        content.dataset.state = 'closed';
      }
    });
    this.setRovingTabindex();
  }

  /**
   * Arrow Up/Down move focus + roving tabindex between triggers.
   * Home / End jump to first / last. Enter / Space are NOT intercepted —
   * the native <button> activation fires the inner Collapsible's
   * click->collapsible#toggle binding.
   */
  keydown(event) {
    const triggers = this.triggers.filter((t) => !t.disabled);
    if (triggers.length === 0) return;
    const currentIdx = triggers.indexOf(document.activeElement);
    if (currentIdx === -1) return;

    let nextIdx = -1;
    switch (event.key) {
      case 'ArrowDown':
        nextIdx = (currentIdx + 1) % triggers.length;
        break;
      case 'ArrowUp':
        nextIdx = (currentIdx - 1 + triggers.length) % triggers.length;
        break;
      case 'Home':
        nextIdx = 0;
        break;
      case 'End':
        nextIdx = triggers.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    triggers[currentIdx].tabIndex = -1;
    triggers[nextIdx].tabIndex = 0;
    triggers[nextIdx].focus();
  }
}
