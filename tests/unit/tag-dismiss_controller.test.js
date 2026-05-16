import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import TagDismissController from '../../src/js/controllers/tag-dismiss_controller.js';
import { setTranslations, setLocale, __reset } from '../../src/js/utils/i18n.js';

/**
 * Unit tests for the Tag compound's `tag-dismiss` controller (S2.6 — opt-in).
 *
 * Mirrors the alert-dismiss S1.4b test pattern verbatim, with one extra
 * assertion : the announcer message interpolates the Tag's label so SR
 * users know which tag was removed when several are present.
 *
 * Coverage map (6 tests):
 *
 *  1. dismiss() — click stamps data-state="dismissing" on the tag root.
 *  2. transitionend (opacity) — removes the tag from the DOM.
 *  3. transitionend (non-opacity, e.g. background-color) — does NOT remove.
 *  4. dispatches `tag:dismissed` (bubbles, composed) with detail.label.
 *  5. announces the resolved (label-interpolated) message in #theme-announcer.
 *  6. multiple dismissable tags act independently (no cross-talk).
 */
describe('TagDismissController', () => {
  let app;

  beforeEach(() => {
    __reset();
    setTranslations('fr', {
      'theme.tag.aria.dismiss': 'Retirer l\'étiquette « {label} »',
      'theme.tag.aria.dismissed': 'Étiquette « {label} » retirée.',
    });
    setLocale('fr');
  });

  afterEach(() => {
    if (app) app.stop();
    document.body.innerHTML = '';
  });

  async function mount(label = 'JavaScript') {
    document.body.innerHTML = `
      <div id="theme-announcer" aria-live="polite" aria-atomic="true"></div>
      <span id="tag"
        class="theme-tag"
        data-variant="primary"
        data-soft="true"
        data-controller="tag-dismiss"
        data-tag-dismiss-label-value="${label}">
        <span class="theme-tag__label">${label}</span>
        <button id="dismiss" type="button" class="theme-tag__dismiss"
          aria-label="Retirer l'étiquette « ${label} »"
          data-action="click->tag-dismiss#dismiss"><span aria-hidden="true">×</span></button>
      </span>
    `;
    app = Application.start();
    app.register('tag-dismiss', TagDismissController);
    await new Promise((r) => setTimeout(r, 0));
    return {
      tag: document.getElementById('tag'),
      dismissBtn: document.getElementById('dismiss'),
      announcer: document.getElementById('theme-announcer'),
    };
  }

  function fireOpacityTransitionEnd(el) {
    const evt = new Event('transitionend', { bubbles: true });
    Object.defineProperty(evt, 'propertyName', { value: 'opacity', enumerable: true });
    el.dispatchEvent(evt);
  }

  function fireNonOpacityTransitionEnd(el) {
    const evt = new Event('transitionend', { bubbles: true });
    Object.defineProperty(evt, 'propertyName', { value: 'background-color', enumerable: true });
    el.dispatchEvent(evt);
  }

  it('dismiss() — click stamps data-state="dismissing" on the tag root', async () => {
    const { tag, dismissBtn } = await mount();
    expect(tag.dataset.state).toBeUndefined();
    dismissBtn.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(tag.dataset.state).toBe('dismissing');
  });

  it('transitionend (opacity) — removes the tag from the DOM', async () => {
    const { tag, dismissBtn } = await mount();
    dismissBtn.click();
    await new Promise((r) => setTimeout(r, 0));
    expect(document.getElementById('tag')).toBe(tag);
    fireOpacityTransitionEnd(tag);
    await new Promise((r) => setTimeout(r, 0));
    expect(document.getElementById('tag')).toBeNull();
  });

  it('transitionend (non-opacity) — does NOT remove the tag', async () => {
    const { tag, dismissBtn } = await mount();
    dismissBtn.click();
    await new Promise((r) => setTimeout(r, 0));
    fireNonOpacityTransitionEnd(tag);
    await new Promise((r) => setTimeout(r, 0));
    expect(document.getElementById('tag')).toBe(tag);
  });

  it('dispatches `tag:dismissed` (bubbles, composed, detail.label) on opacity transitionend', async () => {
    const { tag, dismissBtn } = await mount('TypeScript');
    let captured = null;
    document.addEventListener('tag:dismissed', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, composed: e.composed, detail: e.detail };
    });
    dismissBtn.click();
    await new Promise((r) => setTimeout(r, 0));
    fireOpacityTransitionEnd(tag);
    await new Promise((r) => setTimeout(r, 0));
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('tag:dismissed');
    expect(captured.bubbles).toBe(true);
    expect(captured.composed).toBe(true);
    expect(captured.detail).toEqual({ label: 'TypeScript' });
  });

  it('announces the label-interpolated message in #theme-announcer', async () => {
    const { tag, dismissBtn, announcer } = await mount('Python');
    dismissBtn.click();
    await new Promise((r) => setTimeout(r, 0));
    fireOpacityTransitionEnd(tag);
    await new Promise((r) => setTimeout(r, 0));
    expect(announcer.textContent).toBe('Étiquette « Python » retirée.');
  });

  it('multiple dismissable tags act independently (no cross-talk)', async () => {
    document.body.innerHTML = `
      <div id="theme-announcer" aria-live="polite" aria-atomic="true"></div>
      <span id="tag-1" class="theme-tag" data-controller="tag-dismiss" data-tag-dismiss-label-value="One">
        <button id="d1" type="button" data-action="click->tag-dismiss#dismiss">×</button>
      </span>
      <span id="tag-2" class="theme-tag" data-controller="tag-dismiss" data-tag-dismiss-label-value="Two">
        <button id="d2" type="button" data-action="click->tag-dismiss#dismiss">×</button>
      </span>
    `;
    app = Application.start();
    app.register('tag-dismiss', TagDismissController);
    await new Promise((r) => setTimeout(r, 0));

    document.getElementById('d1').click();
    await new Promise((r) => setTimeout(r, 0));
    expect(document.getElementById('tag-1').dataset.state).toBe('dismissing');
    expect(document.getElementById('tag-2').dataset.state).toBeUndefined();

    fireOpacityTransitionEnd(document.getElementById('tag-1'));
    await new Promise((r) => setTimeout(r, 0));
    expect(document.getElementById('tag-1')).toBeNull();
    expect(document.getElementById('tag-2')).not.toBeNull();
  });
});
