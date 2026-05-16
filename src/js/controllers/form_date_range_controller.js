/**
 * form-date-range controller — date range pair (start + end) cross-field validation.
 *
 * 7th Ring 3 controller (after password-strength + session-timeout-countdown +
 * back-to-top + product-tour + form-with-steps + address-autocomplete).
 *
 * Per the Forms family doctrine (cf. Form-WithSteps.md §1) :
 *  - Composes 2 DatePicker Ring 2 instances pure (no Ring 2 amend per ADR-0015 immutability).
 *  - Cross-field validation : start ≤ end. Invalid range → dispatches
 *    `form-date-range:invalid` event with detail.{ reason: 'start-after-end' }.
 *  - Cross-step state owned by consumer — kit dispatches `form-date-range:select`
 *    with detail.{ startDate, endDate } on every valid pair update ; consumer persists.
 *  - Listens to `date-picker:select` events from the two child DatePickers (which
 *    bubble via composed:true per Stimulus / DatePicker S2.7 doctrine).
 *
 * Events dispatched (all bubble + composed) :
 *  form-date-range:mount    — { startDate?, endDate? } (initial values if set)
 *  form-date-range:select   — { startDate, endDate } — fired when both are set + valid
 *  form-date-range:invalid  — { reason: 'start-after-end', startDate, endDate }
 *  form-date-range:clear    — { which: 'start' | 'end' | 'both' }
 */

import { Controller } from '@hotwired/stimulus';

export default class FormDateRangeController extends Controller {
  static targets = ['startInput', 'endInput', 'errorMessage'];
  static values = {
    startDate: { type: String, default: '' },  // ISO 8601 yyyy-mm-dd
    endDate:   { type: String, default: '' },
  };

  _destroyed = false;
  // `false` until connect() finishes. Stimulus value-changed callbacks fire
  // *before* connect(), and connect() runs the initial _validate() itself —
  // the guard stops the callbacks from double-running validation on boot.
  _ready = false;

  connect() {
    this._destroyed = false;
    // Listen to date-picker:select events from descendant DatePicker controllers.
    this.element.addEventListener('date-picker:select', this._onDatePickerSelectBound = (e) => this._onDatePickerSelect(e));
    this._dispatch('form-date-range:mount', {
      startDate: this.startDateValue,
      endDate: this.endDateValue,
    });
    this._validate();
    this._ready = true;
  }

  disconnect() {
    this._destroyed = true;
    this.element.removeEventListener('date-picker:select', this._onDatePickerSelectBound);
  }

  /**
   * React to programmatic value changes — a consumer setting the range via
   * `data-form-date-range-{start,end}-date-value`, or a child DatePicker.
   * Guarded by `_ready` so the initial Stimulus value-changed fire (before
   * connect()) doesn't double-run the validation connect() already does.
   */
  startDateValueChanged() {
    if (this._ready) this._validate();
  }

  endDateValueChanged() {
    if (this._ready) this._validate();
  }

  _onDatePickerSelect(event) {
    // event.detail.value is the ISO date selected. Determine which DatePicker fired
    // by walking up to find the data-form-date-range-target attribute.
    const sourceEl = event.target.closest('[data-form-date-range-target]');
    if (!sourceEl) return;
    const which = sourceEl.dataset.formDateRangeTarget;
    const selectedValue = event.detail && event.detail.value;
    if (!selectedValue) return;

    if (which === 'startInput') {
      this.startDateValue = selectedValue;
    } else if (which === 'endInput') {
      this.endDateValue = selectedValue;
    }
    this._validate();
  }

  _validate() {
    const start = this.startDateValue;
    const end = this.endDateValue;

    // Clear error display if either is missing — not invalid yet.
    if (!start || !end) {
      this._clearErrorDisplay();
      return;
    }

    if (start > end) {
      this._showErrorDisplay();
      this._dispatch('form-date-range:invalid', {
        reason: 'start-after-end',
        startDate: start,
        endDate: end,
      });
      return;
    }

    this._clearErrorDisplay();
    this._dispatch('form-date-range:select', {
      startDate: start,
      endDate: end,
    });
  }

  _showErrorDisplay() {
    if (this.hasErrorMessageTarget) {
      this.errorMessageTarget.removeAttribute('hidden');
    }
  }

  _clearErrorDisplay() {
    if (this.hasErrorMessageTarget) {
      this.errorMessageTarget.setAttribute('hidden', '');
    }
  }

  clear() {
    this.startDateValue = '';
    this.endDateValue = '';
    this._dispatch('form-date-range:clear', { which: 'both' });
    this._clearErrorDisplay();
  }

  _dispatch(name, detail) {
    const event = new CustomEvent(name, {
      bubbles: true,
      composed: true,
      cancelable: false,
      detail,
    });
    this.element.dispatchEvent(event);
    return event;
  }
}
