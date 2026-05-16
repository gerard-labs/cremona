import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

// Hoisted mocks for @floating-ui/dom — same pattern as
// popover_controller.test.js (popover is a co-mounted controller here).
const { mockCleanup, mockComputePosition, mockAutoUpdate } = vi.hoisted(() => {
  const cleanup = vi.fn();
  return {
    mockCleanup: cleanup,
    mockComputePosition: vi.fn(() =>
      Promise.resolve({ x: 100, y: 50, placement: 'bottom-start' }),
    ),
    mockAutoUpdate: vi.fn((trigger, content, fn) => {
      fn();
      return cleanup;
    }),
  };
});

vi.mock('@floating-ui/dom', () => ({
  computePosition: mockComputePosition,
  autoUpdate: mockAutoUpdate,
  offset: vi.fn(),
  flip: vi.fn(),
  shift: vi.fn(),
}));

const { default: PopoverController } = await import('../../src/js/controllers/popover_controller.js');
const { default: DropdownMenuController } = await import('../../src/js/controllers/dropdown-menu_controller.js');
const { default: ContextMenuController } = await import('../../src/js/controllers/context-menu_controller.js');

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the ContextMenu compound's `context-menu` controller,
 * co-mounted with `popover` + `dropdown-menu` controllers.
 *
 * Responsibilities covered (12 tests):
 *   1. openAt(event) — preventDefault native context menu.
 *   2. openAt(event) — positions phantom at clientX/clientY via inline style.
 *   3. openAt(event) — opens the popover (popoverCtrl.openValue → true).
 *   4. openAt — second call while open: closes + reopens at new coords.
 *   5. Dispatches context-menu:open (bubbles, composed, detail.{x,y}).
 *   6. Dispatches context-menu:close after popover:close.
 *   7. area="self" (default) — listener fires on data-action wrap binding
 *      (smoke: openAt() callable directly).
 *   8. area="parent" — connect attaches listener on parent element.
 *   9. area="window" — connect attaches listener on documentElement.
 *  10. Inherits role="menu" + role="menuitem" from DropdownMenu (smoke
 *      via super.connect() chain).
 *  11. Inherits Arrow Up/Down nav from DropdownMenu (keydown delegated).
 *  12. disconnect — removes parent/window contextmenu listener.
 */
describe('ContextMenuController', () => {
  let app;

  beforeEach(() => {
    mockCleanup.mockClear();
    mockComputePosition.mockClear();
    mockAutoUpdate.mockClear();
    document.body.innerHTML = '';
    document.documentElement.dir = 'ltr';
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
  });

  async function mount({ items = ['Cut', 'Copy', 'Paste'], area = 'self' } = {}) {
    const itemsHtml = items.map((label, i) => (
      `<div id="ci-${i}" class="theme-item">
        <div class="theme-item__text"><span class="theme-item__label">${label}</span></div>
      </div>`
    )).join('');
    document.body.innerHTML = `
      <div id="parent">
        <div id="wrap" class="theme-popover theme-dropdown-menu theme-context-menu"
          data-controller="popover dropdown-menu context-menu"
          data-action="contextmenu->context-menu#openAt keydown.esc@window->popover#close keydown->dropdown-menu#keydown click->dropdown-menu#onItemClick"
          data-popover-placement-value="bottom-start"
          data-popover-offset-value="0"
          data-popover-open-value="false"
          data-context-menu-area-value="${area}">
          <span class="theme-context-menu__phantom"
            data-popover-target="trigger"
            data-context-menu-target="phantom"
            aria-hidden="true"></span>
          <div id="cm-content"
            class="theme-popover__content theme-dropdown-menu__content theme-context-menu__content"
            data-popover-target="content"
            data-state="closed"
            role="menu"
            hidden>${itemsHtml}</div>
        </div>
      </div>
    `;
    app = Application.start();
    app.register('popover', PopoverController);
    app.register('dropdown-menu', DropdownMenuController);
    app.register('context-menu', ContextMenuController);
    await tick();
    await tick();
    return {
      parent: document.getElementById('parent'),
      wrap: document.getElementById('wrap'),
      content: document.getElementById('cm-content'),
      phantom: document.querySelector('[data-context-menu-target="phantom"]'),
      items: items.map((_, i) => document.getElementById(`ci-${i}`)),
      cmCtrl: app.controllers.find((c) => c.identifier === 'context-menu'),
      ddCtrl: app.controllers.find((c) => c.identifier === 'dropdown-menu'),
      popoverCtrl: app.controllers.find((c) => c.identifier === 'popover'),
    };
  }

  it('openAt — preventDefault native context menu', async () => {
    const { cmCtrl } = await mount();
    let prevented = false;
    cmCtrl.openAt({
      clientX: 100, clientY: 200,
      preventDefault: () => { prevented = true; },
    });
    expect(prevented).toBe(true);
  });

  it('openAt — positions phantom at clientX/clientY via inline style', async () => {
    const { cmCtrl, phantom } = await mount();
    cmCtrl.openAt({ clientX: 250, clientY: 380, preventDefault: () => {} });
    expect(phantom.style.position).toBe('fixed');
    expect(phantom.style.left).toBe('250px');
    expect(phantom.style.top).toBe('380px');
  });

  it('openAt — opens the popover (openValue → true)', async () => {
    const { cmCtrl, popoverCtrl } = await mount();
    expect(popoverCtrl.openValue).toBe(false);
    cmCtrl.openAt({ clientX: 50, clientY: 50, preventDefault: () => {} });
    await tick();
    expect(popoverCtrl.openValue).toBe(true);
  });

  it('openAt while open — closes then reopens at new coords', async () => {
    const { cmCtrl, popoverCtrl, phantom } = await mount();
    cmCtrl.openAt({ clientX: 100, clientY: 100, preventDefault: () => {} });
    await tick();
    expect(popoverCtrl.openValue).toBe(true);
    expect(phantom.style.left).toBe('100px');
    cmCtrl.openAt({ clientX: 300, clientY: 400, preventDefault: () => {} });
    await tick();
    await tick(); // microtask defer for the re-open
    await tick();
    expect(popoverCtrl.openValue).toBe(true);
    expect(phantom.style.left).toBe('300px');
    expect(phantom.style.top).toBe('400px');
  });

  it('dispatches context-menu:open (bubbles, composed, detail.{x,y})', async () => {
    const { wrap, cmCtrl } = await mount();
    let captured = null;
    wrap.addEventListener('context-menu:open', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, composed: e.composed, detail: e.detail };
    });
    cmCtrl.openAt({ clientX: 42, clientY: 84, preventDefault: () => {} });
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('context-menu:open');
    expect(captured.bubbles).toBe(true);
    expect(captured.composed).toBe(true);
    expect(captured.detail.x).toBe(42);
    expect(captured.detail.y).toBe(84);
  });

  it('dispatches context-menu:close after popover:close', async () => {
    const { wrap, cmCtrl, popoverCtrl } = await mount();
    cmCtrl.openAt({ clientX: 10, clientY: 20, preventDefault: () => {} });
    await tick();
    let captured = null;
    wrap.addEventListener('context-menu:close', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, composed: e.composed };
    });
    popoverCtrl.close();
    await tick();
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('context-menu:close');
    expect(captured.bubbles).toBe(true);
    expect(captured.composed).toBe(true);
  });

  it('area="self" — controller resolves area to wrap element', async () => {
    const { wrap, cmCtrl } = await mount({ area: 'self' });
    expect(cmCtrl._areaElement).toBe(wrap);
  });

  it('area="parent" — controller resolves to wrap.parentElement', async () => {
    const { parent, cmCtrl } = await mount({ area: 'parent' });
    expect(cmCtrl._areaElement).toBe(parent);
  });

  it('area="window" — controller resolves to document.documentElement', async () => {
    const { cmCtrl } = await mount({ area: 'window' });
    expect(cmCtrl._areaElement).toBe(document.documentElement);
  });

  it('inherits role="menu" + role="menuitem" stamping from DropdownMenu', async () => {
    const { content, items } = await mount();
    expect(content.getAttribute('role')).toBe('menu');
    items.forEach((it) => expect(it.getAttribute('role')).toBe('menuitem'));
  });

  it('inherits Arrow nav from DropdownMenu', async () => {
    const { items, ddCtrl } = await mount();
    items[0].focus();
    ddCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    expect(document.activeElement).toBe(items[1]);
  });

  it('disconnect — removes area listener (parent area)', async () => {
    const { parent, wrap, cmCtrl } = await mount({ area: 'parent' });
    expect(cmCtrl._areaElement).toBe(parent);
    wrap.remove();
    await tick();
    // After disconnect, contextmenu on the parent should NOT trigger any
    // openAt — we verify indirectly by checking _areaElement is nulled.
    expect(cmCtrl._areaElement).toBeNull();
  });
});
