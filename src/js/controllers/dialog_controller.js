import { Controller } from '@hotwired/stimulus';

/**
 * dialog — modal native `<dialog>` controller.
 *
 * Per OQ-20 doctrine [Ring 2 lock-in ADR — pending]: wraps native
 * `<dialog>` element. The native API provides top-layer positioning,
 * `::backdrop` rendering, focus trap (Tab cycles within), and Esc
 * dismiss. This controller adds the missing pieces:
 *
 *   1. Open/close orchestration synchronized with our `data-state` /
 *      `openValue` model so consumer code can drive the dialog
 *      declaratively (Stimulus values) or imperatively (open() / close()).
 *
 *   2. Focus return on close — native showModal() puts focus on the
 *      first focusable inside the dialog (or `[autofocus]` if set), but
 *      doesn't track the trigger to return focus to. We snapshot
 *      `document.activeElement` at open time and restore at close.
 *
 *   3. Backdrop click dismiss — clicking on the `::backdrop` pseudo
 *      fires a `click` event whose target IS the dialog element (the
 *      backdrop is the dialog's own painted area outside its content
 *      box). Filter via `event.target === this.dialogTarget` to
 *      distinguish backdrop from inner-content clicks.
 *
 *   4. Esc dismiss policy — native `<dialog>` always closes on Esc.
 *      For destructive confirms where Esc should NOT dismiss (the
 *      user must click an explicit button), set
 *      `closeOnEscapeValue=false` — the controller preventDefault's the
 *      native `cancel` event.
 *
 *   5. Animated close via @starting-style + transition allow-discrete
 *      in CSS (see styles/components/dialog.css). No JS-side animation
 *      orchestration needed — the browser handles the discrete-step
 *      transition between display: block and display: none.
 *
 * Per the S1.4b descriptor-binding gotcha (see Collapsible §2 +
 * ADR-0008): tests call controller methods directly (`ctrl.open()`,
 * `ctrl.close()`) rather than synthesising clicks through action
 * descriptors.
 *
 * Targets:
 *   dialog (required) — the native `<dialog>` element.
 *   trigger (optional) — the element that opened the dialog. If absent,
 *                        focus return falls back to whatever was the
 *                        document.activeElement at open time.
 *
 * Values:
 *   open (Boolean, default false) — SSR-open dialogs set this true.
 *   closeOnEscape (Boolean, default true) — false for destructive
 *                  confirms that require explicit dismissal.
 *   closeOnBackdropClick (Boolean, default true) — false for the same
 *                  destructive doctrine.
 *
 * Events emitted (raw CustomEvent, bubbles + composed — mirrors Popover):
 *   dialog:open
 *   dialog:close
 */
export default class DialogController extends Controller {
  static targets = ['dialog', 'trigger'];

  static values = {
    open: { type: Boolean, default: false },
    closeOnEscape: { type: Boolean, default: true },
    closeOnBackdropClick: { type: Boolean, default: true },
  };

  connect() {
    if (!this.hasDialogTarget) return;
    this.dialogTarget.addEventListener('close', this._onNativeClose);
    this.dialogTarget.addEventListener('cancel', this._onNativeCancel);
    this.dialogTarget.addEventListener('click', this._onClick);
  }

  disconnect() {
    if (this.hasDialogTarget) {
      this.dialogTarget.removeEventListener('close', this._onNativeClose);
      this.dialogTarget.removeEventListener('cancel', this._onNativeCancel);
      this.dialogTarget.removeEventListener('click', this._onClick);
    }
    this._returnFocus = null;
  }

  /** Explicit open — for triggers OUTSIDE the controller scope. */
  open() {
    this.openValue = true;
  }

  /** Explicit close — wired via `data-action="click->dialog#close"` on
      inner Cancel / dismiss buttons. */
  close() {
    this.openValue = false;
  }

  toggle() {
    this.openValue = !this.openValue;
  }

  openValueChanged(open, previous) {
    if (previous === undefined) {
      if (open) this._showNative();
      return;
    }
    if (open === previous) return;
    if (open) this._showNative();
    else this._closeNative();
  }

  _showNative() {
    if (!this.hasDialogTarget) return;
    // Skip if already open (avoids InvalidStateError from double-showModal).
    if (this.dialogTarget.open) return;
    this._returnFocus = document.activeElement;
    this.dialogTarget.showModal();
    this.element.dispatchEvent(
      new CustomEvent('dialog:open', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  _closeNative() {
    if (!this.hasDialogTarget) return;
    // Skip if already closed (native close() throws if not open).
    if (!this.dialogTarget.open) return;
    this.dialogTarget.close();
    // _onNativeClose fires synchronously after close() — focus return
    // + event dispatch happen there.
  }

  /**
   * Fires when the native dialog closes (either programmatically via
   * close() OR natively via Esc). Resync openValue if the native path
   * was taken (Esc), restore focus, dispatch our event.
   */
  _onNativeClose = () => {
    if (this.openValue) this.openValue = false;
    if (this._returnFocus && typeof this._returnFocus.focus === 'function') {
      this._returnFocus.focus();
    }
    this._returnFocus = null;
    this.element.dispatchEvent(
      new CustomEvent('dialog:close', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  /**
   * Native `cancel` event fires on Esc keydown (BEFORE `close`). When
   * `closeOnEscapeValue` is false, preventDefault keeps the dialog
   * open — useful for destructive confirms where the user must commit
   * via explicit button.
   */
  _onNativeCancel = (event) => {
    if (!this.closeOnEscapeValue) {
      event.preventDefault();
    }
  };

  /**
   * Backdrop click dismiss — `event.target === dialog` happens when the
   * click landed on the dialog's painted backdrop area (outside its
   * content box). Inner-content clicks have event.target somewhere
   * inside the dialog's descendant tree.
   *
   * When closeOnBackdropClickValue is false (destructive doctrine), the
   * backdrop click is ignored.
   */
  _onClick = (event) => {
    if (!this.closeOnBackdropClickValue) return;
    if (event.target === this.dialogTarget) {
      this.close();
    }
  };
}
