import { Controller } from '@hotwired/stimulus';

/**
 * calendar — month-grid date display.
 *
 * Foundation compound for DatePicker (S2.7). Renders a 7-column × N-row
 * grid of day cells (~5-6 rows depending on month length and week-start
 * offset). Pure WAI-ARIA APG "Date Picker Dialog" / "Grid" pattern :
 *
 *   - role="grid" on the grid container (stamped in Twig),
 *     role="row" per week, role="gridcell" per day (stamped by this
 *     controller at render time so the count matches the actual layout).
 *   - Roving tabindex on day cells — only the focused day has tabindex=0,
 *     all others tabindex=-1 (single tab stop into the grid).
 *   - aria-activedescendant on the grid points at the focused day's id.
 *   - aria-selected="true" on the selected day (single-select model).
 *   - aria-current="date" on today.
 *   - aria-disabled="true" on out-of-range, disabled-weekday, OR other-month
 *     days that fall outside the displayed month's chronological range.
 *
 * Keyboard nav (sealed S2.7) :
 *
 *   - ArrowLeft / ArrowRight     ±1 day (chronological — same in LTR and RTL)
 *   - ArrowUp / ArrowDown        ±7 days (previous / next week)
 *   - PageUp / PageDown          ±1 month
 *   - Shift+PageUp / Shift+PgDn  ±1 year
 *   - Home / End                 first / last day of the focused week
 *   - Enter / Space              select the focused day
 *
 * Locale-aware via Intl.DateTimeFormat (NOT Day.js — deferred until
 * relative-time UX surfaces, per OQ-40 doctrine "natif d'abord"). Month
 * label "mai 2026" / "May 2026" + weekday narrow labels (L M M J V S D /
 * S M T W T F S) computed at runtime.
 *
 * The Twig template stamps the outer chrome (header with prev/next + month
 * label, weekday header container, grid container). This controller renders
 * the day cells imperatively on connect() + on every prev/next nav.
 *
 * Targets :
 *   prevButton  (required) — '<' month navigation
 *   nextButton  (required) — '>' month navigation
 *   monthLabel  (required) — text written via Intl.DateTimeFormat
 *   weekdays    (required) — container for the 7 weekday letters
 *   grid        (required) — container for role="row" + day cells
 *   hiddenInput (optional) — form-integration hidden input
 *
 * Values :
 *   value             (String, default '')      ISO 8601 yyyy-mm-dd of selected date
 *   min               (String, default '')      ISO 8601 lower bound
 *   max               (String, default '')      ISO 8601 upper bound
 *   displayMonth      (String, default '')      YYYY-MM initially shown (default :
 *                                                 value's month, or current month
 *                                                 if no value)
 *   weekStart         (Number, default 1)       0=Sun | 1=Mon
 *   locale            (String, default 'fr')    for Intl.DateTimeFormat names
 *   disabledWeekdays  (String, default '')      CSV weekday indices to disable
 *
 * Events emitted (raw CustomEvent, bubbles + composed) :
 *   calendar:select               detail = { iso: 'yyyy-mm-dd', date: Date }
 *   calendar:display-month-change detail = { month: 'YYYY-MM', label: 'mai 2026' }
 */
export default class CalendarController extends Controller {
  static targets = ['prevButton', 'nextButton', 'monthLabel', 'weekdays', 'grid', 'hiddenInput'];

  static values = {
    value: { type: String, default: '' },
    min: { type: String, default: '' },
    max: { type: String, default: '' },
    displayMonth: { type: String, default: '' },
    weekStart: { type: Number, default: 1 },
    locale: { type: String, default: 'fr' },
    disabledWeekdays: { type: String, default: '' },
  };

  connect() {
    // Cache today (UTC ISO) so the highlight stays stable across renders.
    this._today = isoOfDate(new Date());

    // Determine the initial display month: explicit value > selected value's
    // month > today's month.
    if (!this.displayMonthValue) {
      const seed = this.valueValue || this._today;
      this.displayMonthValue = seed.slice(0, 7);
    }

    // Initial focused day: selected value > today (if in displayed month) >
    // first day of displayed month. Always within the displayed month.
    this._focusedIso = this._initialFocusedIso();

    this._renderWeekdays();
    this._renderMonth();
  }

  // ---------- Public methods (wired via data-action) ----------

  /** Wired via `data-action="click->calendar#prevMonth"` on prevButton. */
  prevMonth() {
    this.displayMonthValue = shiftMonth(this.displayMonthValue, -1);
  }

  /** Wired via `data-action="click->calendar#nextMonth"` on nextButton. */
  nextMonth() {
    this.displayMonthValue = shiftMonth(this.displayMonthValue, +1);
  }

  /**
   * Wired via `data-action="click->calendar#onDayClick"` on the wrap.
   * Stimulus dispatches every click on a descendant to this method — we
   * filter for the day-cell class so clicks on prev/next buttons or chrome
   * areas don't trigger selection.
   */
  onDayClick(event) {
    const cell = event.target && event.target.closest && event.target.closest('.theme-calendar__day');
    if (!cell || !this.element.contains(cell)) return;
    if (cell.getAttribute('aria-disabled') === 'true') return;
    const iso = cell.dataset.iso;
    if (!iso) return;
    this._focusedIso = iso;
    this._select(iso);
    // If the click landed on an other-month day, navigate the display month
    // (the controller's value sync will trigger a re-render).
    if (iso.slice(0, 7) !== this.displayMonthValue) {
      this.displayMonthValue = iso.slice(0, 7);
    } else {
      this._refreshGridState();
    }
  }

  /**
   * Wired via `data-action="keydown->calendar#onKeydown"` on the wrap.
   * Filters to keydowns originating from a day cell — keys on the prev/next
   * buttons stay native (Enter activates the button via the browser).
   */
  onKeydown(event) {
    const cell = event.target && event.target.classList && event.target.classList.contains('theme-calendar__day')
      ? event.target
      : null;
    if (!cell) return;

    let handled = true;
    let delta = 0;
    let monthShift = 0;
    let yearShift = 0;
    let homeEnd = null;

    switch (event.key) {
      case 'ArrowLeft':
        delta = -1;
        break;
      case 'ArrowRight':
        delta = +1;
        break;
      case 'ArrowUp':
        delta = -7;
        break;
      case 'ArrowDown':
        delta = +7;
        break;
      case 'PageUp':
        if (event.shiftKey) yearShift = -1;
        else monthShift = -1;
        break;
      case 'PageDown':
        if (event.shiftKey) yearShift = +1;
        else monthShift = +1;
        break;
      case 'Home':
        homeEnd = 'start';
        break;
      case 'End':
        homeEnd = 'end';
        break;
      case 'Enter':
      case ' ':
        if (cell.getAttribute('aria-disabled') !== 'true') {
          this._select(cell.dataset.iso);
        }
        break;
      default:
        handled = false;
    }

    if (!handled) return;

    if (typeof event.preventDefault === 'function') event.preventDefault();

    let nextIso = this._focusedIso;
    if (delta !== 0) {
      nextIso = shiftIso(this._focusedIso, delta);
    } else if (monthShift !== 0) {
      nextIso = shiftMonthIso(this._focusedIso, monthShift);
    } else if (yearShift !== 0) {
      nextIso = shiftMonthIso(this._focusedIso, yearShift * 12);
    } else if (homeEnd) {
      nextIso = isoForWeekEdge(this._focusedIso, this.weekStartValue, homeEnd);
    }

    if (!nextIso || nextIso === this._focusedIso) return;

    this._focusedIso = nextIso;
    const nextMonth = nextIso.slice(0, 7);
    if (nextMonth !== this.displayMonthValue) {
      // Cross-month nav: setting displayMonthValue triggers re-render via
      // the value-changed callback, which also re-applies focus to
      // _focusedIso. No need to call _focusCell() here.
      this.displayMonthValue = nextMonth;
    } else {
      this._focusCell(nextIso);
    }
  }

  // ---------- Stimulus value-changed callbacks ----------

  /**
   * Re-render the grid whenever the displayed month changes. Also fires the
   * `calendar:display-month-change` event with the locale-formatted month
   * label.
   *
   * Two early-return guards :
   *  - `!this._focusedIso` — Stimulus's ValueObserver.start fires the initial
   *    valueChanged callback BEFORE the controller's connect() method runs.
   *    At that point our internal state isn't ready ; connect() handles the
   *    initial render explicitly.
   *  - `month === this._lastRenderedMonth` — when connect() itself mutates
   *    `displayMonthValue` (because the DOM attribute was empty), the
   *    callback fires later in a microtask AFTER the initial render. The
   *    cache short-circuits the duplicate work + suppresses an erroneous
   *    `calendar:display-month-change` event on initial mount.
   */
  displayMonthValueChanged(month, previous) {
    if (!this._focusedIso) return;
    if (!month) return;
    if (month === this._lastRenderedMonth) return;
    if (month === previous) return;
    this._renderMonth();
    this.element.dispatchEvent(
      new CustomEvent('calendar:display-month-change', {
        bubbles: true,
        composed: true,
        detail: {
          month,
          label: this._formatMonthLabel(month),
        },
      }),
    );
  }

  /**
   * When the consumer sets a new value programmatically, refresh aria-selected
   * + sync the hidden input. Does NOT re-render the grid (the user might be on
   * a different month) — let `displayMonthValueChanged` handle that if needed.
   */
  valueValueChanged() {
    if (this.hasHiddenInputTarget) {
      this.hiddenInputTarget.value = this.valueValue;
    }
    if (this._isRendered) {
      this._refreshGridState();
    }
  }

  // ---------- Render ----------

  _renderWeekdays() {
    if (!this.hasWeekdaysTarget) return;
    const weekStart = clampWeekStart(this.weekStartValue);
    const labels = weekdayNarrowLabels(this.localeValue, weekStart);
    let html = '';
    for (const lbl of labels) {
      // The wrapping span is decorative (aria-hidden on the parent). The
      // first letter is the narrow weekday name from Intl.DateTimeFormat.
      html += `<span class="theme-calendar__weekday">${escapeHtml(lbl)}</span>`;
    }
    this.weekdaysTarget.innerHTML = html;
  }

  _renderMonth() {
    if (!this.hasMonthLabelTarget || !this.hasGridTarget) return;

    const month = this.displayMonthValue;
    const weekStart = clampWeekStart(this.weekStartValue);

    // Update the header label first (always — even if grid render fails).
    this.monthLabelTarget.textContent = this._formatMonthLabel(month);

    // Compute the cells for the displayed month. The grid is 7 cells wide
    // and N rows tall (5 or 6 typically). The first cell may be from the
    // previous month (offset based on weekStart). Trailing cells fill the
    // last row to a multiple of 7.
    const cells = buildMonthCells(month, weekStart);

    const minIso = this.minValue;
    const maxIso = this.maxValue;
    const disabledWeekdaysSet = parseDisabledWeekdays(this.disabledWeekdaysValue);
    const selectedIso = this.valueValue;
    const today = this._today;

    // Ensure _focusedIso falls inside the displayed month (after a nav, the
    // controller already updated _focusedIso ; on consumer value change with
    // no month nav, we need to clamp).
    if (this._focusedIso.slice(0, 7) !== month) {
      this._focusedIso = clampFocusedToMonth(this._focusedIso, month, cells);
    }

    const gridId = this.gridTarget.id || '';
    const cellIdBase = `${gridId || 'theme-calendar-grid'}-cell`;

    // Render rows. Each row is a `<div role="row">` with 7 day buttons.
    const rowsHtml = [];
    for (let r = 0; r < cells.length; r += 7) {
      const rowCells = cells.slice(r, r + 7);
      const cellsHtml = rowCells.map((cell) => {
        const iso = cell.iso;
        const weekday = cell.weekday;
        const isOtherMonth = cell.otherMonth;
        const isToday = iso === today;
        const isSelected = iso === selectedIso;
        const inRange = isoInRange(iso, minIso, maxIso);
        const isDisabledWeekday = disabledWeekdaysSet.has(weekday);
        const isDisabled = !inRange || isDisabledWeekday;
        const isFocused = iso === this._focusedIso;

        const dataState = isSelected
          ? 'selected'
          : isToday
            ? 'today'
            : isOtherMonth
              ? 'other-month'
              : 'default';

        const ariaParts = [
          `role="gridcell"`,
          `data-calendar-target="dayCell"`,
          `data-iso="${iso}"`,
          `data-weekday="${weekday}"`,
          `data-state="${dataState}"`,
          `tabindex="${isFocused ? 0 : -1}"`,
          `id="${cellIdBase}-${iso}"`,
        ];
        if (isSelected) ariaParts.push(`aria-selected="true"`);
        else ariaParts.push(`aria-selected="false"`);
        if (isToday) ariaParts.push(`aria-current="date"`);
        if (isDisabled) ariaParts.push(`aria-disabled="true"`);

        return `<button type="button" class="theme-calendar__day" ${ariaParts.join(' ')}>${cell.day}</button>`;
      }).join('');
      rowsHtml.push(`<div class="theme-calendar__row" role="row">${cellsHtml}</div>`);
    }

    this.gridTarget.innerHTML = rowsHtml.join('');

    // Set aria-activedescendant to the focused cell's id.
    const focusedId = `${cellIdBase}-${this._focusedIso}`;
    this.gridTarget.setAttribute('aria-activedescendant', focusedId);

    this._isRendered = true;
    this._lastRenderedMonth = month;
  }

  /**
   * Re-apply state attributes (aria-selected, data-state, aria-disabled,
   * tabindex) without rebuilding the DOM. Used when the value changes but
   * the displayed month stays the same.
   */
  _refreshGridState() {
    if (!this.hasGridTarget) return;
    const selectedIso = this.valueValue;
    const today = this._today;
    const minIso = this.minValue;
    const maxIso = this.maxValue;
    const disabledWeekdaysSet = parseDisabledWeekdays(this.disabledWeekdaysValue);
    const cells = this.gridTarget.querySelectorAll('.theme-calendar__day');
    for (const cell of cells) {
      const iso = cell.dataset.iso;
      const weekday = Number(cell.dataset.weekday);
      const isOtherMonth = cell.dataset.state === 'other-month';
      const isToday = iso === today;
      const isSelected = iso === selectedIso;
      const inRange = isoInRange(iso, minIso, maxIso);
      const isDisabled = !inRange || disabledWeekdaysSet.has(weekday);
      cell.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      if (isToday) cell.setAttribute('aria-current', 'date');
      else cell.removeAttribute('aria-current');
      if (isDisabled) cell.setAttribute('aria-disabled', 'true');
      else cell.removeAttribute('aria-disabled');
      cell.dataset.state = isSelected
        ? 'selected'
        : isToday
          ? 'today'
          : isOtherMonth
            ? 'other-month'
            : 'default';
      cell.tabIndex = iso === this._focusedIso ? 0 : -1;
    }
    this.gridTarget.setAttribute(
      'aria-activedescendant',
      `${this.gridTarget.id || 'theme-calendar-grid'}-cell-${this._focusedIso}`,
    );
  }

  // ---------- Helpers ----------

  _initialFocusedIso() {
    const candidate = this.valueValue || this._today;
    if (candidate.slice(0, 7) === this.displayMonthValue) return candidate;
    // Fallback: first day of the displayed month.
    return `${this.displayMonthValue}-01`;
  }

  _select(iso) {
    if (!iso) return;
    if (iso === this.valueValue) {
      // Re-selecting the same day still fires the event so consumers can act
      // (e.g. close a popover).
      this._dispatchSelect(iso);
      return;
    }
    this.valueValue = iso;
    // valueValueChanged → _refreshGridState (which updates aria-selected).
    this._dispatchSelect(iso);
  }

  _dispatchSelect(iso) {
    const date = new Date(iso + 'T00:00:00Z');
    this.element.dispatchEvent(
      new CustomEvent('calendar:select', {
        bubbles: true,
        composed: true,
        detail: { iso, date },
      }),
    );
  }

  _focusCell(iso) {
    if (!this.hasGridTarget) return;
    const cells = this.gridTarget.querySelectorAll('.theme-calendar__day');
    for (const cell of cells) {
      if (cell.dataset.iso === iso) {
        cell.tabIndex = 0;
        try {
          cell.focus();
        } catch {
          // happy-dom may throw on focus in some edge cases — ignore.
        }
      } else {
        cell.tabIndex = -1;
      }
    }
    this.gridTarget.setAttribute(
      'aria-activedescendant',
      `${this.gridTarget.id || 'theme-calendar-grid'}-cell-${iso}`,
    );
  }

  _formatMonthLabel(yearMonth) {
    const [year, monthIdx1] = yearMonth.split('-').map(Number);
    const d = new Date(Date.UTC(year, monthIdx1 - 1, 1));
    try {
      return new Intl.DateTimeFormat(this.localeValue, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
    } catch {
      return yearMonth;
    }
  }
}

// ---------- Pure utility functions (testable in isolation) ----------

function clampWeekStart(n) {
  return n === 0 ? 0 : 1;
}

function parseDisabledWeekdays(csv) {
  if (!csv) return new Set();
  return new Set(
    csv
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
  );
}

function isoOfDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shiftMonth(yearMonth, deltaMonths) {
  const [y, m] = yearMonth.split('-').map(Number);
  const total = (y * 12 + (m - 1)) + deltaMonths;
  const ny = Math.floor(total / 12);
  const nm = (total % 12 + 12) % 12;
  return `${ny}-${String(nm + 1).padStart(2, '0')}`;
}

function shiftIso(iso, deltaDays) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function shiftMonthIso(iso, deltaMonths) {
  const d = new Date(iso + 'T00:00:00Z');
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + deltaMonths);
  // Clamp day to the new month's length (e.g. shifting from Jan 31 to Feb
  // should land on Feb 28 / 29, not "Feb 31" wrapping into March).
  const lastDayOfTargetMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDayOfTargetMonth));
  return d.toISOString().slice(0, 10);
}

function isoForWeekEdge(iso, weekStart, edge) {
  const d = new Date(iso + 'T00:00:00Z');
  const dayOfWeek = d.getUTCDay(); // 0=Sun, 6=Sat
  const offsetFromStart = (dayOfWeek - weekStart + 7) % 7;
  if (edge === 'start') {
    d.setUTCDate(d.getUTCDate() - offsetFromStart);
  } else {
    d.setUTCDate(d.getUTCDate() + (6 - offsetFromStart));
  }
  return d.toISOString().slice(0, 10);
}

function isoInRange(iso, minIso, maxIso) {
  if (minIso && iso < minIso) return false;
  if (maxIso && iso > maxIso) return false;
  return true;
}

function clampFocusedToMonth(iso, yearMonth, cells) {
  // If the iso is in the cells (could be other-month edge), keep it. Otherwise
  // fall back to the first in-month cell.
  if (cells.some((c) => c.iso === iso)) return iso;
  return `${yearMonth}-01`;
}

function buildMonthCells(yearMonth, weekStart) {
  const [year, monthIdx1] = yearMonth.split('-').map(Number);
  const monthIdx0 = monthIdx1 - 1;
  const firstOfMonth = new Date(Date.UTC(year, monthIdx0, 1));
  const firstWeekday = firstOfMonth.getUTCDay();
  const offset = (firstWeekday - weekStart + 7) % 7;
  const daysInMonth = new Date(Date.UTC(year, monthIdx0 + 1, 0)).getUTCDate();

  const cells = [];
  // Leading other-month days
  if (offset > 0) {
    const prevMonthDays = new Date(Date.UTC(year, monthIdx0, 0)).getUTCDate();
    for (let i = offset; i > 0; i--) {
      const day = prevMonthDays - i + 1;
      const date = new Date(Date.UTC(year, monthIdx0 - 1, day));
      cells.push({
        day,
        iso: date.toISOString().slice(0, 10),
        weekday: date.getUTCDay(),
        otherMonth: true,
      });
    }
  }
  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(year, monthIdx0, day));
    cells.push({
      day,
      iso: date.toISOString().slice(0, 10),
      weekday: date.getUTCDay(),
      otherMonth: false,
    });
  }
  // Trailing other-month days to complete the last row
  while (cells.length % 7 !== 0) {
    const trailingIdx = cells.length - (offset + daysInMonth);
    const day = trailingIdx + 1;
    const date = new Date(Date.UTC(year, monthIdx0 + 1, day));
    cells.push({
      day,
      iso: date.toISOString().slice(0, 10),
      weekday: date.getUTCDay(),
      otherMonth: true,
    });
  }
  return cells;
}

function weekdayNarrowLabels(locale, weekStart) {
  // Pick a known week starting on Sunday (2026-01-04 was a Sunday) and emit
  // 7 narrow weekday labels in chronological order, then rotate to start on
  // weekStart.
  const labels = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(2026, 0, 4 + i));
    try {
      labels.push(new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' }).format(d));
    } catch {
      // Fallback: first letter of English weekday names.
      labels.push(['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]);
    }
  }
  // Rotate so labels[0] corresponds to weekStart.
  return labels.slice(weekStart).concat(labels.slice(0, weekStart));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}
