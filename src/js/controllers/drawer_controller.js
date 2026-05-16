import DialogController from './dialog_controller.js';

/**
 * drawer — modal side-panel sliding from a viewport edge.
 *
 * Extends DialogController to inherit the modal mechanics (showModal,
 * focus snapshot+return, native cancel/close, backdrop-click policy,
 * close-on-Esc policy). The new behavior at this layer is:
 *
 *   1. New static value `edge` (start | end | top | bottom). Stamped on
 *      the inner <dialog> as `data-edge` via the Twig template — the
 *      CSS picks it up to choose pinning + slide direction. Stimulus
 *      static values merge across the inheritance chain so `open`,
 *      `closeOnEscape`, `closeOnBackdropClick` from DialogController
 *      are still available + reflected as `data-drawer-*-value`.
 *
 *   2. Distinct events `drawer:open` / `drawer:close` (vs Dialog's
 *      `dialog:*`). Different compound, different consumer-side event
 *      namespace — keeps analytics + listeners ergonomic.
 *
 * The slide animation is entirely CSS-time via:
 *   - per-edge `transform: translate3d(...)` for the off-screen state
 *   - `[open]` rule for the visible state (transform: translate3d(0, 0, 0))
 *   - `@starting-style` rule per edge for the entry's starting frame
 *   - `transition allow-discrete` for the `display` / `overlay` discrete
 *     transitions (Baseline 2024 — same pattern as Dialog)
 *   - `--theme-drawer-flip` custom property (1 in LTR, -1 in RTL) inverts
 *     the inline-axis transform direction for `edge="start"` / `edge="end"`
 *
 * The controller does NOT touch the transform/inset — those are pure CSS.
 * Cohérent doctrine "logical CSS only" — Drawer needs no exception (unlike
 * Popover, where Floating UI imposes physical inline left/top).
 *
 * Targets (inherited from DialogController):
 *   dialog (required) — the native <dialog> element.
 *   trigger (optional) — the opener element.
 *
 * Values (inherited + new):
 *   open                  (Boolean, default false) — SSR-open drawers.
 *   closeOnEscape         (Boolean, default true)
 *   closeOnBackdropClick  (Boolean, default true)
 *   edge                  (String,  default 'end') — start | end | top | bottom
 *
 * Events emitted (override DialogController's dialog:* — see _showNative /
 * _onNativeClose below):
 *   drawer:open  — bubbles + composed. detail.edge = the active edge.
 *   drawer:close — bubbles + composed.
 */
export default class DrawerController extends DialogController {
  static values = {
    edge: { type: String, default: 'end' },
  };

  /**
   * Override DialogController._showNative to dispatch `drawer:open`
   * instead of `dialog:open`. Same modal mechanics — calls native
   * showModal() + snapshots focus.
   */
  _showNative() {
    if (!this.hasDialogTarget) return;
    if (this.dialogTarget.open) return;
    this._returnFocus = document.activeElement;
    this.dialogTarget.showModal();
    this.element.dispatchEvent(
      new CustomEvent('drawer:open', {
        bubbles: true,
        composed: true,
        detail: { edge: this.edgeValue },
      }),
    );
  }

  /**
   * Override DialogController._onNativeClose to dispatch `drawer:close`.
   * Same focus return + openValue sync semantics — only the event name
   * differs. Arrow function (class field) shadows the parent's binding
   * so connect()/disconnect()'s addEventListener references the child's
   * version transparently.
   */
  _onNativeClose = () => {
    if (this.openValue) this.openValue = false;
    if (this._returnFocus && typeof this._returnFocus.focus === 'function') {
      this._returnFocus.focus();
    }
    this._returnFocus = null;
    this.element.dispatchEvent(
      new CustomEvent('drawer:close', {
        bubbles: true,
        composed: true,
      }),
    );
  };
}
