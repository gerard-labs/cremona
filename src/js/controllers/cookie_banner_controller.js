/**
 * cookie-banner controller — RGPD-CookieBanner (Ring 3 S3.3b-2).
 *
 * 17th Ring 3 controller (after faceted-filters S3.3b-2).
 *
 * Thin controller (~95-110 effective lines) — manages RGPD consent
 * persistence via BOTH document.cookie + localStorage (defensive per
 * OQ-NEW sealed at S3.3b-2 opening). Server-readable cookie for SSR
 * consent decisions + fast client read via localStorage. Belt-and-
 * suspenders protection against Safari ITP / 3rd-party cookie blocking.
 *
 * Readback prioritizes document.cookie when present (RGPD-canonical
 * source of truth). Both are written atomically on every consent
 * action (accept / reject / customize-with-state).
 *
 * The pattern composes Dialog Ring 2 with closeOnEscape=false +
 * closeOnBackdropClick=false (RGPD legal commit — user MUST commit to
 * a button, can't dismiss accidentally). Cross-controller compose :
 * `data-controller="dialog cookie-banner"`.
 *
 * No lazy lib load — pure DOM + storage logic.
 *
 * Surface :
 *   data-controller="dialog cookie-banner"     (11e cross-controller compose)
 *
 *   data-cookie-banner-cookie-name-value="theme.consent"
 *   data-cookie-banner-max-age-days-value="180"
 *   data-cookie-banner-secure-value="true"
 *   data-cookie-banner-same-site-value="lax"           (lax | strict | none)
 *   data-cookie-banner-storage-key-value="theme.consent"
 *   data-cookie-banner-auto-show-value="true"          (show on connect if no consent yet)
 *
 *   CTA buttons :
 *     data-action="click->cookie-banner#accept"
 *     data-action="click->cookie-banner#reject"
 *     data-action="click->cookie-banner#customize"
 *
 *   Events (bubbles + composed) :
 *     cookie-banner:accept       (detail.{ consent: 'all', persistedAt })
 *     cookie-banner:reject       (detail.{ consent: 'minimal', persistedAt })
 *     cookie-banner:customize    (detail.{}) — consumer opens RGPD-PreferencesCenter
 *     cookie-banner:save-custom  (detail.{ consent: object, persistedAt }) — dispatched by consumer after PreferencesCenter save
 */

import { Controller } from '@hotwired/stimulus';

export default class CookieBannerController extends Controller {
  static values = {
    cookieName:   { type: String, default: 'theme.consent' },
    maxAgeDays:   { type: Number, default: 180 },
    secure:       { type: Boolean, default: true },
    sameSite:     { type: String, default: 'lax' },
    storageKey:   { type: String, default: 'theme.consent' },
    autoShow:     { type: Boolean, default: true },
  };

  // Class-field initial-fire guards.
  _destroyed = false;

  connect() {
    this._destroyed = false;
    // Auto-show on connect if no prior consent persisted (RGPD-canonical
    // : the banner must reappear if cookies / localStorage are cleared).
    if (this.autoShowValue && this._readConsent() == null) {
      this._openDialog();
    }
  }

  disconnect() {
    this._destroyed = true;
  }

  /**
   * Wired via `data-action="click->cookie-banner#accept"`. Persists "all"
   * consent + closes dialog + dispatches cookie-banner:accept.
   */
  accept(event) {
    if (this._destroyed) return;
    if (event) event.preventDefault();
    const persistedAt = new Date().toISOString();
    this._writeConsent({ consent: 'all', persistedAt });
    this._closeDialog();
    this.element.dispatchEvent(
      new CustomEvent('cookie-banner:accept', {
        bubbles: true,
        composed: true,
        detail: { consent: 'all', persistedAt },
      }),
    );
  }

  /**
   * Wired via `data-action="click->cookie-banner#reject"`. Persists "minimal"
   * (only essential cookies) + closes + dispatches cookie-banner:reject.
   */
  reject(event) {
    if (this._destroyed) return;
    if (event) event.preventDefault();
    const persistedAt = new Date().toISOString();
    this._writeConsent({ consent: 'minimal', persistedAt });
    this._closeDialog();
    this.element.dispatchEvent(
      new CustomEvent('cookie-banner:reject', {
        bubbles: true,
        composed: true,
        detail: { consent: 'minimal', persistedAt },
      }),
    );
  }

  /**
   * Wired via `data-action="click->cookie-banner#customize"`. Dispatches
   * cookie-banner:customize ; consumer wires this to open the
   * RGPD-PreferencesCenter dialog.
   */
  customize(event) {
    if (this._destroyed) return;
    if (event) event.preventDefault();
    this.element.dispatchEvent(
      new CustomEvent('cookie-banner:customize', {
        bubbles: true,
        composed: true,
        detail: {},
      }),
    );
  }

  /**
   * Public method — consumer calls after RGPD-PreferencesCenter save with
   * the per-category state object. Persists the granular consent.
   */
  saveCustom(consentObject) {
    if (this._destroyed) return;
    const persistedAt = new Date().toISOString();
    const payload = { consent: consentObject, persistedAt };
    this._writeConsent(payload);
    this._closeDialog();
    this.element.dispatchEvent(
      new CustomEvent('cookie-banner:save-custom', {
        bubbles: true,
        composed: true,
        detail: payload,
      }),
    );
  }

  /** Public method — consumer can read current consent for SSR decisions. */
  getConsent() {
    return this._readConsent();
  }

  /**
   * Read consent. Priority : document.cookie (RGPD-canonical), then
   * localStorage (fast client). Returns parsed object OR null.
   */
  _readConsent() {
    const fromCookie = this._readCookie();
    if (fromCookie) {
      try { return JSON.parse(fromCookie); } catch { return null; }
    }
    const fromStorage = this._readStorage();
    if (fromStorage) {
      try { return JSON.parse(fromStorage); } catch { return null; }
    }
    return null;
  }

  /**
   * Write consent to BOTH document.cookie AND localStorage (defensive
   * per OQ-NEW sealed). Atomic from caller's perspective — both writes
   * happen in the same call.
   */
  _writeConsent(payload) {
    const serialized = JSON.stringify(payload);
    this._writeCookie(serialized);
    this._writeStorage(serialized);
  }

  _readCookie() {
    if (typeof document === 'undefined' || !document.cookie) return null;
    const name = this.cookieNameValue + '=';
    const parts = document.cookie.split('; ');
    for (const part of parts) {
      if (part.startsWith(name)) {
        return decodeURIComponent(part.slice(name.length));
      }
    }
    return null;
  }

  _writeCookie(value) {
    if (typeof document === 'undefined') return;
    const maxAgeSec = this.maxAgeDaysValue * 86400;
    const flags = [
      `${this.cookieNameValue}=${encodeURIComponent(value)}`,
      `Max-Age=${maxAgeSec}`,
      `Path=/`,
      `SameSite=${this._validSameSite(this.sameSiteValue)}`,
    ];
    if (this.secureValue) flags.push('Secure');
    document.cookie = flags.join('; ');
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
      // localStorage unavailable (private mode, denied) — silent fallback (cookie covers).
    }
  }

  _openDialog() {
    // The Dialog controller is co-mounted on the same wrap. Set its open value.
    if (typeof this.application !== 'undefined' && this.application?.getControllerForElementAndIdentifier) {
      const dialog = this.application.getControllerForElementAndIdentifier(this.element, 'dialog');
      if (dialog && typeof dialog.open === 'function') {
        dialog.open();
        return;
      }
    }
    // Fallback : set data-dialog-open-value attribute (Stimulus reactive value).
    this.element.setAttribute('data-dialog-open-value', 'true');
  }

  _closeDialog() {
    if (typeof this.application !== 'undefined' && this.application?.getControllerForElementAndIdentifier) {
      const dialog = this.application.getControllerForElementAndIdentifier(this.element, 'dialog');
      if (dialog && typeof dialog.close === 'function') {
        dialog.close();
        return;
      }
    }
    this.element.setAttribute('data-dialog-open-value', 'false');
  }

  _validSameSite(value) {
    const valid = ['lax', 'strict', 'none'];
    return valid.includes(value.toLowerCase()) ? value.toLowerCase() : 'lax';
  }
}
