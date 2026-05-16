import { Controller } from '@hotwired/stimulus';

/**
 * input-group — focus delegation + helper actions for InputGroup.
 *
 * Responsibilities:
 *   1. Focus delegation — clicking a non-button affix focuses the inner
 *      input. Buttons inside the affix (clear, show-password, copy, …)
 *      keep their own click semantics; the controller skips delegation
 *      when the click landed on a button / link / focusable element.
 *   2. Expose `clear()` — wipes the input value, re-dispatches `input`
 *      and `change` events so any external listeners (Field validation,
 *      form state) recompute, then refocuses the input.
 *   3. Expose `focusInput()` — programmatic helper consumers can wire
 *      from custom data-action attributes.
 *
 * Targets:
 *   prefix  — the prefix <span> (auto-discovered if not stamped)
 *   suffix  — the suffix <span>
 *   input   — the <input>; if no explicit target, falls back to the
 *             first .theme-input within the wrapper. Stamped on connect.
 *
 * Actions:
 *   data-action="click->input-group#delegateClick" on the wrapper itself
 *       (Twig template wires this) — handles the focus-delegation path.
 *   data-action="click->input-group#clear" on a button inside a prefix/suffix.
 *   data-action="click->input-group#focusInput" optional consumer-wired hook.
 */
export default class InputGroupController extends Controller {
  static targets = ['prefix', 'suffix', 'input'];

  connect() {
    // Stamp the input target so subsequent calls resolve in O(1) via Stimulus.
    if (!this.hasInputTarget) {
      const input = this.element.querySelector('.theme-input');
      if (input) input.setAttribute('data-input-group-target', 'input');
    }
  }

  /**
   * Click delegation — wired by the template on the wrapper itself.
   * If the click target is inside a button / link / explicitly focusable
   * element, we don't steal focus (the button click handler runs).
   * Otherwise we focus the inner input.
   */
  delegateClick(event) {
    if (event.target.closest('button, a, [tabindex], input, select, textarea')) return;
    this.focusInput();
  }

  /**
   * Public helper — focus the inner input. Wired by clear() after wiping
   * and can also be invoked directly from a consumer's data-action.
   */
  focusInput() {
    const el = this.getInput();
    if (el) el.focus();
  }

  /**
   * Public helper — wipe the input's value, fire `input` + `change` so
   * external listeners (form validation, autosave, Field's error state
   * recomputation) react as if the user had cleared manually, then refocus.
   */
  clear(event) {
    const el = this.getInput();
    if (!el) return;
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.focus();
    if (event) event.preventDefault();
  }

  /** Resolve the input — prefer the explicit target, fall back to the first .theme-input. */
  getInput() {
    if (this.hasInputTarget) return this.inputTarget;
    return this.element.querySelector('.theme-input');
  }
}
