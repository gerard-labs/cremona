import { describe, it, expect, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import SidebarController from '../../src/js/controllers/sidebar_controller.js';

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the Sidebar compound's `sidebar` controller (S2.8).
 *
 * Per the OQ-44 resolution sealed at S2.8 opening :
 *  - Event-only persistence (no localStorage / cookie / URL).
 *  - The controller dispatches `sidebar:collapse-change` ; consumer persists.
 *
 * Coverage map (10 tests) :
 *
 *  Initial render
 *   1. connect with collapsedValue=false → data-collapsed="false", aria-expanded="true".
 *   2. connect with collapsedValue=true → data-collapsed="true", aria-expanded="false".
 *   3. connect without collapseToggle target → no error, data-collapsed still stamped.
 *
 *  Toggle action
 *   4. toggleCollapse() → collapsedValue flips + DOM re-synced + dispatch fires.
 *   5. toggleCollapse() twice → ping-pong false → true → false, 2 dispatches.
 *
 *  Dispatch behavior
 *   6. dispatch detail.collapsed matches new state.
 *   7. dispatch bubbles + composed (catchable on parent).
 *   8. no spurious dispatch on initial mount (class-field guard pattern).
 *
 *  Manual value mutation
 *   9. Mutating collapsedValue directly (consumer code) → same DOM sync + dispatch.
 *  10. Setting collapsedValue to same value → no-op (no spurious dispatch).
 */
describe('SidebarController', () => {
  let app;

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
  });

  async function mount({ collapsed = false, withToggle = true } = {}) {
    const toggleHtml = withToggle ? `<button id="sb-toggle"
        class="cremona-sidebar__collapse-toggle"
        data-sidebar-target="collapseToggle"
        data-action="click->sidebar#toggleCollapse"
        aria-controls="sb"
        aria-expanded="true"
        aria-label="Toggle">☰</button>` : '';
    document.body.innerHTML = `
      <aside id="sb" class="cremona-sidebar"
        data-controller="sidebar"
        data-sidebar-collapsed-value="${collapsed}"
        aria-label="Navigation principale">
        <div class="cremona-sidebar__header">${toggleHtml}</div>
        <nav class="cremona-sidebar__nav" aria-label="Sections">
          <ul>
            <li><a class="cremona-item" href="/a">A</a></li>
            <li><a class="cremona-item" href="/b" aria-current="page">B</a></li>
          </ul>
        </nav>
      </aside>
    `;
    app = Application.start();
    app.register('sidebar', SidebarController);
    await tick();
    await tick();
    return {
      wrap: document.getElementById('sb'),
      ctrl: app.controllers.find((c) => c.identifier === 'sidebar'),
      toggle: document.getElementById('sb-toggle'),
    };
  }

  // 1
  it('connect with collapsedValue=false → data-collapsed="false", aria-expanded="true"', async () => {
    const { wrap, toggle } = await mount({ collapsed: false });
    expect(wrap.dataset.collapsed).toBe('false');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  // 2
  it('connect with collapsedValue=true → data-collapsed="true", aria-expanded="false"', async () => {
    const { wrap, toggle } = await mount({ collapsed: true });
    expect(wrap.dataset.collapsed).toBe('true');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  // 3
  it('connect without collapseToggle target → no error, data-collapsed still stamped', async () => {
    const { wrap } = await mount({ collapsed: true, withToggle: false });
    expect(wrap.dataset.collapsed).toBe('true');
    // no throw
  });

  // 4
  it('toggleCollapse() → collapsedValue flips + DOM re-synced + dispatch fires', async () => {
    const { wrap, ctrl, toggle } = await mount({ collapsed: false });
    const events = [];
    wrap.addEventListener('sidebar:collapse-change', (e) => events.push(e.detail));
    ctrl.toggleCollapse();
    await tick();
    expect(ctrl.collapsedValue).toBe(true);
    expect(wrap.dataset.collapsed).toBe('true');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ collapsed: true });
  });

  // 5
  it('toggleCollapse() twice → ping-pong false → true → false, 2 dispatches', async () => {
    const { wrap, ctrl } = await mount({ collapsed: false });
    const events = [];
    wrap.addEventListener('sidebar:collapse-change', (e) => events.push(e.detail));
    ctrl.toggleCollapse();
    await tick();
    ctrl.toggleCollapse();
    await tick();
    expect(ctrl.collapsedValue).toBe(false);
    expect(events).toHaveLength(2);
    expect(events[0].collapsed).toBe(true);
    expect(events[1].collapsed).toBe(false);
  });

  // 6
  it('dispatch detail.collapsed matches new state', async () => {
    const { wrap, ctrl } = await mount({ collapsed: true });
    const events = [];
    wrap.addEventListener('sidebar:collapse-change', (e) => events.push(e.detail));
    ctrl.toggleCollapse();
    await tick();
    expect(events[0]).toEqual({ collapsed: false });
  });

  // 7
  it('dispatch bubbles + composed (catchable on parent)', async () => {
    const { ctrl } = await mount({ collapsed: false });
    const events = [];
    // Listen on document (parent of the wrap) — only bubbling events reach here.
    const handler = (e) => events.push(e);
    document.addEventListener('sidebar:collapse-change', handler);
    ctrl.toggleCollapse();
    await tick();
    document.removeEventListener('sidebar:collapse-change', handler);
    expect(events).toHaveLength(1);
    expect(events[0].bubbles).toBe(true);
    expect(events[0].composed).toBe(true);
  });

  // 8
  it('no spurious dispatch on initial mount (class-field guard pattern)', async () => {
    document.body.innerHTML = `
      <aside id="sb" class="cremona-sidebar"
        data-controller="sidebar"
        data-sidebar-collapsed-value="true">
      </aside>
    `;
    const wrap = document.getElementById('sb');
    const events = [];
    wrap.addEventListener('sidebar:collapse-change', (e) => events.push(e.detail));
    app = Application.start();
    app.register('sidebar', SidebarController);
    await tick();
    await tick();
    expect(events).toHaveLength(0);
    expect(wrap.dataset.collapsed).toBe('true');
  });

  // 9
  it('Mutating collapsedValue directly (consumer code) → same DOM sync + dispatch', async () => {
    const { wrap, ctrl, toggle } = await mount({ collapsed: false });
    const events = [];
    wrap.addEventListener('sidebar:collapse-change', (e) => events.push(e.detail));
    ctrl.collapsedValue = true;
    await tick();
    expect(wrap.dataset.collapsed).toBe('true');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(events).toHaveLength(1);
  });

  // 10
  it('Setting collapsedValue to same value → no-op (no spurious dispatch)', async () => {
    const { wrap, ctrl } = await mount({ collapsed: false });
    const events = [];
    wrap.addEventListener('sidebar:collapse-change', (e) => events.push(e.detail));
    ctrl.collapsedValue = false;
    await tick();
    expect(events).toHaveLength(0);
  });
});
