import { describe, it, expect, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import NumberInputController from '../../src/js/controllers/number-input_controller.js';

/**
 * Unit tests for the NumberInput compound's `number-input` controller (S2.6).
 *
 * Coverage map (10 tests):
 *
 *  Stepper invocation
 *   1. increment() — calls input.stepUp(), value increases by step.
 *   2. decrement() — calls input.stepDown(), value decreases by step.
 *   3. increment() respects step="5".
 *   4. decrement() respects step="0.01" (decimal).
 *
 *  Empty-input fallback
 *   5. increment() on empty input → seeds with min (or '0' if no min).
 *   6. decrement() on empty input → seeds with max (or '0' if no max).
 *
 *  Boundary state (button disabled at edge)
 *   7. value at min → decrement button disabled, increment enabled.
 *   8. value at max → increment button disabled, decrement enabled.
 *
 *  Disabled / readonly
 *   9. disabled input → both buttons no-op (don't change value).
 *  10. native input event fires after stepUp/stepDown — bubbles up.
 */
describe('NumberInputController', () => {
  let app;

  afterEach(() => {
    if (app) app.stop();
    document.body.innerHTML = '';
  });

  async function mount({
    value = '',
    min = null,
    max = null,
    step = null,
    disabled = false,
    readonly = false,
  } = {}) {
    const minAttr = min !== null ? ` min="${min}"` : '';
    const maxAttr = max !== null ? ` max="${max}"` : '';
    const stepAttr = step !== null ? ` step="${step}"` : '';
    const valueAttr = value !== '' ? ` value="${value}"` : '';
    const disabledAttr = disabled ? ' disabled' : '';
    const readonlyAttr = readonly ? ' readonly' : '';

    document.body.innerHTML = `
      <div id="ni" class="theme-number-input" data-controller="number-input">
        <button id="dec" type="button" class="theme-number-input__btn--decrement"
                data-number-input-target="decrement"
                data-action="click->number-input#decrement"${disabledAttr}>−</button>
        <input id="inp" class="theme-number-input__input" type="number" inputmode="numeric"
               data-number-input-target="input"${valueAttr}${minAttr}${maxAttr}${stepAttr}${disabledAttr}${readonlyAttr}>
        <button id="inc" type="button" class="theme-number-input__btn--increment"
                data-number-input-target="increment"
                data-action="click->number-input#increment"${disabledAttr}>+</button>
      </div>
    `;
    app = Application.start();
    app.register('number-input', NumberInputController);
    await new Promise((r) => setTimeout(r, 0));
    return {
      wrap: document.getElementById('ni'),
      input: document.getElementById('inp'),
      dec: document.getElementById('dec'),
      inc: document.getElementById('inc'),
    };
  }

  it('increment() — calls input.stepUp(), value increases by 1', async () => {
    const { input, inc } = await mount({ value: 5 });
    inc.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(input.value).toBe('6');
  });

  it('decrement() — calls input.stepDown(), value decreases by 1', async () => {
    const { input, dec } = await mount({ value: 5 });
    dec.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(input.value).toBe('4');
  });

  it('increment() respects step="5"', async () => {
    const { input, inc } = await mount({ value: 10, step: 5 });
    inc.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(input.value).toBe('15');
  });

  it('decrement() respects step="0.01" (decimal)', async () => {
    const { input, dec } = await mount({ value: 9.99, step: 0.01, min: 0 });
    dec.click();
    await new Promise((r) => setTimeout(r, 0));
    // Browser stepDown with float step has minor float arithmetic — check
    // approx via parseFloat round-trip. happy-dom matches Chromium's behavior.
    expect(parseFloat(input.value)).toBeCloseTo(9.98, 2);
  });

  it('increment() on empty input → seeds with min', async () => {
    const { input, inc } = await mount({ value: '', min: 3, max: 10 });
    inc.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(input.value).toBe('3');
  });

  it('decrement() on empty input → seeds with max', async () => {
    const { input, dec } = await mount({ value: '', min: 3, max: 10 });
    dec.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(input.value).toBe('10');
  });

  it('value at min → decrement button disabled, increment enabled', async () => {
    const { dec, inc } = await mount({ value: 1, min: 1, max: 10 });
    expect(dec.disabled).toBe(true);
    expect(inc.disabled).toBe(false);
  });

  it('value at max → increment button disabled, decrement enabled', async () => {
    const { dec, inc } = await mount({ value: 10, min: 1, max: 10 });
    expect(dec.disabled).toBe(false);
    expect(inc.disabled).toBe(true);
  });

  it('disabled input → both buttons no-op (do not change value)', async () => {
    const { input, dec, inc } = await mount({ value: 5, disabled: true });
    inc.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(input.value).toBe('5');
    dec.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(input.value).toBe('5');
  });

  it('native input event fires after stepUp — bubbles up', async () => {
    const { input, inc } = await mount({ value: 5 });
    let captured = null;
    input.addEventListener('input', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, value: e.target.value };
    });
    inc.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('input');
    expect(captured.bubbles).toBe(true);
    expect(captured.value).toBe('6');
  });
});
