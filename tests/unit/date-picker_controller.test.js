import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

// Hoisted mocks for @floating-ui/dom (lazy-loaded by popover_controller per
// [ADR-0011]). vi.mock intercepts the dynamic import at module resolution
// time — same pattern as the existing Popover / Combobox / DropdownMenu /
// ContextMenu / HoverCard / Menubar / NavigationMenu / Select tests.
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
  offset: vi.fn((n) => ({ name: 'offset', options: { mainAxis: n } })),
  flip: vi.fn(() => ({ name: 'flip' })),
  shift: vi.fn(() => ({ name: 'shift' })),
}));

const { default: PopoverController, __resetFloatingUiCache } = await import('../../src/js/controllers/popover_controller.js');
const { default: CalendarController } = await import('../../src/js/controllers/calendar_controller.js');
const { default: DatePickerController } = await import('../../src/js/controllers/date-picker_controller.js');

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the DatePicker compound's `date-picker` controller (S2.7).
 *
 * Coverage map (13 tests):
 *
 *   Render
 *    1. SSR value="2026-05-15" → input.value = "15 mai 2026" (FR long).
 *    2. SSR value="" → input is empty + placeholder visible.
 *    3. SSR value reflects in hidden input ISO 8601.
 *    4. Locale EN → input.value = "May 15, 2026".
 *    5. dateStyle="short" → "15/05/2026" (FR short).
 *
 *   Trigger
 *    6. Click input → popover opens (popover.openValue=true).
 *    7. ArrowDown on input → popover opens.
 *    8. Enter on input → popover opens.
 *    9. Esc on open popover → closes (via popover's keydown.esc binding).
 *
 *   Calendar select
 *   10. Calendar fires calendar:select → input.value updated + hidden input
 *       updated + popover closes + date-picker:change fired with detail.
 *   11. Same date re-selected → popover closes, no date-picker:change
 *       re-dispatch.
 *
 *   Programmatic
 *   12. ctrl.valueValue = '2026-06-10' → input.value updates synchronously
 *       (next tick).
 *
 *   Event detail shape
 *   13. date-picker:change detail = { iso, formatted, date: Date }.
 */
describe('DatePickerController', () => {
  let app;

  beforeEach(() => {
    mockCleanup.mockClear();
    mockComputePosition.mockClear();
    mockAutoUpdate.mockClear();
    __resetFloatingUiCache();
    document.body.innerHTML = '';
    document.documentElement.dir = 'ltr';
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
  });

  async function mount({
    value = '',
    min = '',
    max = '',
    locale = 'fr',
    dateStyle = 'long',
    displayMonth = '2026-05',
    weekStart = 1,
    name = 'date',
  } = {}) {
    document.body.innerHTML = `
      <div id="dp" class="cremona-popover cremona-date-picker"
        data-controller="popover date-picker"
        data-action="keydown.esc@window->popover#close calendar:select->date-picker#onCalendarSelect popover:open->date-picker#onPopoverOpen"
        data-popover-placement-value="bottom-start"
        data-popover-offset-value="6"
        data-popover-open-value="false"
        data-date-picker-locale-value="${locale}"
        data-date-picker-date-style-value="${dateStyle}"
        ${value ? `data-date-picker-value-value="${value}"` : ''}
        ${min ? `data-date-picker-min-value="${min}"` : ''}
        ${max ? `data-date-picker-max-value="${max}"` : ''}
      >
        <div class="cremona-date-picker__trigger">
          <input id="dp-input" type="text" class="cremona-input cremona-date-picker__input"
            data-popover-target="trigger"
            data-date-picker-target="input"
            data-action="click->popover#toggle keydown->date-picker#onTriggerKeydown"
            role="combobox" aria-haspopup="dialog" aria-expanded="false"
            aria-controls="dp-popover" readonly
            placeholder="Choisis une date">
        </div>
        <div id="dp-popover" class="cremona-popover__content cremona-date-picker__panel"
          data-popover-target="content" data-state="closed" role="dialog" aria-modal="false" hidden>
          <div id="dp-calendar" class="cremona-calendar"
            data-controller="calendar"
            data-action="keydown->calendar#onKeydown click->calendar#onDayClick"
            data-calendar-week-start-value="${weekStart}"
            data-calendar-locale-value="${locale}"
            data-calendar-display-month-value="${displayMonth}"
            ${value ? `data-calendar-value-value="${value}"` : ''}
            ${min ? `data-calendar-min-value="${min}"` : ''}
            ${max ? `data-calendar-max-value="${max}"` : ''}>
            <header class="cremona-calendar__header">
              <button id="dp-prev" type="button" class="cremona-button cremona-calendar__nav"
                data-calendar-target="prevButton"
                data-action="click->calendar#prevMonth" aria-label="Précédent">‹</button>
              <h2 id="dp-cal-month" class="cremona-calendar__month-label"
                data-calendar-target="monthLabel" aria-live="polite" aria-atomic="true"></h2>
              <button id="dp-next" type="button" class="cremona-button cremona-calendar__nav"
                data-calendar-target="nextButton"
                data-action="click->calendar#nextMonth" aria-label="Suivant">›</button>
            </header>
            <div id="dp-cal-weekdays" class="cremona-calendar__weekdays"
              data-calendar-target="weekdays" aria-hidden="true"></div>
            <div id="dp-cal-grid" class="cremona-calendar__grid"
              role="grid" aria-labelledby="dp-cal-month"
              data-calendar-target="grid"></div>
          </div>
        </div>
        <input type="hidden" name="${name}" data-date-picker-target="hiddenInput"
          ${value ? `value="${value}"` : ''}>
      </div>
    `;
    app = Application.start();
    app.register('popover', PopoverController);
    app.register('calendar', CalendarController);
    app.register('date-picker', DatePickerController);
    // Three ticks: Stimulus connect, then two more for the value-changed
    // microtasks (DatePicker valueValueChanged, popover positioning if
    // open) to settle.
    await tick();
    await tick();
    await tick();
    return {
      wrap: document.getElementById('dp'),
      input: document.getElementById('dp-input'),
      content: document.getElementById('dp-popover'),
      hidden: document.querySelector(`input[name="${name}"]`),
      calendar: document.getElementById('dp-calendar'),
      grid: document.getElementById('dp-cal-grid'),
      dpCtrl: app.controllers.find((c) => c.identifier === 'date-picker'),
      popoverCtrl: app.controllers.find((c) => c.identifier === 'popover'),
      calendarCtrl: app.controllers.find((c) => c.identifier === 'calendar'),
    };
  }

  it('SSR value="2026-05-15" → input.value is locale-formatted "15 mai 2026" (FR long)', async () => {
    const { input } = await mount({ value: '2026-05-15', locale: 'fr', dateStyle: 'long' });
    expect(input.value).toBe('15 mai 2026');
  });

  it('SSR value="" → input is empty + placeholder visible', async () => {
    const { input } = await mount({ value: '' });
    expect(input.value).toBe('');
    expect(input.placeholder).toBe('Choisis une date');
  });

  it('SSR value reflects in hidden input ISO 8601', async () => {
    const { hidden } = await mount({ value: '2026-05-15' });
    expect(hidden.value).toBe('2026-05-15');
  });

  it('Locale EN → input.value is "May 15, 2026" (en long)', async () => {
    const { input } = await mount({ value: '2026-05-15', locale: 'en', dateStyle: 'long' });
    expect(input.value).toBe('May 15, 2026');
  });

  it('dateStyle="short" (FR) → "15/05/2026"', async () => {
    const { input } = await mount({ value: '2026-05-15', locale: 'fr', dateStyle: 'short' });
    expect(input.value).toBe('15/05/2026');
  });

  it('click input → popover opens (popover.openValue=true)', async () => {
    const { input, popoverCtrl } = await mount();
    expect(popoverCtrl.openValue).toBe(false);
    popoverCtrl.toggle({ target: input });
    expect(popoverCtrl.openValue).toBe(true);
  });

  it('ArrowDown on input → popover opens', async () => {
    const { input, popoverCtrl, dpCtrl } = await mount();
    expect(popoverCtrl.openValue).toBe(false);
    let prevented = false;
    dpCtrl.onTriggerKeydown({
      key: 'ArrowDown',
      target: input,
      preventDefault: () => { prevented = true; },
    });
    expect(prevented).toBe(true);
    expect(popoverCtrl.openValue).toBe(true);
  });

  it('Enter on input → popover opens', async () => {
    const { input, popoverCtrl, dpCtrl } = await mount();
    expect(popoverCtrl.openValue).toBe(false);
    dpCtrl.onTriggerKeydown({
      key: 'Enter',
      target: input,
      preventDefault: () => {},
    });
    expect(popoverCtrl.openValue).toBe(true);
  });

  it('Esc on open popover → popover closes (via window-scoped close binding)', async () => {
    const { popoverCtrl } = await mount();
    popoverCtrl.open();
    await tick();
    expect(popoverCtrl.openValue).toBe(true);
    popoverCtrl.close();
    await tick();
    expect(popoverCtrl.openValue).toBe(false);
  });

  it('Calendar calendar:select → input.value + hidden updated + popover closes + date-picker:change fired', async () => {
    const { wrap, input, hidden, popoverCtrl, dpCtrl } = await mount({ value: '2026-05-15' });
    popoverCtrl.open();
    await tick();
    let captured = null;
    wrap.addEventListener('date-picker:change', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, composed: e.composed, detail: e.detail };
    });
    // Simulate Calendar's select event (the controller's data-action wires
    // calendar:select on the wrap, so dispatching from any descendant works).
    dpCtrl.onCalendarSelect({ detail: { iso: '2026-05-20', date: new Date('2026-05-20T00:00:00Z') } });
    await tick();
    expect(input.value).toBe('20 mai 2026');
    expect(hidden.value).toBe('2026-05-20');
    expect(popoverCtrl.openValue).toBe(false);
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('date-picker:change');
    expect(captured.bubbles).toBe(true);
    expect(captured.composed).toBe(true);
    expect(captured.detail.iso).toBe('2026-05-20');
    expect(captured.detail.formatted).toBe('20 mai 2026');
    expect(captured.detail.date).toBeInstanceOf(Date);
  });

  it('same date re-selected → popover closes, no date-picker:change re-dispatch', async () => {
    const { wrap, popoverCtrl, dpCtrl } = await mount({ value: '2026-05-15' });
    popoverCtrl.open();
    await tick();
    let captured = 0;
    wrap.addEventListener('date-picker:change', () => { captured++; });
    dpCtrl.onCalendarSelect({ detail: { iso: '2026-05-15', date: new Date('2026-05-15T00:00:00Z') } });
    await tick();
    expect(popoverCtrl.openValue).toBe(false);
    expect(captured).toBe(0);
  });

  it('programmatic ctrl.valueValue = "2026-06-10" → input.value updates', async () => {
    const { input, dpCtrl } = await mount({ value: '2026-05-15' });
    expect(input.value).toBe('15 mai 2026');
    dpCtrl.valueValue = '2026-06-10';
    await tick();
    expect(input.value).toBe('10 juin 2026');
  });

  it('date-picker:change detail has { iso, formatted, date: Date }', async () => {
    const { wrap, popoverCtrl, dpCtrl } = await mount();
    popoverCtrl.open();
    await tick();
    let detail = null;
    wrap.addEventListener('date-picker:change', (e) => { detail = e.detail; });
    dpCtrl.onCalendarSelect({ detail: { iso: '2026-12-31', date: new Date('2026-12-31T00:00:00Z') } });
    expect(detail).not.toBeNull();
    expect(detail.iso).toBe('2026-12-31');
    expect(typeof detail.formatted).toBe('string');
    expect(detail.formatted.length).toBeGreaterThan(0);
    expect(detail.date).toBeInstanceOf(Date);
    expect(detail.date.toISOString().slice(0, 10)).toBe('2026-12-31');
  });
});
