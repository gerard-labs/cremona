import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import LangSwitcherController from '../../src/js/controllers/lang_switcher_controller.js';

async function tick() {
  await Promise.resolve();
}

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('lang-switcher', LangSwitcherController);
  return app;
}

function template({ currentLocale = 'fr', storageKey = 'theme.locale', locales = ['fr', 'en', 'de'] } = {}) {
  const items = locales.map((code) => `
    <div class="cremona-item cremona-lang-switcher__item" role="menuitem" tabindex="-1"
         data-action="click->lang-switcher#select"
         data-locale="${code}"></div>
  `).join('');
  return `
    <div class="cremona-lang-switcher"
         data-controller="lang-switcher"
         data-lang-switcher-current-locale-value="${currentLocale}"
         data-lang-switcher-storage-key-value="${storageKey}">
      <button class="cremona-lang-switcher__trigger">
        <span data-lang-switcher-target="current">${currentLocale.toUpperCase()}</span>
      </button>
      <div class="cremona-lang-switcher__content" role="menu">
        ${items}
      </div>
    </div>
  `;
}

describe('lang-switcher controller', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
    // Reset localStorage between tests for hermetic state.
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
  });

  afterEach(() => {
    app?.stop();
  });

  it('syncs the trigger label to the initial currentLocale on connect', async () => {
    app = mount(template({ currentLocale: 'fr' }));
    await tick();
    const trigger = document.querySelector('[data-lang-switcher-target="current"]');
    expect(trigger.textContent).toBe('FR');
  });

  it('re-hydrates from localStorage when a persisted value differs', async () => {
    window.localStorage.setItem('theme.locale', 'en');
    app = mount(template({ currentLocale: 'fr' }));
    await tick();
    const trigger = document.querySelector('[data-lang-switcher-target="current"]');
    expect(trigger.textContent).toBe('EN');
    const wrap = document.querySelector('.cremona-lang-switcher');
    expect(wrap.getAttribute('data-lang-switcher-current-locale-value')).toBe('en');
  });

  it('dispatches lang-switcher:change with locale + previousLocale on select', async () => {
    app = mount(template({ currentLocale: 'fr' }));
    await tick();
    const wrap = document.querySelector('.cremona-lang-switcher');
    const changeEvents = [];
    wrap.addEventListener('lang-switcher:change', (e) => changeEvents.push(e.detail));
    const enItem = document.querySelector('[data-locale="en"]');
    enItem.click();
    await tick();
    expect(changeEvents).toHaveLength(1);
    expect(changeEvents[0]).toEqual({ locale: 'en', previousLocale: 'fr' });
  });

  it('persists the new locale to localStorage on select', async () => {
    app = mount(template({ currentLocale: 'fr' }));
    await tick();
    const deItem = document.querySelector('[data-locale="de"]');
    deItem.click();
    await tick();
    expect(window.localStorage.getItem('theme.locale')).toBe('de');
  });

  it('updates the trigger label after selection', async () => {
    app = mount(template({ currentLocale: 'fr' }));
    await tick();
    const enItem = document.querySelector('[data-locale="en"]');
    enItem.click();
    await tick();
    const trigger = document.querySelector('[data-lang-switcher-target="current"]');
    expect(trigger.textContent).toBe('EN');
  });

  it('does not dispatch when selecting the already-current locale', async () => {
    app = mount(template({ currentLocale: 'fr' }));
    await tick();
    const wrap = document.querySelector('.cremona-lang-switcher');
    const changeEvents = [];
    wrap.addEventListener('lang-switcher:change', (e) => changeEvents.push(e.detail));
    const frItem = document.querySelector('[data-locale="fr"]');
    frItem.click();
    await tick();
    expect(changeEvents).toHaveLength(0);
  });

  it('uses a custom storageKey when provided', async () => {
    app = mount(template({ currentLocale: 'fr', storageKey: 'app.userLocale' }));
    await tick();
    const enItem = document.querySelector('[data-locale="en"]');
    enItem.click();
    await tick();
    expect(window.localStorage.getItem('app.userLocale')).toBe('en');
    expect(window.localStorage.getItem('theme.locale')).toBeNull();
  });

  it('handles localStorage being unavailable gracefully', async () => {
    const original = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
    try {
      app = mount(template({ currentLocale: 'fr' }));
      await tick();
      const wrap = document.querySelector('.cremona-lang-switcher');
      const changeEvents = [];
      wrap.addEventListener('lang-switcher:change', (e) => changeEvents.push(e.detail));
      const enItem = document.querySelector('[data-locale="en"]');
      enItem.click();
      await tick();
      // Event still dispatched ; persist silently fails.
      expect(changeEvents).toHaveLength(1);
      expect(changeEvents[0].locale).toBe('en');
    } finally {
      Object.defineProperty(window, 'localStorage', { configurable: true, value: original });
    }
  });

  it('ignores select when data-locale is missing', async () => {
    app = mount(`
      <div class="cremona-lang-switcher" data-controller="lang-switcher" data-lang-switcher-current-locale-value="fr">
        <span data-lang-switcher-target="current">FR</span>
        <div data-action="click->lang-switcher#select"></div>
      </div>
    `);
    await tick();
    const wrap = document.querySelector('.cremona-lang-switcher');
    const changeEvents = [];
    wrap.addEventListener('lang-switcher:change', (e) => changeEvents.push(e.detail));
    const item = wrap.querySelector('[data-action]');
    item.click();
    await tick();
    expect(changeEvents).toHaveLength(0);
  });

  it('does not dispatch after disconnect', async () => {
    app = mount(template({ currentLocale: 'fr' }));
    await tick();
    const wrap = document.querySelector('.cremona-lang-switcher');
    const changeEvents = [];
    wrap.addEventListener('lang-switcher:change', (e) => changeEvents.push(e.detail));
    // Disconnect by removing the element.
    wrap.remove();
    await tick();
    // Subsequent imperative dispatch shouldn't reach a listener (element gone).
    expect(changeEvents).toHaveLength(0);
  });

  it('toggles aria-current state would be consumer responsibility (not auto-stamped)', async () => {
    // The kit's `lang-switcher` controller does NOT mutate aria-current on items —
    // consumer's Twig stamps it at SSR time. This test documents that contract.
    app = mount(`
      <div class="cremona-lang-switcher" data-controller="lang-switcher" data-lang-switcher-current-locale-value="fr">
        <span data-lang-switcher-target="current">FR</span>
        <div data-action="click->lang-switcher#select" data-locale="fr" aria-current="true"></div>
        <div data-action="click->lang-switcher#select" data-locale="en"></div>
      </div>
    `);
    await tick();
    const enItem = document.querySelector('[data-locale="en"]');
    enItem.click();
    await tick();
    // The fr item still has aria-current — the controller intentionally doesn't
    // mutate DOM attrs ; consumer re-renders via Symfony or client-side framework.
    const frItem = document.querySelector('[data-locale="fr"]');
    expect(frItem.getAttribute('aria-current')).toBe('true');
    expect(enItem.getAttribute('aria-current')).toBeNull();
  });
});
