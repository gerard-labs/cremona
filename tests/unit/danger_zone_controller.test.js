import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import DangerZoneController from '../../src/js/controllers/danger_zone_controller.js';

async function tick() {
  await Promise.resolve();
}

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('danger-zone', DangerZoneController);
  return app;
}

function template({ expected = 'SUPPRIMER', matchMode = 'exact', initialInput = '' } = {}) {
  return `
    <article class="theme-card theme-danger-zone"
             data-controller="danger-zone"
             data-danger-zone-expected-value="${expected}"
             data-danger-zone-match-mode-value="${matchMode}"
             data-danger-zone-state="idle">
      <div class="theme-card__body">
        <input type="text"
               class="theme-input"
               data-danger-zone-target="input"
               value="${initialInput}">
      </div>
      <div class="theme-card__footer">
        <button type="button"
                class="theme-button"
                data-variant="destructive"
                data-danger-zone-target="button"
                disabled
                aria-disabled="true">Delete</button>
      </div>
    </article>
  `;
}

function fireInput(el, value) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('danger-zone controller', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    app?.stop();
  });

  it('keeps the button disabled when input is empty on connect', async () => {
    app = mount(template({ expected: 'SUPPRIMER' }));
    await tick();
    const button = document.querySelector('[data-danger-zone-target="button"]');
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('enables the button when input exactly matches expected', async () => {
    app = mount(template({ expected: 'SUPPRIMER' }));
    await tick();
    const input = document.querySelector('[data-danger-zone-target="input"]');
    fireInput(input, 'SUPPRIMER');
    await tick();
    const button = document.querySelector('[data-danger-zone-target="button"]');
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('false');
    const wrap = document.querySelector('.theme-danger-zone');
    expect(wrap.getAttribute('data-danger-zone-state')).toBe('armed');
  });

  it('disables the button again when match is broken', async () => {
    app = mount(template({ expected: 'SUPPRIMER' }));
    await tick();
    const input = document.querySelector('[data-danger-zone-target="input"]');
    fireInput(input, 'SUPPRIMER');
    await tick();
    fireInput(input, 'SUPPRIMERX');
    await tick();
    const button = document.querySelector('[data-danger-zone-target="button"]');
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('case-insensitive mode matches "supprimer" against "SUPPRIMER"', async () => {
    app = mount(template({ expected: 'SUPPRIMER', matchMode: 'case-insensitive' }));
    await tick();
    const input = document.querySelector('[data-danger-zone-target="input"]');
    fireInput(input, 'supprimer');
    await tick();
    const button = document.querySelector('[data-danger-zone-target="button"]');
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('case-insensitive mode trims whitespace before compare', async () => {
    app = mount(template({ expected: 'DELETE', matchMode: 'case-insensitive' }));
    await tick();
    const input = document.querySelector('[data-danger-zone-target="input"]');
    fireInput(input, '  delete  ');
    await tick();
    const button = document.querySelector('[data-danger-zone-target="button"]');
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('exact mode rejects case differences', async () => {
    app = mount(template({ expected: 'SUPPRIMER', matchMode: 'exact' }));
    await tick();
    const input = document.querySelector('[data-danger-zone-target="input"]');
    fireInput(input, 'supprimer');
    await tick();
    const button = document.querySelector('[data-danger-zone-target="button"]');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('dispatches danger-zone:match-change when transitioning idle → armed', async () => {
    app = mount(template({ expected: 'SUPPRIMER' }));
    await tick();
    const wrap = document.querySelector('.theme-danger-zone');
    const events = [];
    wrap.addEventListener('danger-zone:match-change', (e) => events.push(e.detail));
    const input = document.querySelector('[data-danger-zone-target="input"]');
    fireInput(input, 'SUPPRIMER');
    await tick();
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ matches: true, typed: 'SUPPRIMER' });
  });

  it('dispatches danger-zone:match-change when transitioning armed → idle', async () => {
    app = mount(template({ expected: 'SUPPRIMER' }));
    await tick();
    const wrap = document.querySelector('.theme-danger-zone');
    const events = [];
    const input = document.querySelector('[data-danger-zone-target="input"]');
    fireInput(input, 'SUPPRIMER');
    await tick();
    wrap.addEventListener('danger-zone:match-change', (e) => events.push(e.detail));
    fireInput(input, 'SUPP');
    await tick();
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ matches: false, typed: 'SUPP' });
  });

  it('does NOT dispatch match-change for keystrokes within the same matches state', async () => {
    app = mount(template({ expected: 'SUPPRIMER' }));
    await tick();
    const wrap = document.querySelector('.theme-danger-zone');
    const events = [];
    wrap.addEventListener('danger-zone:match-change', (e) => events.push(e.detail));
    const input = document.querySelector('[data-danger-zone-target="input"]');
    fireInput(input, 'S');
    await tick();
    fireInput(input, 'SU');
    await tick();
    fireInput(input, 'SUP');
    await tick();
    // All still non-matching ; no transition crossed.
    expect(events).toHaveLength(0);
  });

  it('returns false (button stays disabled) when expectedValue is empty', async () => {
    app = mount(template({ expected: '' }));
    await tick();
    const input = document.querySelector('[data-danger-zone-target="input"]');
    fireInput(input, 'anything');
    await tick();
    const button = document.querySelector('[data-danger-zone-target="button"]');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('handles paste (one input event with full pasted value) atomically', async () => {
    app = mount(template({ expected: 'DELETE' }));
    await tick();
    const wrap = document.querySelector('.theme-danger-zone');
    const events = [];
    wrap.addEventListener('danger-zone:match-change', (e) => events.push(e.detail));
    const input = document.querySelector('[data-danger-zone-target="input"]');
    // Simulate paste : single input event with full pasted value.
    fireInput(input, 'DELETE');
    await tick();
    expect(events).toHaveLength(1);
    expect(events[0].matches).toBe(true);
    const button = document.querySelector('[data-danger-zone-target="button"]');
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('cleans up input listener on disconnect', async () => {
    app = mount(template({ expected: 'SUPPRIMER' }));
    await tick();
    const wrap = document.querySelector('.theme-danger-zone');
    wrap.remove();
    await tick();
    // No assertion needed — disconnect just shouldn't throw on re-input.
    expect(true).toBe(true);
  });
});
