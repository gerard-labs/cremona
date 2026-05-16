import { Controller } from '@hotwired/stimulus';

/**
 * date-picker — Input-anchored single-date picker (Ring 2 S2.7 workhorse).
 *
 * Composition (per the S2.7 design brief) :
 *   - Popover (mounted on the SAME wrap via `data-controller="popover
 *     date-picker"`, mirroring the Combobox / Select pattern) provides the
 *     floating panel + click-outside dismiss + Esc dismiss + Floating UI
 *     positioning (lazy-loaded per [ADR-0011]).
 *   - Input (Ring 1 S1.2) provides the trigger envelope. The input is
 *     read-only — typing dates is NOT supported in S2.7 (manual typing is
 *     a future amend if real demand emerges).
 *   - Calendar (Ring 2 S2.7) is rendered inside the popover content. The
 *     DatePicker listens for the Calendar's `calendar:select` event
 *     (bubbles + composed → reaches our wrap-level data-action) +
 *     synchronises input.value (formatted via Intl.DateTimeFormat) + the
 *     hidden form input.
 *
 * Per OQ-40 doctrine (sealed S2.7) : vanilla minimal. No Flatpickr adapter.
 * No Day.js dep. Locale formatting via native Intl.DateTimeFormat (zero
 * bundle cost).
 *
 * Per WAI-ARIA APG "Date Picker Dialog" :
 *   - input role="combobox" + aria-haspopup="dialog" + aria-expanded
 *     (managed by the popover controller — synced on show/hide).
 *   - popover content role="dialog" + aria-modal="false" + aria-labelledby
 *     (sr-only span ; provides the dialog accessible name).
 *
 * Targets :
 *   input       (required) — the read-only Input trigger.
 *   hiddenInput (optional) — form-integration hidden input (carries the
 *                            ISO value ; the user-visible input carries
 *                            the locale-formatted version).
 *
 * Values :
 *   value      (String, default '')   ISO 8601 yyyy-mm-dd of the selected date.
 *   min        (String, default '')   ISO 8601 lower bound (forwarded to Calendar).
 *   max        (String, default '')   ISO 8601 upper bound (forwarded to Calendar).
 *   locale     (String, default 'fr') for Intl.DateTimeFormat.
 *   dateStyle  (String, default 'long') Intl.DateTimeFormat preset
 *                                       ('long' = "12 mai 2026", 'medium' =
 *                                       "12 mai.", 'short' = "12/05/2026",
 *                                       'full' = "mardi 12 mai 2026").
 *
 * Events emitted (raw CustomEvent, bubbles + composed) :
 *   date-picker:change  detail = { iso, formatted, date }
 */
export default class DatePickerController extends Controller {
  static targets = ['input', 'hiddenInput'];

  static values = {
    value: { type: String, default: '' },
    min: { type: String, default: '' },
    max: { type: String, default: '' },
    locale: { type: String, default: 'fr' },
    dateStyle: { type: String, default: 'long' },
  };

  connect() {
    // Sync the visible input + hidden input from the initial value (SSR
    // pre-fill case). The Twig template stamps the raw value on
    // hiddenInput but the visible input only shows a localized format —
    // this controller is the single source of truth for that formatting.
    this._refreshInputDisplay();
  }

  /**
   * Wired via `data-action="calendar:select->date-picker#onCalendarSelect"`
   * on the wrap. The Calendar (rendered inside the popover content) fires
   * `calendar:select` with detail.{iso, date} whenever the user picks a
   * day. We update our `valueValue` (which triggers _refreshInputDisplay
   * via the value-changed callback), close the popover, and re-dispatch
   * as `date-picker:change`.
   */
  onCalendarSelect(event) {
    const iso = event && event.detail && event.detail.iso;
    if (!iso) return;
    if (this.valueValue === iso) {
      // Same date re-selected — still close the popover (consumer
      // dismissed the picker by clicking the already-selected day). Don't
      // re-dispatch date-picker:change (idempotent — the consumer would
      // be wired up to the same state).
      this._closePopover();
      return;
    }
    this.valueValue = iso;
    // The value-changed callback updates input.value + hidden input.
    this._dispatchChange(iso);
    this._closePopover();
  }

  /**
   * Wired via `data-action="popover:open->date-picker#onPopoverOpen"` on
   * the wrap. When the popover opens, focus the Calendar's currently-
   * focused day cell (the Calendar's roving tabindex landed on the
   * selected day or today on render). This gives the keyboard user a
   * direct entry point into the grid.
   */
  onPopoverOpen() {
    // Use a microtask to wait for the popover's visibility transition to
    // start (data-state="open" is set sync inside popover.show()), so
    // the focus call lands after the cells are rendered + visible.
    Promise.resolve().then(() => {
      const focusable = this.element.querySelector(
        '.theme-calendar__day[tabindex="0"]',
      );
      if (focusable) {
        try { focusable.focus(); } catch { /* happy-dom ignore */ }
      }
    });
  }

  /**
   * Wired via `data-action="keydown->date-picker#onTriggerKeydown"` on the
   * input. ArrowDown / Alt+ArrowDown opens the popover (WAI-ARIA APG
   * Combobox pattern). Enter / Space also opens (idiomatic for a button-
   * like trigger).
   */
  onTriggerKeydown(event) {
    const popover = this._popoverController;
    if (!popover) return;
    if (popover.openValue) return; // Esc handled by popover#close binding.
    if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
      if (typeof event.preventDefault === 'function') event.preventDefault();
      popover.open();
    }
  }

  // ---------- Stimulus value-changed callbacks ----------

  valueValueChanged() {
    this._refreshInputDisplay();
    this._syncHiddenInput();
  }

  // ---------- Helpers ----------

  get _popoverController() {
    if (!this.application) return null;
    return this.application.getControllerForElementAndIdentifier(this.element, 'popover');
  }

  _refreshInputDisplay() {
    if (!this.hasInputTarget) return;
    const iso = this.valueValue;
    this.inputTarget.value = iso ? this._formatIso(iso) : '';
  }

  _syncHiddenInput() {
    if (this.hasHiddenInputTarget) {
      this.hiddenInputTarget.value = this.valueValue;
    }
  }

  _closePopover() {
    const popover = this._popoverController;
    if (popover) popover.close();
  }

  _formatIso(iso) {
    if (!iso) return '';
    // Build the Date at UTC midnight to avoid timezone drift when the
    // user's tz shifts the day (e.g. "2026-05-15T00:00:00Z" → in
    // Pacific time → 2026-05-14 17:00 → would format as May 14).
    const date = new Date(iso + 'T00:00:00Z');
    try {
      return new Intl.DateTimeFormat(this.localeValue, {
        dateStyle: this.dateStyleValue,
        timeZone: 'UTC',
      }).format(date);
    } catch {
      // Fallback: return the ISO if the locale or dateStyle is bogus.
      return iso;
    }
  }

  _dispatchChange(iso) {
    const date = new Date(iso + 'T00:00:00Z');
    const formatted = this._formatIso(iso);
    this.element.dispatchEvent(
      new CustomEvent('date-picker:change', {
        bubbles: true,
        composed: true,
        detail: { iso, formatted, date },
      }),
    );
  }
}
