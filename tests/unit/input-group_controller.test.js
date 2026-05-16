import { describe, it, expect, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import InputGroupController from '../../src/js/controllers/input-group_controller.js';

/**
 * Unit tests for the InputGroup primitive's `input-group` Stimulus
 * controller.
 *
 * Validates:
 *   - connect() stamps the input target onto the first .cremona-input
 *   - focusInput() focuses the inner input
 *   - clear() wipes the value, dispatches input + change, refocuses
 *   - delegateClick on the prefix focuses the input
 *   - delegateClick on a button inside the prefix is skipped (no focus steal)
 */
describe('InputGroupController', () => {
  let app;

  afterEach(() => {
    if (app) app.stop();
    document.body.innerHTML = '';
  });

  async function mount(innerHTML) {
    document.body.innerHTML = innerHTML;
    app = Application.start();
    app.register('input-group', InputGroupController);
    await new Promise((r) => setTimeout(r, 0));
  }

  it('connect() stamps data-input-group-target="input" on the first .cremona-input', async () => {
    await mount(`
      <div class="cremona-input-group" data-controller="input-group" data-action="click->input-group#delegateClick">
        <span class="cremona-input-group__prefix">€</span>
        <input class="cremona-input" type="number">
      </div>
    `);
    const input = document.querySelector('input.cremona-input');
    expect(input.getAttribute('data-input-group-target')).toBe('input');
  });

  it('focusInput() focuses the inner input', async () => {
    await mount(`
      <div class="cremona-input-group" data-controller="input-group" data-action="click->input-group#delegateClick">
        <input class="cremona-input" type="text">
        <span class="cremona-input-group__suffix">EUR</span>
      </div>
    `);
    const input = document.querySelector('input.cremona-input');
    const focusSpy = vi.spyOn(input, 'focus');
    // Click on suffix → delegates to focusInput
    document.querySelector('.cremona-input-group__suffix').click();
    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it('clear() wipes value, dispatches input + change, refocuses', async () => {
    await mount(`
      <div class="cremona-input-group" data-controller="input-group" data-action="click->input-group#delegateClick">
        <input class="cremona-input" type="text" value="hello">
        <span class="cremona-input-group__suffix">
          <button type="button" data-action="click->input-group#clear" aria-label="Clear">×</button>
        </span>
      </div>
    `);
    const input = document.querySelector('input.cremona-input');
    const events = [];
    input.addEventListener('input',  (e) => events.push(`input:${e.target.value}`));
    input.addEventListener('change', (e) => events.push(`change:${e.target.value}`));
    const focusSpy = vi.spyOn(input, 'focus');

    document.querySelector('button[data-action*="clear"]').click();
    await Promise.resolve();

    expect(input.value).toBe('');
    expect(events).toEqual(['input:', 'change:']);
    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it('delegateClick on a non-button prefix focuses the input', async () => {
    await mount(`
      <div class="cremona-input-group" data-controller="input-group" data-action="click->input-group#delegateClick">
        <span class="cremona-input-group__prefix">€</span>
        <input class="cremona-input" type="number">
      </div>
    `);
    const input = document.querySelector('input.cremona-input');
    const focusSpy = vi.spyOn(input, 'focus');
    document.querySelector('.cremona-input-group__prefix').click();
    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it('delegateClick on a button INSIDE the prefix does NOT steal focus from the button', async () => {
    await mount(`
      <div class="cremona-input-group" data-controller="input-group" data-action="click->input-group#delegateClick">
        <span class="cremona-input-group__prefix">
          <button type="button" aria-label="Help">?</button>
        </span>
        <input class="cremona-input" type="text">
      </div>
    `);
    const input = document.querySelector('input.cremona-input');
    const focusSpy = vi.spyOn(input, 'focus');
    document.querySelector('.cremona-input-group__prefix button').click();
    // Click bubbles to the group's delegateClick, but the closest('button')
    // check short-circuits before focusInput() runs.
    expect(focusSpy).not.toHaveBeenCalled();
  });
});
