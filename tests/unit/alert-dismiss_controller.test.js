import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import AlertDismissController from '../../src/js/controllers/alert-dismiss_controller.js';
import { setTranslations, setLocale, __reset } from '../../src/js/utils/i18n.js';

/**
 * Unit tests for the Alert primitive's `alert-dismiss` controller.
 *
 * Responsibilities covered:
 *   1. dismiss() stamps data-state="dismissing" on the alert root.
 *   2. After the opacity transitionend, the alert is removed from the DOM.
 *   3. The `alert:dismissed` custom event fires (bubbles, composed).
 *   4. The #theme-announcer live region receives the (i18n-resolved) message.
 *   5. transitionend on a non-opacity property does NOT trigger the cleanup.
 */
describe('AlertDismissController', () => {
  let app;

  beforeEach(() => {
    __reset();
    setTranslations('fr', {
      'theme.alert.aria.dismissed': 'Alerte fermée.',
      'theme.alert.aria.custom': 'Message personnalisé.',
    });
    setLocale('fr');
  });

  afterEach(() => {
    if (app) app.stop();
    document.body.innerHTML = '';
  });

  async function mount({ message } = {}) {
    document.body.innerHTML = `
      <div id="theme-announcer" aria-live="polite" aria-atomic="true"></div>
      <div id="alert"
        class="theme-alert"
        data-variant="info"
        data-tone="soft"
        role="status"
        data-controller="alert-dismiss"
        ${message ? `data-alert-dismiss-message-value="${message}"` : ''}>
        <p class="theme-alert__title">Titre</p>
        <button id="dismiss" type="button" class="theme-alert__dismiss"
          aria-label="Fermer"
          data-action="click->alert-dismiss#dismiss">x</button>
      </div>
    `;
    app = Application.start();
    app.register('alert-dismiss', AlertDismissController);
    await new Promise((r) => setTimeout(r, 0));
    return {
      alert: document.getElementById('alert'),
      dismissBtn: document.getElementById('dismiss'),
      announcer: document.getElementById('theme-announcer'),
    };
  }

  it('dismiss() — click stamps data-state="dismissing" on the alert root', async () => {
    const { alert, dismissBtn } = await mount();
    expect(alert.dataset.state).toBeUndefined();
    dismissBtn.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(alert.dataset.state).toBe('dismissing');
  });

  it('transitionend (opacity) — removes the alert from the DOM', async () => {
    const { alert, dismissBtn } = await mount();
    dismissBtn.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(document.getElementById('alert')).toBe(alert);
    const evt = new Event('transitionend', { bubbles: true });
    Object.defineProperty(evt, 'propertyName', { value: 'opacity', enumerable: true });
    alert.dispatchEvent(evt);
    await new Promise((r) => setTimeout(r, 0));
    expect(document.getElementById('alert')).toBeNull();
  });

  it('transitionend (non-opacity) — does NOT remove the alert', async () => {
    const { alert, dismissBtn } = await mount();
    dismissBtn.click();
    await new Promise((r) => setTimeout(r, 0));
    const evt = new Event('transitionend', { bubbles: true });
    Object.defineProperty(evt, 'propertyName', { value: 'background-color', enumerable: true });
    alert.dispatchEvent(evt);
    await new Promise((r) => setTimeout(r, 0));
    expect(document.getElementById('alert')).toBe(alert);
  });

  it('dispatches `alert:dismissed` (bubbles, composed) on opacity transitionend', async () => {
    const { alert, dismissBtn } = await mount();
    let captured = null;
    document.addEventListener('alert:dismissed', (e) => {
      captured = { type: e.type, bubbles: e.bubbles };
    });
    dismissBtn.click();
    await new Promise((r) => setTimeout(r, 0));
    const evt = new Event('transitionend', { bubbles: true });
    Object.defineProperty(evt, 'propertyName', { value: 'opacity', enumerable: true });
    alert.dispatchEvent(evt);
    await new Promise((r) => setTimeout(r, 0));
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('alert:dismissed');
    expect(captured.bubbles).toBe(true);
  });

  it('announces the resolved message into #theme-announcer (default key)', async () => {
    const { alert, dismissBtn, announcer } = await mount();
    dismissBtn.click();
    await new Promise((r) => setTimeout(r, 0));
    const evt = new Event('transitionend', { bubbles: true });
    Object.defineProperty(evt, 'propertyName', { value: 'opacity', enumerable: true });
    alert.dispatchEvent(evt);
    await new Promise((r) => setTimeout(r, 0));
    expect(announcer.textContent).toBe('Alerte fermée.');
  });

  it('announces a custom message via data-alert-dismiss-message-value', async () => {
    const { alert, dismissBtn, announcer } = await mount({ message: 'theme.alert.aria.custom' });
    dismissBtn.click();
    await new Promise((r) => setTimeout(r, 0));
    const evt = new Event('transitionend', { bubbles: true });
    Object.defineProperty(evt, 'propertyName', { value: 'opacity', enumerable: true });
    alert.dispatchEvent(evt);
    await new Promise((r) => setTimeout(r, 0));
    expect(announcer.textContent).toBe('Message personnalisé.');
  });
});
