import { describe, it, expect, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import CheckboxIndeterminateController from '../../src/js/controllers/checkbox-indeterminate_controller.js';

/**
 * Unit tests for the Checkbox primitive's `checkbox-indeterminate` Stimulus
 * controller. The controller has two responsibilities:
 *   1. connect() — set el.indeterminate = true when data-indeterminate="true"
 *   2. clear()    — on user change, sync the marker attribute so a reconnect
 *                   won't resurrect the indeterminate state.
 *
 * happy-dom note: the native <input type="checkbox"> `indeterminate` property
 * is supported (it's part of the HTMLInputElement IDL), so we can assert it
 * directly without stubs. The pattern matches `textarea-autosize` (controller
 * attached to the element, no wrapper).
 */
describe('CheckboxIndeterminateController', () => {
  let app;

  afterEach(() => {
    if (app) app.stop();
    document.body.innerHTML = '';
  });

  async function mount({ initialIndeterminate = null } = {}) {
    const indeterminateAttr = initialIndeterminate !== null
      ? `data-indeterminate="${initialIndeterminate}"`
      : '';
    document.body.innerHTML = `
      <input type="checkbox"
        class="theme-checkbox__input"
        data-controller="checkbox-indeterminate"
        data-action="change->checkbox-indeterminate#clear"
        ${indeterminateAttr}>
    `;
    const el = document.querySelector('input');
    app = Application.start();
    app.register('checkbox-indeterminate', CheckboxIndeterminateController);
    await new Promise((r) => setTimeout(r, 0));
    return el;
  }

  it('connect() leaves indeterminate=false when data-indeterminate is absent', async () => {
    const el = await mount();
    expect(el.indeterminate).toBe(false);
  });

  it('connect() leaves indeterminate=false when data-indeterminate="false"', async () => {
    const el = await mount({ initialIndeterminate: 'false' });
    expect(el.indeterminate).toBe(false);
  });

  it('connect() sets el.indeterminate=true when data-indeterminate="true"', async () => {
    const el = await mount({ initialIndeterminate: 'true' });
    expect(el.indeterminate).toBe(true);
  });

  it('clear() syncs the marker attribute on user-toggle change event', async () => {
    const el = await mount({ initialIndeterminate: 'true' });
    expect(el.indeterminate).toBe(true);
    expect(el.dataset.indeterminate).toBe('true');

    // Simulate the user toggling the checkbox. Native browser behavior would
    // clear `el.indeterminate` automatically on user input; we replicate that
    // here so the controller's clear() handler is exercised independently.
    el.indeterminate = false;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));

    expect(el.dataset.indeterminate).toBe('false');
  });

  it('clear() does not reset the indeterminate DOM property (browser owns it)', async () => {
    const el = await mount({ initialIndeterminate: 'true' });
    el.indeterminate = false;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));

    // The controller MUST NOT touch el.indeterminate — that is the browser's
    // responsibility on user input. Verifying the DOM property is still false
    // (= what the user-toggle set it to) confirms the controller hasn't
    // re-applied the indeterminate state after the toggle.
    expect(el.indeterminate).toBe(false);
  });
});
