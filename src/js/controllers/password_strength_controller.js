import { Controller } from '@hotwired/stimulus';
import { t } from '../utils/i18n.js';

/**
 * password-strength — live password strength meter controller (Ring 3).
 *
 * zxcvbn-ts v3.x is the underlying scoring library. **Lazy-loaded** via
 * module-scoped dynamic `import()`. Lazy-on-FIRST-KEYSTROKE (not on
 * `connect()`) — saves the ~30 kB zxcvbn chunk for users who land on
 * Auth-Register but bail without typing (distinct from Chart / FileUpload
 * lazy-on-mount strategy).
 *
 * 3-tier score mapping (kit-owned doctrine — not consumer-overridable
 * in v1) :
 *   score 0-1 → variant `danger`  (faible)
 *   score 2   → variant `warning` (moyen)
 *   score 3-4 → variant `success` (fort)
 *
 * Progress fill value mapping (zxcvbn 0-4 → 0-100 %) :
 *   score 0 → 20 %  (10 % below 20 % feels too empty for "very weak")
 *   score 1 → 40 %
 *   score 2 → 60 %
 *   score 3 → 80 %
 *   score 4 → 100 %
 *
 * Race-condition surface :
 *  - The controller may `disconnect()` during the lazy-load (user navigates
 *    away mid-fetch OR Auth-Register transitions to its success-email-sent
 *    terminal state mid-typing). The `_destroyed` flag set on `disconnect()`
 *    is checked in the `loadZxcvbn().then()` callback so the score paint
 *    never happens on a now-orphan element.
 *
 * Idempotency cache :
 *  - `_lastScore` class field initialized to `null` BEFORE Stimulus
 *    callbacks fire (class-field initial-fire guard pattern). `_renderScore`
 *    skips when the score is unchanged.
 *
 * Events emitted :
 *  - `password-strength:mount`  — on connect(). bubbles + composed.
 *  - `password-strength:change` — on every score change. bubbles + composed.
 *                                  detail: { score: 0-4, valid: boolean }.
 *
 * See `docs/specs/ring3/Auth-PasswordStrength.md` for the full spec.
 */

let _zxcvbn = null;
let _zxcvbnPromise = null;

function loadZxcvbn() {
  if (_zxcvbn) return Promise.resolve(_zxcvbn);
  if (_zxcvbnPromise) return _zxcvbnPromise;
  _zxcvbnPromise = Promise.all([
    import('@zxcvbn-ts/core'),
    import('@zxcvbn-ts/language-en'),
  ]).then(([core, en]) => {
    core.zxcvbnOptions.setOptions({
      translations: en.translations,
      graphs: en.adjacencyGraphs,
      dictionary: { ...en.dictionary },
    });
    _zxcvbn = core.zxcvbn;
    return _zxcvbn;
  });
  return _zxcvbnPromise;
}

/**
 * Reset the module-scoped lazy-load cache. Test-only — exposed for the
 * vitest unit suite to isolate per-test mock state. Mirror chart /
 * file-upload precedent verbatim.
 */
export function __resetZxcvbnCache() {
  _zxcvbn = null;
  _zxcvbnPromise = null;
}

export default class PasswordStrengthController extends Controller {
  static targets = ['input', 'meter', 'hint'];
  static values = {
    minScore: { type: Number, default: 2 },
    debounceMs: { type: Number, default: 150 },
  };

  // Class-field initial-fire guards (initialized BEFORE Stimulus value-changed callbacks fire).
  _destroyed = false;
  _debounceTimer = null;
  _lastScore = null;

  connect() {
    // Sync paint : the meter starts at score=0 + variant=danger + the
    // empty-state hint. No async I/O on connect() — zxcvbn is fetched
    // on FIRST keystroke (saves the chunk for users who bail without
    // typing).
    this._renderScore({ score: 0, empty: true });
    this.element.dispatchEvent(
      new CustomEvent('password-strength:mount', {
        bubbles: true,
        composed: true,
        detail: { minScore: this.minScoreValue },
      }),
    );
  }

  disconnect() {
    this._destroyed = true;
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
  }

  /** Wired via `data-action="input->password-strength#evaluate"` on the Input. */
  evaluate(event) {
    const password = event.target.value || '';
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      if (this._destroyed) return;
      this._score(password);
    }, this.debounceMsValue);
  }

  _score(password) {
    if (!password.length) {
      this._renderScore({ score: 0, empty: true });
      return;
    }
    if (_zxcvbn) {
      this._renderScore(_zxcvbn(password));
      return;
    }
    loadZxcvbn().then((fn) => {
      if (this._destroyed) return;
      // Race-check : the user may have cleared the field during the
      // lazy load. Re-read the input value to score against the latest
      // state, not the stale `password` captured at evaluate() time.
      const current = this.hasInputTarget ? this.inputTarget.value : password;
      if (!current.length) {
        this._renderScore({ score: 0, empty: true });
        return;
      }
      this._renderScore(fn(current));
    });
  }

  _renderScore(result) {
    const score = result.score ?? 0;
    const empty = !!result.empty;

    // Idempotency cache : skip the DOM mutation + event dispatch when the
    // score hasn't changed. The empty-state hint differs from score=0
    // (idle vs scored), so we track them as distinct internal states via
    // a string key.
    const stateKey = empty ? 'empty' : `score-${score}`;
    if (stateKey === this._lastScore) return;
    this._lastScore = stateKey;

    // Map score → Progress variant + value.
    const variant = score >= 3 ? 'success' : score === 2 ? 'warning' : 'danger';
    const value = ((score + 1) / 5) * 100; // 20 / 40 / 60 / 80 / 100

    if (this.hasMeterTarget) {
      this.meterTarget.setAttribute('data-variant', variant);
      this.meterTarget.setAttribute('value', String(value));
    }

    if (this.hasHintTarget) {
      const tierKey = empty
        ? 'theme.auth.password-strength.tier.empty'
        : `theme.auth.password-strength.tier.${score}`;
      this.hintTarget.textContent = t(tierKey);
    }

    this.element.dispatchEvent(
      new CustomEvent('password-strength:change', {
        bubbles: true,
        composed: true,
        detail: {
          score,
          valid: !empty && score >= this.minScoreValue,
          empty,
        },
      }),
    );
  }
}
