import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

// vi.hoisted + vi.mock @floating-ui/dom — required for happy-dom 15 (no
// ResizeObserver). Mirrors select_controller.test.js + popover_controller.test.js
// per the S2.1 test-isolation doctrine.
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
const { default: ComboboxController } = await import('../../src/js/controllers/combobox_controller.js');

// Seed i18n so the announcer message resolves (the controller calls t() with
// a plural key). Without this, the announcer text would be the raw key.
const { setTranslations, setLocale, __reset } = await import('../../src/js/utils/i18n.js');

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the Combobox compound's `combobox` controller, co-mounted
 * with `popover`.
 *
 * Controller architecture: `ComboboxController extends SelectController` per
 * OQ-32 (sealed S2.3b opening). Tests cover the new Combobox-specific
 * behavior (filter logic, empty state, Esc-clear, announce, focusout dismiss)
 * AND verify the inherited Select behavior still works in the subclass
 * context (aria-activedescendant nav, Enter selects, click selects).
 *
 * Per OQ-31 (sealed S2.3b opening): announce results count via the shared
 * #theme-announcer (declared in base/reset.css). Tests inject the announcer
 * element manually since base/reset.css isn't loaded in test env.
 *
 * Per S1.4b descriptor-binding gotcha: tests call controller methods
 * directly (`ctrl.filter({target: input})`, `ctrl.keydown({key, ...})`).
 *
 * Responsibilities covered (20 tests):
 *   1. filter() — substring case-insensitive match.
 *   2. filter() — toggles empty state on no match.
 *   3. filter() — emptyQuery reflects untrimmed user input.
 *   4. filter() — auto-opens popover when closed.
 *   5. filter() — sets activedescendant on first visible option.
 *   6. filter() — clears activedescendant when no visible options.
 *   7. filter() — dispatches combobox:filter with detail.{query, count}.
 *   8. filter() — announces count to #theme-announcer (count > 0).
 *   9. filter() — clears announcer to "" when count = 0 (empty state covers).
 *  10. filter() — excludes aria-disabled options from visibleCount.
 *  11. keydown ArrowDown when closed → opens popover.
 *  12. keydown ArrowDown when open → activedescendant +1 (clamped).
 *  13. keydown ArrowUp when open → activedescendant -1 (clamped at 0).
 *  14. keydown Enter on active → selects + closes + dispatches combobox:change.
 *  15. keydown Esc when query non-empty → clears input + re-filters.
 *  16. keydown Esc when query empty → no-op (delegates to popover window-scope).
 *  17. onOptionClick → selects + closes + dispatches combobox:change.
 *  18. _onPopoverOpen → activedescendant on first visible option.
 *  19. SSR with value → input shows matching option's label.
 *  20. focusout with relatedTarget outside wrap → closes.
 *  21. focusout with relatedTarget inside wrap → stays open.
 *  22. focusout with null relatedTarget → closes.
 */
describe('ComboboxController', () => {
  let app;

  beforeEach(() => {
    mockCleanup.mockClear();
    mockComputePosition.mockClear();
    mockAutoUpdate.mockClear();
    document.body.innerHTML = '';
    document.documentElement.dir = 'ltr';
    // Inject the shared announcer (declared in base/reset.css in production).
    const announcer = document.createElement('div');
    announcer.id = 'theme-announcer';
    announcer.className = 'sr-only';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(announcer);
    // Seed i18n so t() resolves the results-count key.
    __reset();
    setTranslations('fr', {
      'theme.combobox.aria.results-count.one': '1 résultat',
      'theme.combobox.aria.results-count.other': '{count} résultats',
    });
    setLocale('fr');
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
  });

  async function mount({
    value = '',
    placeholder = 'Rechercher…',
    options = null,
  } = {}) {
    const opts =
      options || [
        { value: 'fr', label: 'Français' },
        { value: 'en', label: 'English' },
        { value: 'de', label: 'Deutsch' },
        { value: 'es', label: 'Español' },
      ];
    const optionsHtml = opts
      .map((o, i) => {
        const dis = o.disabled
          ? ' aria-disabled="true" data-state="disabled"'
          : '';
        const sel = o.value === value && value !== '';
        return `<div class="theme-item theme-combobox__option"
          id="cbx-opt-${i + 1}"
          data-combobox-target="option"
          data-value="${o.value}"
          data-hidden="false"
          role="option"
          aria-selected="${sel ? 'true' : 'false'}"${dis}>
          <span class="theme-item__text"><span class="theme-item__label">${o.label}</span></span>
        </div>`;
      })
      .join('');
    const selectedOpt = opts.find((o) => o.value === value && value !== '');
    const initialInputValue = selectedOpt ? selectedOpt.label : '';
    // The announcer was injected by beforeEach — preserve it.
    const announcer = document.getElementById('theme-announcer');
    const wrapper = document.createElement('div');
    wrapper.id = 'host';
    wrapper.innerHTML = `
      <form id="form">
        <div id="wrap" class="theme-popover theme-combobox"
          data-controller="popover combobox"
          data-action="keydown.esc@window->popover#close keydown->combobox#keydown input->combobox#filter focus->combobox#openOnFocus click->combobox#onOptionClick"
          data-popover-placement-value="bottom-start"
          data-popover-offset-value="4"
          data-popover-open-value="false"
          data-combobox-value-value="${value}"
          data-combobox-placeholder-value="${placeholder}"
          data-combobox-query-value="">
          <div class="theme-combobox__wrap">
            <input type="text" class="theme-combobox__input"
              data-popover-target="trigger"
              data-combobox-target="input"
              data-size="md"
              role="combobox"
              autocomplete="off"
              spellcheck="false"
              value="${initialInputValue}"
              placeholder="${placeholder}"
              aria-autocomplete="list"
              aria-haspopup="listbox" aria-expanded="false" aria-controls="cbx-listbox">
            <span class="theme-combobox__chevron" aria-hidden="true">v</span>
          </div>
          <input type="hidden" name="lang" value="${value}" data-combobox-target="hiddenInput">
          <div id="cbx-listbox" class="theme-popover__content theme-combobox__listbox"
            data-popover-target="content"
            data-state="closed"
            role="listbox"
            hidden>
            <div class="theme-combobox__options" data-combobox-target="optionsContainer">${optionsHtml}</div>
            <div class="theme-combobox__empty" data-combobox-target="empty" hidden>Aucun résultat pour « <strong data-combobox-target="emptyQuery"></strong> »</div>
          </div>
        </div>
      </form>
      <button id="outside-btn" type="button">Outside</button>
    `;
    document.body.appendChild(wrapper);
    // Make sure the announcer stays at body level (Stimulus's app.start
    // scans documentElement for controllers; the announcer outside any
    // controller stays untouched).
    if (!document.getElementById('theme-announcer')) {
      document.body.appendChild(announcer);
    }

    app = Application.start();
    app.register('popover', PopoverController);
    app.register('combobox', ComboboxController);
    await tick();
    await tick();
    return {
      wrap: document.getElementById('wrap'),
      input: document.querySelector('[data-combobox-target="input"]'),
      hiddenInput: document.querySelector('[data-combobox-target="hiddenInput"]'),
      empty: document.querySelector('[data-combobox-target="empty"]'),
      emptyQuery: document.querySelector('[data-combobox-target="emptyQuery"]'),
      options: opts.map((_, i) => document.getElementById(`cbx-opt-${i + 1}`)),
      announcer: document.getElementById('theme-announcer'),
      cbxCtrl: app.controllers.find((c) => c.identifier === 'combobox'),
      popoverCtrl: app.controllers.find((c) => c.identifier === 'popover'),
    };
  }

  it('filter() — case-insensitive substring match hides non-matching options', async () => {
    const { input, options, cbxCtrl } = await mount();
    input.value = 'FR';
    cbxCtrl.filter({ target: input });
    expect(options[0].dataset.hidden).toBe('false'); // Français matches "fr"
    expect(options[1].dataset.hidden).toBe('true');  // English no match
    expect(options[2].dataset.hidden).toBe('true');  // Deutsch no match
    expect(options[3].dataset.hidden).toBe('true');  // Español no match
  });

  it('filter() — substring anywhere in label matches', async () => {
    const { input, options, cbxCtrl } = await mount();
    input.value = 'lish'; // matches "Engl-ish"
    cbxCtrl.filter({ target: input });
    expect(options[1].dataset.hidden).toBe('false');
    expect(options[0].dataset.hidden).toBe('true');
  });

  it('filter() — toggles empty state when no match', async () => {
    const { input, empty, cbxCtrl } = await mount();
    expect(empty.hidden).toBe(true);
    input.value = 'zzzzzz';
    cbxCtrl.filter({ target: input });
    expect(empty.hidden).toBe(false);
  });

  it('filter() — emptyQuery reflects untrimmed user input', async () => {
    const { input, emptyQuery, cbxCtrl } = await mount();
    input.value = '  zzzz  ';
    cbxCtrl.filter({ target: input });
    expect(emptyQuery.textContent).toBe('  zzzz  ');
  });

  it('filter() — auto-opens popover when closed', async () => {
    const { input, cbxCtrl, popoverCtrl } = await mount();
    expect(popoverCtrl.openValue).toBe(false);
    input.value = 'en';
    cbxCtrl.filter({ target: input });
    await tick();
    expect(popoverCtrl.openValue).toBe(true);
  });

  it('filter() — sets activedescendant on first visible option', async () => {
    const { input, options, cbxCtrl } = await mount();
    input.value = 'es';
    cbxCtrl.filter({ target: input });
    // Visible: Español (idx 3). aria-activedescendant should point there.
    // (Note: filter calls _setActive(0) on visible options — first visible.)
    expect(input.getAttribute('aria-activedescendant')).toBe(options[3].id);
  });

  it('filter() — clears activedescendant when no visible options', async () => {
    const { input, cbxCtrl } = await mount();
    input.value = 'zzzz';
    cbxCtrl.filter({ target: input });
    expect(input.getAttribute('aria-activedescendant')).toBe(null);
  });

  it('filter() — dispatches combobox:filter with detail.{query, count}', async () => {
    const { input, wrap, cbxCtrl } = await mount();
    let captured = null;
    wrap.addEventListener('combobox:filter', (e) => {
      captured = { type: e.type, detail: e.detail, bubbles: e.bubbles };
    });
    input.value = 'EN';
    cbxCtrl.filter({ target: input });
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('combobox:filter');
    expect(captured.bubbles).toBe(true);
    expect(captured.detail.query).toBe('en');
    expect(captured.detail.count).toBe(1);
  });

  it('filter() — announces results count to #theme-announcer (count > 0, plural)', async () => {
    const { input, announcer, cbxCtrl } = await mount();
    // Query 'n' matches Français (fra-n-çais) + English (e-n-glish) = 2.
    // Deutsch has no 'n'; Español has 'ñ' (different codepoint), not 'n'.
    input.value = 'n';
    cbxCtrl.filter({ target: input });
    expect(announcer.textContent).toBe('2 résultats');
  });

  it('filter() — uses .one plural form when count = 1', async () => {
    const { input, announcer, cbxCtrl } = await mount();
    // 'deu' matches only Deutsch.
    input.value = 'deu';
    cbxCtrl.filter({ target: input });
    expect(announcer.textContent).toBe('1 résultat');
  });

  it('filter() — clears announcer to "" when count = 0', async () => {
    const { input, announcer, cbxCtrl } = await mount();
    announcer.textContent = 'previous value';
    input.value = 'zzzzzzzz';
    cbxCtrl.filter({ target: input });
    expect(announcer.textContent).toBe('');
  });

  it('filter() — excludes aria-disabled options from visibleCount', async () => {
    const { input, cbxCtrl, wrap } = await mount({
      options: [
        { value: 'fr', label: 'Français' },
        { value: 'en', label: 'English', disabled: true },
        { value: 'de', label: 'Deutsch' },
      ],
    });
    let captured = null;
    wrap.addEventListener('combobox:filter', (e) => { captured = e.detail; });
    input.value = 'en'; // matches English (disabled) ONLY
    cbxCtrl.filter({ target: input });
    expect(captured.count).toBe(0); // disabled excluded
  });

  it('keydown ArrowDown when closed — opens popover', async () => {
    const { cbxCtrl, popoverCtrl } = await mount();
    expect(popoverCtrl.openValue).toBe(false);
    cbxCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    await tick();
    expect(popoverCtrl.openValue).toBe(true);
  });

  it('keydown ArrowDown when open — activedescendant +1 (clamped)', async () => {
    const { input, options, cbxCtrl, popoverCtrl } = await mount();
    popoverCtrl.open();
    await tick();
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);
    cbxCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1].id);
    expect(options[1].dataset.active).toBe('true');
    expect(options[0].dataset.active).toBe('false');
  });

  it('keydown ArrowUp when open — activedescendant -1 (clamped at 0)', async () => {
    const { input, options, cbxCtrl, popoverCtrl } = await mount();
    popoverCtrl.open();
    await tick();
    cbxCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    cbxCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} });
    expect(input.getAttribute('aria-activedescendant')).toBe(options[2].id);
    cbxCtrl.keydown({ key: 'ArrowUp', preventDefault: () => {} });
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1].id);
    // Clamp at index 0
    cbxCtrl.keydown({ key: 'ArrowUp', preventDefault: () => {} });
    cbxCtrl.keydown({ key: 'ArrowUp', preventDefault: () => {} });
    cbxCtrl.keydown({ key: 'ArrowUp', preventDefault: () => {} });
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);
  });

  it('keydown Enter on active option — selects + closes + dispatches combobox:change', async () => {
    const { input, hiddenInput, options, cbxCtrl, popoverCtrl, wrap } = await mount();
    popoverCtrl.open();
    await tick();
    cbxCtrl.keydown({ key: 'ArrowDown', preventDefault: () => {} }); // active = English
    let captured = null;
    wrap.addEventListener('combobox:change', (e) => {
      captured = { type: e.type, detail: e.detail, bubbles: e.bubbles, composed: e.composed };
    });
    cbxCtrl.keydown({ key: 'Enter', preventDefault: () => {} });
    await tick();
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('combobox:change');
    expect(captured.detail.value).toBe('en');
    expect(captured.detail.label).toBe('English');
    expect(input.value).toBe('English');
    expect(hiddenInput.value).toBe('en');
    expect(options[1].getAttribute('aria-selected')).toBe('true');
    expect(popoverCtrl.openValue).toBe(false);
  });

  it('keydown Esc when query non-empty — clears input + re-filters', async () => {
    const { input, empty, cbxCtrl, popoverCtrl } = await mount();
    input.value = 'zzzz';
    cbxCtrl.filter({ target: input });
    await tick();
    expect(empty.hidden).toBe(false);
    expect(popoverCtrl.openValue).toBe(true);
    cbxCtrl.keydown({ key: 'Escape', preventDefault: () => {} });
    expect(input.value).toBe('');
    expect(empty.hidden).toBe(true);
    // Still open — first Esc clears, doesn't close. Second Esc would close via popover#close window-scoped action.
  });

  it('keydown Esc when query empty — no-op (popover#close window-scope handles)', async () => {
    const { cbxCtrl, popoverCtrl } = await mount();
    popoverCtrl.open();
    await tick();
    // ComboboxController#keydown doesn't preventDefault or close — the
    // window-scoped action `keydown.esc@window->popover#close` (declared on the
    // wrap) does that. So popoverCtrl.openValue stays true after the keydown
    // method itself runs.
    cbxCtrl.keydown({ key: 'Escape', preventDefault: () => {} });
    expect(popoverCtrl.openValue).toBe(true); // controller's keydown is no-op for Esc + empty query
  });

  it('onOptionClick — selects, closes, dispatches combobox:change', async () => {
    const { input, options, cbxCtrl, popoverCtrl, wrap } = await mount();
    popoverCtrl.open();
    await tick();
    let captured = null;
    wrap.addEventListener('combobox:change', (e) => {
      captured = { type: e.type, detail: e.detail };
    });
    cbxCtrl.onOptionClick({ target: options[2] });
    await tick();
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('combobox:change');
    expect(captured.detail.value).toBe('de');
    expect(captured.detail.label).toBe('Deutsch');
    expect(input.value).toBe('Deutsch');
    expect(popoverCtrl.openValue).toBe(false);
  });

  it('_onPopoverOpen — activedescendant on first visible option (no SSR)', async () => {
    const { input, options, popoverCtrl } = await mount();
    popoverCtrl.open();
    await tick();
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);
  });

  it('SSR with value — input shows matching option label', async () => {
    const { input } = await mount({ value: 'en' });
    expect(input.value).toBe('English');
  });

  it('SSR without value — input is empty', async () => {
    const { input } = await mount({ value: '' });
    expect(input.value).toBe('');
  });

  it('focusout with relatedTarget outside wrap — popover closes', async () => {
    const { wrap, cbxCtrl, popoverCtrl } = await mount();
    void cbxCtrl;
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

  it('focusout with relatedTarget inside wrap — popover stays open', async () => {
    const { wrap, cbxCtrl, options, popoverCtrl } = await mount();
    void cbxCtrl;
    popoverCtrl.open();
    await tick();
    expect(popoverCtrl.openValue).toBe(true);
    const focusOutEvt = new FocusEvent('focusout', {
      bubbles: true,
      relatedTarget: options[1],
    });
    wrap.dispatchEvent(focusOutEvt);
    await tick();
    expect(popoverCtrl.openValue).toBe(true);
  });

  it('focusout with null relatedTarget (window blur) — popover closes', async () => {
    const { wrap, cbxCtrl, popoverCtrl } = await mount();
    void cbxCtrl;
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
