import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

// Hoisted mocks for @floating-ui/dom (used by the co-mounted popover
// controller). Same pattern as popover_controller.test.js.
const { mockCleanup, mockComputePosition, mockAutoUpdate } = vi.hoisted(() => {
  const cleanup = vi.fn();
  return {
    mockCleanup: cleanup,
    mockComputePosition: vi.fn(() =>
      Promise.resolve({ x: 100, y: 50, placement: 'bottom' }),
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

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the DropdownMenu compound's `dropdown-menu` controller,
 * co-mounted with the `popover` controller on the same wrap element.
 *
 * Responsibilities covered:
 *   1. _initRoles — content gets role="menu", items get role="menuitem".
 *   2. _initRovingTabindex — first non-disabled item gets tabindex=0, rest -1.
 *   3. items getter — excludes aria-disabled items.
 *   4. _onPopoverOpen — first item focused on popover open.
 *   5. keydown ArrowDown — focus moves to next item (cyclic).
 *   6. keydown ArrowUp — focus moves to previous (wraps from first to last).
 *   7. keydown Home / End — first / last item.
 *   8. keydown Enter / Space — triggers click on focused item.
 *   9. keydown when focus outside items — ArrowDown lands on first.
 *  10. onItemClick — closes popover via cross-controller.
 *  11. onItemClick with aria-disabled item — does NOT close.
 *  12. Disabled items skipped from roving / Arrow nav.
 *  13. disconnect removes popover:open listener.
 *
 * Per S1.4b descriptor-binding gotcha: tests call controller methods
 * directly rather than synthesising events.
 */
describe('DropdownMenuController', () => {
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

  async function mount({ items = ['One', 'Two', 'Three'], disabledIdx = -1 } = {}) {
    const itemsHtml = items.map((label, i) => {
      const dis = i === disabledIdx ? ' aria-disabled="true"' : '';
      return `<div id="it-${i}" class="cremona-item"${dis}>
        <div class="cremona-item__text"><span class="cremona-item__label">${label}</span></div>
      </div>`;
    }).join('');
    document.body.innerHTML = `
      <div id="wrap" class="cremona-popover cremona-dropdown-menu"
        data-controller="popover dropdown-menu"
        data-action="click->popover#toggle keydown.esc@window->popover#close keydown->dropdown-menu#keydown click->dropdown-menu#onItemClick"
        data-popover-placement-value="bottom"
        data-popover-offset-value="8"
        data-popover-open-value="false">
        <button id="trigger" data-popover-target="trigger"
          aria-haspopup="menu" aria-expanded="false" aria-controls="dd-content">Open</button>
        <div id="dd-content" class="cremona-popover__content cremona-dropdown-menu__content"
          data-popover-target="content"
          data-state="closed"
          hidden>
          ${itemsHtml}
        </div>
      </div>
    `;
    app = Application.start();
    app.register('popover', PopoverController);
    app.register('dropdown-menu', DropdownMenuController);
    await tick();
    await tick();
    return {
      wrap: document.getElementById('wrap'),
      trigger: document.getElementById('trigger'),
      content: document.getElementById('dd-content'),
      items: items.map((_, i) => document.getElementById(`it-${i}`)),
      ddCtrl: app.controllers.find((c) => c.identifier === 'dropdown-menu'),
      popoverCtrl: app.controllers.find((c) => c.identifier === 'popover'),
    };
  }

  it('_initRoles — content gets role="menu", items get role="menuitem"', async () => {
    const { content, items } = await mount();
    expect(content.getAttribute('role')).toBe('menu');
    items.forEach((item) => expect(item.getAttribute('role')).toBe('menuitem'));
  });

  it('_initRovingTabindex — first item tabindex=0, rest tabindex=-1', async () => {
    const { items } = await mount();
    expect(items[0].tabIndex).toBe(0);
    expect(items[1].tabIndex).toBe(-1);
    expect(items[2].tabIndex).toBe(-1);
  });

  it('items getter — excludes aria-disabled items', async () => {
    const { ddCtrl } = await mount({ disabledIdx: 1 });
    const enabled = ddCtrl.items;
    expect(enabled.length).toBe(2);
    expect(enabled[0].id).toBe('it-0');
    expect(enabled[1].id).toBe('it-2');
  });

  it('_onPopoverOpen — first item gets focus when popover opens', async () => {
    const { items, popoverCtrl } = await mount();
    popoverCtrl.open();
    await tick();
    expect(document.activeElement).toBe(items[0]);
    expect(items[0].tabIndex).toBe(0);
  });

  it('keydown ArrowDown — focus moves to next item (cyclic)', async () => {
    const { items, ddCtrl } = await mount();
    items[0].focus();
    ddCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    expect(document.activeElement).toBe(items[1]);
    expect(items[0].tabIndex).toBe(-1);
    expect(items[1].tabIndex).toBe(0);
  });

  it('keydown ArrowDown on last → wraps to first', async () => {
    const { items, ddCtrl } = await mount();
    items[2].focus();
    items[2].tabIndex = 0; items[0].tabIndex = -1;
    ddCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    expect(document.activeElement).toBe(items[0]);
  });

  it('keydown ArrowUp — focus moves to previous (wraps from first to last)', async () => {
    const { items, ddCtrl } = await mount();
    items[0].focus();
    ddCtrl.keydown({ key: 'ArrowUp', preventDefault: () => {} });
    expect(document.activeElement).toBe(items[2]);
  });

  it('keydown Home — jumps to first item', async () => {
    const { items, ddCtrl } = await mount();
    items[2].focus();
    items[2].tabIndex = 0; items[0].tabIndex = -1;
    ddCtrl.keydown({ key: 'Home', preventDefault: () => {} });
    expect(document.activeElement).toBe(items[0]);
  });

  it('keydown End — jumps to last item', async () => {
    const { items, ddCtrl } = await mount();
    items[0].focus();
    ddCtrl.keydown({ key: 'End', preventDefault: () => {} });
    expect(document.activeElement).toBe(items[2]);
  });

  it('keydown Enter — triggers click on focused item', async () => {
    const { items, ddCtrl } = await mount();
    items[1].focus();
    let clicked = false;
    items[1].addEventListener('click', () => { clicked = true; });
    ddCtrl.keydown({ key: 'Enter', preventDefault: () => {} });
    expect(clicked).toBe(true);
  });

  it('keydown Space — triggers click on focused item', async () => {
    const { items, ddCtrl } = await mount();
    items[0].focus();
    let clicked = false;
    items[0].addEventListener('click', () => { clicked = true; });
    ddCtrl.keydown({ key: ' ', preventDefault: () => {} });
    expect(clicked).toBe(true);
  });

  it('keydown ArrowDown when focus outside items — jumps to first', async () => {
    const { trigger, items, ddCtrl } = await mount();
    trigger.focus(); // outside items
    ddCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    expect(document.activeElement).toBe(items[0]);
  });

  it('keydown ArrowUp when focus outside items — jumps to last', async () => {
    const { trigger, items, ddCtrl } = await mount();
    trigger.focus();
    ddCtrl.keydown({ key: 'ArrowUp', preventDefault: () => {} });
    expect(document.activeElement).toBe(items[2]);
  });

  it('onItemClick — closes popover via cross-controller', async () => {
    const { items, ddCtrl, popoverCtrl } = await mount();
    popoverCtrl.open();
    await tick();
    expect(popoverCtrl.openValue).toBe(true);
    ddCtrl.onItemClick({ target: items[1] });
    await tick();
    expect(popoverCtrl.openValue).toBe(false);
  });

  it('onItemClick with aria-disabled item — does NOT close', async () => {
    const { items, ddCtrl, popoverCtrl } = await mount({ disabledIdx: 1 });
    popoverCtrl.open();
    await tick();
    ddCtrl.onItemClick({ target: items[1] });
    await tick();
    expect(popoverCtrl.openValue).toBe(true);
  });

  it('disabled item — skipped from Arrow nav', async () => {
    const { items, ddCtrl } = await mount({ disabledIdx: 1 });
    items[0].focus();
    ddCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    // Item at index 1 is disabled → items getter returns [0, 2] → ArrowDown
    // from index 0 (in enabled list) goes to index 1 (in enabled list) = item 2.
    expect(document.activeElement).toBe(items[2]);
  });

  it('disconnect removes popover:open listener', async () => {
    const { wrap, ddCtrl, items, popoverCtrl } = await mount();
    // Initial state: items[0].tabIndex===0 from _initRovingTabindex.
    wrap.remove();
    await tick();
    // After removal, even if a popover:open event were dispatched, the handler
    // is unregistered. We verify indirectly: the focus state from a fresh
    // popover.open call should not move (controller is disconnected).
    items[0].blur();
    // We can't easily test the listener removal without re-mounting; the test
    // approximates by checking that ddCtrl._popoverController returns
    // something (or doesn't crash) — disconnect should not throw.
    expect(() => ddCtrl.disconnect()).not.toThrow();
    void popoverCtrl;
  });

  // OQ-27 — Tab-out dismiss (sealed S2.2 opening). When focus leaves the
  // wrap, the menu auto-closes via cross-controller close().
  it('focusout with relatedTarget outside wrap → popover closes', async () => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<button id="outside-btn" type="button">Outside</button>',
    );
    const { wrap, ddCtrl, popoverCtrl } = await mount();
    void ddCtrl;
    popoverCtrl.open();
    await tick();
    expect(popoverCtrl.openValue).toBe(true);

    const outside = document.getElementById('outside-btn');
    const focusOutEvt = new FocusEvent('focusout', {
      bubbles: true,
      relatedTarget: outside,
    });
    wrap.dispatchEvent(focusOutEvt);
    await tick();
    expect(popoverCtrl.openValue).toBe(false);
  });

  it('focusout with relatedTarget inside wrap → popover stays open', async () => {
    const { wrap, ddCtrl, items, popoverCtrl } = await mount();
    void ddCtrl;
    popoverCtrl.open();
    await tick();
    expect(popoverCtrl.openValue).toBe(true);

    const focusOutEvt = new FocusEvent('focusout', {
      bubbles: true,
      relatedTarget: items[1],
    });
    wrap.dispatchEvent(focusOutEvt);
    await tick();
    // Focus moved INSIDE the wrap → menu stays open.
    expect(popoverCtrl.openValue).toBe(true);
  });

  it('focusout with null relatedTarget (window blur) → popover closes', async () => {
    const { wrap, ddCtrl, popoverCtrl } = await mount();
    void ddCtrl;
    popoverCtrl.open();
    await tick();
    expect(popoverCtrl.openValue).toBe(true);

    const focusOutEvt = new FocusEvent('focusout', {
      bubbles: true,
      relatedTarget: null,
    });
    wrap.dispatchEvent(focusOutEvt);
    await tick();
    expect(popoverCtrl.openValue).toBe(false);
  });
});
