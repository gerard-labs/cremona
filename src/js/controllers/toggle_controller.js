import { Controller } from '@hotwired/stimulus';

/**
 * toggle — flips `aria-pressed` on click and emits a custom `toggle` event.
 *
 * A Toggle is the press-and-stay button pattern: aria-pressed="false"
 * → aria-pressed="true" on click. The kit owns the state flip (not the
 * browser, unlike <input type="checkbox" role="switch">) because Toggle's
 * shape is a <button> (richer styling, no form-data contract).
 *
 * Custom event:
 *   `toggle` — bubbles, composed. detail = { pressed: boolean }.
 *   Consumers can wire data-action="toggle->controller#method" or
 *   addEventListener('toggle', ...) on the button or any ancestor.
 *
 * Disabled buttons short-circuit at the browser level (click event never
 * fires on a `disabled` <button>) — no need to check here.
 *
 * Used as the base for ToggleGroup (S1.3 #5) which orchestrates N Toggles
 * with arrow-key navigation + mutex / multi selection modes.
 */
export default class ToggleController extends Controller {
  toggle(event) {
    const next = this.element.getAttribute('aria-pressed') !== 'true';
    this.element.setAttribute('aria-pressed', next ? 'true' : 'false');
    this.element.dispatchEvent(
      new CustomEvent('toggle', {
        bubbles: true,
        composed: true,
        detail: { pressed: next },
      }),
    );
    if (event) event.preventDefault();
  }
}
