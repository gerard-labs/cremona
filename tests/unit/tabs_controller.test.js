import { describe, it, expect, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import TabsController from '../../src/js/controllers/tabs_controller.js';

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the Tabs compound's `tabs` controller (S2.8).
 *
 * Coverage map (14 tests) :
 *
 *  Initial render + value defaulting
 *   1. connect with valueValue set → DOM synced (aria-selected, tabindex, hidden).
 *   2. connect with valueValue empty → first non-disabled trigger picked as default.
 *   3. connect skips disabled triggers when defaulting.
 *
 *  Click activation
 *   4. click on inactive trigger → tabs:change dispatched + DOM re-synced.
 *   5. click on disabled trigger → no-op (no dispatch).
 *   6. click on already-active trigger → no-op (no dispatch).
 *
 *  Keyboard nav — automatic activation (default)
 *   7. ArrowRight on active → next trigger focused + selected, dispatch fires.
 *   8. ArrowLeft on first → wraps to last (cyclic).
 *   9. Home → focuses + selects first trigger.
 *  10. End → focuses + selects last trigger.
 *
 *  Keyboard nav — manual activation
 *  11. activation='manual' + Arrow → focus moves, selection unchanged.
 *  12. activation='manual' + Enter on focused tab → selects it.
 *
 *  Orientation
 *  13. orientation='vertical' → ArrowDown nexts, ArrowUp prevs.
 *
 *  Event detail shape
 *  14. tabs:change detail carries { value, previousValue }.
 */
describe('TabsController', () => {
  let app;

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
  });

  async function mount({
    value = 'tab-1',
    orientation = 'horizontal',
    activation = 'automatic',
    disabled = [],
  } = {}) {
    const tabs = ['tab-1', 'tab-2', 'tab-3'];
    const triggers = tabs.map((id) => {
      const isDisabled = disabled.includes(id);
      const disAttr = isDisabled ? ' disabled aria-disabled="true"' : '';
      return `<button id="trig-${id}" type="button" role="tab"
        class="theme-tabs__trigger"
        data-tabs-target="trigger"
        data-tab-id="${id}"
        data-action="click->tabs#activate keydown->tabs#onKeydown"
        aria-controls="panel-${id}"${disAttr}>${id}</button>`;
    }).join('');
    const panels = tabs.map((id) => `<div id="panel-${id}" role="tabpanel"
      class="theme-tabs__panel"
      data-tabs-target="panel"
      data-tab-id="${id}"
      aria-labelledby="trig-${id}"
      tabindex="0">panel ${id}</div>`).join('');
    document.body.innerHTML = `
      <div id="t" class="theme-tabs"
        data-controller="tabs"
        data-tabs-value-value="${value}"
        data-tabs-orientation-value="${orientation}"
        data-tabs-activation-value="${activation}">
        <div role="tablist" class="theme-tabs__list" data-tabs-target="list"
          aria-label="Tests">${triggers}</div>
        ${panels}
      </div>
    `;
    app = Application.start();
    app.register('tabs', TabsController);
    await tick();
    await tick();
    return {
      wrap: document.getElementById('t'),
      ctrl: app.controllers.find((c) => c.identifier === 'tabs'),
      trig: (id) => document.getElementById(`trig-${id}`),
      panel: (id) => document.getElementById(`panel-${id}`),
    };
  }

  function key(target, k) {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  }

  // 1
  it('connect with valueValue set → DOM synced (aria-selected, tabindex, hidden)', async () => {
    const { trig, panel } = await mount({ value: 'tab-2' });
    expect(trig('tab-1').getAttribute('aria-selected')).toBe('false');
    expect(trig('tab-1').getAttribute('tabindex')).toBe('-1');
    expect(trig('tab-2').getAttribute('aria-selected')).toBe('true');
    expect(trig('tab-2').getAttribute('tabindex')).toBe('0');
    expect(panel('tab-1').hidden).toBe(true);
    expect(panel('tab-2').hidden).toBe(false);
    expect(panel('tab-3').hidden).toBe(true);
  });

  // 2
  it('connect with valueValue empty → first non-disabled trigger picked as default', async () => {
    const { ctrl, trig } = await mount({ value: '' });
    expect(ctrl.valueValue).toBe('tab-1');
    expect(trig('tab-1').getAttribute('aria-selected')).toBe('true');
  });

  // 3
  it('connect skips disabled triggers when defaulting', async () => {
    const { ctrl, trig } = await mount({ value: '', disabled: ['tab-1'] });
    expect(ctrl.valueValue).toBe('tab-2');
    expect(trig('tab-2').getAttribute('aria-selected')).toBe('true');
  });

  // 4
  it('click on inactive trigger → tabs:change dispatched + DOM re-synced', async () => {
    const { wrap, trig, panel } = await mount({ value: 'tab-1' });
    const events = [];
    wrap.addEventListener('tabs:change', (e) => events.push(e.detail));
    trig('tab-2').click();
    await tick();
    expect(trig('tab-1').getAttribute('aria-selected')).toBe('false');
    expect(trig('tab-2').getAttribute('aria-selected')).toBe('true');
    expect(panel('tab-2').hidden).toBe(false);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ value: 'tab-2', previousValue: 'tab-1' });
  });

  // 5
  it('click on disabled trigger → no-op (no dispatch)', async () => {
    const { wrap, ctrl, trig } = await mount({ value: 'tab-1', disabled: ['tab-2'] });
    const events = [];
    wrap.addEventListener('tabs:change', (e) => events.push(e.detail));
    trig('tab-2').click();
    await tick();
    expect(ctrl.valueValue).toBe('tab-1');
    expect(events).toHaveLength(0);
  });

  // 6
  it('click on already-active trigger → no-op (no dispatch)', async () => {
    const { wrap, ctrl, trig } = await mount({ value: 'tab-2' });
    const events = [];
    wrap.addEventListener('tabs:change', (e) => events.push(e.detail));
    trig('tab-2').click();
    await tick();
    expect(ctrl.valueValue).toBe('tab-2');
    expect(events).toHaveLength(0);
  });

  // 7
  it('ArrowRight on active → next trigger focused + selected, dispatch fires (automatic)', async () => {
    const { wrap, ctrl, trig } = await mount({ value: 'tab-1' });
    const events = [];
    wrap.addEventListener('tabs:change', (e) => events.push(e.detail));
    key(trig('tab-1'), 'ArrowRight');
    await tick();
    expect(ctrl.valueValue).toBe('tab-2');
    expect(document.activeElement).toBe(trig('tab-2'));
    expect(events).toHaveLength(1);
  });

  // 8
  it('ArrowLeft on first → wraps to last (cyclic)', async () => {
    const { ctrl, trig } = await mount({ value: 'tab-1' });
    key(trig('tab-1'), 'ArrowLeft');
    await tick();
    expect(ctrl.valueValue).toBe('tab-3');
    expect(document.activeElement).toBe(trig('tab-3'));
  });

  // 9
  it('Home → focuses + selects first trigger', async () => {
    const { ctrl, trig } = await mount({ value: 'tab-3' });
    key(trig('tab-3'), 'Home');
    await tick();
    expect(ctrl.valueValue).toBe('tab-1');
    expect(document.activeElement).toBe(trig('tab-1'));
  });

  // 10
  it('End → focuses + selects last trigger', async () => {
    const { ctrl, trig } = await mount({ value: 'tab-1' });
    key(trig('tab-1'), 'End');
    await tick();
    expect(ctrl.valueValue).toBe('tab-3');
    expect(document.activeElement).toBe(trig('tab-3'));
  });

  // 11
  it('activation=manual + ArrowRight → focus moves, selection unchanged', async () => {
    const { wrap, ctrl, trig } = await mount({ value: 'tab-1', activation: 'manual' });
    const events = [];
    wrap.addEventListener('tabs:change', (e) => events.push(e.detail));
    key(trig('tab-1'), 'ArrowRight');
    await tick();
    expect(document.activeElement).toBe(trig('tab-2'));
    expect(ctrl.valueValue).toBe('tab-1');
    expect(events).toHaveLength(0);
  });

  // 12
  it('activation=manual + Enter on focused tab → selects it', async () => {
    const { ctrl, trig } = await mount({ value: 'tab-1', activation: 'manual' });
    key(trig('tab-1'), 'ArrowRight');
    await tick();
    expect(document.activeElement).toBe(trig('tab-2'));
    // Now Enter on the focused (tab-2) trigger activates it.
    key(trig('tab-2'), 'Enter');
    await tick();
    expect(ctrl.valueValue).toBe('tab-2');
  });

  // 13
  it('orientation=vertical → ArrowDown nexts, ArrowUp prevs', async () => {
    const { ctrl, trig } = await mount({ value: 'tab-1', orientation: 'vertical' });
    key(trig('tab-1'), 'ArrowDown');
    await tick();
    expect(ctrl.valueValue).toBe('tab-2');
    key(trig('tab-2'), 'ArrowUp');
    await tick();
    expect(ctrl.valueValue).toBe('tab-1');
    // Horizontal keys are NOT honored in vertical mode.
    key(trig('tab-1'), 'ArrowRight');
    await tick();
    expect(ctrl.valueValue).toBe('tab-1');
  });

  // 14
  it('tabs:change detail carries { value, previousValue }', async () => {
    const { wrap, trig } = await mount({ value: 'tab-1' });
    const events = [];
    wrap.addEventListener('tabs:change', (e) => events.push(e.detail));
    trig('tab-3').click();
    await tick();
    expect(events[0]).toEqual({ value: 'tab-3', previousValue: 'tab-1' });
  });
});
