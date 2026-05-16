import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import AccordionController from '../../src/js/controllers/accordion_controller.js';
import CollapsibleController from '../../src/js/controllers/collapsible_controller.js';

/**
 * Unit tests for the Accordion primitive's `accordion` controller.
 *
 * Responsibilities covered:
 *   1. setRovingTabindex() at connect — exactly one trigger has tabindex=0;
 *      single mode = currently-open trigger, else first non-disabled; multi
 *      mode = first non-disabled.
 *   2. onChildToggle() — single mode unpresses all other Collapsibles when
 *      one opens; multi mode no-op.
 *   3. keydown() — Arrow Up / Down / Home / End move focus + roving tabindex.
 *
 * Tests call controller methods directly (via app.controllers lookup) — same
 * isolation strategy as Collapsible's tests (happy-dom + Stimulus 3.2 action
 * binding via .click() / synthetic keydown is brittle; the controller logic
 * is what we actually need to assert).
 */
describe('AccordionController', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
  });

  function collapsibleHtml(id, { open = false, disabled = false } = {}) {
    return `
      <div class="cremona-collapsible" id="${id}" data-controller="collapsible" data-action="click->collapsible#toggle">
        <button id="${id}-trigger" type="button" class="cremona-collapsible__trigger"
          aria-expanded="${open ? 'true' : 'false'}"
          aria-controls="${id}-content"
          ${disabled ? 'disabled' : ''}>Trigger ${id}</button>
        <div id="${id}-content" class="cremona-collapsible__content" data-state="${open ? 'open' : 'closed'}">
          <div class="cremona-collapsible__content-inner"><p>${id} content</p></div>
        </div>
      </div>
    `;
  }

  async function mount({ mode = 'single', items = [{}, {}, {}] } = {}) {
    const inner = items.map((opts, i) => collapsibleHtml(`c${i + 1}`, opts)).join('');
    document.body.innerHTML = `
      <div id="acc" class="cremona-accordion"
        data-controller="accordion"
        data-action="collapsible:toggle->accordion#onChildToggle keydown->accordion#keydown"
        data-accordion-mode-value="${mode}">
        ${inner}
      </div>
    `;
    app = Application.start();
    app.register('collapsible', CollapsibleController);
    app.register('accordion', AccordionController);
    await new Promise((r) => setTimeout(r, 0));
    const accordion = document.getElementById('acc');
    const accCtrl = app.controllers.find((c) => c.identifier === 'accordion');
    const collapsibles = items.map((_, i) => document.getElementById(`c${i + 1}`));
    const collapsibleCtrls = items.map((_, i) =>
      app.controllers.find((c) => c.identifier === 'collapsible' && c.element.id === `c${i + 1}`),
    );
    const triggers = items.map((_, i) => document.getElementById(`c${i + 1}-trigger`));
    return { accordion, accCtrl, collapsibles, collapsibleCtrls, triggers };
  }

  it('setRovingTabindex() — single mode, no open: first non-disabled gets tabindex=0', async () => {
    const { triggers } = await mount({ mode: 'single', items: [{}, {}, {}] });
    expect(triggers[0].tabIndex).toBe(0);
    expect(triggers[1].tabIndex).toBe(-1);
    expect(triggers[2].tabIndex).toBe(-1);
  });

  it('setRovingTabindex() — single mode, c2 open: c2 trigger gets tabindex=0', async () => {
    const { triggers } = await mount({ mode: 'single', items: [{}, { open: true }, {}] });
    expect(triggers[0].tabIndex).toBe(-1);
    expect(triggers[1].tabIndex).toBe(0);
    expect(triggers[2].tabIndex).toBe(-1);
  });

  it('setRovingTabindex() — multi mode, first non-disabled wins', async () => {
    const { triggers } = await mount({
      mode: 'multi',
      items: [{ disabled: true }, { open: true }, { open: true }],
    });
    expect(triggers[0].tabIndex).toBe(-1);
    expect(triggers[1].tabIndex).toBe(0);
    expect(triggers[2].tabIndex).toBe(-1);
  });

  it('onChildToggle() — single mode, opening c2 closes c1 (mutex)', async () => {
    const { collapsibles, collapsibleCtrls, triggers } = await mount({
      mode: 'single',
      items: [{ open: true }, {}, {}],
    });
    // Open c2 by calling its toggle() directly (this dispatches
    // collapsible:toggle which bubbles to the accordion's onChildToggle).
    collapsibleCtrls[1].toggle();
    expect(triggers[0].getAttribute('aria-expanded')).toBe('false');
    expect(triggers[1].getAttribute('aria-expanded')).toBe('true');
    expect(collapsibles[0].querySelector('.cremona-collapsible__content').dataset.state).toBe('closed');
    expect(collapsibles[1].querySelector('.cremona-collapsible__content').dataset.state).toBe('open');
  });

  it('onChildToggle() — multi mode, opening c2 does NOT close c1', async () => {
    const { collapsibleCtrls, triggers } = await mount({
      mode: 'multi',
      items: [{ open: true }, {}, {}],
    });
    collapsibleCtrls[1].toggle();
    expect(triggers[0].getAttribute('aria-expanded')).toBe('true');
    expect(triggers[1].getAttribute('aria-expanded')).toBe('true');
  });

  it('onChildToggle() — single mode close: roving tabindex updates after a child closes', async () => {
    const { collapsibleCtrls, triggers } = await mount({
      mode: 'single',
      items: [{}, { open: true }, {}],
    });
    expect(triggers[1].tabIndex).toBe(0);
    // Close c2 — no other Collapsible is open, so roving should fall back to
    // first non-disabled (c1).
    collapsibleCtrls[1].toggle();
    expect(triggers[0].tabIndex).toBe(0);
    expect(triggers[1].tabIndex).toBe(-1);
  });

  it('keydown() — ArrowDown moves focus to the next trigger and updates tabindex', async () => {
    const { accCtrl, triggers } = await mount({ mode: 'single', items: [{}, {}, {}] });
    triggers[0].focus();
    accCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    expect(document.activeElement).toBe(triggers[1]);
    expect(triggers[0].tabIndex).toBe(-1);
    expect(triggers[1].tabIndex).toBe(0);
  });

  it('keydown() — ArrowUp wraps from first to last', async () => {
    const { accCtrl, triggers } = await mount({ mode: 'single', items: [{}, {}, {}] });
    triggers[0].focus();
    accCtrl.keydown({ key: 'ArrowUp', preventDefault: () => {} });
    expect(document.activeElement).toBe(triggers[2]);
  });

  it('keydown() — End jumps to the last trigger', async () => {
    const { accCtrl, triggers } = await mount({ mode: 'multi', items: [{}, {}, {}, {}] });
    triggers[0].focus();
    accCtrl.keydown({ key: 'End', preventDefault: () => {} });
    expect(document.activeElement).toBe(triggers[3]);
  });

  it('keydown() — disabled triggers are skipped', async () => {
    const { accCtrl, triggers } = await mount({
      mode: 'multi',
      items: [{}, { disabled: true }, {}],
    });
    triggers[0].focus();
    accCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    expect(document.activeElement).toBe(triggers[2]);
  });
});
