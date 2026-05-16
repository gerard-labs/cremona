import { describe, it, expect, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import TooltipController from '../../src/js/controllers/tooltip_controller.js';

/**
 * Unit tests for the Tooltip primitive's `tooltip` controller.
 *
 * Responsibilities covered:
 *   1. dismiss() — Esc keydown stamps data-state="dismissed" on the wrap.
 *   2. dismiss() — non-Esc keydown is a no-op.
 *   3. reset() — focusout to outside the wrap clears the dismissed state.
 *   4. reset() — focusout to inside the wrap does NOT clear (e.g. moving
 *      between the trigger and a child of the trigger keeps dismissed).
 */
describe('TooltipController', () => {
  let app;

  afterEach(() => {
    if (app) app.stop();
    document.body.innerHTML = '';
  });

  async function mount() {
    document.body.innerHTML = `
      <span class="cremona-tooltip-wrap" id="wrap"
        data-controller="tooltip"
        data-action="keydown.esc->tooltip#dismiss focusout->tooltip#reset">
        <button id="trigger" type="button" aria-describedby="tt">Trigger</button>
        <span id="tt" class="cremona-tooltip" role="tooltip">Tooltip text</span>
      </span>
      <button id="outside" type="button">Outside</button>
    `;
    app = Application.start();
    app.register('tooltip', TooltipController);
    await new Promise((r) => setTimeout(r, 0));
    return {
      wrap: document.getElementById('wrap'),
      trigger: document.getElementById('trigger'),
      outside: document.getElementById('outside'),
    };
  }

  it('dismiss() — Escape stamps data-state="dismissed"', async () => {
    const { wrap, trigger } = await mount();
    expect(wrap.dataset.state).toBeUndefined();
    const evt = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    trigger.dispatchEvent(evt);
    await new Promise((r) => setTimeout(r, 0));
    expect(wrap.dataset.state).toBe('dismissed');
  });

  it('dismiss() — non-Escape keydown is a no-op', async () => {
    const { wrap } = await mount();
    // Stimulus' keydown.esc filter on the action already prevents non-Esc
    // from invoking the method; this test sanity-checks the method itself.
    const ctrl = app.controllers.find((c) => c.identifier === 'tooltip');
    ctrl.dismiss({ key: 'Enter', preventDefault: () => {} });
    expect(wrap.dataset.state).toBeUndefined();
  });

  it('reset() — focusout to outside clears the dismissed flag', async () => {
    const { wrap, trigger, outside } = await mount();
    wrap.dataset.state = 'dismissed';
    const evt = new FocusEvent('focusout', { bubbles: true, relatedTarget: outside });
    trigger.dispatchEvent(evt);
    await new Promise((r) => setTimeout(r, 0));
    expect(wrap.dataset.state).toBeUndefined();
  });

  it('reset() — focusout staying inside the wrap does NOT clear', async () => {
    const { wrap, trigger } = await mount();
    wrap.dataset.state = 'dismissed';
    const tt = document.getElementById('tt');
    const evt = new FocusEvent('focusout', { bubbles: true, relatedTarget: tt });
    trigger.dispatchEvent(evt);
    await new Promise((r) => setTimeout(r, 0));
    expect(wrap.dataset.state).toBe('dismissed');
  });

  it('reset() — focusout with no relatedTarget (focus left the page) clears', async () => {
    const { wrap, trigger } = await mount();
    wrap.dataset.state = 'dismissed';
    const evt = new FocusEvent('focusout', { bubbles: true, relatedTarget: null });
    trigger.dispatchEvent(evt);
    await new Promise((r) => setTimeout(r, 0));
    expect(wrap.dataset.state).toBeUndefined();
  });
});
