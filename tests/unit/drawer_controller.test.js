import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import DrawerController from '../../src/js/controllers/drawer_controller.js';

/**
 * Unit tests for the Drawer compound's `drawer` controller.
 *
 * Per Ring 2 S2.2: DrawerController extends DialogController. Same modal
 * mechanics (showModal/close, focus snapshot+return, native cancel/close,
 * backdrop-click policy, Esc dismiss policy) — only the dispatched event
 * names differ (drawer:* vs dialog:*) and the new `edge` value carries
 * the slide direction.
 *
 * Native `<dialog>` shim in happy-dom 15 doesn't fully implement
 * showModal/close — we replace HTMLDialogElement.prototype methods with
 * deterministic spies (same pattern as dialog_controller.test.js).
 *
 * Responsibilities covered (12 tests):
 *   1.  open() — calls showModal, sets open attr.
 *   2.  close() — calls close, removes open attr.
 *   3.  toggle() — flips state.
 *   4.  dispatches drawer:open (bubbles, composed, detail.edge).
 *   5.  dispatches drawer:close (bubbles, composed).
 *   6.  Focus return — activeElement at open time gets focus on close.
 *   7.  cancel event with closeOnEscape=true — native close proceeds.
 *   8.  cancel event with closeOnEscape=false — preventDefault keeps open.
 *   9.  backdrop click → close (when closeOnBackdropClick=true).
 *  10.  click inner content → no close.
 *  11.  edge value stamped on data-edge of the dialog (consumer-side
 *       expectation that Twig template mirrors edgeValue into data-edge).
 *  12.  SSR-open (open=true) — showModal called on connect + edge in event.
 */
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('DrawerController', () => {
  let app;
  let showModalSpy;
  let closeSpy;

  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.dir = 'ltr';
    showModalSpy = vi.fn(function () { this.setAttribute('open', ''); });
    closeSpy = vi.fn(function () {
      if (!this.hasAttribute('open')) return;
      this.removeAttribute('open');
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
    edge = 'end',
    closeOnEscape = true,
    closeOnBackdropClick = true,
  } = {}) {
    document.body.innerHTML = `
      <button id="trigger" type="button">Open</button>
      <div id="wrap" class="cremona-drawer-wrap"
        data-controller="drawer"
        data-drawer-open-value="${open ? 'true' : 'false'}"
        data-drawer-edge-value="${edge}"
        data-drawer-close-on-escape-value="${closeOnEscape ? 'true' : 'false'}"
        data-drawer-close-on-backdrop-click-value="${closeOnBackdropClick ? 'true' : 'false'}">
        <dialog id="dr" class="cremona-drawer" data-drawer-target="dialog" data-edge="${edge}" aria-labelledby="dr-title">
          <header class="cremona-drawer__header">
            <h2 id="dr-title" class="cremona-drawer__title">Title</h2>
          </header>
          <div class="cremona-drawer__body">
            <p>Body text</p>
            <button id="inner-btn" type="button">Inner action</button>
          </div>
        </dialog>
      </div>
    `;
    app = Application.start();
    app.register('drawer', DrawerController);
    await tick();
    await tick();
    return {
      wrap: document.getElementById('wrap'),
      trigger: document.getElementById('trigger'),
      dialog: document.getElementById('dr'),
      innerBtn: document.getElementById('inner-btn'),
      ctrl: app.controllers.find((c) => c.identifier === 'drawer'),
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

  it('dispatches drawer:open (bubbles, composed, detail.edge) on open', async () => {
    const { wrap, ctrl } = await mount({ edge: 'start' });
    let captured = null;
    wrap.addEventListener('drawer:open', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, composed: e.composed, detail: e.detail };
    });
    ctrl.open();
    await tick();
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('drawer:open');
    expect(captured.bubbles).toBe(true);
    expect(captured.composed).toBe(true);
    expect(captured.detail.edge).toBe('start');
  });

  it('dispatches drawer:close (bubbles, composed) on close', async () => {
    const { wrap, ctrl } = await mount({ open: true });
    let captured = null;
    wrap.addEventListener('drawer:close', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, composed: e.composed };
    });
    ctrl.close();
    await tick();
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('drawer:close');
    expect(captured.bubbles).toBe(true);
  });

  it('focus return — activeElement at open time gets focus on close', async () => {
    const { trigger, ctrl } = await mount();
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
    ctrl.open();
    await tick();
    document.body.focus();
    ctrl.close();
    await tick();
    expect(document.activeElement).toBe(trigger);
  });

  it('cancel event with closeOnEscape=true — native close proceeds', async () => {
    const { dialog, ctrl } = await mount({ open: true });
    expect(dialog.hasAttribute('open')).toBe(true);
    const cancelEvt = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancelEvt);
    expect(cancelEvt.defaultPrevented).toBe(false);
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
    const clickEvt = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvt, 'target', { value: dialog, enumerable: true });
    dialog.dispatchEvent(clickEvt);
    await tick();
    expect(ctrl.openValue).toBe(false);
  });

  it('click on inner content (target !== dialog) → no close', async () => {
    const { dialog, ctrl, innerBtn } = await mount({ open: true });
    const clickEvt = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvt, 'target', { value: innerBtn, enumerable: true });
    dialog.dispatchEvent(clickEvt);
    await tick();
    expect(ctrl.openValue).toBe(true);
  });

  it('edge value reflects on dialog data-edge (via Twig consumer)', async () => {
    const { dialog, ctrl } = await mount({ edge: 'bottom' });
    expect(dialog.dataset.edge).toBe('bottom');
    expect(ctrl.edgeValue).toBe('bottom');
  });

  it('SSR-open (open=true) — showModal called on connect + drawer:open dispatched with edge', async () => {
    const { dialog, ctrl } = await mount({ open: true, edge: 'top' });
    expect(showModalSpy).toHaveBeenCalled();
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(ctrl.openValue).toBe(true);
    expect(ctrl.edgeValue).toBe('top');
  });
});
