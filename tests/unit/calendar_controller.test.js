import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import CalendarController from '../../src/js/controllers/calendar_controller.js';

/**
 * Unit tests for the Calendar compound's `calendar` controller (S2.7).
 *
 * Coverage map (13 tests):
 *
 *   Render
 *    1. connect() renders a 7-column grid with 35-42 day cells for the
 *       displayed month + computes the weekday header (7 labels).
 *    2. weekStart=1 places Monday first in the weekday header (FR default);
 *       weekStart=0 places Sunday first.
 *    3. Today's cell gets aria-current="date" + data-state="today" when
 *       it falls within the displayed month.
 *    4. value="2026-05-15" pre-selects that day (aria-selected="true" +
 *       data-state="selected").
 *
 *   Keyboard nav
 *    5. ArrowRight on the focused day advances focus by +1 day.
 *    6. ArrowDown advances by +7 days (next week).
 *    7. PageDown advances by +1 month and dispatches
 *       calendar:display-month-change.
 *    8. Shift+PageDown advances by +1 year (12 months).
 *    9. Home / End move focus to first / last day of the focused week
 *       (respecting weekStart).
 *
 *   Selection
 *   10. Click on a day cell sets value + dispatches calendar:select
 *       (bubbles + composed, detail.iso + detail.date).
 *   11. Enter on the focused day fires calendar:select.
 *
 *   Constraints
 *   12. min/max boundary: cells outside the range get aria-disabled="true"
 *       and clicks are no-op.
 *   13. disabledWeekdays="0,6" disables every Saturday and Sunday cell.
 */
describe('CalendarController', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
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
    displayMonth = '2026-05',
    weekStart = 1,
    locale = 'fr',
    disabledWeekdays = '',
    name = '',
  } = {}) {
    const attrs = [
      `data-controller="calendar"`,
      `data-action="keydown->calendar#onKeydown click->calendar#onDayClick"`,
      `data-calendar-week-start-value="${weekStart}"`,
      `data-calendar-locale-value="${locale}"`,
      `data-calendar-display-month-value="${displayMonth}"`,
    ];
    if (value) attrs.push(`data-calendar-value-value="${value}"`);
    if (min) attrs.push(`data-calendar-min-value="${min}"`);
    if (max) attrs.push(`data-calendar-max-value="${max}"`);
    if (disabledWeekdays) attrs.push(`data-calendar-disabled-weekdays-value="${disabledWeekdays}"`);

    document.body.innerHTML = `
      <div id="cal" class="cremona-calendar" ${attrs.join(' ')}>
        <header class="cremona-calendar__header">
          <button id="prev" type="button" class="cremona-button cremona-calendar__nav"
            data-calendar-target="prevButton"
            data-action="click->calendar#prevMonth"
            aria-label="Mois précédent">‹</button>
          <h2 id="cal-month" class="cremona-calendar__month-label"
            data-calendar-target="monthLabel"
            aria-live="polite" aria-atomic="true"></h2>
          <button id="next" type="button" class="cremona-button cremona-calendar__nav"
            data-calendar-target="nextButton"
            data-action="click->calendar#nextMonth"
            aria-label="Mois suivant">›</button>
        </header>
        <div id="cal-weekdays" class="cremona-calendar__weekdays"
          data-calendar-target="weekdays" aria-hidden="true"></div>
        <div id="cal-grid" class="cremona-calendar__grid"
          role="grid" aria-labelledby="cal-month"
          data-calendar-target="grid"></div>
        ${name ? `<input type="hidden" name="${name}" data-calendar-target="hiddenInput">` : ''}
      </div>
    `;
    app = Application.start();
    app.register('calendar', CalendarController);
    // Two ticks: first for Stimulus connect, second for value-changed
    // microtasks to flush.
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    return {
      wrap: document.getElementById('cal'),
      prev: document.getElementById('prev'),
      next: document.getElementById('next'),
      monthLabel: document.getElementById('cal-month'),
      weekdays: document.getElementById('cal-weekdays'),
      grid: document.getElementById('cal-grid'),
      ctrl: app.controllers.find((c) => c.identifier === 'calendar'),
    };
  }

  function cellsOf(grid) {
    return Array.from(grid.querySelectorAll('.cremona-calendar__day'));
  }

  function cellByIso(grid, iso) {
    return grid.querySelector(`.cremona-calendar__day[data-iso="${iso}"]`);
  }

  it('connect() — renders 7 weekday labels and a 5-6 row grid of day cells', async () => {
    const { grid, weekdays } = await mount({ displayMonth: '2026-05' });
    expect(weekdays.querySelectorAll('.cremona-calendar__weekday').length).toBe(7);
    const cells = cellsOf(grid);
    // May 2026 has 31 days; with weekStart=1 (Mon) and May 1 = Friday,
    // there are 4 leading other-month cells (Mon-Thu of week containing
    // May 1) + 31 own-month cells = 35 total + trailing cells to reach a
    // multiple of 7. 35 is a multiple of 7 so no trailing needed.
    // Actual: 4 leading + 31 own + 0 trailing = 35 cells.
    expect(cells.length).toBe(35);
    expect(grid.querySelectorAll('[role="row"]').length).toBe(5);
  });

  it('weekStart=1 places Monday first; weekStart=0 places Sunday first', async () => {
    const { weekdays: wkMon } = await mount({ displayMonth: '2026-05', weekStart: 1, locale: 'fr' });
    const labels1 = Array.from(wkMon.querySelectorAll('.cremona-calendar__weekday')).map((e) => e.textContent);
    // FR narrow: L M M J V S D when starting Monday.
    expect(labels1[0]).toBe('L');
    expect(labels1[6]).toBe('D');

    document.body.innerHTML = '';
    app.stop();
    const { weekdays: wkSun } = await mount({ displayMonth: '2026-05', weekStart: 0, locale: 'fr' });
    const labels0 = Array.from(wkSun.querySelectorAll('.cremona-calendar__weekday')).map((e) => e.textContent);
    // Sunday first → D L M M J V S
    expect(labels0[0]).toBe('D');
    expect(labels0[6]).toBe('S');
  });

  it('today highlight — aria-current="date" + data-state="today" on the cell matching today\'s ISO', async () => {
    const today = new Date();
    const todayYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const todayIso = `${todayYM}-${String(today.getDate()).padStart(2, '0')}`;
    const { grid } = await mount({ displayMonth: todayYM });
    const cell = cellByIso(grid, todayIso);
    expect(cell).not.toBeNull();
    expect(cell.getAttribute('aria-current')).toBe('date');
    expect(cell.dataset.state).toBe('today');
  });

  it('value="2026-05-15" pre-selects that day (aria-selected="true" + data-state="selected")', async () => {
    const { grid } = await mount({ displayMonth: '2026-05', value: '2026-05-15' });
    const selected = cellByIso(grid, '2026-05-15');
    expect(selected.getAttribute('aria-selected')).toBe('true');
    expect(selected.dataset.state).toBe('selected');
    expect(selected.tabIndex).toBe(0);
  });

  it('ArrowRight advances focus by +1 day (chronological)', async () => {
    const { grid, ctrl } = await mount({ displayMonth: '2026-05', value: '2026-05-15' });
    const focusedBefore = cellByIso(grid, '2026-05-15');
    ctrl.onKeydown({ key: 'ArrowRight', target: focusedBefore, preventDefault: () => {} });
    expect(ctrl._focusedIso).toBe('2026-05-16');
    const focusedAfter = cellByIso(grid, '2026-05-16');
    expect(focusedAfter.tabIndex).toBe(0);
    expect(focusedBefore.tabIndex).toBe(-1);
  });

  it('ArrowDown advances focus by +7 days (next week)', async () => {
    const { grid, ctrl } = await mount({ displayMonth: '2026-05', value: '2026-05-15' });
    const focusedBefore = cellByIso(grid, '2026-05-15');
    ctrl.onKeydown({ key: 'ArrowDown', target: focusedBefore, preventDefault: () => {} });
    expect(ctrl._focusedIso).toBe('2026-05-22');
  });

  it('PageDown advances by +1 month and dispatches calendar:display-month-change', async () => {
    const { wrap, grid, ctrl } = await mount({ displayMonth: '2026-05', value: '2026-05-15' });
    let captured = null;
    wrap.addEventListener('calendar:display-month-change', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, composed: e.composed, detail: e.detail };
    });
    const focusedBefore = cellByIso(grid, '2026-05-15');
    ctrl.onKeydown({ key: 'PageDown', shiftKey: false, target: focusedBefore, preventDefault: () => {} });
    expect(ctrl.displayMonthValue).toBe('2026-06');
    await new Promise((r) => setTimeout(r, 0));
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('calendar:display-month-change');
    expect(captured.bubbles).toBe(true);
    expect(captured.composed).toBe(true);
    expect(captured.detail.month).toBe('2026-06');
    expect(typeof captured.detail.label).toBe('string');
    expect(captured.detail.label.length).toBeGreaterThan(0);
  });

  it('Shift+PageDown advances by +1 year (12 months)', async () => {
    const { grid, ctrl } = await mount({ displayMonth: '2026-05', value: '2026-05-15' });
    const focusedBefore = cellByIso(grid, '2026-05-15');
    ctrl.onKeydown({ key: 'PageDown', shiftKey: true, target: focusedBefore, preventDefault: () => {} });
    expect(ctrl.displayMonthValue).toBe('2027-05');
  });

  it('Home / End move focus to start / end of focused week (weekStart=1)', async () => {
    // May 15, 2026 was a Friday. With weekStart=1 (Mon), the week is
    // Mon May 11 (start) → Sun May 17 (end).
    const { grid, ctrl } = await mount({ displayMonth: '2026-05', value: '2026-05-15', weekStart: 1 });
    const focused = cellByIso(grid, '2026-05-15');
    ctrl.onKeydown({ key: 'Home', target: focused, preventDefault: () => {} });
    expect(ctrl._focusedIso).toBe('2026-05-11');
    ctrl.onKeydown({ key: 'End', target: cellByIso(grid, '2026-05-11'), preventDefault: () => {} });
    expect(ctrl._focusedIso).toBe('2026-05-17');
  });

  it('click on a day cell sets value + dispatches calendar:select (bubbles + composed, detail.iso + detail.date)', async () => {
    const { wrap, grid, ctrl } = await mount({ displayMonth: '2026-05' });
    let captured = null;
    wrap.addEventListener('calendar:select', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, composed: e.composed, detail: e.detail };
    });
    const target = cellByIso(grid, '2026-05-15');
    ctrl.onDayClick({ target });
    expect(ctrl.valueValue).toBe('2026-05-15');
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('calendar:select');
    expect(captured.bubbles).toBe(true);
    expect(captured.composed).toBe(true);
    expect(captured.detail.iso).toBe('2026-05-15');
    expect(captured.detail.date).toBeInstanceOf(Date);
    expect(captured.detail.date.toISOString().slice(0, 10)).toBe('2026-05-15');
  });

  it('Enter on the focused day fires calendar:select', async () => {
    const { wrap, grid, ctrl } = await mount({ displayMonth: '2026-05', value: '2026-05-15' });
    let captured = null;
    wrap.addEventListener('calendar:select', (e) => {
      captured = e.detail;
    });
    const focused = cellByIso(grid, '2026-05-15');
    ctrl.onKeydown({ key: 'Enter', target: focused, preventDefault: () => {} });
    expect(captured).not.toBeNull();
    expect(captured.iso).toBe('2026-05-15');
  });

  it('min/max boundary — cells outside the range are aria-disabled and click is no-op', async () => {
    const { grid, ctrl } = await mount({
      displayMonth: '2026-05',
      min: '2026-05-10',
      max: '2026-05-20',
    });
    const before = cellByIso(grid, '2026-05-05');
    const after = cellByIso(grid, '2026-05-25');
    const inRange = cellByIso(grid, '2026-05-15');
    expect(before.getAttribute('aria-disabled')).toBe('true');
    expect(after.getAttribute('aria-disabled')).toBe('true');
    expect(inRange.getAttribute('aria-disabled')).not.toBe('true');

    // Click on a disabled day → no value change, no event.
    let captured = false;
    ctrl.element.addEventListener('calendar:select', () => { captured = true; });
    ctrl.onDayClick({ target: before });
    expect(captured).toBe(false);
    expect(ctrl.valueValue).toBe('');
  });

  it('disabledWeekdays="0,6" disables every Saturday (6) and Sunday (0) cell', async () => {
    const { grid } = await mount({ displayMonth: '2026-05', disabledWeekdays: '0,6' });
    // May 2, 2026 = Saturday (weekday 6). May 3, 2026 = Sunday (weekday 0).
    const sat = cellByIso(grid, '2026-05-02');
    const sun = cellByIso(grid, '2026-05-03');
    const mon = cellByIso(grid, '2026-05-04');
    expect(sat.getAttribute('aria-disabled')).toBe('true');
    expect(sun.getAttribute('aria-disabled')).toBe('true');
    expect(mon.getAttribute('aria-disabled')).not.toBe('true');
  });
});
