import { describe, it, expect, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import ToggleGroupController from '../../src/js/controllers/toggle-group_controller.js';
import ToggleController from '../../src/js/controllers/toggle_controller.js';

/**
 * Unit tests for the ToggleGroup primitive's `toggle-group` controller.
 *
 * Responsibilities covered:
 *   1. setRovingTabindex() at connect — exactly one toggle has tabindex=0;
 *      in single mode it's the pressed one, else the first non-disabled.
 *   2. onToggle() — mutex behavior in single mode unpresses others;
 *      no-op in multi mode.
 *   3. keydown() — Arrow / Home / End move focus + roving tabindex update.
 */
describe('ToggleGroupController', () => {
  let app;

  afterEach(() => {
    if (app) app.stop();
    document.body.innerHTML = '';
  });

  async function mount({ mode = 'single', orientation = 'horizontal', toggles = [] } = {}) {
    const togglesHtml = toggles.map((t, i) => `
      <button type="button"
        class="theme-toggle"
        data-controller="toggle"
        data-action="click->toggle#toggle"
        aria-pressed="${t.pressed ? 'true' : 'false'}"
        ${t.disabled ? 'disabled' : ''}
        data-test-idx="${i}">Toggle ${i}</button>
    `).join('');
    document.body.innerHTML = `
      <div class="theme-toggle-group"
        role="group"
        data-controller="toggle-group"
        data-action="keydown->toggle-group#keydown toggle->toggle-group#onToggle"
        data-toggle-group-mode-value="${mode}"
        data-toggle-group-orientation-value="${orientation}">${togglesHtml}</div>
    `;
    app = Application.start();
    app.register('toggle', ToggleController);
    app.register('toggle-group', ToggleGroupController);
    await new Promise((r) => setTimeout(r, 0));
    return Array.from(document.querySelectorAll('.theme-toggle'));
  }

  it('setRovingTabindex() — single mode, pressed toggle gets tabindex=0', async () => {
    const ts = await mount({
      mode: 'single',
      toggles: [{ pressed: false }, { pressed: true }, { pressed: false }],
    });
    expect(ts[0].tabIndex).toBe(-1);
    expect(ts[1].tabIndex).toBe(0);
    expect(ts[2].tabIndex).toBe(-1);
  });

  it('setRovingTabindex() — multi mode, first non-disabled gets tabindex=0', async () => {
    const ts = await mount({
      mode: 'multi',
      toggles: [{ disabled: true }, { pressed: false }, { pressed: true }],
    });
    expect(ts[0].tabIndex).toBe(-1);
    expect(ts[1].tabIndex).toBe(0);
    expect(ts[2].tabIndex).toBe(-1);
  });

  it('onToggle() — single mode unpresses all others when one is pressed', async () => {
    const ts = await mount({
      mode: 'single',
      toggles: [{ pressed: true }, { pressed: false }, { pressed: false }],
    });
    // Click the second toggle — its own controller flips aria-pressed to true,
    // dispatches `toggle{ pressed: true }`, the group controller unpresses ts[0].
    ts[1].click();
    await new Promise((r) => setTimeout(r, 0));
    expect(ts[0].getAttribute('aria-pressed')).toBe('false');
    expect(ts[1].getAttribute('aria-pressed')).toBe('true');
    expect(ts[2].getAttribute('aria-pressed')).toBe('false');
  });

  it('onToggle() — multi mode does NOT unpress others', async () => {
    const ts = await mount({
      mode: 'multi',
      toggles: [{ pressed: true }, { pressed: false }, { pressed: true }],
    });
    ts[1].click(); // press the middle one
    await new Promise((r) => setTimeout(r, 0));
    expect(ts[0].getAttribute('aria-pressed')).toBe('true');
    expect(ts[1].getAttribute('aria-pressed')).toBe('true');
    expect(ts[2].getAttribute('aria-pressed')).toBe('true');
  });

  it('keydown() — ArrowRight (horizontal) moves focus to next toggle and updates tabindex', async () => {
    const ts = await mount({
      mode: 'multi',
      orientation: 'horizontal',
      toggles: [{}, {}, {}],
    });
    ts[0].focus();
    const evt = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    ts[0].dispatchEvent(evt);
    await new Promise((r) => setTimeout(r, 0));
    expect(document.activeElement).toBe(ts[1]);
    expect(ts[0].tabIndex).toBe(-1);
    expect(ts[1].tabIndex).toBe(0);
  });

  it('keydown() — End jumps to the last toggle', async () => {
    const ts = await mount({ mode: 'multi', toggles: [{}, {}, {}, {}] });
    ts[0].focus();
    const evt = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
    ts[0].dispatchEvent(evt);
    await new Promise((r) => setTimeout(r, 0));
    expect(document.activeElement).toBe(ts[3]);
    expect(ts[3].tabIndex).toBe(0);
  });

  it('keydown() — ArrowLeft wraps from first to last', async () => {
    const ts = await mount({
      mode: 'multi',
      orientation: 'horizontal',
      toggles: [{}, {}, {}],
    });
    ts[0].focus();
    const evt = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
    ts[0].dispatchEvent(evt);
    await new Promise((r) => setTimeout(r, 0));
    expect(document.activeElement).toBe(ts[2]);
  });
});
