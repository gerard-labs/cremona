import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import ThemeSwitcherController from '../../src/js/controllers/theme_switcher_controller.js';

async function tick() {
  await Promise.resolve();
}

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('theme-switcher', ThemeSwitcherController);
  return app;
}

function template({ currentMode = 'system', storageKey = 'theme.mode', target = 'self' } = {}) {
  const opts = ['light', 'dark', 'system'];
  const toggles = opts.map((m) => `
    <button class="cremona-toggle cremona-toggle-group__item cremona-theme-switcher__item"
            data-theme-mode="${m}"
            aria-pressed="${m === currentMode ? 'true' : 'false'}"
            aria-label="${m}"></button>
  `).join('');
  return `
    <div class="cremona-toggle-group cremona-theme-switcher__group"
         role="group"
         data-controller="theme-switcher"
         data-theme-switcher-current-mode-value="${currentMode}"
         data-theme-switcher-storage-key-value="${storageKey}"
         data-theme-switcher-target-value="${target}">
      ${toggles}
    </div>
  `;
}

function dispatchToggle(button, pressed) {
  button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  button.dispatchEvent(new CustomEvent('toggle', {
    bubbles: true,
    composed: true,
    detail: { pressed },
  }));
}

function mockMatchMedia(matches) {
  const listeners = new Set();
  const mql = {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_evt, fn) => listeners.add(fn),
    removeEventListener: (_evt, fn) => listeners.delete(fn),
    addListener: (fn) => listeners.add(fn),
    removeListener: (fn) => listeners.delete(fn),
    dispatchChange: (newMatches) => {
      mql.matches = newMatches;
      listeners.forEach((fn) => fn({ matches: newMatches }));
    },
  };
  window.matchMedia = vi.fn().mockReturnValue(mql);
  return mql;
}

describe('theme-switcher controller', () => {
  let app;
  let originalMatchMedia;

  beforeEach(() => {
    document.body.innerHTML = '';
    try { window.localStorage.clear(); } catch { /* ignore */ }
    document.documentElement.removeAttribute('data-theme');
    document.body.removeAttribute('data-theme');
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    app?.stop();
    document.documentElement.removeAttribute('data-theme');
    document.body.removeAttribute('data-theme');
    window.matchMedia = originalMatchMedia;
  });

  it('applies dark theme on connect when currentMode=dark + target=self', async () => {
    app = mount(template({ currentMode: 'dark', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.cremona-theme-switcher__group');
    expect(wrap.getAttribute('data-theme')).toBe('dark');
  });

  it('removes data-theme when currentMode=light + target=self', async () => {
    app = mount(template({ currentMode: 'light', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.cremona-theme-switcher__group');
    expect(wrap.getAttribute('data-theme')).toBeNull();
  });

  it('resolves system mode to dark when prefers-color-scheme matches', async () => {
    mockMatchMedia(true);
    app = mount(template({ currentMode: 'system', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.cremona-theme-switcher__group');
    expect(wrap.getAttribute('data-theme')).toBe('dark');
  });

  it('resolves system mode to light when prefers-color-scheme does not match', async () => {
    mockMatchMedia(false);
    app = mount(template({ currentMode: 'system', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.cremona-theme-switcher__group');
    expect(wrap.getAttribute('data-theme')).toBeNull();
  });

  it('dispatches theme-switcher:change on mode selection', async () => {
    mockMatchMedia(false);
    app = mount(template({ currentMode: 'system', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.cremona-theme-switcher__group');
    const changeEvents = [];
    wrap.addEventListener('theme-switcher:change', (e) => changeEvents.push(e.detail));
    wrap.addEventListener('toggle', (e) => {
      app.getControllerForElementAndIdentifier(wrap, 'theme-switcher').onToggle(e);
    });
    const darkToggle = wrap.querySelector('[data-theme-mode="dark"]');
    dispatchToggle(darkToggle, true);
    await tick();
    expect(changeEvents).toHaveLength(1);
    expect(changeEvents[0]).toEqual({ mode: 'dark', resolvedTheme: 'dark', previousMode: 'system' });
  });

  it('persists the mode CHOICE to localStorage (not resolved theme)', async () => {
    mockMatchMedia(true);
    app = mount(template({ currentMode: 'light', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.cremona-theme-switcher__group');
    wrap.addEventListener('toggle', (e) => {
      app.getControllerForElementAndIdentifier(wrap, 'theme-switcher').onToggle(e);
    });
    const systemToggle = wrap.querySelector('[data-theme-mode="system"]');
    dispatchToggle(systemToggle, true);
    await tick();
    expect(window.localStorage.getItem('theme.mode')).toBe('system');
  });

  it('re-hydrates mode from localStorage when persisted differs', async () => {
    mockMatchMedia(false);
    window.localStorage.setItem('theme.mode', 'dark');
    app = mount(template({ currentMode: 'system', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.cremona-theme-switcher__group');
    expect(wrap.getAttribute('data-theme')).toBe('dark');
    expect(wrap.getAttribute('data-theme-switcher-current-mode-value')).toBe('dark');
  });

  it('ignores invalid persisted mode strings', async () => {
    mockMatchMedia(false);
    window.localStorage.setItem('theme.mode', 'rainbow');
    app = mount(template({ currentMode: 'light', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.cremona-theme-switcher__group');
    expect(wrap.getAttribute('data-theme-switcher-current-mode-value')).toBe('light');
  });

  it('re-applies on OS theme change when mode=system', async () => {
    const mql = mockMatchMedia(false);
    app = mount(template({ currentMode: 'system', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.cremona-theme-switcher__group');
    expect(wrap.getAttribute('data-theme')).toBeNull();
    const changeEvents = [];
    wrap.addEventListener('theme-switcher:change', (e) => changeEvents.push(e.detail));
    mql.dispatchChange(true); // OS toggles to dark.
    await tick();
    expect(wrap.getAttribute('data-theme')).toBe('dark');
    expect(changeEvents).toHaveLength(1);
    expect(changeEvents[0].mode).toBe('system');
    expect(changeEvents[0].resolvedTheme).toBe('dark');
  });

  it('does not react to OS theme change when mode=light explicit', async () => {
    const mql = mockMatchMedia(false);
    app = mount(template({ currentMode: 'light', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.cremona-theme-switcher__group');
    const changeEvents = [];
    wrap.addEventListener('theme-switcher:change', (e) => changeEvents.push(e.detail));
    mql.dispatchChange(true);
    await tick();
    // No subscription in light mode → no event + data-theme stays null.
    expect(changeEvents).toHaveLength(0);
    expect(wrap.getAttribute('data-theme')).toBeNull();
  });

  it('subscribes/unsubscribes system listener when mode transitions', async () => {
    const mql = mockMatchMedia(false);
    app = mount(template({ currentMode: 'light', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.cremona-theme-switcher__group');
    wrap.addEventListener('toggle', (e) => {
      app.getControllerForElementAndIdentifier(wrap, 'theme-switcher').onToggle(e);
    });
    // Switch to system → subscribe.
    const systemToggle = wrap.querySelector('[data-theme-mode="system"]');
    dispatchToggle(systemToggle, true);
    await tick();
    const changeEvents = [];
    wrap.addEventListener('theme-switcher:change', (e) => changeEvents.push(e.detail));
    mql.dispatchChange(true);
    await tick();
    expect(changeEvents).toHaveLength(1);
    expect(changeEvents[0].mode).toBe('system');
    // Switch to dark → unsubscribe ; OS changes no longer dispatch.
    const darkToggle = wrap.querySelector('[data-theme-mode="dark"]');
    dispatchToggle(darkToggle, true);
    await tick();
    changeEvents.length = 0;
    mql.dispatchChange(false);
    await tick();
    expect(changeEvents).toHaveLength(0);
  });

  it('does not dispatch when selecting the already-current mode', async () => {
    mockMatchMedia(false);
    app = mount(template({ currentMode: 'light', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.cremona-theme-switcher__group');
    const changeEvents = [];
    wrap.addEventListener('theme-switcher:change', (e) => changeEvents.push(e.detail));
    wrap.addEventListener('toggle', (e) => {
      app.getControllerForElementAndIdentifier(wrap, 'theme-switcher').onToggle(e);
    });
    const lightToggle = wrap.querySelector('[data-theme-mode="light"]');
    dispatchToggle(lightToggle, true);
    await tick();
    expect(changeEvents).toHaveLength(0);
  });

  it('does not dispatch after disconnect', async () => {
    mockMatchMedia(false);
    app = mount(template({ currentMode: 'system', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.cremona-theme-switcher__group');
    const changeEvents = [];
    wrap.addEventListener('theme-switcher:change', (e) => changeEvents.push(e.detail));
    wrap.remove();
    await tick();
    expect(changeEvents).toHaveLength(0);
  });

  it('handles matchMedia being unavailable gracefully', async () => {
    delete window.matchMedia;
    app = mount(template({ currentMode: 'system', target: 'self' }));
    await tick();
    const wrap = document.querySelector('.cremona-theme-switcher__group');
    // Falls back to 'light' resolution.
    expect(wrap.getAttribute('data-theme')).toBeNull();
  });
});
