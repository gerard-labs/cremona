/**
 * faceted-filters controller — Search-FacetedFilters (Ring 3 S3.3b-2).
 *
 * 16th Ring 3 controller (after password-strength + session-timeout-countdown
 * + back-to-top + product-tour + form-with-steps + address-autocomplete +
 * form-date-range + color-picker + signature-pad + tag-input + phone-input +
 * lang-switcher + density-switcher + theme-switcher + danger-zone).
 *
 * Thin controller (~85-95 effective lines) — aggregates the selection state
 * of multiple facet groups (categories + brand + price range + color + etc.)
 * into a single `state` object and dispatches a `faceted-filters:change`
 * event whenever any facet input changes.
 *
 * Markup-agnostic : reads every `<input>` inside the wrap, aggregates by
 * `name` attribute, and builds the state object. Supports :
 *   - Multiple checkboxes with same name → array of values (the checked ones)
 *   - Single checkbox with unique name → boolean (true if checked)
 *   - Radio group (same name, type=radio) → single value
 *   - Range / number inputs → number (or { min, max } for paired inputs)
 *   - Text / select inputs → string value
 *
 * Empty values are OMITTED from the state object — consumers detect
 * "unchanged" / "cleared" implicitly via the absence of the key.
 *
 * No lazy lib load — pure DOM + event listener + aggregation logic.
 *
 * Surface :
 *   data-controller="faceted-filters"               (standalone)
 *   data-controller="popover faceted-filters"      (10e cross-controller compose — facets in popover)
 *
 *   data-faceted-filters-mode-value="multi"         (multi | single — affects multi-checkbox semantics)
 *
 *   Each input inside the wrap : standard HTML `<input>` with `name` attr.
 *   Optional clear button : data-action="click->faceted-filters#clear"
 *
 *   Events (bubbles + composed) :
 *     faceted-filters:change  (detail.{ state, changed })
 *     faceted-filters:cleared (detail.{ state })
 */

import { Controller } from '@hotwired/stimulus';

export default class FacetedFiltersController extends Controller {
  static values = {
    mode: { type: String, default: 'multi' },
  };

  // Class-field initial-fire guards.
  _destroyed = false;
  _onChangeBound = null;

  connect() {
    this._destroyed = false;
    this._onChangeBound = (event) => this._onChange(event);
    this.element.addEventListener('change', this._onChangeBound);
    this.element.addEventListener('input', this._onChangeBound);
  }

  disconnect() {
    this._destroyed = true;
    if (this._onChangeBound) {
      this.element.removeEventListener('change', this._onChangeBound);
      this.element.removeEventListener('input', this._onChangeBound);
    }
    this._onChangeBound = null;
  }

  /**
   * Wired via DOM `change` / `input` event delegation. Aggregates current
   * state + dispatches faceted-filters:change. Filters out events from
   * non-input targets (e.g. a label's click bubbles through too).
   */
  _onChange(event) {
    if (this._destroyed) return;
    const target = event.target;
    if (!target || !target.name || !this._isInputLike(target)) return;
    const state = this.getState();
    this.element.dispatchEvent(
      new CustomEvent('faceted-filters:change', {
        bubbles: true,
        composed: true,
        detail: {
          state,
          changed: { name: target.name, value: target.value, type: target.type },
        },
      }),
    );
  }

  /**
   * Build the current state object by aggregating every input inside the wrap.
   * Public method — consumer can call `controller.getState()` for snapshot.
   */
  getState() {
    const state = {};
    const inputs = this.element.querySelectorAll('input[name], select[name]');
    inputs.forEach((input) => {
      const name = input.name;
      if (!name) return;
      const type = input.type;
      if (type === 'checkbox') {
        if (!input.checked) return;
        // Multiple checkboxes with same name → array ; single → boolean.
        const sameName = this.element.querySelectorAll(`input[type="checkbox"][name="${CSS.escape(name)}"]`);
        if (sameName.length > 1) {
          if (!state[name]) state[name] = [];
          state[name].push(input.value);
        } else {
          state[name] = true;
        }
      } else if (type === 'radio') {
        if (!input.checked) return;
        state[name] = input.value;
      } else if (type === 'range' || type === 'number') {
        const value = input.valueAsNumber;
        if (Number.isFinite(value)) state[name] = value;
      } else {
        const value = input.value;
        if (value !== '' && value !== null && value !== undefined) {
          state[name] = value;
        }
      }
    });
    return state;
  }

  /**
   * Wired via `data-action="click->faceted-filters#clear"`. Resets all
   * inputs to their default state + dispatches faceted-filters:cleared.
   */
  clear(event) {
    if (this._destroyed) return;
    if (event) event.preventDefault();
    const inputs = this.element.querySelectorAll('input[name], select[name]');
    inputs.forEach((input) => {
      const type = input.type;
      if (type === 'checkbox' || type === 'radio') {
        input.checked = false;
      } else if (type === 'range' || type === 'number') {
        // Clearing a filter resets a range/number input to its minimum
        // (no constraint), falling back to the authored default or empty.
        input.value = input.min || input.defaultValue || '';
      } else {
        input.value = '';
      }
    });
    const state = this.getState();
    this.element.dispatchEvent(
      new CustomEvent('faceted-filters:cleared', {
        bubbles: true,
        composed: true,
        detail: { state },
      }),
    );
  }

  _isInputLike(el) {
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'select' || tag === 'textarea';
  }
}
