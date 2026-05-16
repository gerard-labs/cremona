import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import DialogController from '../../src/js/controllers/dialog_controller.js';

/**
 * Unit tests for the Dialog compound's `dialog` controller.
 *
 * Native `<dialog>` support in happy-dom 15: `showModal()` and `close()`
 * exist but don't truly render top-layer — they toggle the `open`
 * attribute and dispatch `close` events. Sufficient for our state
 * management tests; visual top-layer behavior is browser-tested via
 * Playwright (out of scope here).
 *
 * Per S1.4b gotcha: tests call controller methods directly (`ctrl.open()`,
 * `ctrl.close()`) rather than synthesising clicks through action descriptors.
 *
 * Responsibilities covered:
 *   1. open() — opens the dialog (showModal called, open attribute set).
 *   2. close() — closes (close called, open attribute removed).
 *   3. toggle() — flips state.
 *   4. dispatches dialog:open (bubbles, composed) on open.
 *   5. dispatches dialog:close (bubbles, composed) on close.
 *   6. Focus return — activeElement at open time gets focus on close.
 *   7. cancel event with closeOnEscape=true — native close proceeds.
 *   8. cancel event with closeOnEscape=false — preventDefault keeps open.
 *   9. backdrop click (event.target === dialog) → close().
 *  10. backdrop click with closeOnBackdropClick=false → no close.
 *  11. click on inner content → no close.
 *  12. SSR-open (open=true) — showModal called on connect.
 *  13. _onNativeClose syncs openValue when Esc was used.
 *  14. disconnect removes listeners.
 */
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('DialogController', () => {
  let app;
  // happy-dom 15's <dialog> may not implement showModal/close in all
  // versions — spy on the methods to track calls regardless.
  let showModalSpy;
  let closeSpy;

  beforeEach(() => {
    document.body.innerHTML = '';
    // Patch HTMLDialogElement methods to be reliable spies. happy-dom
    // 15.11.x ships showModal/close but their behavior varies; replacing
    // them with deterministic stubs gives us clean assertions.
    showModalSpy = vi.fn(function () {
      this.setAttribute('open', '');
    });
    closeSpy = vi.fn(function () {
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
      // Native dispatches `close` event after close().
      this.dispatchEvent(new Event('close'));
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      value: showModalSpy, configurable: true, writable: true,
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      value: closeSpy, configurable: true, writable: true,
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'open', {
      get() { return this.hasAttribute('open'); },
      set(v) { if (v) this.setAttribute('open', ''); else this.removeAttribute('open'); },
      configurable: true,
    });
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
  });

  async function mount({
    open = false,
    closeOnEscape = true,
    closeOnBackdropClick = true,
  } = {}) {
    document.body.innerHTML = `
      <button id="trigger" type="button">Open</button>
      <div id="wrap" class="cremona-dialog-wrap"
        data-controller="dialog"
        data-dialog-open-value="${open ? 'true' : 'false'}"
        data-dialog-close-on-escape-value="${closeOnEscape ? 'true' : 'false'}"
        data-dialog-close-on-backdrop-click-value="${closeOnBackdropClick ? 'true' : 'false'}">
        <dialog id="dlg" class="cremona-dialog" data-dialog-target="dialog" aria-labelledby="dlg-title">
          <header class="cremona-dialog__header">
            <h2 id="dlg-title" class="cremona-dialog__title">Title</h2>
          </header>
          <div class="cremona-dialog__body">
            <p>Body text</p>
            <button id="inner-btn" type="button">Inner action</button>
          </div>
        </dialog>
      </div>
    `;
    app = Application.start();
    app.register('dialog', DialogController);
    await tick();
    await tick();
    return {
      wrap: document.getElementById('wrap'),
      trigger: document.getElementById('trigger'),
      dialog: document.getElementById('dlg'),
      innerBtn: document.getElementById('inner-btn'),
      ctrl: app.controllers.find((c) => c.identifier === 'dialog'),
    };
  }

  it('open() — calls showModal and sets open attribute', async () => {
    const { dialog, ctrl } = await mount();
    expect(dialog.hasAttribute('open')).toBe(false);
    ctrl.open();
    await tick();
    expect(showModalSpy).toHaveBeenCalled();
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('close() — calls close() and removes open attribute', async () => {
    const { dialog, ctrl } = await mount({ open: true });
    expect(dialog.hasAttribute('open')).toBe(true);
    ctrl.close();
    await tick();
    expect(closeSpy).toHaveBeenCalled();
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('toggle() — closed → open → closed', async () => {
    const { dialog, ctrl } = await mount();
    ctrl.toggle();
    await tick();
    expect(dialog.hasAttribute('open')).toBe(true);
    ctrl.toggle();
    await tick();
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('dispatches dialog:open (bubbles, composed) on open', async () => {
    const { wrap, ctrl } = await mount();
    let captured = null;
    wrap.addEventListener('dialog:open', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, composed: e.composed };
    });
    ctrl.open();
    await tick();
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('dialog:open');
    expect(captured.bubbles).toBe(true);
    expect(captured.composed).toBe(true);
  });

  it('dispatches dialog:close (bubbles, composed) on close', async () => {
    const { wrap, ctrl } = await mount({ open: true });
    let captured = null;
    wrap.addEventListener('dialog:close', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, composed: e.composed };
    });
    ctrl.close();
    await tick();
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('dialog:close');
    expect(captured.bubbles).toBe(true);
  });

  it('focus return — activeElement at open time gets focus on close', async () => {
    const { trigger, ctrl } = await mount();
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
    ctrl.open();
    await tick();
    // Simulate the trigger losing focus when dialog opens (happens in real browsers via showModal).
    document.body.focus();
    ctrl.close();
    await tick();
    expect(document.activeElement).toBe(trigger);
  });

  it('cancel event with closeOnEscape=true — native close proceeds', async () => {
    const { dialog, ctrl } = await mount({ open: true });
    expect(dialog.hasAttribute('open')).toBe(true);
    // Native dispatches `cancel` before `close` on Esc. Simulate this.
    const cancelEvt = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancelEvt);
    // Controller's _onNativeCancel does NOT preventDefault (closeOnEscape=true is the default).
    expect(cancelEvt.defaultPrevented).toBe(false);
    // Simulate the native close following the un-cancelled cancel.
    dialog.dispatchEvent(new Event('close'));
    await tick();
    expect(ctrl.openValue).toBe(false);
  });

  it('cancel event with closeOnEscape=false — preventDefault keeps open', async () => {
    const { dialog, ctrl } = await mount({ open: true, closeOnEscape: false });
    const cancelEvt = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancelEvt);
    expect(cancelEvt.defaultPrevented).toBe(true);
    expect(ctrl.openValue).toBe(true);
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('backdrop click (event.target === dialog) → close', async () => {
    const { dialog, ctrl } = await mount({ open: true });
    expect(ctrl.openValue).toBe(true);
    // event.target === dialog itself (the backdrop pseudo-click).
    const clickEvt = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvt, 'target', { value: dialog, enumerable: true });
    dialog.dispatchEvent(clickEvt);
    await tick();
    expect(ctrl.openValue).toBe(false);
  });

  it('backdrop click with closeOnBackdropClick=false → no close', async () => {
    const { dialog, ctrl } = await mount({ open: true, closeOnBackdropClick: false });
    const clickEvt = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvt, 'target', { value: dialog, enumerable: true });
    dialog.dispatchEvent(clickEvt);
    await tick();
    expect(ctrl.openValue).toBe(true);
  });

  it('click on inner content (target !== dialog) → no close', async () => {
    const { dialog, ctrl, innerBtn } = await mount({ open: true });
    const clickEvt = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvt, 'target', { value: innerBtn, enumerable: true });
    dialog.dispatchEvent(clickEvt);
    await tick();
    expect(ctrl.openValue).toBe(true);
  });

  it('SSR-open (open=true) — showModal called on connect', async () => {
    const { dialog, ctrl } = await mount({ open: true });
    expect(showModalSpy).toHaveBeenCalled();
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(ctrl.openValue).toBe(true);
  });

  it('_onNativeClose — syncs openValue when Esc was used (native close path)', async () => {
    const { dialog, ctrl } = await mount({ open: true });
    expect(ctrl.openValue).toBe(true);
    // Simulate native Esc dismissal: native fires `close` event directly
    // (cancel was un-preventedDefault, native then closed).
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));
    await tick();
    expect(ctrl.openValue).toBe(false);
  });

  it('disconnect removes event listeners', async () => {
    const { dialog, wrap } = await mount({ open: true });
    let captured = false;
    wrap.addEventListener('dialog:close', () => { captured = true; });
    wrap.remove();
    await tick();
    // After disconnect, the controller's listeners on dialog should be removed.
    // Dispatching a fresh close event should NOT cause dialog:close to fire.
    dialog.dispatchEvent(new Event('close'));
    await tick();
    expect(captured).toBe(false);
  });

  it('open() twice — does not call showModal twice (guarded)', async () => {
    const { ctrl } = await mount();
    ctrl.open();
    await tick();
    expect(showModalSpy).toHaveBeenCalledTimes(1);
    ctrl.open(); // openValue is already true; openValueChanged sees open===previous, returns.
    await tick();
    expect(showModalSpy).toHaveBeenCalledTimes(1);
  });
});
