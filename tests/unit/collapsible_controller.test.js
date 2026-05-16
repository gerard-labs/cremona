import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import CollapsibleController from '../../src/js/controllers/collapsible_controller.js';

/**
 * Unit tests for the Collapsible primitive's `collapsible` controller.
 *
 * Responsibilities covered:
 *   1. connect() syncs the content's data-state from the trigger's
 *      aria-expanded so the visual matches the initial DOM.
 *   2. toggle() flips aria-expanded AND data-state in lockstep.
 *   3. toggle() dispatches `collapsible:toggle` (bubbles + composed) with
 *      detail.open reflecting the NEW state (post-flip).
 *   4. Two Collapsibles in the same DOM are independent — toggling one
 *      does not affect the other.
 *
 * The tests call the controller's `toggle()` method directly (via the
 * Application's controllers index) rather than simulating a click —
 * this isolates the controller's behavior from Stimulus's action binding
 * which is Stimulus's own responsibility (not under test here).
 */
describe('CollapsibleController', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
  });

  async function mount({ open = false, secondOpen = null } = {}) {
    const second = secondOpen != null ? `
      <div class="cremona-collapsible" id="c2" data-controller="collapsible" data-action="click->collapsible#toggle">
        <button type="button" class="cremona-collapsible__trigger"
          aria-expanded="${secondOpen ? 'true' : 'false'}"
          aria-controls="c2-content">Second</button>
        <div id="c2-content" class="cremona-collapsible__content" data-state="${secondOpen ? 'open' : 'closed'}">
          <div class="cremona-collapsible__content-inner"><p>Second content</p></div>
        </div>
      </div>
    ` : '';
    document.body.innerHTML = `
      <div class="cremona-collapsible" id="c1" data-controller="collapsible" data-action="click->collapsible#toggle">
        <button id="trigger" type="button" class="cremona-collapsible__trigger"
          aria-expanded="${open ? 'true' : 'false'}"
          aria-controls="c1-content">First</button>
        <div id="c1-content" class="cremona-collapsible__content" data-state="${open ? 'open' : 'closed'}">
          <div class="cremona-collapsible__content-inner"><p>First content</p></div>
        </div>
      </div>
      ${second}
    `;
    app = Application.start();
    app.register('collapsible', CollapsibleController);
    await new Promise((r) => setTimeout(r, 0));
    return {
      first: document.getElementById('c1'),
      second: document.getElementById('c2'),
      firstCtrl: app.controllers.find((c) => c.element.id === 'c1'),
      secondCtrl: app.controllers.find((c) => c.element.id === 'c2'),
    };
  }

  it('connect() — syncs data-state on the content from aria-expanded', async () => {
    const { first } = await mount({ open: true });
    expect(first.querySelector('.cremona-collapsible__content').dataset.state).toBe('open');
  });

  it('connect() — defaults to closed when aria-expanded is false', async () => {
    const { first } = await mount({ open: false });
    expect(first.querySelector('.cremona-collapsible__content').dataset.state).toBe('closed');
  });

  it('toggle() — closed → open flips aria-expanded and data-state', async () => {
    const { first, firstCtrl } = await mount({ open: false });
    firstCtrl.toggle();
    expect(first.querySelector('.cremona-collapsible__trigger').getAttribute('aria-expanded')).toBe('true');
    expect(first.querySelector('.cremona-collapsible__content').dataset.state).toBe('open');
  });

  it('toggle() — open → closed flips back', async () => {
    const { first, firstCtrl } = await mount({ open: true });
    firstCtrl.toggle();
    expect(first.querySelector('.cremona-collapsible__trigger').getAttribute('aria-expanded')).toBe('false');
    expect(first.querySelector('.cremona-collapsible__content').dataset.state).toBe('closed');
  });

  it('toggle() — dispatches collapsible:toggle (bubbles) with detail.open=true on open', async () => {
    const { first, firstCtrl } = await mount({ open: false });
    let captured = null;
    first.addEventListener('collapsible:toggle', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, detail: e.detail };
    });
    firstCtrl.toggle();
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('collapsible:toggle');
    expect(captured.bubbles).toBe(true);
    expect(captured.detail.open).toBe(true);
  });

  it('toggle() — dispatched detail.open reflects the NEW state on close', async () => {
    const { first, firstCtrl } = await mount({ open: true });
    let captured = null;
    first.addEventListener('collapsible:toggle', (e) => { captured = e.detail; });
    firstCtrl.toggle();
    expect(captured).toEqual({ open: false });
  });

  it('toggle() — filters out clicks outside the trigger (when called with an event)', async () => {
    const { first, firstCtrl } = await mount({ open: false });
    const contentInner = first.querySelector('.cremona-collapsible__content-inner');
    // Simulate a click event whose target is the content-inner, NOT the trigger.
    firstCtrl.toggle({ target: contentInner });
    expect(first.querySelector('.cremona-collapsible__trigger').getAttribute('aria-expanded')).toBe('false');
  });

  it('two Collapsibles are independent — toggling one does not affect the other', async () => {
    const { first, second, firstCtrl, secondCtrl } = await mount({ open: false, secondOpen: true });
    firstCtrl.toggle();
    expect(first.querySelector('.cremona-collapsible__content').dataset.state).toBe('open');
    expect(second.querySelector('.cremona-collapsible__trigger').getAttribute('aria-expanded')).toBe('true');
    expect(second.querySelector('.cremona-collapsible__content').dataset.state).toBe('open');
    // And vice versa: toggling second doesn't affect first.
    secondCtrl.toggle();
    expect(second.querySelector('.cremona-collapsible__trigger').getAttribute('aria-expanded')).toBe('false');
    expect(first.querySelector('.cremona-collapsible__trigger').getAttribute('aria-expanded')).toBe('true');
  });
});
