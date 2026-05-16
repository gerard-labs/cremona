import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import DensitySwitcherController from '../../src/js/controllers/density_switcher_controller.js';

async function tick() {
  await Promise.resolve();
}

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('density-switcher', DensitySwitcherController);
  return app;
}

function template({ currentDensity = 'comfortable', storageKey = 'theme.density', target = 'self' } = {}) {
  const opts = ['comfortable', 'cozy', 'compact'];
  const toggles = opts.map((d) => `
    <button class="theme-toggle theme-toggle-group__item theme-density-switcher__item"
            data-density="${d}"
            aria-pressed="${d === currentDensity ? 'true' : 'false'}"
            aria-label="${d}"></button>
  `).join('');
  return `
    <div class="theme-toggle-group theme-density-switcher__group"
         role="group"
         data-controller="density-switcher"
         data-density-switcher-current-density-value="${currentDensity}"
         data-density-switcher-storage-key-value="${storageKey}"
         data-density-switcher-target-value="${target}">
      ${toggles}
    </div>
  `;
}

function dispatchToggleEvent(button, pressed) {
  button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  button.dispatchEvent(new CustomEvent('toggle', {
    bubbles: true,
    composed: true,
    detail: { pressed },
  }));
}

describe('density-switcher controller', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
    try { window.localStorage.clear(); } catch { /* ignore */ }
    document.documentElement.removeAttribute('data-density');
    document.body.removeAttribute('data-density');
  });

  afterEach(() => {
    app?.stop();
    document.documentElement.removeAttribute('data-density');
    document.body.removeAttribute('data-density');
  });

  it('applies the initial currentDensity to target=self on connect', async () => {
    app = mount(template({ currentDensity: 'cozy', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.theme-density-switcher__group');
    expect(wrap.getAttribute('data-density')).toBe('cozy');
  });

  it('re-hydrates from localStorage when persisted value differs', async () => {
    window.localStorage.setItem('theme.density', 'compact');
    app = mount(template({ currentDensity: 'comfortable', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.theme-density-switcher__group');
    expect(wrap.getAttribute('data-density')).toBe('compact');
    expect(wrap.getAttribute('data-density-switcher-current-density-value')).toBe('compact');
  });

  it('dispatches density-switcher:change on pressed toggle with new density', async () => {
    app = mount(template({ currentDensity: 'comfortable', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.theme-density-switcher__group');
    const changeEvents = [];
    wrap.addEventListener('density-switcher:change', (e) => changeEvents.push(e.detail));
    // Wire the action like Twig does (in real usage handled by data-action).
    wrap.addEventListener('toggle', (e) => {
      app.getControllerForElementAndIdentifier(wrap, 'density-switcher').onToggle(e);
    });
    const cozyToggle = document.querySelector('[data-density="cozy"]');
    dispatchToggleEvent(cozyToggle, true);
    await tick();
    expect(changeEvents).toHaveLength(1);
    expect(changeEvents[0]).toEqual({ density: 'cozy', previousDensity: 'comfortable' });
  });

  it('ignores toggle events when pressed=false (mutex unpresses)', async () => {
    app = mount(template({ currentDensity: 'cozy', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.theme-density-switcher__group');
    const changeEvents = [];
    wrap.addEventListener('density-switcher:change', (e) => changeEvents.push(e.detail));
    wrap.addEventListener('toggle', (e) => {
      app.getControllerForElementAndIdentifier(wrap, 'density-switcher').onToggle(e);
    });
    const cozyToggle = document.querySelector('[data-density="cozy"]');
    dispatchToggleEvent(cozyToggle, false);
    await tick();
    expect(changeEvents).toHaveLength(0);
  });

  it('does not dispatch when selecting the already-current density', async () => {
    app = mount(template({ currentDensity: 'comfortable', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.theme-density-switcher__group');
    const changeEvents = [];
    wrap.addEventListener('density-switcher:change', (e) => changeEvents.push(e.detail));
    wrap.addEventListener('toggle', (e) => {
      app.getControllerForElementAndIdentifier(wrap, 'density-switcher').onToggle(e);
    });
    const sameToggle = document.querySelector('[data-density="comfortable"]');
    dispatchToggleEvent(sameToggle, true);
    await tick();
    expect(changeEvents).toHaveLength(0);
  });

  it('persists the new density to localStorage', async () => {
    app = mount(template({ currentDensity: 'comfortable', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.theme-density-switcher__group');
    wrap.addEventListener('toggle', (e) => {
      app.getControllerForElementAndIdentifier(wrap, 'density-switcher').onToggle(e);
    });
    const compactToggle = document.querySelector('[data-density="compact"]');
    dispatchToggleEvent(compactToggle, true);
    await tick();
    expect(window.localStorage.getItem('theme.density')).toBe('compact');
  });

  it('applies data-density to documentElement when target=documentElement', async () => {
    app = mount(template({ currentDensity: 'comfortable', target: 'documentElement' }));
    await tick();
    expect(document.documentElement.getAttribute('data-density')).toBe('comfortable');
    const wrap = document.querySelector('.theme-density-switcher__group');
    wrap.addEventListener('toggle', (e) => {
      app.getControllerForElementAndIdentifier(wrap, 'density-switcher').onToggle(e);
    });
    const compactToggle = document.querySelector('[data-density="compact"]');
    dispatchToggleEvent(compactToggle, true);
    await tick();
    expect(document.documentElement.getAttribute('data-density')).toBe('compact');
  });

  it('applies data-density to body when target=body', async () => {
    app = mount(template({ currentDensity: 'comfortable', target: 'body' }));
    await tick();
    expect(document.body.getAttribute('data-density')).toBe('comfortable');
    const wrap = document.querySelector('.theme-density-switcher__group');
    wrap.addEventListener('toggle', (e) => {
      app.getControllerForElementAndIdentifier(wrap, 'density-switcher').onToggle(e);
    });
    const cozyToggle = document.querySelector('[data-density="cozy"]');
    dispatchToggleEvent(cozyToggle, true);
    await tick();
    expect(document.body.getAttribute('data-density')).toBe('cozy');
  });

  it('uses a custom storageKey', async () => {
    app = mount(template({ currentDensity: 'comfortable', storageKey: 'app.density', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.theme-density-switcher__group');
    wrap.addEventListener('toggle', (e) => {
      app.getControllerForElementAndIdentifier(wrap, 'density-switcher').onToggle(e);
    });
    const cozyToggle = document.querySelector('[data-density="cozy"]');
    dispatchToggleEvent(cozyToggle, true);
    await tick();
    expect(window.localStorage.getItem('app.density')).toBe('cozy');
    expect(window.localStorage.getItem('theme.density')).toBeNull();
  });

  it('ignores toggle events missing data-density attribute', async () => {
    app = mount(`
      <div class="theme-toggle-group" data-controller="density-switcher"
           data-density-switcher-current-density-value="comfortable"
           data-density-switcher-target-value="self">
        <button aria-pressed="false"></button>
      </div>
    `);
    await tick();
    const wrap = document.querySelector('.theme-toggle-group');
    const changeEvents = [];
    wrap.addEventListener('density-switcher:change', (e) => changeEvents.push(e.detail));
    wrap.addEventListener('toggle', (e) => {
      app.getControllerForElementAndIdentifier(wrap, 'density-switcher').onToggle(e);
    });
    const btn = wrap.querySelector('button');
    dispatchToggleEvent(btn, true);
    await tick();
    expect(changeEvents).toHaveLength(0);
  });

  it('does not dispatch after disconnect', async () => {
    app = mount(template({ currentDensity: 'comfortable', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.theme-density-switcher__group');
    const changeEvents = [];
    wrap.addEventListener('density-switcher:change', (e) => changeEvents.push(e.detail));
    wrap.remove();
    await tick();
    expect(changeEvents).toHaveLength(0);
  });
});
