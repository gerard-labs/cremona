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
const { default: SelectController } = await import('../../src/js/controllers/select_controller.js');

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the Select compound's `select` controller, co-mounted
 * with `popover`.
 *
 * WAI-ARIA APG "Listbox (Collapsible)" pattern — aria-activedescendant
 * (focus stays on trigger, attribute points to active option). Different
 * from DropdownMenu's roving tabindex; chosen to prepare Combobox (S2.3b)
 * which mandates this pattern.
 *
 * Per OQ-28: vanilla implementation, no Tom Select.
 *
 * Responsibilities covered (14 tests):
 *   1.  keydown ArrowDown when closed → opens popover.
 *   2.  keydown Enter when closed → opens popover.
 *   3.  keydown when open: ArrowDown → activedescendant moves to next.
 *   4.  keydown when open: ArrowUp → activedescendant moves to previous.
 *   5.  keydown when open: Home/End → first/last.
 *   6.  keydown when open: Enter → selects active option, closes popover.
 *   7.  Click on option → selects, closes, dispatches select:change.
 *   8.  Click on disabled option → no select.
 *   9.  popover:open → activedescendant on selected option (or first).
 *  10.  Selecting updates valueValue + label + hidden input.
 *  11.  Selecting updates aria-selected + check icon visible (CSS-driven,
 *       smoke via aria-selected attribute).
 *  12.  Disabled options excluded from Arrow nav (jumped over).
 *  13.  Esc closes via co-mounted popover (smoke — no select dispatched).
 *  14.  SSR with value: trigger label shows the matching option's label.
 */
describe('SelectController', () => {
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

  async function mount({ value = '', placeholder = 'Choose…', options = null } = {}) {
    const opts = options || [
      { value: 'fr', label: 'Français' },
      { value: 'en', label: 'English' },
      { value: 'de', label: 'Deutsch' },
    ];
    const optionsHtml = opts.map((o, i) => {
      const dis = o.disabled ? ' aria-disabled="true" data-state="disabled"' : '';
      const sel = o.value === value && value !== '';
      return `<div class="theme-item theme-select__option"
        id="sel-opt-${i + 1}"
        data-select-target="option"
        data-value="${o.value}"
        role="option"
        aria-selected="${sel ? 'true' : 'false'}"${dis}>
        <span class="theme-item__text"><span class="theme-item__label">${o.label}</span></span>
      </div>`;
    }).join('');
    const selectedOpt = opts.find((o) => o.value === value && value !== '');
    const labelText = selectedOpt ? selectedOpt.label : placeholder;
    const isPlaceholder = !selectedOpt;
    document.body.innerHTML = `
      <form id="form">
        <div id="wrap" class="theme-popover theme-select"
          data-controller="popover select"
          data-action="click->popover#toggle keydown.esc@window->popover#close keydown->select#keydown click->select#onOptionClick"
          data-popover-placement-value="bottom-start"
          data-popover-offset-value="4"
          data-popover-open-value="false"
          data-select-value-value="${value}"
          data-select-placeholder-value="${placeholder}">
          <button type="button" class="theme-select__trigger"
            data-popover-target="trigger"
            data-select-target="button"
            aria-haspopup="listbox" aria-expanded="false" aria-controls="sel-listbox">
            <span class="theme-select__label" data-select-target="label" data-placeholder="${isPlaceholder}">${labelText}</span>
            <span class="theme-select__chevron" aria-hidden="true">v</span>
          </button>
          <input type="hidden" name="lang" value="${value}" data-select-target="hiddenInput">
          <div id="sel-listbox" class="theme-popover__content theme-select__listbox"
            data-popover-target="content"
            data-state="closed"
            role="listbox"
            hidden>${optionsHtml}</div>
        </div>
      </form>
    `;
    app = Application.start();
    app.register('popover', PopoverController);
    app.register('select', SelectController);
    await tick();
    await tick();
    return {
      wrap: document.getElementById('wrap'),
      button: document.querySelector('[data-select-target="button"]'),
      label: document.querySelector('[data-select-target="label"]'),
      hiddenInput: document.querySelector('[data-select-target="hiddenInput"]'),
      listbox: document.getElementById('sel-listbox'),
      options: opts.map((_, i) => document.getElementById(`sel-opt-${i + 1}`)),
      form: document.getElementById('form'),
      selCtrl: app.controllers.find((c) => c.identifier === 'select'),
      popoverCtrl: app.controllers.find((c) => c.identifier === 'popover'),
    };
  }

  it('keydown ArrowDown when closed — opens popover', async () => {
    const { selCtrl, popoverCtrl } = await mount();
    expect(popoverCtrl.openValue).toBe(false);
    selCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    await tick();
    expect(popoverCtrl.openValue).toBe(true);
  });

  it('keydown Enter when closed — opens popover', async () => {
    const { selCtrl, popoverCtrl } = await mount();
    selCtrl.keydown({ key: 'Enter', preventDefault: () => {} });
    await tick();
    expect(popoverCtrl.openValue).toBe(true);
  });

  it('keydown ArrowDown when open — activedescendant moves to next', async () => {
    const { button, options, selCtrl, popoverCtrl } = await mount();
    popoverCtrl.open();
    await tick();
    // Initial: first option active
    expect(button.getAttribute('aria-activedescendant')).toBe(options[0].id);
    selCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    expect(button.getAttribute('aria-activedescendant')).toBe(options[1].id);
    expect(options[1].dataset.active).toBe('true');
    expect(options[0].dataset.active).toBe('false');
  });

  it('keydown ArrowUp when open — moves to previous (clamped at 0)', async () => {
    const { button, options, selCtrl, popoverCtrl } = await mount();
    popoverCtrl.open();
    await tick();
    selCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    selCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    expect(button.getAttribute('aria-activedescendant')).toBe(options[2].id);
    selCtrl.keydown({ key: 'ArrowUp', preventDefault: () => {} });
    expect(button.getAttribute('aria-activedescendant')).toBe(options[1].id);
    selCtrl.keydown({ key: 'ArrowUp', preventDefault: () => {} });
    selCtrl.keydown({ key: 'ArrowUp', preventDefault: () => {} });
    // Clamped at 0 — does NOT wrap (different from DropdownMenu).
    expect(button.getAttribute('aria-activedescendant')).toBe(options[0].id);
  });

  it('keydown Home/End when open — first/last', async () => {
    const { button, options, selCtrl, popoverCtrl } = await mount();
    popoverCtrl.open();
    await tick();
    selCtrl.keydown({ key: 'End', preventDefault: () => {} });
    expect(button.getAttribute('aria-activedescendant')).toBe(options[2].id);
    selCtrl.keydown({ key: 'Home', preventDefault: () => {} });
    expect(button.getAttribute('aria-activedescendant')).toBe(options[0].id);
  });

  it('keydown Enter when open — selects active option, closes', async () => {
    const { selCtrl, popoverCtrl, label, hiddenInput, options } = await mount();
    popoverCtrl.open();
    await tick();
    selCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} }); // active = en
    selCtrl.keydown({ key: 'Enter', preventDefault: () => {} });
    await tick();
    expect(selCtrl.valueValue).toBe('en');
    expect(label.textContent).toBe('English');
    expect(label.dataset.placeholder).toBe('false');
    expect(hiddenInput.value).toBe('en');
    expect(options[1].getAttribute('aria-selected')).toBe('true');
    expect(options[0].getAttribute('aria-selected')).toBe('false');
    expect(popoverCtrl.openValue).toBe(false);
  });

  it('click on option — selects, closes, dispatches select:change', async () => {
    const { selCtrl, popoverCtrl, options, wrap } = await mount();
    popoverCtrl.open();
    await tick();
    let captured = null;
    wrap.addEventListener('select:change', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, composed: e.composed, detail: e.detail };
    });
    selCtrl.onOptionClick({ target: options[2] });
    await tick();
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('select:change');
    expect(captured.detail.value).toBe('de');
    expect(captured.detail.label).toBe('Deutsch');
    expect(popoverCtrl.openValue).toBe(false);
  });

  it('click on disabled option — does NOT select', async () => {
    const { selCtrl, popoverCtrl, options } = await mount({
      options: [
        { value: 'fr', label: 'Français' },
        { value: 'en', label: 'English', disabled: true },
        { value: 'de', label: 'Deutsch' },
      ],
    });
    popoverCtrl.open();
    await tick();
    selCtrl.onOptionClick({ target: options[1] }); // disabled
    await tick();
    expect(selCtrl.valueValue).toBe('');
    expect(popoverCtrl.openValue).toBe(true); // still open
  });

  it('popover:open — activedescendant on selected option (or first)', async () => {
    const { button, options, popoverCtrl } = await mount({ value: 'de' });
    popoverCtrl.open();
    await tick();
    expect(button.getAttribute('aria-activedescendant')).toBe(options[2].id);
  });

  it('selecting updates aria-selected + value + label + hidden input', async () => {
    const { selCtrl, popoverCtrl, options, label, hiddenInput } = await mount();
    popoverCtrl.open();
    await tick();
    selCtrl.onOptionClick({ target: options[2] });
    await tick();
    expect(options[2].getAttribute('aria-selected')).toBe('true');
    expect(options[0].getAttribute('aria-selected')).toBe('false');
    expect(label.textContent).toBe('Deutsch');
    expect(hiddenInput.value).toBe('de');
  });

  it('Disabled options skipped from ArrowDown nav', async () => {
    const { button, options, selCtrl, popoverCtrl } = await mount({
      options: [
        { value: 'fr', label: 'Français' },
        { value: 'en', label: 'English', disabled: true },
        { value: 'de', label: 'Deutsch' },
      ],
    });
    popoverCtrl.open();
    await tick();
    // Initial active = fr (first non-disabled)
    expect(button.getAttribute('aria-activedescendant')).toBe(options[0].id);
    selCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    // Should jump to de (skip en which is disabled)
    expect(button.getAttribute('aria-activedescendant')).toBe(options[2].id);
  });

  it('Esc via co-mounted popover closes (no select dispatched)', async () => {
    const { wrap, popoverCtrl } = await mount();
    popoverCtrl.open();
    await tick();
    let dispatched = false;
    wrap.addEventListener('select:change', () => { dispatched = true; });
    popoverCtrl.close();
    await tick();
    expect(popoverCtrl.openValue).toBe(false);
    expect(dispatched).toBe(false);
  });

  it('SSR with value: trigger label shows matching option label', async () => {
    const { label } = await mount({ value: 'en' });
    expect(label.textContent).toBe('English');
    expect(label.dataset.placeholder).toBe('false');
  });

  it('SSR without value: label shows placeholder', async () => {
    const { label } = await mount({ value: '', placeholder: 'Sélectionne…' });
    expect(label.textContent).toBe('Sélectionne…');
    expect(label.dataset.placeholder).toBe('true');
  });
});
