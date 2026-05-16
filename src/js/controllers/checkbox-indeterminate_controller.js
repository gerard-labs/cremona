import { Controller } from '@hotwired/stimulus';

/**
 * checkbox-indeterminate — sets `el.indeterminate = true` when the Twig
 * template stamped `data-indeterminate="true"`.
 *
 * Why a controller for this:
 *   The HTML <input type="checkbox"> `indeterminate` is a DOM property only —
 *   it has no attribute counterpart. To let server-rendered Twig express the
 *   indeterminate state from the consumer side (e.g. a "select-all" header in
 *   a DataTable rendered server-side), we need 5 lines of JS to read the
 *   marker attribute and flip the property. The native checkbox then announces
 *   `aria-checked="mixed"` automatically (browser-managed).
 *
 * Pattern mirrors `textarea-autosize`: the controller attaches DIRECTLY to
 * the native <input> element (no wrapper).
 *
 * Action wiring (Twig template adds when `indeterminate: true`):
 *   data-controller="checkbox-indeterminate"
 *   data-action="change->checkbox-indeterminate#clear"
 *   data-indeterminate="true"
 *
 * On user-toggle (click / Space), the browser natively clears the
 * `indeterminate` DOM property. `clear()` syncs the marker attribute so a
 * subsequent reconnect (e.g. HTMX morphdom swap re-mounting the controller)
 * doesn't resurrect the indeterminate state.
 */
export default class CheckboxIndeterminateController extends Controller {
  connect() {
    if (this.element.dataset.indeterminate === 'true') {
      this.element.indeterminate = true;
    }
  }

  clear() {
    this.element.dataset.indeterminate = 'false';
  }
}
