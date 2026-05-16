import DrawerController from './drawer_controller.js';

/**
 * sheet — responsive variant of Drawer.
 *
 * Per Ring 2 S2.2 OQ-26 doctrine: bottom-sheet on mobile (< 768 px),
 * side-drawer on desktop (≥ 768 px). The responsive switch is ENTIRELY
 * CSS-time — `sheet.css` has a media query at the 768 px breakpoint
 * that overrides the per-edge pinning to force bottom-sheet semantics
 * regardless of the `data-edge` attribute. The controller doesn't
 * observe the breakpoint.
 *
 * Sheet extends DrawerController to inherit ALL modal mechanics (showModal,
 * focus snapshot+return, cancel/close events, backdrop policy, Esc policy,
 * edge value). The only override is the dispatched event names — `sheet:*`
 * instead of `drawer:*` — so consumer listeners can filter by intent
 * (`document.addEventListener('sheet:open', ...)` is clearer than checking
 * `.theme-sheet-wrap` ancestor on every `drawer:open`).
 *
 * The event detail.edge reports the consumer's configured edge value
 * (NOT the responsively-rendered edge — on mobile it's always "bottom"
 * visually, but the API-level intent is what gets logged for analytics).
 *
 * Targets (inherited): dialog (required), trigger (optional).
 * Values (inherited from Drawer):
 *   open                 (Boolean, default false)
 *   closeOnEscape        (Boolean, default true)
 *   closeOnBackdropClick (Boolean, default true)
 *   edge                 (String,  default 'end')
 *
 * Events emitted (override DrawerController's drawer:*):
 *   sheet:open  — bubbles + composed. detail.edge = the configured edge.
 *   sheet:close — bubbles + composed.
 */
export default class SheetController extends DrawerController {
  _showNative() {
    if (!this.hasDialogTarget) return;
    if (this.dialogTarget.open) return;
    this._returnFocus = document.activeElement;
    this.dialogTarget.showModal();
    this.element.dispatchEvent(
      new CustomEvent('sheet:open', {
        bubbles: true,
        composed: true,
        detail: { edge: this.edgeValue },
      }),
    );
  }

  _onNativeClose = () => {
    if (this.openValue) this.openValue = false;
    if (this._returnFocus && typeof this._returnFocus.focus === 'function') {
      this._returnFocus.focus();
    }
    this._returnFocus = null;
    this.element.dispatchEvent(
      new CustomEvent('sheet:close', {
        bubbles: true,
        composed: true,
      }),
    );
  };
}
