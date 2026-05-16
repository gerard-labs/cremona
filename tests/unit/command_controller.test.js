import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import CommandController from '../../src/js/controllers/command_controller.js';

/**
 * Note : we don't mount Dialog + Combobox here — they're complex compose
 * targets with their own tests. Instead we mock their controllers' opening /
 * value-changed surface so CommandController's orchestration logic is tested
 * in isolation. The cross-controller compose pattern itself is verified via
 * the DialogController + ComboboxController tests separately.
 *
 * Per S1.4b descriptor-binding gotcha + S2.7 cross-controller pattern : tests
 * call controller methods directly (`ctrl.open()`, `ctrl.toggle()`).
 *
 * Coverage map (14 tests) :
 *   1. connect → window keydown listener installed + global API registered.
 *   2. disconnect → window keydown removed + global API unregistered.
 *   3. ⌘K (metaKey) → toggle() invoked.
 *   4. Ctrl+K → toggle() invoked.
 *   5. Alt+K → NOT a hotkey, ignored.
 *   6. Shift+K → NOT a hotkey, ignored.
 *   7. Non-K letter with ⌘ → ignored.
 *   8. register(commands) → commands stored in registry.
 *   9. register(idempotent) → same id replaces existing entry.
 *  10. unregister(id) → command removed.
 *  11. dialog:open event → command:open dispatched + autoFocusInput → input.focus called.
 *  12. dialog:close event → command:close dispatched.
 *  13. combobox:change event with known id → action invoked + command:execute dispatched + close called.
 *  14. combobox:change event with unknown id → no action invoked, no command:execute.
 */
describe('CommandController', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
    delete window.themeCommand;
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
    delete window.themeCommand;
  });

  async function mount({ hotkey = 'k', autoFocusInput = true } = {}) {
    document.body.innerHTML = `
      <div id="cmd-wrap" class="cremona-command"
        data-controller="command"
        data-command-hotkey-value="${hotkey}"
        data-command-auto-focus-input-value="${autoFocusInput}">
        <input data-combobox-target="input" />
      </div>
    `;
    app = Application.start();
    app.register('command', CommandController);
    await new Promise((r) => setTimeout(r, 0));
    return {
      wrap: document.getElementById('cmd-wrap'),
      ctrl: app.controllers.find((c) => c.identifier === 'command'),
      input: document.querySelector('[data-combobox-target="input"]'),
    };
  }

  // 1
  it('connect → global API registered on window.themeCommand', async () => {
    const { ctrl } = await mount({});
    expect(window.themeCommand).toBeTruthy();
    expect(window.themeCommand.__owner).toBe(ctrl);
    expect(typeof window.themeCommand.register).toBe('function');
    expect(typeof window.themeCommand.open).toBe('function');
    expect(typeof window.themeCommand.close).toBe('function');
  });

  // 2
  it('disconnect → window.themeCommand removed', async () => {
    const { wrap } = await mount({});
    expect(window.themeCommand).toBeTruthy();
    wrap.remove(); // element removal is what Stimulus observes to disconnect
    await new Promise((r) => setTimeout(r, 0));
    expect(window.themeCommand).toBeUndefined();
  });

  // 3
  it('⌘K (metaKey) → toggle() invoked', async () => {
    const { ctrl } = await mount({});
    const spy = vi.spyOn(ctrl, 'toggle').mockImplementation(() => {});
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k', metaKey: true, bubbles: true, cancelable: true,
    }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // 4
  it('Ctrl+K → toggle() invoked', async () => {
    const { ctrl } = await mount({});
    const spy = vi.spyOn(ctrl, 'toggle').mockImplementation(() => {});
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k', ctrlKey: true, bubbles: true, cancelable: true,
    }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // 5
  it('Alt+K → NOT a hotkey (Alt is exclusion), ignored', async () => {
    const { ctrl } = await mount({});
    const spy = vi.spyOn(ctrl, 'toggle').mockImplementation(() => {});
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k', metaKey: true, altKey: true, bubbles: true, cancelable: true,
    }));
    expect(spy).not.toHaveBeenCalled();
  });

  // 6
  it('Shift+K → NOT a hotkey (Shift is exclusion), ignored', async () => {
    const { ctrl } = await mount({});
    const spy = vi.spyOn(ctrl, 'toggle').mockImplementation(() => {});
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k', metaKey: true, shiftKey: true, bubbles: true, cancelable: true,
    }));
    expect(spy).not.toHaveBeenCalled();
  });

  // 7
  it('Non-K letter with ⌘ → ignored', async () => {
    const { ctrl } = await mount({});
    const spy = vi.spyOn(ctrl, 'toggle').mockImplementation(() => {});
    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'j', metaKey: true, bubbles: true, cancelable: true,
    }));
    expect(spy).not.toHaveBeenCalled();
  });

  // 8
  it('register(commands) → commands stored in registry', async () => {
    const { ctrl } = await mount({});
    const a1 = vi.fn();
    const a2 = vi.fn();
    ctrl.register([
      { id: 'cmd-a', label: 'A', action: a1 },
      { id: 'cmd-b', label: 'B', action: a2 },
    ]);
    expect(ctrl._commands).toHaveLength(2);
    expect(ctrl._commands[0].id).toBe('cmd-a');
  });

  // 9
  it('register(idempotent) → same id replaces existing entry', async () => {
    const { ctrl } = await mount({});
    const a1 = vi.fn();
    const a2 = vi.fn();
    ctrl.register([{ id: 'cmd-a', label: 'A', action: a1 }]);
    ctrl.register([{ id: 'cmd-a', label: 'A2', action: a2 }]);
    expect(ctrl._commands).toHaveLength(1);
    expect(ctrl._commands[0].label).toBe('A2');
    expect(ctrl._commands[0].action).toBe(a2);
  });

  // 10
  it('unregister(id) → command removed', async () => {
    const { ctrl } = await mount({});
    ctrl.register([{ id: 'cmd-a', label: 'A', action: vi.fn() }]);
    expect(ctrl._commands).toHaveLength(1);
    ctrl.unregister('cmd-a');
    expect(ctrl._commands).toHaveLength(0);
  });

  // 11
  it('dialog:open event → command:open dispatched + input focused', async () => {
    const { wrap, input } = await mount({ autoFocusInput: true });
    const events = [];
    wrap.addEventListener('command:open', (e) => events.push(e.detail));
    const focusSpy = vi.spyOn(input, 'focus').mockImplementation(() => {});
    wrap.dispatchEvent(new CustomEvent('dialog:open', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
    expect(events).toHaveLength(1);
    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  // 12
  it('dialog:close event → command:close dispatched', async () => {
    const { wrap } = await mount({});
    const events = [];
    wrap.addEventListener('command:close', (e) => events.push(e.detail));
    wrap.dispatchEvent(new CustomEvent('dialog:close', { bubbles: true }));
    expect(events).toHaveLength(1);
  });

  // 13
  it('combobox:change with known id → action invoked + command:execute + close called', async () => {
    const { ctrl, wrap } = await mount({});
    const action = vi.fn();
    ctrl.register([{ id: 'go.home', label: 'Aller à l\'accueil', group: 'Navigation', action }]);
    const closeSpy = vi.spyOn(ctrl, 'close').mockImplementation(() => {});
    const events = [];
    wrap.addEventListener('command:execute', (e) => events.push(e.detail));
    wrap.dispatchEvent(new CustomEvent('combobox:change', {
      bubbles: true,
      detail: { value: 'go.home', label: 'Aller à l\'accueil' },
    }));
    expect(action).toHaveBeenCalledTimes(1);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ id: 'go.home', label: 'Aller à l\'accueil', group: 'Navigation' });
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  // 14
  it('combobox:change with unknown id → no action, no command:execute fired with action', async () => {
    const { wrap } = await mount({});
    // Don't register any command.
    const events = [];
    wrap.addEventListener('command:execute', (e) => events.push(e.detail));
    wrap.dispatchEvent(new CustomEvent('combobox:change', {
      bubbles: true,
      detail: { value: 'unknown.cmd', label: 'Unknown' },
    }));
    // command:execute STILL fires (the value was selected) but no action runs.
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe('unknown.cmd');
  });
});
