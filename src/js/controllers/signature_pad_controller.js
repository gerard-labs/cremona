/**
 * signature-pad controller — Form-Signature (Ring 3 S3.3a-2).
 *
 * 9th Ring 3 controller (after password-strength + session-timeout-countdown +
 * back-to-top + product-tour + form-with-steps + address-autocomplete +
 * form-date-range + color-picker).
 *
 * Lazy-loads signature_pad v5.x on first pointerdown on the canvas per
 * ADR-0024. Mirror ADR-0018
 * lazy-on-first-interaction variant verbatim (2nd use after zxcvbn-on-first-
 * keystroke). The canvas renders empty by default ; signature_pad only runs
 * when the user starts drawing.
 *
 * Synthetic pointerdown replay AFTER lazy load ensures no lost first-stroke
 * coordinates : the controller captures the first pointerdown event, lazy-
 * loads signature_pad, then dispatches a synthetic pointerdown with the
 * original coordinates so the stroke starts at the correct origin.
 *
 * Surface :
 *   data-controller="signature-pad"
 *   data-signature-pad-pen-color-value="#000000"
 *   data-signature-pad-background-color-value="rgba(255,255,255,0)"
 *   data-signature-pad-min-width-value="0.5"
 *   data-signature-pad-max-width-value="2.5"
 *
 *   Events (bubbles + composed) :
 *     signature-pad:mount
 *     signature-pad:ready
 *     signature-pad:change   (detail.{ isEmpty, dataUrl })
 *     signature-pad:clear
 */

import { Controller } from '@hotwired/stimulus';
import { t } from '../utils/i18n.js';

let _SignaturePad = null;
let _SignaturePadPromise = null;

function loadSignaturePad() {
  if (_SignaturePad) return Promise.resolve(_SignaturePad);
  if (_SignaturePadPromise) return _SignaturePadPromise;
  _SignaturePadPromise = import('signature_pad').then((mod) => {
    _SignaturePad = mod.default;
    return _SignaturePad;
  });
  return _SignaturePadPromise;
}

/**
 * Reset the module-scoped lazy-load cache. Test-only — exposed for the
 * Vitest unit suite to isolate per-test mock state. Mirror chart /
 * file-upload / product-tour / password-strength / color-picker precedent.
 */
export function __resetSignaturePadCache() {
  _SignaturePad = null;
  _SignaturePadPromise = null;
}

export default class SignaturePadController extends Controller {
  static targets = ['canvas', 'hiddenInput', 'clearBtn'];
  static values = {
    penColor: { type: String, default: '#000000' },
    backgroundColor: { type: String, default: 'rgba(255, 255, 255, 0)' },
    minWidth: { type: Number, default: 0.5 },
    maxWidth: { type: Number, default: 2.5 },
  };

  // Class-field initial-fire guards.
  _destroyed = false;
  _pad = null;
  _pointerDownBound = null;

  connect() {
    this._destroyed = false;
    this._pad = null;

    // Sync paint : canvas ARIA + high-DPI sizing + event dispatch happen immediately.
    if (this.hasCanvasTarget) {
      this.canvasTarget.setAttribute('role', 'img');
      if (!this.canvasTarget.getAttribute('aria-label')) {
        this.canvasTarget.setAttribute('aria-label', t('theme.form.signature.aria.label'));
      }
      this._resizeCanvas();
    }
    this.element.setAttribute('data-signature-pad-state', 'idle');
    this.element.dispatchEvent(
      new CustomEvent('signature-pad:mount', {
        bubbles: true,
        composed: true,
        detail: {},
      }),
    );

    // Lazy load on FIRST pointerdown (saves chunk for users who never sign).
    this._pointerDownBound = (e) => this._initOnPointerDown(e);
    if (this.hasCanvasTarget) {
      this.canvasTarget.addEventListener('pointerdown', this._pointerDownBound, { once: true });
    }
  }

  disconnect() {
    this._destroyed = true;
    if (this.hasCanvasTarget && this._pointerDownBound) {
      this.canvasTarget.removeEventListener('pointerdown', this._pointerDownBound);
      this._pointerDownBound = null;
    }
    if (this._pad && typeof this._pad.off === 'function') {
      this._pad.off();
      this._pad = null;
    }
  }

  _initOnPointerDown(event) {
    if (this._destroyed) return;
    if (this._pad) return;
    if (_SignaturePad) {
      this._beginPad(_SignaturePad, event);
    } else {
      loadSignaturePad().then((Ctor) => {
        if (this._destroyed) return;
        if (this._pad) return;
        this._beginPad(Ctor, event);
      });
    }
  }

  _beginPad(Ctor, firstEvent) {
    if (!this.hasCanvasTarget) return;
    this._pad = new Ctor(this.canvasTarget, {
      penColor: this.penColorValue,
      backgroundColor: this.backgroundColorValue,
      minWidth: this.minWidthValue,
      maxWidth: this.maxWidthValue,
    });
    this.element.setAttribute('data-signature-pad-state', 'ready');

    // Replay the missed pointerdown event so the first stroke isn't lost.
    if (firstEvent && this.canvasTarget && typeof PointerEvent !== 'undefined') {
      const synth = new PointerEvent('pointerdown', {
        bubbles: true,
        clientX: firstEvent.clientX,
        clientY: firstEvent.clientY,
        pointerId: firstEvent.pointerId ?? 1,
        pointerType: firstEvent.pointerType ?? 'mouse',
      });
      this.canvasTarget.dispatchEvent(synth);
    }

    if (typeof this._pad.addEventListener === 'function') {
      this._pad.addEventListener('endStroke', () => this._dispatchChange());
    }

    this.element.dispatchEvent(
      new CustomEvent('signature-pad:ready', {
        bubbles: true,
        composed: true,
        detail: {},
      }),
    );
  }

  /** Wired via `data-action="click->signature-pad#clear"` on the Clear button. */
  clear() {
    if (this._pad && typeof this._pad.clear === 'function') {
      this._pad.clear();
      this._syncHiddenInput('');
      this.element.dispatchEvent(
        new CustomEvent('signature-pad:clear', { bubbles: true, composed: true }),
      );
    }
  }

  _dispatchChange() {
    if (!this._pad) return;
    const isEmpty = typeof this._pad.isEmpty === 'function' ? this._pad.isEmpty() : false;
    const dataUrl = typeof this._pad.toDataURL === 'function' ? this._pad.toDataURL('image/png') : '';
    this._syncHiddenInput(dataUrl);
    this.element.dispatchEvent(
      new CustomEvent('signature-pad:change', {
        bubbles: true,
        composed: true,
        detail: { isEmpty, dataUrl },
      }),
    );
  }

  _syncHiddenInput(value) {
    if (this.hasHiddenInputTarget) {
      this.hiddenInputTarget.value = value;
    }
  }

  _resizeCanvas() {
    const canvas = this.canvasTarget;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(ratio, ratio);
  }
}
