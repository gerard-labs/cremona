/**
 * density-switcher controller — DensitySwitcher (Ring 3 S3.3b-1).
 *
 * 13th Ring 3 controller (after password-strength + session-timeout-countdown
 * + back-to-top + product-tour + form-with-steps + address-autocomplete +
 * form-date-range + color-picker + signature-pad + tag-input + phone-input +
 * lang-switcher).
 *
 * Thin controller (~60 lines effective) — composes ToggleGroup Ring 1
 * (single mode mutex) + flips `data-density` attribute on the configurable
 * target element (documentElement / body / self) + persists to localStorage
 * + dispatches `density-switcher:change` event.
 *
 * Listens to the bubbled `toggle` event from inner Toggle Ring 1 children
 * (cross-controller compose via `data-controller="toggle-group density-switcher"`
 * on the wrap + `data-action="... toggle->density-switcher#onToggle"`). Filters
 * to `aria-pressed="true"` events only (ToggleGroup mutex re-dispatches
 * `toggle` for the just-unpressed siblings too).
 *
 * No lazy lib load — pure composition + thin attribute/persistence glue.
 *
 * Surface :
 *   data-controller="toggle-group density-switcher"
 *   data-density-switcher-current-density-value="comfortable"   (default | cozy | compact)
 *   data-density-switcher-storage-key-value="theme.density"
 *   data-density-switcher-target-value="documentElement"        (documentElement | body | self)
 *
 *   Each inner Toggle :
 *     data-density="<comfortable|cozy|compact>"
 *
 *   Events (bubbles + composed) :
 *     density-switcher:change  (detail.{ density, previousDensity })
 */

import { Controller } from '@hotwired/stimulus';

export default class DensitySwitcherController extends Controller {
  static values = {
    currentDensity: { type: String, default: 'comfortable' },
    storageKey: { type: String, default: 'theme.density' },
    target: { type: String, default: 'documentElement' },
  };

  // Class-field initial-fire guards.
  _destroyed = false;
  _previousDensity = null;

  connect() {
    this._destroyed = false;
    this._previousDensity = this.currentDensityValue;
    // Re-hydrate from localStorage if a persisted value exists + differs.
    const persisted = this._readStorage();
    if (persisted && persisted !== this.currentDensityValue) {
      this.currentDensityValue = persisted;
      this._applyToTarget(persisted);
    } else if (persisted === this.currentDensityValue) {
      // Persisted matches initial — still apply (in case target attribute wasn't SSR'd).
      this._applyToTarget(this.currentDensityValue);
    } else {
      // No persisted value — apply initial currentDensity if not yet on target.
      this._applyToTarget(this.currentDensityValue);
    }
  }

  disconnect() {
    this._destroyed = true;
  }

  /**
   * Wired via `data-action="toggle->density-switcher#onToggle"` on the
   * group wrap. The event bubbles from inner Toggle children. We act only
   * on the freshly-pressed toggle (single-mode mutex re-dispatches `toggle`
   * for unpressed siblings — those carry aria-pressed="false" and are
   * filtered out here).
   */
  onToggle(event) {
    if (this._destroyed) return;
    const toggle = event.target;
    if (!toggle || typeof toggle.getAttribute !== 'function') return;
    const pressed = toggle.getAttribute('aria-pressed') === 'true';
    if (!pressed) return;
    const density = toggle.dataset?.density;
    if (!density || density === this.currentDensityValue) return;
    const previousDensity = this.currentDensityValue;
    this.currentDensityValue = density;
    this._previousDensity = previousDensity;
    this._writeStorage(density);
    this._applyToTarget(density);
    this.element.dispatchEvent(
      new CustomEvent('density-switcher:change', {
        bubbles: true,
        composed: true,
        detail: { density, previousDensity },
      }),
    );
  }

  _applyToTarget(density) {
    const targetEl = this._resolveTargetElement();
    if (targetEl) targetEl.setAttribute('data-density', density);
  }

  _resolveTargetElement() {
    switch (this.targetValue) {
      case 'self':
        return this.element;
      case 'body':
        return typeof document !== 'undefined' ? document.body : null;
      case 'documentElement':
      default:
        return typeof document !== 'undefined' ? document.documentElement : null;
    }
  }

  _readStorage() {
    try {
      return window.localStorage?.getItem(this.storageKeyValue) ?? null;
    } catch {
      return null;
    }
  }

  _writeStorage(value) {
    try {
      window.localStorage?.setItem(this.storageKeyValue, value);
    } catch {
      // localStorage unavailable — silent fallback.
    }
  }
}
