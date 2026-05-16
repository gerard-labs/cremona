import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

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
const { default: NavigationMenuController } = await import('../../src/js/controllers/navigation-menu_controller.js');
const { default: MenubarController } = await import('../../src/js/controllers/menubar_controller.js');

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the NavigationMenu compound's `navigation-menu` controller.
 *
 * NavigationMenuController extends MenubarController verbatim (no method
 * overrides). The tests here verify:
 *   1. Inheritance works (Menubar mechanics are operational).
 *   2. NavigationMenu identity is preserved (the controller registers under
 *      its own identifier).
 *   3. Submenu items as `<a href>` work (Items with as='a').
 *   4. aria-current="page" survives the cascade (item-level state).
 *
 * Per OQ-30 (sealed S2.3a) + OQ-33 (sealed S2.3b opening).
 * Per S1.4b descriptor-binding gotcha: tests call methods directly.
 */
describe('NavigationMenuController', () => {
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

  async function mount({ triggers = ['Solutions', 'Pricing', 'Resources'] } = {}) {
    const menusHtml = triggers
      .map((label, i) => {
        return `<div id="sm-${i}" class="cremona-popover cremona-dropdown-menu"
          data-controller="popover dropdown-menu"
          data-action="click->popover#toggle keydown.esc@window->popover#close keydown->dropdown-menu#keydown click->dropdown-menu#onItemClick"
          data-popover-placement-value="bottom-start"
          data-popover-offset-value="2"
          data-popover-open-value="false">
          <button id="tr-${i}" type="button" class="cremona-menubar__trigger"
            data-popover-target="trigger"
            data-navigation-menu-target="trigger"
            aria-haspopup="menu" aria-expanded="false" aria-controls="sm-${i}-content">${label}</button>
          <div id="sm-${i}-content" class="cremona-popover__content cremona-dropdown-menu__content"
            data-popover-target="content"
            data-state="closed"
            hidden>
            <a class="cremona-item" id="it-${i}-0" role="menuitem" tabindex="-1" href="/path-${i}-0">Link A</a>
            <a class="cremona-item" id="it-${i}-1" role="menuitem" tabindex="-1" href="/path-${i}-1"${i === 0 ? ' aria-current="page" data-selected="true"' : ''}>Link B</a>
          </div>
        </div>`;
      })
      .join('');
    document.body.innerHTML = `
      <nav id="nav-shell" class="cremona-navigation-menu" aria-label="Main">
        <div id="nm-wrap" class="cremona-menubar"
          data-controller="navigation-menu"
          data-action="keydown->navigation-menu#keydown"
          aria-label="Main">${menusHtml}</div>
      </nav>
    `;
    app = Application.start();
    app.register('popover', PopoverController);
    app.register('dropdown-menu', DropdownMenuController);
    app.register('menubar', MenubarController);
    app.register('navigation-menu', NavigationMenuController);
    await tick();
    await tick();
    return {
      shell: document.getElementById('nav-shell'),
      wrap: document.getElementById('nm-wrap'),
      triggers: triggers.map((_, i) => document.getElementById(`tr-${i}`)),
      items: triggers.map((_, i) => [
        document.getElementById(`it-${i}-0`),
        document.getElementById(`it-${i}-1`),
      ]),
      nmCtrl: app.controllers.find((c) => c.identifier === 'navigation-menu'),
      popoverCtrls: triggers.map((_, i) =>
        app.getControllerForElementAndIdentifier(
          document.getElementById(`sm-${i}`),
          'popover',
        ),
      ),
    };
  }

  it('identity — controller is registered as "navigation-menu" + extends MenubarController', async () => {
    const { nmCtrl } = await mount();
    expect(nmCtrl).toBeDefined();
    expect(nmCtrl.identifier).toBe('navigation-menu');
    expect(nmCtrl).toBeInstanceOf(NavigationMenuController);
    // Verify ES extends chain.
    expect(nmCtrl).toBeInstanceOf(MenubarController);
  });

  it('shell — <nav aria-label> landmark wraps the menubar', async () => {
    const { shell, wrap } = await mount();
    expect(shell.tagName).toBe('NAV');
    expect(shell.getAttribute('aria-label')).toBe('Main');
    expect(shell.contains(wrap)).toBe(true);
  });

  it('inherited _initRoles — wrap gets role="menubar", triggers get role="menuitem"', async () => {
    const { wrap, triggers } = await mount();
    expect(wrap.getAttribute('role')).toBe('menubar');
    triggers.forEach((t) => {
      expect(t.getAttribute('role')).toBe('menuitem');
      expect(t.getAttribute('aria-haspopup')).toBe('menu');
    });
  });

  it('inherited _initRovingTabindex — first trigger tabindex=0', async () => {
    const { triggers } = await mount();
    expect(triggers[0].tabIndex).toBe(0);
    expect(triggers[1].tabIndex).toBe(-1);
  });

  it('inherited keydown ArrowRight — moves focus to next trigger', async () => {
    const { triggers, nmCtrl } = await mount();
    triggers[0].focus();
    nmCtrl.keydown({ key: 'ArrowRight', preventDefault: () => {} });
    expect(document.activeElement).toBe(triggers[1]);
  });

  it('inherited keydown ArrowDown — opens submenu', async () => {
    const { triggers, popoverCtrls, nmCtrl } = await mount();
    triggers[1].focus();
    nmCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    await tick();
    expect(popoverCtrls[1].openValue).toBe(true);
  });

  it('inherited cascading-open — ArrowRight with submenu open closes A + opens B', async () => {
    const { triggers, popoverCtrls, items, nmCtrl } = await mount();
    triggers[0].focus();
    popoverCtrls[0].open();
    await tick();
    nmCtrl.keydown({ key: 'ArrowRight', preventDefault: () => {} });
    await tick();
    expect(popoverCtrls[0].openValue).toBe(false);
    expect(popoverCtrls[1].openValue).toBe(true);
    expect(document.activeElement).toBe(items[1][0]);
  });

  it('submenu items are <a href> per OQ-33', async () => {
    const { items } = await mount();
    items.forEach((row) => {
      row.forEach((item) => {
        expect(item.tagName).toBe('A');
        expect(item.getAttribute('href')).toBeTruthy();
      });
    });
  });

  it('aria-current="page" preserved on the active item (consumer-stamped)', async () => {
    const { items } = await mount();
    // First menu, second item is marked aria-current="page" in the mount fixture.
    expect(items[0][1].getAttribute('aria-current')).toBe('page');
    expect(items[0][1].dataset.selected).toBe('true');
  });

  it('inherited focusTrigger(idx) — moves focus + roving', async () => {
    const { triggers, nmCtrl } = await mount();
    nmCtrl.focusTrigger(2);
    expect(document.activeElement).toBe(triggers[2]);
    expect(triggers[2].tabIndex).toBe(0);
    expect(triggers[0].tabIndex).toBe(-1);
  });
});
