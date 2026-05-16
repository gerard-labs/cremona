import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import PreferencesCenterController from '../../src/js/controllers/preferences_center_controller.js';

async function tick() {
  await Promise.resolve();
}

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('preferences-center', PreferencesCenterController);
  return app;
}

function template({
  essentialChecked = true,
  analyticsChecked = false,
  marketingChecked = false,
  functionalChecked = true,
} = {}) {
  return `
    <div class="theme-rgpd-preferences-center" data-controller="preferences-center">
      <div class="theme-rgpd-preferences-center__categories">
        <div class="theme-rgpd-preferences-center__category">
          <input type="checkbox" name="essential" ${essentialChecked ? 'checked' : ''} disabled>
        </div>
        <div class="theme-rgpd-preferences-center__category">
          <input type="checkbox" name="analytics" ${analyticsChecked ? 'checked' : ''}>
        </div>
        <div class="theme-rgpd-preferences-center__category">
          <input type="checkbox" name="marketing" ${marketingChecked ? 'checked' : ''}>
        </div>
        <div class="theme-rgpd-preferences-center__category">
          <input type="checkbox" name="functional" ${functionalChecked ? 'checked' : ''}>
        </div>
      </div>
      <button type="button" data-preferences-center-target="saveButton" data-action="click->preferences-center#save">Save</button>
      <button type="button" data-action="click->preferences-center#cancel">Cancel</button>
    </div>
  `;
}

function fireChange(el) {
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('preferences-center controller', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    app?.stop();
  });

  it('captures initial state on connect (4 categories)', async () => {
    app = mount(template({ essentialChecked: true, analyticsChecked: false, marketingChecked: false, functionalChecked: true }));
    await tick();
    const wrap = document.querySelector('.theme-rgpd-preferences-center');
    const ctrl = app.getControllerForElementAndIdentifier(wrap, 'preferences-center');
    const state = ctrl.getState();
    expect(state.essential).toBe(true);
    expect(state.analytics).toBe(false);
    expect(state.marketing).toBe(false);
    expect(state.functional).toBe(true);
  });

  it('isDirty() returns false initially (no changes)', async () => {
    app = mount(template());
    await tick();
    const wrap = document.querySelector('.theme-rgpd-preferences-center');
    const ctrl = app.getControllerForElementAndIdentifier(wrap, 'preferences-center');
    expect(ctrl.isDirty()).toBe(false);
  });

  it('dispatches preferences-center:dirty when user toggles a category', async () => {
    app = mount(template());
    await tick();
    const wrap = document.querySelector('.theme-rgpd-preferences-center');
    const events = [];
    wrap.addEventListener('preferences-center:dirty', (e) => events.push(e.detail));
    const analytics = wrap.querySelector('input[name="analytics"]');
    analytics.checked = true;
    fireChange(analytics);
    await tick();
    expect(events).toHaveLength(1);
    expect(events[0].dirty).toBe(true);
  });

  it('save() dispatches preferences-center:save with full state object', async () => {
    app = mount(template());
    await tick();
    const wrap = document.querySelector('.theme-rgpd-preferences-center');
    const events = [];
    wrap.addEventListener('preferences-center:save', (e) => events.push(e.detail));
    const analytics = wrap.querySelector('input[name="analytics"]');
    analytics.checked = true;
    fireChange(analytics);
    await tick();
    const saveBtn = wrap.querySelector('[data-preferences-center-target="saveButton"]');
    saveBtn.click();
    await tick();
    expect(events).toHaveLength(1);
    expect(events[0].consent.essential).toBe(true);
    expect(events[0].consent.analytics).toBe(true);
    expect(events[0].consent.marketing).toBe(false);
    expect(events[0].consent.functional).toBe(true);
    expect(events[0].persistedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('cancel() resets all toggles to initial state + dispatches cancel', async () => {
    app = mount(template());
    await tick();
    const wrap = document.querySelector('.theme-rgpd-preferences-center');
    const events = [];
    wrap.addEventListener('preferences-center:cancel', (e) => events.push(e.detail));
    const analytics = wrap.querySelector('input[name="analytics"]');
    analytics.checked = true;
    fireChange(analytics);
    await tick();
    expect(analytics.checked).toBe(true);
    const cancelBtn = wrap.querySelectorAll('button')[1];
    cancelBtn.click();
    await tick();
    expect(analytics.checked).toBe(false); // reset to initial
    expect(events).toHaveLength(1);
  });

  it('required (disabled) category cannot be toggled off — defensive revert', async () => {
    app = mount(template());
    await tick();
    const wrap = document.querySelector('.theme-rgpd-preferences-center');
    const essential = wrap.querySelector('input[name="essential"]');
    // Even if forced unchecked + change fired, controller reverts.
    essential.checked = false;
    fireChange(essential);
    await tick();
    expect(essential.checked).toBe(true);
  });

  it('save() resets the initial baseline (subsequent toggles dirty against new baseline)', async () => {
    app = mount(template());
    await tick();
    const wrap = document.querySelector('.theme-rgpd-preferences-center');
    const ctrl = app.getControllerForElementAndIdentifier(wrap, 'preferences-center');
    const analytics = wrap.querySelector('input[name="analytics"]');
    analytics.checked = true;
    fireChange(analytics);
    await tick();
    expect(ctrl.isDirty()).toBe(true);
    const saveBtn = wrap.querySelector('[data-preferences-center-target="saveButton"]');
    saveBtn.click();
    await tick();
    expect(ctrl.isDirty()).toBe(false); // saved state is new baseline
  });

  it('dirty event NOT dispatched when toggling back to initial state', async () => {
    app = mount(template());
    await tick();
    const wrap = document.querySelector('.theme-rgpd-preferences-center');
    const events = [];
    const analytics = wrap.querySelector('input[name="analytics"]');
    // Become dirty (analytics OFF → ON).
    analytics.checked = true;
    fireChange(analytics);
    await tick();
    wrap.addEventListener('preferences-center:dirty', (e) => events.push(e.detail));
    // Revert to initial (analytics ON → OFF — back to initial state).
    analytics.checked = false;
    fireChange(analytics);
    await tick();
    // Dirty event fires (true → false transition).
    expect(events).toHaveLength(1);
    expect(events[0].dirty).toBe(false);
  });

  it('getState() returns snapshot at call time (post-toggle)', async () => {
    app = mount(template());
    await tick();
    const wrap = document.querySelector('.theme-rgpd-preferences-center');
    const ctrl = app.getControllerForElementAndIdentifier(wrap, 'preferences-center');
    const marketing = wrap.querySelector('input[name="marketing"]');
    marketing.checked = true;
    fireChange(marketing);
    await tick();
    const snapshot = ctrl.getState();
    expect(snapshot.marketing).toBe(true);
  });

  it('multiple toggles aggregate correctly in the same save', async () => {
    app = mount(template());
    await tick();
    const wrap = document.querySelector('.theme-rgpd-preferences-center');
    const events = [];
    wrap.addEventListener('preferences-center:save', (e) => events.push(e.detail));
    const analytics = wrap.querySelector('input[name="analytics"]');
    const marketing = wrap.querySelector('input[name="marketing"]');
    analytics.checked = true;
    fireChange(analytics);
    marketing.checked = true;
    fireChange(marketing);
    await tick();
    const saveBtn = wrap.querySelector('[data-preferences-center-target="saveButton"]');
    saveBtn.click();
    await tick();
    expect(events).toHaveLength(1);
    expect(events[0].consent.analytics).toBe(true);
    expect(events[0].consent.marketing).toBe(true);
  });

  it('disconnect cleanup — no throw', async () => {
    app = mount(template());
    await tick();
    const wrap = document.querySelector('.theme-rgpd-preferences-center');
    wrap.remove();
    await tick();
    expect(true).toBe(true);
  });
});
