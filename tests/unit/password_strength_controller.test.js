import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

// Hoisted mocks per the chart_controller.test.js / file_upload_controller.test.js
// pattern (vi.hoisted + vi.mock factory). The mock intercepts BOTH static
// and dynamic imports of '@zxcvbn-ts/core' + '@zxcvbn-ts/language-en' —
// Vite's module resolution treats them as the same module ID.
const { mockZxcvbn, mockSetOptions, scoreOverrides } = vi.hoisted(() => {
  const overrides = new Map();
  // Default scorer : returns 2 for any non-empty password unless the test
  // overrides via `scoreOverrides.set('password', N)`.
  const fn = vi.fn((password) => {
    if (overrides.has(password)) {
      return { score: overrides.get(password), feedback: { warning: '', suggestions: [] } };
    }
    return { score: password ? 2 : 0, feedback: { warning: '', suggestions: [] } };
  });
  return { mockZxcvbn: fn, mockSetOptions: vi.fn(), scoreOverrides: overrides };
});

vi.mock('@zxcvbn-ts/core', () => ({
  zxcvbn: mockZxcvbn,
  zxcvbnOptions: { setOptions: mockSetOptions },
}));
vi.mock('@zxcvbn-ts/language-en', () => ({
  translations: {},
  adjacencyGraphs: {},
  dictionary: {},
}));

const { default: PasswordStrengthController, __resetZxcvbnCache } = await import(
  '../../src/js/controllers/password_strength_controller.js'
);

// Pre-load i18n so the hint text uses real FR labels rather than the
// raw keys. Mirror auth-login test pattern.
const { setTranslations, setLocale } = await import('../../src/js/utils/i18n.js');
const frDict = (await import('../../src/js/i18n/fr.json')).default;
setTranslations('fr', frDict);
setLocale('fr');

/** Flush microtasks twice — once for Stimulus's MutationObserver, once for
 *  the debounce setTimeout + the loadZxcvbn().then() Promise resolution. */
const tick = () => new Promise((r) => setTimeout(r, 0));
const tickN = async (n = 2) => {
  for (let i = 0; i < n; i++) await tick();
};

/**
 * Unit tests for Auth-PasswordStrength's `password-strength` controller
 * (S3.1b — 1st new Ring 3 controller).
 *
 * Per [ADR-0018](../docs/adr/0018-lib-validation-zxcvbn.md) :
 *   - Lazy-load zxcvbn-ts mirror [ADR-0011/0012/0013] verbatim.
 *   - Lazy on FIRST keystroke (not on connect()) — distinct from Chart /
 *     FileUpload lazy-on-mount strategy.
 *   - Sync paint on connect() : empty hint + Progress value=0/variant=danger.
 *   - 3-tier score mapping : 0-1 danger, 2 warning, 3-4 success.
 *
 * Coverage map (12 tests) :
 *
 *   Lifecycle
 *    1. connect → empty-state paint + password-strength:mount fired.
 *    2. connect → no zxcvbn fetched (lazy on first keystroke).
 *    3. disconnect → no further DOM mutation on pending debounce.
 *
 *   Lazy load
 *    4. first keystroke → loadZxcvbn() invoked + score paints after Promise resolution.
 *    5. subsequent keystroke → cached, sync paint (no second load).
 *
 *   Score → variant mapping
 *    6. score=0 → variant='danger' + value=20.
 *    7. score=2 → variant='warning' + value=60.
 *    8. score=4 → variant='success' + value=100.
 *
 *   Event dispatch
 *    9. score=3 (≥ minScore=2) → password-strength:change detail.valid=true.
 *   10. score=1 (< minScore=2) → password-strength:change detail.valid=false.
 *
 *   Idempotency
 *   11. same score 2 typed twice → only 1 password-strength:change dispatched after first.
 *
 *   Race condition
 *   12. disconnect() before lazy-load resolves → no late paint, no event.
 */
describe('PasswordStrengthController', () => {
  let app;

  beforeEach(() => {
    __resetZxcvbnCache();
    mockZxcvbn.mockClear();
    mockSetOptions.mockClear();
    scoreOverrides.clear();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
  });

  async function mount({ minScore = 2, debounceMs = 0 } = {}) {
    document.body.innerHTML = `
      <div id="pwd-wrap" class="cremona-auth-password-strength"
        data-controller="password-strength"
        data-password-strength-min-score-value="${minScore}"
        data-password-strength-debounce-ms-value="${debounceMs}">
        <input type="password" id="pwd-input" name="password"
          data-password-strength-target="input"
          data-action="input->password-strength#evaluate"
          autocomplete="new-password"/>
        <progress class="cremona-progress" data-size="sm" data-variant="danger"
          data-password-strength-target="meter"
          value="0" max="100" aria-label="Force du mot de passe"></progress>
        <p class="cremona-auth-password-strength__hint" data-password-strength-target="hint" aria-live="polite"></p>
      </div>
    `;
    app = Application.start();
    app.register('password-strength', PasswordStrengthController);
    await tick();
    return {
      wrap: document.getElementById('pwd-wrap'),
      input: document.getElementById('pwd-input'),
      meter: document.querySelector('[data-password-strength-target="meter"]'),
      hint: document.querySelector('[data-password-strength-target="hint"]'),
    };
  }

  function fireInput(input, value) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  it('paints empty-state hint on connect + dispatches password-strength:mount', async () => {
    const mountEvent = vi.fn();
    document.addEventListener('password-strength:mount', mountEvent);
    const { meter, hint } = await mount();
    expect(meter.getAttribute('data-variant')).toBe('danger');
    expect(meter.getAttribute('value')).toBe('20');
    expect(hint.textContent).toBe('Saisis un mot de passe.');
    expect(mountEvent).toHaveBeenCalledTimes(1);
    expect(mountEvent.mock.calls[0][0].detail).toEqual({ minScore: 2 });
    document.removeEventListener('password-strength:mount', mountEvent);
  });

  it('does NOT fetch zxcvbn on connect (lazy on first keystroke)', async () => {
    await mount();
    expect(mockZxcvbn).not.toHaveBeenCalled();
  });

  it('disconnect clears pending debounce timer', async () => {
    const { input, wrap } = await mount({ debounceMs: 1000 });
    fireInput(input, 'somepass');
    wrap.remove();
    await tickN(3);
    expect(mockZxcvbn).not.toHaveBeenCalled();
  });

  it('first keystroke triggers loadZxcvbn + paints score asynchronously', async () => {
    const { input, meter, hint } = await mount();
    scoreOverrides.set('Pass1234', 2);
    fireInput(input, 'Pass1234');
    await tickN(3);
    expect(mockZxcvbn).toHaveBeenCalledWith('Pass1234');
    expect(meter.getAttribute('data-variant')).toBe('warning');
    expect(meter.getAttribute('value')).toBe('60');
    expect(hint.textContent).toBe('Moyen');
  });

  it('subsequent keystrokes hit the cache (sync), no re-load', async () => {
    const { input } = await mount();
    scoreOverrides.set('AAA', 1);
    scoreOverrides.set('BBB', 2);
    fireInput(input, 'AAA');
    await tickN(3);
    expect(mockZxcvbn).toHaveBeenCalledTimes(1);
    fireInput(input, 'BBB');
    await tickN(2);
    expect(mockZxcvbn).toHaveBeenCalledTimes(2);
    // No second cache-load Promise resolution — second scoring is sync via cached _zxcvbn.
  });

  it('score=0 maps to variant=danger, value=20, hint "Très faible"', async () => {
    const { input, meter, hint } = await mount();
    scoreOverrides.set('aaa', 0);
    fireInput(input, 'aaa');
    await tickN(3);
    expect(meter.getAttribute('data-variant')).toBe('danger');
    expect(meter.getAttribute('value')).toBe('20');
    expect(hint.textContent).toBe('Très faible');
  });

  it('score=2 maps to variant=warning, value=60, hint "Moyen"', async () => {
    const { input, meter, hint } = await mount();
    scoreOverrides.set('Middle1', 2);
    fireInput(input, 'Middle1');
    await tickN(3);
    expect(meter.getAttribute('data-variant')).toBe('warning');
    expect(meter.getAttribute('value')).toBe('60');
    expect(hint.textContent).toBe('Moyen');
  });

  it('score=4 maps to variant=success, value=100, hint "Très fort"', async () => {
    const { input, meter, hint } = await mount();
    scoreOverrides.set('Super-Strong-Pass-2026!', 4);
    fireInput(input, 'Super-Strong-Pass-2026!');
    await tickN(3);
    expect(meter.getAttribute('data-variant')).toBe('success');
    expect(meter.getAttribute('value')).toBe('100');
    expect(hint.textContent).toBe('Très fort');
  });

  it('score=3 with minScore=2 dispatches change with valid=true', async () => {
    const changeEvent = vi.fn();
    document.addEventListener('password-strength:change', changeEvent);
    const { input } = await mount({ minScore: 2 });
    scoreOverrides.set('Strong-Pass-3', 3);
    fireInput(input, 'Strong-Pass-3');
    await tickN(3);
    const lastCall = changeEvent.mock.calls.at(-1)[0];
    expect(lastCall.detail).toMatchObject({ score: 3, valid: true, empty: false });
    document.removeEventListener('password-strength:change', changeEvent);
  });

  it('score=1 with minScore=2 dispatches change with valid=false', async () => {
    const changeEvent = vi.fn();
    document.addEventListener('password-strength:change', changeEvent);
    const { input } = await mount({ minScore: 2 });
    scoreOverrides.set('weak', 1);
    fireInput(input, 'weak');
    await tickN(3);
    const lastCall = changeEvent.mock.calls.at(-1)[0];
    expect(lastCall.detail).toMatchObject({ score: 1, valid: false, empty: false });
    document.removeEventListener('password-strength:change', changeEvent);
  });

  it('idempotency : same score paints only once (skips duplicate dispatch)', async () => {
    const changeEvent = vi.fn();
    document.addEventListener('password-strength:change', changeEvent);
    const { input } = await mount();
    scoreOverrides.set('AAA', 2);
    scoreOverrides.set('BBB', 2);
    // Initial mount-time dispatch (empty-state).
    const baseline = changeEvent.mock.calls.length;
    fireInput(input, 'AAA');
    await tickN(3);
    fireInput(input, 'BBB');
    await tickN(2);
    // Two distinct typed inputs both score 2 → ONE additional dispatch
    // beyond the baseline (the second is suppressed by the idempotency
    // cache because the resulting state key 'score-2' is unchanged).
    expect(changeEvent.mock.calls.length).toBe(baseline + 1);
    document.removeEventListener('password-strength:change', changeEvent);
  });

  it('race condition : disconnect during lazy-load skips late paint + event', async () => {
    const changeEvent = vi.fn();
    document.addEventListener('password-strength:change', changeEvent);
    const { input, wrap, meter } = await mount();
    scoreOverrides.set('Pass1', 2);
    fireInput(input, 'Pass1');
    // Disconnect immediately, before the debounce + lazy-load resolve.
    const baseline = changeEvent.mock.calls.length;
    const baselineMeterVariant = meter.getAttribute('data-variant');
    wrap.remove();
    await tickN(4);
    // No late paint : variant stays at the pre-disconnect value, no
    // additional change event fires.
    expect(meter.getAttribute('data-variant')).toBe(baselineMeterVariant);
    expect(changeEvent.mock.calls.length).toBe(baseline);
    document.removeEventListener('password-strength:change', changeEvent);
  });
});
