import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

// Mock @floating-ui/dom for the co-mounted popover controllers inside each
// submenu's DropdownMenu — mirrors dropdown-menu_controller.test.js pattern.
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
const { default: MenubarController } = await import('../../src/js/controllers/menubar_controller.js');

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the Menubar compound's `menubar` controller orchestrating
 * N standalone DropdownMenu compounds.
 *
 * Per OQ-30 (sealed S2.3a): per-submenu DropdownMenus + thin orchestrator.
 * Per WAI-ARIA APG "Menubar (menu of menus)".
 *
 * Cross-controller mechanics tested:
 *   - role="menubar" + role="menuitem" + aria-haspopup="menu" stamping.
 *   - Roving tabindex among triggers.
 *   - ArrowLeft/Right cyclic.
 *   - Home/End jump.
 *   - ArrowDown/Enter/Space open submenu (cross-controller call to
 *     each DropdownMenu's Popover#open).
 *   - Cascading-open: with menu A open, ArrowRight closes A + opens B.
 *
 * Per S1.4b descriptor-binding gotcha: tests call controller methods
 * directly (`ctrl.keydown({key, ...})`, `ctrl.focusTrigger(idx)`).
 */
describe('MenubarController', () => {
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

  async function mount({ triggers = ['File', 'Edit', 'View', 'Help'], disabledIdx = -1 } = {}) {
    const menusHtml = triggers
      .map((label, i) => {
        const dis = i === disabledIdx ? 'disabled' : '';
        return `<div id="sm-${i}" class="theme-popover theme-dropdown-menu"
          data-controller="popover dropdown-menu"
          data-action="click->popover#toggle keydown.esc@window->popover#close keydown->dropdown-menu#keydown click->dropdown-menu#onItemClick"
          data-popover-placement-value="bottom-start"
          data-popover-offset-value="2"
          data-popover-open-value="false">
          <button id="tr-${i}" type="button" class="theme-menubar__trigger"
            data-popover-target="trigger"
            data-menubar-target="trigger"
            ${dis}
            aria-haspopup="menu" aria-expanded="false" aria-controls="sm-${i}-content">${label}</button>
          <div id="sm-${i}-content" class="theme-popover__content theme-dropdown-menu__content"
            data-popover-target="content"
            data-state="closed"
            hidden>
            <div class="theme-item" id="it-${i}-0">Item A</div>
            <div class="theme-item" id="it-${i}-1">Item B</div>
          </div>
        </div>`;
      })
      .join('');
    document.body.innerHTML = `
      <div id="mb-wrap" class="theme-menubar"
        data-controller="menubar"
        data-action="keydown->menubar#keydown">${menusHtml}</div>
    `;
    app = Application.start();
    app.register('popover', PopoverController);
    app.register('dropdown-menu', DropdownMenuController);
    app.register('menubar', MenubarController);
    await tick();
    await tick();
    return {
      wrap: document.getElementById('mb-wrap'),
      triggers: triggers.map((_, i) => document.getElementById(`tr-${i}`)),
      submenus: triggers.map((_, i) => document.getElementById(`sm-${i}`)),
      mbCtrl: app.controllers.find((c) => c.identifier === 'menubar'),
      popoverCtrls: triggers.map((_, i) =>
        app.getControllerForElementAndIdentifier(
          document.getElementById(`sm-${i}`),
          'popover',
        ),
      ),
    };
  }

  it('_initRoles — wrap gets role="menubar", triggers get role="menuitem" + aria-haspopup="menu"', async () => {
    const { wrap, triggers } = await mount();
    expect(wrap.getAttribute('role')).toBe('menubar');
    triggers.forEach((t) => {
      expect(t.getAttribute('role')).toBe('menuitem');
      expect(t.getAttribute('aria-haspopup')).toBe('menu');
    });
  });

  it('_initRovingTabindex — first trigger tabindex=0, rest tabindex=-1', async () => {
    const { triggers } = await mount();
    expect(triggers[0].tabIndex).toBe(0);
    expect(triggers[1].tabIndex).toBe(-1);
    expect(triggers[2].tabIndex).toBe(-1);
    expect(triggers[3].tabIndex).toBe(-1);
  });

  it('keydown ArrowRight — focus moves to next trigger', async () => {
    const { triggers, mbCtrl } = await mount();
    triggers[0].focus();
    mbCtrl.keydown({ key: 'ArrowRight', preventDefault: () => {} });
    expect(document.activeElement).toBe(triggers[1]);
    expect(triggers[1].tabIndex).toBe(0);
    expect(triggers[0].tabIndex).toBe(-1);
  });

  it('keydown ArrowRight on last → wraps to first (cyclic)', async () => {
    const { triggers, mbCtrl } = await mount();
    triggers[3].focus();
    triggers[3].tabIndex = 0; triggers[0].tabIndex = -1;
    mbCtrl.keydown({ key: 'ArrowRight', preventDefault: () => {} });
    expect(document.activeElement).toBe(triggers[0]);
  });

  it('keydown ArrowLeft — focus moves to previous (wraps to last from first)', async () => {
    const { triggers, mbCtrl } = await mount();
    triggers[0].focus();
    mbCtrl.keydown({ key: 'ArrowLeft', preventDefault: () => {} });
    expect(document.activeElement).toBe(triggers[3]);
  });

  it('keydown Home — focus jumps to first trigger', async () => {
    const { triggers, mbCtrl } = await mount();
    triggers[2].focus();
    triggers[2].tabIndex = 0; triggers[0].tabIndex = -1;
    mbCtrl.keydown({ key: 'Home', preventDefault: () => {} });
    expect(document.activeElement).toBe(triggers[0]);
  });

  it('keydown End — focus jumps to last trigger', async () => {
    const { triggers, mbCtrl } = await mount();
    triggers[0].focus();
    mbCtrl.keydown({ key: 'End', preventDefault: () => {} });
    expect(document.activeElement).toBe(triggers[3]);
  });

  it('keydown ArrowDown on focused trigger — opens submenu via cross-controller', async () => {
    const { triggers, popoverCtrls, mbCtrl } = await mount();
    triggers[1].focus();
    expect(popoverCtrls[1].openValue).toBe(false);
    mbCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    await tick();
    expect(popoverCtrls[1].openValue).toBe(true);
  });

  it('keydown Enter on focused trigger — opens submenu', async () => {
    const { triggers, popoverCtrls, mbCtrl } = await mount();
    triggers[0].focus();
    mbCtrl.keydown({ key: 'Enter', preventDefault: () => {} });
    await tick();
    expect(popoverCtrls[0].openValue).toBe(true);
  });

  it('keydown Space on focused trigger — opens submenu', async () => {
    const { triggers, popoverCtrls, mbCtrl } = await mount();
    triggers[2].focus();
    mbCtrl.keydown({ key: ' ', preventDefault: () => {} });
    await tick();
    expect(popoverCtrls[2].openValue).toBe(true);
  });

  it('keydown ArrowRight with submenu open — cascading-open (close A + open B + focus B first item)', async () => {
    const { triggers, popoverCtrls, mbCtrl } = await mount();
    triggers[0].focus();
    popoverCtrls[0].open();
    await tick();
    // After open, DropdownMenu's _onPopoverOpen auto-focuses the first item of submenu A.
    expect(popoverCtrls[0].openValue).toBe(true);
    expect(popoverCtrls[1].openValue).toBe(false);
    // ArrowRight from inside the open submenu A's items cascades to B (per APG).
    mbCtrl.keydown({ key: 'ArrowRight', preventDefault: () => {} });
    await tick();
    expect(popoverCtrls[0].openValue).toBe(false);
    expect(popoverCtrls[1].openValue).toBe(true);
    // Per WAI-ARIA APG Menubar: when cascading opens the next menubar item's
    // submenu, focus moves to the first menu item of the new submenu (the
    // inherited DropdownMenu `_onPopoverOpen` handler does this).
    expect(document.activeElement).toBe(document.getElementById('it-1-0'));
  });

  it('keydown ArrowLeft with submenu open — cascading-open backwards', async () => {
    const { triggers, popoverCtrls, mbCtrl } = await mount();
    triggers[2].focus();
    triggers[2].tabIndex = 0; triggers[0].tabIndex = -1;
    popoverCtrls[2].open();
    await tick();
    expect(popoverCtrls[2].openValue).toBe(true);
    mbCtrl.keydown({ key: 'ArrowLeft', preventDefault: () => {} });
    await tick();
    expect(popoverCtrls[2].openValue).toBe(false);
    expect(popoverCtrls[1].openValue).toBe(true);
    expect(document.activeElement).toBe(document.getElementById('it-1-0'));
  });

  it('focusTrigger(idx) — moves focus + updates roving tabindex', async () => {
    const { triggers, mbCtrl } = await mount();
    mbCtrl.focusTrigger(2);
    expect(document.activeElement).toBe(triggers[2]);
    expect(triggers[2].tabIndex).toBe(0);
    expect(triggers[0].tabIndex).toBe(-1);
    expect(triggers[1].tabIndex).toBe(-1);
    expect(triggers[3].tabIndex).toBe(-1);
  });

  it('keydown with focus outside any trigger — bails (no nav)', async () => {
    const { triggers, mbCtrl } = await mount();
    document.body.insertAdjacentHTML('beforeend', '<button id="outside">Outside</button>');
    document.getElementById('outside').focus();
    mbCtrl.keydown({ key: 'ArrowRight', preventDefault: () => {} });
    // Triggers untouched.
    expect(triggers[0].tabIndex).toBe(0);
    expect(triggers[1].tabIndex).toBe(-1);
  });

  it('keydown ignores unrelated keys (Tab, letters)', async () => {
    const { triggers, mbCtrl } = await mount();
    triggers[0].focus();
    mbCtrl.keydown({ key: 'Tab', preventDefault: () => {} });
    mbCtrl.keydown({ key: 'a', preventDefault: () => {} });
    expect(document.activeElement).toBe(triggers[0]); // unchanged
  });
});
