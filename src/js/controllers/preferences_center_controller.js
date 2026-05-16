/**
 * preferences-center controller — RGPD-PreferencesCenter (Ring 3 S3.3b-2).
 *
 * 18th Ring 3 controller (after cookie-banner S3.3b-2).
 *
 * Thin controller (~115-130 effective lines) — manages RGPD granular
 * consent preferences via N category Switch toggles + explicit Save
 * button (per OQ-NEW sealed S3.3b-2 opening — RGPD legal intentional
 * commit, NOT instant-save). Tracks dirty state (any toggle differs
 * from initial) ; dispatches `preferences-center:save` with full
 * per-category state object ONLY on explicit Save click.
 *
 * Composes Dialog Ring 2 size=lg cross-controller pattern :
 * `data-controller="dialog preferences-center"` (12th cross-controller
 * compose instance).
 *
 * Optional integration with RGPD-CookieBanner :
 * consumer listens to `preferences-center:save` event + calls
 * cookieBannerCtrl.saveCustom(state) to persist the granular consent
 * via the cookie-banner's defensive Both cookie + localStorage write.
 *
 * No lazy lib load.
 *
 * Surface :
 *   data-controller="dialog preferences-center"
 *
 *   data-preferences-center-categories-value='[{"key":"essential","required":true,"initialChecked":true}]'
 *     OR per-toggle:
 *     <input type="checkbox"
 *            data-preferences-center-target="toggle"
 *            data-category-key="analytics"
 *            data-category-required="false">
 *
 *   Save button :
 *     data-preferences-center-target="saveButton"
 *     data-action="click->preferences-center#save"
 *
 *   Cancel button :
 *     data-action="click->preferences-center#cancel"
 *
 *   Events (bubbles + composed) :
 *     preferences-center:save   (detail.{ consent: { categoryKey: boolean, ... }, persistedAt })
 *     preferences-center:cancel (detail.{})
 *     preferences-center:dirty  (detail.{ dirty: boolean })
 */

import { Controller } from '@hotwired/stimulus';

export default class PreferencesCenterController extends Controller {
  static targets = ['toggle', 'saveButton', 'dirtyIndicator'];
  static values = {};

  // Class-field initial-fire guards.
  _destroyed = false;
  _initialState = null;
  _dirty = false;
  _onToggleChangeBound = null;

  connect() {
    this._destroyed = false;
    this._initialState = this._readToggleState();
    this._dirty = false;
    this._onToggleChangeBound = (event) => this._onToggleChange(event);
    // Listen for change events on the wrap (delegated).
    this.element.addEventListener('change', this._onToggleChangeBound);
    this._syncDirtyVisualState();
  }

  disconnect() {
    this._destroyed = true;
    if (this._onToggleChangeBound) {
      this.element.removeEventListener('change', this._onToggleChangeBound);
    }
    this._onToggleChangeBound = null;
  }

  /**
   * Wired via `data-action="click->preferences-center#save"`. Reads current
   * toggle state + dispatches preferences-center:save. The Save button
   * remains enabled or disabled per the dirty state — consumer can wire
   * the disabled state via the dirty-change event.
   */
  save(event) {
    if (this._destroyed) return;
    if (event) event.preventDefault();
    const consent = this._readToggleState();
    const persistedAt = new Date().toISOString();
    this._initialState = consent;
    this._dirty = false;
    this._syncDirtyVisualState();
    this.element.dispatchEvent(
      new CustomEvent('preferences-center:save', {
        bubbles: true,
        composed: true,
        detail: { consent, persistedAt },
      }),
    );
  }

  /**
   * Wired via `data-action="click->preferences-center#cancel"`. Resets
   * toggles to initial state + dispatches preferences-center:cancel.
   * Does NOT close the dialog — consumer wires the dialog#close action
   * separately if desired (or chains both via multi-action descriptor).
   */
  cancel(event) {
    if (this._destroyed) return;
    if (event) event.preventDefault();
    this._resetToInitial();
    this._dirty = false;
    this._syncDirtyVisualState();
    this.element.dispatchEvent(
      new CustomEvent('preferences-center:cancel', {
        bubbles: true,
        composed: true,
        detail: {},
      }),
    );
  }

  /**
   * Public method — consumer can read current preferences state.
   */
  getState() {
    return this._readToggleState();
  }

  /**
   * Public method — consumer can read dirty status (any toggle differs
   * from initial).
   */
  isDirty() {
    return this._dirty;
  }

  /**
   * Listens for change events from any inner toggle. Recomputes dirty
   * state + dispatches preferences-center:dirty.
   */
  _onToggleChange(event) {
    if (this._destroyed) return;
    const target = event.target;
    // Filter to checkboxes with a name attribute (category key inferred from name).
    if (!target || target.type !== 'checkbox' || !target.name) return;
    // Required categories ship `disabled` → the change event shouldn't fire
    // for them (native), but defensively revert if it does.
    if (target.disabled && !target.checked) {
      target.checked = true;
      return;
    }
    const current = this._readToggleState();
    const wasDirty = this._dirty;
    this._dirty = !this._statesEqual(current, this._initialState);
    if (this._dirty !== wasDirty) {
      this._syncDirtyVisualState();
      this.element.dispatchEvent(
        new CustomEvent('preferences-center:dirty', {
          bubbles: true,
          composed: true,
          detail: { dirty: this._dirty },
        }),
      );
    }
  }

  /**
   * Read every toggle's checked state into an object keyed by `name` attribute.
   * Category key = input's name attribute (e.g. essential / analytics / ...).
   */
  _readToggleState() {
    const state = {};
    this._toggleElements().forEach((toggle) => {
      const key = toggle.name;
      if (!key) return;
      state[key] = toggle.checked;
    });
    return state;
  }

  _resetToInitial() {
    this._toggleElements().forEach((toggle) => {
      const key = toggle.name;
      if (!key || toggle.disabled) return;
      if (this._initialState && key in this._initialState) {
        toggle.checked = this._initialState[key];
      }
    });
  }

  _statesEqual(a, b) {
    if (!a || !b) return false;
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) {
      if (a[k] !== b[k]) return false;
    }
    return true;
  }

  _syncDirtyVisualState() {
    if (this.hasDirtyIndicatorTarget) {
      this.dirtyIndicatorTarget.setAttribute('data-dirty', this._dirty ? 'true' : 'false');
    }
    if (this.hasSaveButtonTarget) {
      this.saveButtonTarget.setAttribute('data-preferences-center-dirty', this._dirty ? 'true' : 'false');
    }
  }

  _toggleElements() {
    // Prefer Stimulus targets if declared ; fall back to checkbox inputs
    // with a name attribute (category key inferred from name).
    if (this.hasToggleTarget) return this.toggleTargets;
    return this.element.querySelectorAll('input[type="checkbox"][name]');
  }
}
