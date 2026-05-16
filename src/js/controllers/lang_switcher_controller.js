/**
 * lang-switcher controller — LangSwitcher (Ring 3 S3.3b-1).
 *
 * 12th Ring 3 controller (after password-strength + session-timeout-countdown
 * + back-to-top + product-tour + form-with-steps + address-autocomplete +
 * form-date-range + color-picker + signature-pad + tag-input + phone-input).
 *
 * Thin controller (~50 lines effective) — composes DropdownMenu Ring 2 +
 * dispatches `lang-switcher:change` event + persists selection to
 * localStorage. Consumer wires actual page reload OR client-side i18n
 * locale flip on the change event.
 *
 * No lazy lib load — pattern is pure composition + thin event/persistence
 * logic. Mirror back-to-top controller precedent (the closest thin-controller
 * template).
 *
 * Surface :
 *   data-controller="popover dropdown-menu lang-switcher"
 *   data-lang-switcher-current-locale-value="fr"
 *   data-lang-switcher-storage-key-value="theme.locale"
 *   data-lang-switcher-target="current"   (span inside trigger)
 *
 *   Each menu item :
 *     data-action="click->lang-switcher#select"
 *     data-locale="<code>"
 *
 *   Events (bubbles + composed) :
 *     lang-switcher:change  (detail.{ locale, previousLocale })
 */

import { Controller } from '@hotwired/stimulus';

export default class LangSwitcherController extends Controller {
  static targets = ['current'];
  static values = {
    currentLocale: { type: String, default: 'fr' },
    storageKey: { type: String, default: 'theme.locale' },
  };

  // Class-field initial-fire guards (S2.8 doctrine — initialized BEFORE
  // Stimulus callbacks fire).
  _destroyed = false;
  _previousLocale = null;

  connect() {
    this._destroyed = false;
    this._previousLocale = this.currentLocaleValue;
    // Re-hydrate from localStorage if a persisted value exists + differs.
    const persisted = this._readStorage();
    if (persisted && persisted !== this.currentLocaleValue) {
      this.currentLocaleValue = persisted;
    }
    this._syncCurrentLabel();
  }

  disconnect() {
    this._destroyed = true;
  }

  /**
   * Wired via `data-action="click->lang-switcher#select"` on each menu option.
   * Persists the selection + dispatches the change event. Consumer wires the
   * actual locale-flip side effect (page reload, runtime i18n switch, …).
   */
  select(event) {
    if (this._destroyed) return;
    const locale = event.currentTarget?.dataset?.locale;
    if (!locale || locale === this.currentLocaleValue) return;
    const previousLocale = this.currentLocaleValue;
    this.currentLocaleValue = locale;
    this._previousLocale = previousLocale;
    this._writeStorage(locale);
    this._syncCurrentLabel();
    this.element.dispatchEvent(
      new CustomEvent('lang-switcher:change', {
        bubbles: true,
        composed: true,
        detail: { locale, previousLocale },
      }),
    );
  }

  _syncCurrentLabel() {
    if (this.hasCurrentTarget) {
      this.currentTarget.textContent = this.currentLocaleValue.toUpperCase();
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
      // localStorage unavailable (private mode, denied) — silent fallback.
    }
  }
}
