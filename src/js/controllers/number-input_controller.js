import { Controller } from '@hotwired/stimulus';

/**
 * number-input — touch-friendly +/- stepper around a native <input type="number">.
 *
 * Per the OQ-mini NumberInput resolution sealed S2.6 :
 *  - The native <input type="number"> handles ALL keyboard semantics
 *    (Arrow Up / Down, type-to-edit, Tab, native min/max/step on form
 *    submit validation).
 *  - The +/- buttons are an explicit affordance for touch + mouse contexts.
 *    They compute the next value manually (current + step, clamped to
 *    min/max) rather than relying on the browser's `stepUp()` / `stepDown()`
 *    methods. The manual path is :
 *      a. behaviorally identical to stepUp/stepDown in real browsers,
 *      b. cross-engine consistent (happy-dom 15 ignores the step attribute
 *         in stepUp(), giving 1-unit advances regardless of step="5" /
 *         step="0.01" — manual calc sidesteps that),
 *      c. precision-correct for decimal steps via toFixed-based rounding
 *         (avoids float drift like 9.99 - 0.01 = 9.979999999999999).
 *  - The controller mirrors the disabled state on the buttons against
 *    the input's min/max boundaries (button greys out at the edge).
 *
 * The native `input` and `change` events fire after every step — bubble to
 * the consumer ; this controller does NOT dispatch a custom event (the
 * native ones are authoritative — same doctrine as Slider S1.3 / Input S1.2).
 *
 * Targets:
 *   input    (required) — the <input type="number">
 *   decrement (required) — the '−' button
 *   increment (required) — the '+' button
 */
export default class NumberInputController extends Controller {
  static targets = ['input', 'decrement', 'increment'];

  connect() {
    if (!this.hasInputTarget) return;
    this._onInput = () => this._refreshButtons();
    this.inputTarget.addEventListener('input', this._onInput);
    this._refreshButtons();
  }

  disconnect() {
    if (this.hasInputTarget && this._onInput) {
      this.inputTarget.removeEventListener('input', this._onInput);
    }
  }

  /** Wired via `data-action="click->number-input#increment"` on '+' button. */
  increment() {
    if (!this.hasInputTarget || this.inputTarget.disabled || this.inputTarget.readOnly) return;
    const input = this.inputTarget;
    if (input.value === '') {
      input.value = input.min !== '' ? input.min : '0';
    } else {
      const step = parseFloat(input.step) || 1;
      const current = parseFloat(input.value) || 0;
      let next = current + step;
      if (input.max !== '') next = Math.min(next, parseFloat(input.max));
      input.value = this._format(next, step);
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /** Wired via `data-action="click->number-input#decrement"` on '−' button. */
  decrement() {
    if (!this.hasInputTarget || this.inputTarget.disabled || this.inputTarget.readOnly) return;
    const input = this.inputTarget;
    if (input.value === '') {
      input.value = input.max !== '' ? input.max : '0';
    } else {
      const step = parseFloat(input.step) || 1;
      const current = parseFloat(input.value) || 0;
      let next = current - step;
      if (input.min !== '') next = Math.max(next, parseFloat(input.min));
      input.value = this._format(next, step);
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Round to the step's decimal precision so float arithmetic doesn't
   * surface (9.99 - 0.01 → "9.98" not "9.979999999999999").
   * If step is an integer, the value rounds to int. Otherwise, count the
   * decimal places of the step.
   */
  _format(value, step) {
    const stepStr = String(step);
    const decimals = stepStr.includes('.') ? stepStr.split('.')[1].length : 0;
    return value.toFixed(decimals);
  }

  _refreshButtons() {
    const input = this.inputTarget;
    const value = parseFloat(input.value);
    const min = input.min !== '' ? parseFloat(input.min) : null;
    const max = input.max !== '' ? parseFloat(input.max) : null;
    const baseDisabled = input.disabled || input.readOnly;
    if (this.hasDecrementTarget) {
      const atMin = min !== null && !isNaN(value) && value <= min;
      this.decrementTarget.disabled = baseDisabled || atMin;
    }
    if (this.hasIncrementTarget) {
      const atMax = max !== null && !isNaN(value) && value >= max;
      this.incrementTarget.disabled = baseDisabled || atMax;
    }
  }
}
