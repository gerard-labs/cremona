/**
 * phone-input controller — Form-PhoneInput (Ring 3).
 *
 * Lazy-loads intl-tel-input v25.x on first focus event. First-focus saves
 * the ~25 kB chunk for users who land on a form with a phone field but
 * never reach it via Tab.
 *
 * Surface :
 *   data-controller="phone-input"
 *   data-phone-input-initial-country-value="fr"
 *   data-phone-input-preferred-countries-value='["fr","us","gb"]'
 *   data-phone-input-separate-dial-code-value="false"
 *   data-phone-input-national-mode-value="true"
 *
 *   Events (bubbles + composed) :
 *     phone-input:mount          (detail.initialCountry)
 *     phone-input:ready          (detail.country)
 *     phone-input:change         (detail.{ number, country, valid })
 *     phone-input:country-change (detail.{ iso2, dialCode, name })
 */

import { Controller } from '@hotwired/stimulus';

let _intlTelInput = null;
let _intlTelInputPromise = null;

function loadIntlTelInput() {
  if (_intlTelInput) return Promise.resolve(_intlTelInput);
  if (_intlTelInputPromise) return _intlTelInputPromise;
  _intlTelInputPromise = import('intl-tel-input').then((mod) => {
    _intlTelInput = mod.default;
    return _intlTelInput;
  });
  return _intlTelInputPromise;
}

/**
 * Reset the module-scoped lazy-load cache. Test-only — exposed for the
 * Vitest unit suite to isolate per-test mock state.
 */
export function __resetIntlTelInputCache() {
  _intlTelInput = null;
  _intlTelInputPromise = null;
}

export default class PhoneInputController extends Controller {
  static targets = ['input', 'hiddenInput'];
  static values = {
    initialCountry: { type: String, default: 'auto' },
    preferredCountries: { type: Array, default: ['fr', 'us', 'gb', 'de', 'es'] },
    separateDialCode: { type: Boolean, default: false },
    nationalMode: { type: Boolean, default: true },
  };

  _destroyed = false;
  _iti = null;
  _focusBound = null;
  _changeBound = null;
  _countryChangeBound = null;

  connect() {
    this._destroyed = false;
    this._iti = null;
    if (this.hasInputTarget) {
      if (this.inputTarget.tagName.toLowerCase() === 'input') {
        if (!this.inputTarget.getAttribute('type')) {
          this.inputTarget.setAttribute('type', 'tel');
        }
        if (!this.inputTarget.getAttribute('autocomplete')) {
          this.inputTarget.setAttribute('autocomplete', 'tel');
        }
        if (!this.inputTarget.getAttribute('inputmode')) {
          this.inputTarget.setAttribute('inputmode', 'tel');
        }
      }
    }
    this.element.setAttribute('data-phone-input-state', 'idle');
    this.element.dispatchEvent(
      new CustomEvent('phone-input:mount', {
        bubbles: true,
        composed: true,
        detail: { initialCountry: this.initialCountryValue },
      }),
    );
    // Lazy load on FIRST focus event (saves ~25 kB chunk for bounce-out paths).
    this._focusBound = () => this._initOnFocus();
    if (this.hasInputTarget) {
      this.inputTarget.addEventListener('focus', this._focusBound, { once: true });
    }
  }

  disconnect() {
    this._destroyed = true;
    if (this.hasInputTarget && this._focusBound) {
      this.inputTarget.removeEventListener('focus', this._focusBound);
      this._focusBound = null;
    }
    if (this.hasInputTarget && this._changeBound) {
      this.inputTarget.removeEventListener('change', this._changeBound);
      this._changeBound = null;
    }
    if (this.hasInputTarget && this._countryChangeBound) {
      this.inputTarget.removeEventListener('countrychange', this._countryChangeBound);
      this._countryChangeBound = null;
    }
    if (this._iti && typeof this._iti.destroy === 'function') {
      this._iti.destroy();
      this._iti = null;
    }
  }

  _initOnFocus() {
    if (this._destroyed) return;
    if (this._iti) return;
    if (_intlTelInput) {
      this._beginIti(_intlTelInput);
    } else {
      loadIntlTelInput().then((factory) => {
        if (this._destroyed) return;
        if (this._iti) return;
        this._beginIti(factory);
      });
    }
  }

  _beginIti(factory) {
    if (!this.hasInputTarget) return;
    this._iti = factory(this.inputTarget, {
      initialCountry: this.initialCountryValue,
      preferredCountries: this.preferredCountriesValue,
      separateDialCode: this.separateDialCodeValue,
      nationalMode: this.nationalModeValue,
      utilsScript: undefined,  // utils bundled — no CDN fetch
    });
    this.element.setAttribute('data-phone-input-state', 'ready');

    const country = typeof this._iti.getSelectedCountryData === 'function'
      ? this._iti.getSelectedCountryData()
      : { iso2: '' };
    this.element.dispatchEvent(
      new CustomEvent('phone-input:ready', {
        bubbles: true,
        composed: true,
        detail: { country: country.iso2 || '' },
      }),
    );

    this._changeBound = () => this._syncHiddenInput();
    this._countryChangeBound = () => this._dispatchCountryChange();
    this.inputTarget.addEventListener('change', this._changeBound);
    this.inputTarget.addEventListener('countrychange', this._countryChangeBound);
  }

  _syncHiddenInput() {
    if (!this._iti) return;
    const number = typeof this._iti.getNumber === 'function' ? this._iti.getNumber() : '';
    const country = typeof this._iti.getSelectedCountryData === 'function'
      ? this._iti.getSelectedCountryData()
      : { iso2: '' };
    const valid = typeof this._iti.isValidNumber === 'function' ? this._iti.isValidNumber() : false;
    if (this.hasHiddenInputTarget) {
      this.hiddenInputTarget.value = number;
    }
    this.element.dispatchEvent(
      new CustomEvent('phone-input:change', {
        bubbles: true,
        composed: true,
        detail: { number, country: country.iso2 || '', valid },
      }),
    );
  }

  _dispatchCountryChange() {
    if (!this._iti) return;
    const country = typeof this._iti.getSelectedCountryData === 'function'
      ? this._iti.getSelectedCountryData()
      : { iso2: '', dialCode: '', name: '' };
    this.element.dispatchEvent(
      new CustomEvent('phone-input:country-change', {
        bubbles: true,
        composed: true,
        detail: { iso2: country.iso2 || '', dialCode: country.dialCode || '', name: country.name || '' },
      }),
    );
  }
}
