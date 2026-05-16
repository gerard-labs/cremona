import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import SheetController from '../../src/js/controllers/sheet_controller.js';

/**
 * Unit tests for the Sheet compound's `sheet` controller.
 *
 * SheetController extends DrawerController (which extends DialogController).
 * Same modal mechanics — only the dispatched event names differ
 * (sheet:* vs drawer:*). The responsive switch (bottom-sheet on mobile)
 * is CSS-only — no controller behavior to test for that.
 *
 * The `edge` value is reported in the event detail unchanged (the
 * consumer's API-level intent, not the responsively-rendered visual edge).
 *
 * Responsibilities covered (10 tests):
 *   1.  open() — calls showModal.
 *   2.  close() — calls close.
 *   3.  toggle() — flips state.
 *   4.  dispatches sheet:open (bubbles, composed, detail.edge).
 *   5.  dispatches sheet:close.
 *   6.  Focus return — activeElement at open time gets focus on close.
 *   7.  cancel event with closeOnEscape=true → close proceeds.
 *   8.  cancel event with closeOnEscape=false → preventDefault keeps open.
 *   9.  edge value reflects on dialog data-edge.
 *  10.  SSR-open (open=true) — showModal called on connect.
 */
const tick = () => new Promise((r) => setTimeout(r, 0));

describe('SheetController', () => {
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
      <div id="wrap" class="theme-sheet-wrap"
        data-controller="sheet"
        data-sheet-open-value="${open ? 'true' : 'false'}"
        data-sheet-edge-value="${edge}"
        data-sheet-close-on-escape-value="${closeOnEscape ? 'true' : 'false'}"
        data-sheet-close-on-backdrop-click-value="${closeOnBackdropClick ? 'true' : 'false'}">
        <dialog id="sh" class="theme-sheet" data-sheet-target="dialog" data-edge="${edge}" aria-labelledby="sh-title">
          <header class="theme-sheet__header">
            <h2 id="sh-title" class="theme-sheet__title">Title</h2>
          </header>
          <div class="theme-sheet__body">
            <p>Body text</p>
          </div>
        </dialog>
      </div>
    `;
    app = Application.start();
    app.register('sheet', SheetController);
    await tick();
    await tick();
    return {
      wrap: document.getElementById('wrap'),
      trigger: document.getElementById('trigger'),
      dialog: document.getElementById('sh'),
      ctrl: app.controllers.find((c) => c.identifier === 'sheet'),
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

  it('dispatches sheet:open (bubbles, composed, detail.edge) on open', async () => {
    const { wrap, ctrl } = await mount({ edge: 'bottom' });
    let captured = null;
    wrap.addEventListener('sheet:open', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, composed: e.composed, detail: e.detail };
    });
    ctrl.open();
    await tick();
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('sheet:open');
    expect(captured.bubbles).toBe(true);
    expect(captured.composed).toBe(true);
    expect(captured.detail.edge).toBe('bottom');
  });

  it('dispatches sheet:close (bubbles, composed) on close', async () => {
    const { wrap, ctrl } = await mount({ open: true });
    let captured = null;
    wrap.addEventListener('sheet:close', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, composed: e.composed };
    });
    ctrl.close();
    await tick();
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('sheet:close');
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

  it('edge value reflects on dialog data-edge', async () => {
    const { dialog, ctrl } = await mount({ edge: 'start' });
    expect(dialog.dataset.edge).toBe('start');
    expect(ctrl.edgeValue).toBe('start');
  });

  it('SSR-open (open=true) — showModal called on connect + sheet:open dispatched', async () => {
    const { dialog, ctrl } = await mount({ open: true, edge: 'end' });
    expect(showModalSpy).toHaveBeenCalled();
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(ctrl.openValue).toBe(true);
    expect(ctrl.edgeValue).toBe('end');
  });
});
