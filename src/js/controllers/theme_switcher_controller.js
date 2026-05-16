/**
 * theme-switcher controller — ThemeSwitcher (Ring 3 S3.3b-1).
 *
 * 14th Ring 3 controller (after password-strength + session-timeout-countdown
 * + back-to-top + product-tour + form-with-steps + address-autocomplete +
 * form-date-range + color-picker + signature-pad + tag-input + phone-input +
 * lang-switcher + density-switcher).
 *
 * Thin controller (~80 lines effective) — composes ToggleGroup Ring 1
 * (single mode mutex) with 3 modes : light / dark / system. The controller :
 *   1. Flips `data-theme="dark|<empty>"` attribute on the configurable target
 *      (documentElement by default).
 *   2. Persists the user's CHOICE (light | dark | system) — not the resolved
 *      theme — to localStorage. So a user who picks 'system' keeps following
 *      the OS preference across sessions.
 *   3. When mode === 'system', resolves the effective theme via
 *      `prefers-color-scheme` + listens for OS-level theme changes (the
 *      MediaQueryList fires on toggle).
 *   4. Dispatches `theme-switcher:change` with `{ mode, resolvedTheme,
 *      previousMode }` on every change.
 *
 * Mirror DensitySwitcher precedent for the toggle-event filtering pattern
 * (single mode mutex re-dispatches `toggle` for unpressed siblings — filter
 * to aria-pressed="true" only).
 *
 * No lazy lib load — pure composition + thin orchestration.
 *
 * Surface :
 *   data-controller="toggle-group theme-switcher"
 *   data-theme-switcher-current-mode-value="system"        (light | dark | system)
 *   data-theme-switcher-storage-key-value="theme.mode"
 *   data-theme-switcher-target-value="documentElement"     (documentElement | body | self)
 *
 *   Each inner Toggle :
 *     data-theme-mode="<light|dark|system>"
 *
 *   Events (bubbles + composed) :
 *     theme-switcher:change  (detail.{ mode, resolvedTheme, previousMode })
 */

import { Controller } from '@hotwired/stimulus';

export default class ThemeSwitcherController extends Controller {
  static values = {
    currentMode: { type: String, default: 'system' },
    storageKey: { type: String, default: 'theme.mode' },
    target: { type: String, default: 'documentElement' },
  };

  // Class-field initial-fire guards.
  _destroyed = false;
  _previousMode = null;
  _systemQuery = null;
  _onSystemChangeBound = null;

  connect() {
    this._destroyed = false;
    this._previousMode = this.currentModeValue;
    // Re-hydrate from localStorage if persisted differs.
    const persisted = this._readStorage();
    if (persisted && persisted !== this.currentModeValue && this._isValidMode(persisted)) {
      this.currentModeValue = persisted;
    }
    this._applyResolvedTheme();
    // If mode === 'system', subscribe to prefers-color-scheme changes.
    if (this.currentModeValue === 'system') {
      this._subscribeSystem();
    }
  }

  disconnect() {
    this._destroyed = true;
    this._unsubscribeSystem();
  }

  /**
   * Wired via `data-action="toggle->theme-switcher#onToggle"` on the group wrap.
   * Filters to pressed=true (mutex re-dispatches for unpressed siblings).
   */
  onToggle(event) {
    if (this._destroyed) return;
    const toggle = event.target;
    if (!toggle || typeof toggle.getAttribute !== 'function') return;
    const pressed = toggle.getAttribute('aria-pressed') === 'true';
    if (!pressed) return;
    const mode = toggle.dataset?.themeMode;
    if (!mode || !this._isValidMode(mode) || mode === this.currentModeValue) return;
    const previousMode = this.currentModeValue;
    this.currentModeValue = mode;
    this._previousMode = previousMode;
    this._writeStorage(mode);
    // Switch system listener subscription based on mode.
    if (mode === 'system') {
      this._subscribeSystem();
    } else {
      this._unsubscribeSystem();
    }
    const resolvedTheme = this._applyResolvedTheme();
    this.element.dispatchEvent(
      new CustomEvent('theme-switcher:change', {
        bubbles: true,
        composed: true,
        detail: { mode, resolvedTheme, previousMode },
      }),
    );
  }

  /**
   * Apply the resolved theme ('light' or 'dark') to the target element :
   *   - mode 'light'  → remove data-theme attribute (light is the default)
   *   - mode 'dark'   → set data-theme="dark"
   *   - mode 'system' → resolve via prefers-color-scheme + apply
   * Returns the resolved theme string for the event payload.
   */
  _applyResolvedTheme() {
    const targetEl = this._resolveTargetElement();
    if (!targetEl) return 'light';
    let resolved = this.currentModeValue;
    if (resolved === 'system') {
      resolved = this._readSystemPreference();
    }
    if (resolved === 'dark') {
      targetEl.setAttribute('data-theme', 'dark');
    } else {
      // light : remove data-theme attribute (default styles apply)
      targetEl.removeAttribute('data-theme');
    }
    return resolved;
  }

  _readSystemPreference() {
    if (typeof window === 'undefined' || !window.matchMedia) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  _subscribeSystem() {
    if (this._systemQuery) return; // already subscribed
    if (typeof window === 'undefined' || !window.matchMedia) return;
    this._systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._onSystemChangeBound = () => this._onSystemChange();
    // addEventListener supported in modern browsers + Safari 14+.
    if (typeof this._systemQuery.addEventListener === 'function') {
      this._systemQuery.addEventListener('change', this._onSystemChangeBound);
    } else if (typeof this._systemQuery.addListener === 'function') {
      // Legacy fallback (Safari < 14).
      this._systemQuery.addListener(this._onSystemChangeBound);
    }
  }

  _unsubscribeSystem() {
    if (!this._systemQuery || !this._onSystemChangeBound) return;
    if (typeof this._systemQuery.removeEventListener === 'function') {
      this._systemQuery.removeEventListener('change', this._onSystemChangeBound);
    } else if (typeof this._systemQuery.removeListener === 'function') {
      this._systemQuery.removeListener(this._onSystemChangeBound);
    }
    this._systemQuery = null;
    this._onSystemChangeBound = null;
  }

  _onSystemChange() {
    if (this._destroyed) return;
    if (this.currentModeValue !== 'system') return;
    const resolved = this._applyResolvedTheme();
    this.element.dispatchEvent(
      new CustomEvent('theme-switcher:change', {
        bubbles: true,
        composed: true,
        detail: { mode: 'system', resolvedTheme: resolved, previousMode: 'system' },
      }),
    );
  }

  _isValidMode(mode) {
    return mode === 'light' || mode === 'dark' || mode === 'system';
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
