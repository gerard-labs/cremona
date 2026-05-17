/**
 * color-picker controller — Form-ColorPicker (Ring 3).
 *
 * Lazy-loads Coloris (melloware fork) v0.x on first `popover:open` event.
 * Module-scoped cache + sync mount/ARIA + async init on first Popover open +
 * race-check on disconnect.
 *
 * The cross-controller compose pattern (`data-controller="popover color-picker"`)
 * lets the Popover Ring 2 controller own positioning + open/close mechanics
 * (Floating UI lazy-loaded) ; this controller owns lazy Coloris load +
 * preview swatch sync.
 *
 * Lazy-on-first-interaction: the picker UI is hidden until the user clicks
 * the trigger → `popover:open` event dispatched → this controller's
 * once-listener fires + lazy-loads Coloris.
 *
 * Surface :
 *   data-controller="popover color-picker"
 *   data-color-picker-alpha-value="false|true"
 *   data-color-picker-swatches-value='[...]'
 *   data-color-picker-format-value="hex|rgb|hsl"
 *   data-color-picker-default-color-value="#000000"
 *
 *   Events (bubbles + composed) :
 *     color-picker:mount   (detail.value)
 *     color-picker:ready
 *     color-picker:change  (detail.value)
 */

import { Controller } from '@hotwired/stimulus';
import { t } from '../utils/i18n.js';

let _Coloris = null;
let _ColorisPromise = null;

function loadColoris() {
  if (_Coloris) return Promise.resolve(_Coloris);
  if (_ColorisPromise) return _ColorisPromise;
  _ColorisPromise = import('@melloware/coloris').then((mod) => {
    _Coloris = mod.default || mod.Coloris || mod;
    return _Coloris;
  });
  return _ColorisPromise;
}

/**
 * Reset the module-scoped lazy-load cache. Test-only — exposed for the
 * Vitest unit suite to isolate per-test mock state. Mirror chart /
 * file-upload / product-tour / password-strength precedent verbatim.
 */
export function __resetColorisCache() {
  _Coloris = null;
  _ColorisPromise = null;
}

export default class ColorPickerController extends Controller {
  static targets = ['input', 'trigger', 'preview'];
  static values = {
    alpha: { type: Boolean, default: false },
    swatches: { type: Array, default: [] },
    format: { type: String, default: 'hex' },
    defaultColor: { type: String, default: '#000000' },
  };

  // Class-field initial-fire guards (initialized BEFORE Stimulus callbacks fire).
  _destroyed = false;
  _initialized = false;
  _popoverOpenBound = null;
  _inputChangeBound = null;

  connect() {
    this._destroyed = false;
    this._initialized = false;

    // Sync paint : ARIA stamp + preview render + event dispatch happen immediately.
    if (this.hasTriggerTarget) {
      this.triggerTarget.setAttribute('aria-label', t('theme.form.color-picker.aria.trigger'));
    }
    const initialValue = (this.hasInputTarget && this.inputTarget.value) || this.defaultColorValue;
    if (this.hasInputTarget && !this.inputTarget.value) {
      this.inputTarget.value = initialValue;
    }
    this._renderPreview(initialValue);
    this.element.setAttribute('data-color-picker-state', 'idle');
    this.element.dispatchEvent(
      new CustomEvent('color-picker:mount', {
        bubbles: true,
        composed: true,
        detail: { value: initialValue },
      }),
    );

    // Lazy load on FIRST popover:open event (cross-controller compose with Popover Ring 2).
    this._popoverOpenBound = () => this._initOnPopoverOpen();
    this.element.addEventListener('popover:open', this._popoverOpenBound, { once: true });
  }

  disconnect() {
    this._destroyed = true;
    if (this._popoverOpenBound) {
      this.element.removeEventListener('popover:open', this._popoverOpenBound);
      this._popoverOpenBound = null;
    }
    if (this._inputChangeBound && this.hasInputTarget) {
      this.inputTarget.removeEventListener('input', this._inputChangeBound);
      this._inputChangeBound = null;
    }
    // Coloris is global ; no per-instance destroy needed.
  }

  _initOnPopoverOpen() {
    if (this._destroyed) return;
    if (this._initialized) return;
    if (_Coloris) {
      this._beginColoris(_Coloris);
    } else {
      loadColoris().then((factory) => {
        if (this._destroyed) return;
        if (this._initialized) return;
        this._beginColoris(factory);
      });
    }
  }

  _beginColoris(factory) {
    if (!this.hasInputTarget) return;
    factory({
      el: this.inputTarget,
      alpha: this.alphaValue,
      swatches: this.swatchesValue,
      format: this.formatValue,
      defaultColor: this.defaultColorValue,
      theme: 'default',
      themeMode: 'auto',
    });
    this._initialized = true;
    this.element.setAttribute('data-color-picker-state', 'ready');

    this._inputChangeBound = () => this._dispatchChange();
    this.inputTarget.addEventListener('input', this._inputChangeBound);

    this.element.dispatchEvent(
      new CustomEvent('color-picker:ready', {
        bubbles: true,
        composed: true,
        detail: {},
      }),
    );
  }

  _dispatchChange() {
    if (!this.hasInputTarget) return;
    const value = this.inputTarget.value;
    this._renderPreview(value);
    this.element.dispatchEvent(
      new CustomEvent('color-picker:change', {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
  }

  _renderPreview(value) {
    if (this.hasPreviewTarget) {
      this.previewTarget.style.backgroundColor = value;
    }
  }
}
