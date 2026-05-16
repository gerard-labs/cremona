/**
 * danger-zone controller — DangerZone inline variant (Ring 3 S3.3b-1).
 *
 * 15th Ring 3 controller (after password-strength + session-timeout-countdown
 * + back-to-top + product-tour + form-with-steps + address-autocomplete +
 * form-date-range + color-picker + signature-pad + tag-input + phone-input +
 * lang-switcher + density-switcher + theme-switcher).
 *
 * Thin controller (~55 lines effective) for the INLINE variant of DangerZone
 * (typed-confirmation pattern : the destructive Button stays disabled until
 * the user types an expected string — typically the resource name or a
 * literal like "SUPPRIMER" — into the inline input). The MODAL variant of
 * DangerZone composes AlertDialog Ring 2 instead and ships NO controller
 * (pure consumer composition per the cohérence-microcopy doctrine §"Confirmations").
 *
 * No lazy lib load — pure typed-value match + button disabled toggle +
 * data-state attribute + danger-zone:match-change event.
 *
 * Surface :
 *   data-controller="danger-zone"
 *   data-danger-zone-expected-value="SUPPRIMER"           (or the resource name)
 *   data-danger-zone-match-mode-value="exact"             (exact | case-insensitive)
 *
 *   Inline input :
 *     data-danger-zone-target="input"
 *
 *   Destructive button :
 *     data-danger-zone-target="button"
 *     disabled (initial)
 *
 *   Events (bubbles + composed) :
 *     danger-zone:match-change  (detail.{ matches, typed })
 */

import { Controller } from '@hotwired/stimulus';

export default class DangerZoneController extends Controller {
  static targets = ['input', 'button'];
  static values = {
    expected: { type: String, default: '' },
    matchMode: { type: String, default: 'exact' },
  };

  // Class-field initial-fire guards.
  _destroyed = false;
  _onInputBound = null;
  _previousMatches = false;

  connect() {
    this._destroyed = false;
    this._previousMatches = false;
    this._onInputBound = () => this._onInput();
    if (this.hasInputTarget) {
      this.inputTarget.addEventListener('input', this._onInputBound);
    }
    // Sync initial state — keep button disabled if expected is set + empty input.
    this._onInput();
  }

  disconnect() {
    this._destroyed = true;
    if (this._onInputBound && this.hasInputTarget) {
      this.inputTarget.removeEventListener('input', this._onInputBound);
    }
    this._onInputBound = null;
  }

  _onInput() {
    if (this._destroyed) return;
    if (!this.hasInputTarget || !this.hasButtonTarget) return;
    const typed = this.inputTarget.value || '';
    const matches = this._matches(typed);
    this._applyButtonState(matches);
    this.element.setAttribute('data-danger-zone-state', matches ? 'armed' : 'idle');
    if (matches !== this._previousMatches) {
      this._previousMatches = matches;
      this.element.dispatchEvent(
        new CustomEvent('danger-zone:match-change', {
          bubbles: true,
          composed: true,
          detail: { matches, typed },
        }),
      );
    }
  }

  _applyButtonState(matches) {
    if (matches) {
      this.buttonTarget.removeAttribute('disabled');
      this.buttonTarget.setAttribute('aria-disabled', 'false');
    } else {
      this.buttonTarget.setAttribute('disabled', '');
      this.buttonTarget.setAttribute('aria-disabled', 'true');
    }
  }

  _matches(typed) {
    const expected = this.expectedValue;
    if (!expected) return false;
    if (this.matchModeValue === 'case-insensitive') {
      return typed.trim().toLowerCase() === expected.toLowerCase();
    }
    return typed === expected;
  }
}
