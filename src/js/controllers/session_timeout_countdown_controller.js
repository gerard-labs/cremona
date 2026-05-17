import { Controller } from '@hotwired/stimulus';
import { t, getLocale } from '../utils/i18n.js';

/**
 * session-timeout-countdown — live MM:SS / "X minutes" countdown
 * controller (Ring 3).
 *
 * Cross-controller compose with Dialog (Ring 2) — the wrapping element
 * carries `data-controller="dialog session-timeout-countdown"`. This
 * controller owns the countdown ; Dialog owns the modal mechanics.
 *
 * Behavior :
 *   - SILENT visual countdown by default. The countdown text mutates
 *     every second visibly, but `aria-live="polite"` only re-announces
 *     on the natural cadence (minute boundaries).
 *   - When `remainingSeconds < warningThresholdSeconds` (default 30 s),
 *     the controller re-stamps `aria-live="assertive"` on the countdown
 *     target so screen readers announce the urgency. Fires
 *     `session-timeout:warning` event ONCE at the threshold crossing.
 *   - Avoids SR fatigue — polite for the bulk of the countdown, assertive
 *     only when truly urgent.
 *
 * Countdown render :
 *   - Uses `Intl.RelativeTimeFormat` for locale-aware "X minutes" /
 *     "X seconds" output. Below 60 seconds, render seconds only.
 *     Above 60, render minutes only (drop the seconds — would be too
 *     noisy at the polite cadence).
 *   - Pluralization via `Intl.PluralRules` for the seconds/minutes
 *     suffix.
 *
 * Race-condition surface :
 *   - The controller may `disconnect()` mid-tick (modal closes via
 *     Extend / Logout, or the consumer reloads the page). The
 *     `_destroyed` flag set on `disconnect()` is checked in the
 *     interval callback ; the interval itself is cleared on disconnect.
 *
 * Events emitted :
 *   - `session-timeout:warning`  — once, when `remainingSeconds`
 *     crosses below `warningThresholdSeconds`. detail: { remaining,
 *     threshold }. bubbles + composed.
 *   - `session-timeout:expired`  — once, when `remainingSeconds <= 0`.
 *     detail: { }. bubbles + composed. Controller stops ticking after.
 *
 * See `docs/specs/ring3/Auth-SessionTimeoutModal.md` for the full spec.
 */

export default class SessionTimeoutCountdownController extends Controller {
  static targets = ['countdown'];
  static values = {
    remainingSeconds: { type: Number, default: 60 },
    warningThresholdSeconds: { type: Number, default: 30 },
    tickMs: { type: Number, default: 1000 },
  };

  // Class-field initial-fire guards.
  _destroyed = false;
  _tickInterval = null;
  _warningFired = false;
  _expiredFired = false;

  connect() {
    this._renderCountdown();
    this._tickInterval = setInterval(() => {
      if (this._destroyed) return;
      this._tick();
    }, this.tickMsValue);
  }

  disconnect() {
    this._destroyed = true;
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = null;
    }
  }

  _tick() {
    const next = this.remainingSecondsValue - 1;
    this.remainingSecondsValue = next;
    this._renderCountdown();

    if (
      !this._warningFired &&
      next < this.warningThresholdSecondsValue &&
      next > 0
    ) {
      this._warningFired = true;
      if (this.hasCountdownTarget) {
        this.countdownTarget.setAttribute('aria-live', 'assertive');
      }
      this.element.dispatchEvent(
        new CustomEvent('session-timeout:warning', {
          bubbles: true,
          composed: true,
          detail: { remaining: next, threshold: this.warningThresholdSecondsValue },
        }),
      );
    }

    if (!this._expiredFired && next <= 0) {
      this._expiredFired = true;
      clearInterval(this._tickInterval);
      this._tickInterval = null;
      this.element.dispatchEvent(
        new CustomEvent('session-timeout:expired', {
          bubbles: true,
          composed: true,
          detail: {},
        }),
      );
    }
  }

  _renderCountdown() {
    if (!this.hasCountdownTarget) return;
    const remaining = Math.max(0, this.remainingSecondsValue);
    const text = this._formatCountdown(remaining);
    this.countdownTarget.textContent = text;
  }

  /**
   * Format `<count> {minute|seconde}(s)` with locale-aware pluralization.
   * Below 60s : seconds. Otherwise : ceil(seconds / 60) minutes.
   */
  _formatCountdown(seconds) {
    const locale = getLocale();
    if (seconds < 60) {
      const cat = this._pluralCategory(locale, seconds);
      const key = `theme.auth.session-timeout-modal.countdown.seconds-${cat}`;
      return t(key, { count: seconds });
    }
    const minutes = Math.ceil(seconds / 60);
    const cat = this._pluralCategory(locale, minutes);
    const key = `theme.auth.session-timeout-modal.countdown.minutes-${cat}`;
    return t(key, { count: minutes });
  }

  _pluralCategory(locale, n) {
    try {
      return new Intl.PluralRules(locale).select(n);
    } catch {
      // happy-dom / older browsers without Intl.PluralRules fall back
      // to a binary one/other split.
      return n === 1 ? 'one' : 'other';
    }
  }
}
