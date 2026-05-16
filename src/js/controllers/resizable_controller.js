import { Controller } from '@hotwired/stimulus';

/**
 * resizable — 2-pane resizable container with pointer + keyboard drag handle.
 *
 * Per OQ-36 (sealed S2.4 opening): event-only persistence. The controller
 * dispatches `resizable:change` detail.{size, direction} on every drag
 * commit; the consumer chooses whether to persist (localStorage / cookie /
 * URL / no persistence). Cohérent kit doctrine "no implicit side effects".
 *
 * Architecture:
 *   CSS Grid 2-pane layout with the start pane's size driven by a CSS
 *   custom property `--cremona-resizable-size`. The controller updates this
 *   custom prop on pointer move + keyboard arrow keys. The handle in the
 *   middle is a draggable + focusable element with role="separator".
 *
 * Per WAI-ARIA APG "Window Splitter":
 *   - role="separator" on the handle.
 *   - aria-orientation matches the controller's orientation value.
 *   - aria-valuemin / aria-valuemax / aria-valuenow expressed as percentages
 *     of the wrap's main-axis size (0-100).
 *   - aria-controls referencing the start pane's id (when consumer provides
 *     one) — purely informative for SR users.
 *
 * Keyboard:
 *   - Horizontal: ArrowLeft / ArrowRight = ±10 px on the start pane.
 *   - Vertical:   ArrowUp / ArrowDown    = ±10 px.
 *   - Home / End: snap to minSize / maxSize.
 *   - Enter: no-op (separator is not an action button).
 *
 * Per S1.4b descriptor-binding gotcha: tests call controller methods
 * directly (`ctrl._onPointerDown({...})`, `ctrl._onKeyDown({key: 'ArrowRight'})`).
 *
 * Targets:
 *   handle (required) — the drag handle element.
 *   startPane (optional) — the start pane; the controller sets its
 *     aria-controls reference but does not require a target for sizing
 *     (the CSS custom prop on the wrap drives grid layout).
 *
 * Values:
 *   orientation (String, default 'horizontal') — horizontal | vertical.
 *   size (Number, default 50) — initial size of start pane as percentage
 *     of wrap's main-axis size (0-100).
 *   minSize (Number, default 10) — minimum size in percent.
 *   maxSize (Number, default 90) — maximum size in percent.
 *   step (Number, default 5) — keyboard increment in percent of the main
 *     axis (NOT pixels — pixel-step on a 1000 px wrap would be 1 % per
 *     keystroke, far too slow ; 5 % keeps drag-or-keyboard parity).
 */
export default class ResizableController extends Controller {
  static targets = ['handle', 'startPane'];

  static values = {
    orientation: { type: String, default: 'horizontal' },
    size: { type: Number, default: 50 },
    minSize: { type: Number, default: 10 },
    maxSize: { type: Number, default: 90 },
    step: { type: Number, default: 5 },
  };

  connect() {
    if (this.hasHandleTarget) {
      this.handleTarget.addEventListener('pointerdown', this._onPointerDown);
      this.handleTarget.addEventListener('keydown', this._onKeyDown);
      this._initAria();
    }
    this._applySize();
  }

  disconnect() {
    if (this.hasHandleTarget) {
      this.handleTarget.removeEventListener('pointerdown', this._onPointerDown);
      this.handleTarget.removeEventListener('keydown', this._onKeyDown);
    }
    this._removePointerListeners();
  }

  /**
   * Stamp role="separator", aria-orientation, aria-value* and tabindex on
   * the handle. Idempotent — keeps consumer-provided ARIA attrs untouched.
   */
  _initAria() {
    const h = this.handleTarget;
    if (!h.hasAttribute('role')) h.setAttribute('role', 'separator');
    if (!h.hasAttribute('aria-orientation')) {
      h.setAttribute('aria-orientation', this.orientationValue);
    }
    if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '0');
    this._updateAriaValue();
  }

  _updateAriaValue() {
    if (!this.hasHandleTarget) return;
    const h = this.handleTarget;
    h.setAttribute('aria-valuenow', String(Math.round(this.sizeValue)));
    h.setAttribute('aria-valuemin', String(Math.round(this.minSizeValue)));
    h.setAttribute('aria-valuemax', String(Math.round(this.maxSizeValue)));
  }

  _applySize() {
    this.element.style.setProperty('--cremona-resizable-size', `${this.sizeValue}%`);
  }

  /** Stimulus auto-callback. */
  sizeValueChanged() {
    this._applySize();
    this._updateAriaValue();
  }

  _onPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return; // primary button only
    if (typeof event.preventDefault === 'function') event.preventDefault();
    this._dragActive = true;
    this._dragStartPointer = this._axisCoord(event);
    this._dragStartSize = this.sizeValue;
    this._dragWrapBox = this.element.getBoundingClientRect();
    if (typeof this.handleTarget.setPointerCapture === 'function' && event.pointerId != null) {
      try {
        this.handleTarget.setPointerCapture(event.pointerId);
      } catch {
        // happy-dom may throw; safe to ignore for tests.
      }
    }
    this.handleTarget.addEventListener('pointermove', this._onPointerMove);
    this.handleTarget.addEventListener('pointerup', this._onPointerUp);
    this.handleTarget.addEventListener('pointercancel', this._onPointerUp);
    this.element.setAttribute('data-dragging', 'true');
  };

  _onPointerMove = (event) => {
    if (!this._dragActive) return;
    const delta = this._axisCoord(event) - this._dragStartPointer;
    const axis = this.orientationValue === 'vertical' ? this._dragWrapBox.height : this._dragWrapBox.width;
    if (!axis || axis <= 0) return;
    const deltaPercent = (delta / axis) * 100;
    const next = this._clamp(this._dragStartSize + deltaPercent);
    if (next !== this.sizeValue) {
      this.sizeValue = next;
      // Apply synchronously — sizeValueChanged() (MutationObserver-driven) is
      // the secondary safety net but fires on microtask. For drag responsiveness
      // and test determinism, apply the CSS custom prop immediately.
      this._applySize();
      this._updateAriaValue();
    }
  };

  _onPointerUp = (event) => {
    if (!this._dragActive) return;
    this._dragActive = false;
    if (typeof this.handleTarget.releasePointerCapture === 'function' && event && event.pointerId != null) {
      try {
        this.handleTarget.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
    this._removePointerListeners();
    this.element.removeAttribute('data-dragging');
    this._dispatch();
  };

  _removePointerListeners() {
    if (!this.hasHandleTarget) return;
    this.handleTarget.removeEventListener('pointermove', this._onPointerMove);
    this.handleTarget.removeEventListener('pointerup', this._onPointerUp);
    this.handleTarget.removeEventListener('pointercancel', this._onPointerUp);
  }

  _onKeyDown = (event) => {
    const isHorizontal = this.orientationValue !== 'vertical';
    let next = this.sizeValue;
    let consumed = false;
    switch (event.key) {
      case 'ArrowRight':
        if (isHorizontal) { next = this.sizeValue + this.stepValue; consumed = true; }
        break;
      case 'ArrowLeft':
        if (isHorizontal) { next = this.sizeValue - this.stepValue; consumed = true; }
        break;
      case 'ArrowDown':
        if (!isHorizontal) { next = this.sizeValue + this.stepValue; consumed = true; }
        break;
      case 'ArrowUp':
        if (!isHorizontal) { next = this.sizeValue - this.stepValue; consumed = true; }
        break;
      case 'Home':
        next = this.minSizeValue;
        consumed = true;
        break;
      case 'End':
        next = this.maxSizeValue;
        consumed = true;
        break;
      default:
        return;
    }
    if (!consumed) return;
    if (typeof event.preventDefault === 'function') event.preventDefault();
    const clamped = this._clamp(next);
    if (clamped === this.sizeValue) return;
    this.sizeValue = clamped;
    // Apply synchronously (sizeValueChanged is the async safety net).
    this._applySize();
    this._updateAriaValue();
    this._dispatch();
  };

  _axisCoord(event) {
    return this.orientationValue === 'vertical' ? event.clientY : event.clientX;
  }

  _clamp(value) {
    return Math.min(this.maxSizeValue, Math.max(this.minSizeValue, value));
  }

  _dispatch() {
    this.element.dispatchEvent(
      new CustomEvent('resizable:change', {
        bubbles: true,
        composed: true,
        detail: {
          size: this.sizeValue,
          orientation: this.orientationValue,
        },
      }),
    );
  }
}
