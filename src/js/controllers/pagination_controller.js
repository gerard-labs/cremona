import { Controller } from '@hotwired/stimulus';
import { t } from '../utils/i18n.js';

/**
 * pagination — Page navigation controller.
 *
 * Composes 4 native <button> elements (first/prev/next/last) + an inline
 * NativeSelect for page-size + an aria-live range label ("1-25 sur 142
 * éléments"). Page-size selector inline, NO separate compound — Pagination
 * IS the natural surface for this control.
 *
 * Per WAI-ARIA APG "Pagination":
 *   - role="navigation" + aria-label on the wrap (consumer-stamped via Twig).
 *   - First/Prev disabled at page 1; Next/Last disabled at last page (or
 *     when totalItems = 0).
 *   - Range label uses aria-live="polite" so SR announces the new range
 *     after page or page-size change without interrupting.
 *
 * Events emitted (raw CustomEvent — mirrors Combobox/Drawer doctrine):
 *   pagination:change — bubbles + composed. detail = { page, pageSize, from,
 *                       to, total, totalPages }. Fires after either page or
 *                       pageSize transition (NOT on initial render).
 *
 * Page-size changes reset the current page to 1 (canonical UX — keep the
 * user at the start of the new size's pagination). Consumers wanting
 * "preserve current row range" can compute it themselves via the dispatched
 * detail and call the action method `goToPage(newPage)`.
 *
 * Tests call controller methods directly (`ctrl.next()`, `ctrl.changePageSize({...})`).
 *
 * Targets:
 *   firstButton, prevButton, nextButton, lastButton (required) — the 4
 *      nav buttons. Disabled state is controller-managed.
 *   rangeLabel (required) — the aria-live region rendering "from-to sur total".
 *   pageSizeSelect (optional) — the inner <select> in the inline NativeSelect.
 *
 * Values:
 *   page (Number, default 1) — current 1-based page.
 *   pageSize (Number, default 25) — rows per page.
 *   totalItems (Number, default 0) — total row count across all pages.
 *   labelKey (String, default 'theme.pagination.range') — i18n key for
 *      the range label; resolves via Intl.PluralRules to `.one` / `.other`
 *      based on totalItems.
 */
export default class PaginationController extends Controller {
  static targets = [
    'firstButton',
    'prevButton',
    'nextButton',
    'lastButton',
    'rangeLabel',
    'pageSizeSelect',
  ];

  static values = {
    page: { type: Number, default: 1 },
    pageSize: { type: Number, default: 25 },
    totalItems: { type: Number, default: 0 },
    labelKey: { type: String, default: 'theme.pagination.range' },
  };

  connect() {
    this._rerender();
  }

  /** Computed: total pages, clamped to >= 1 even when totalItems is 0. */
  get totalPages() {
    if (this.totalItemsValue <= 0) return 1;
    return Math.max(1, Math.ceil(this.totalItemsValue / this.pageSizeValue));
  }

  /** Computed: 1-based first visible row index. 0 when empty. */
  get from() {
    if (this.totalItemsValue <= 0) return 0;
    return (this.pageValue - 1) * this.pageSizeValue + 1;
  }

  /** Computed: 1-based last visible row index. 0 when empty. */
  get to() {
    if (this.totalItemsValue <= 0) return 0;
    return Math.min(this.totalItemsValue, this.pageValue * this.pageSizeValue);
  }

  /** Explicit navigation methods — wired via data-action on each button. */
  first() {
    this.goToPage(1);
  }
  prev() {
    this.goToPage(this.pageValue - 1);
  }
  next() {
    this.goToPage(this.pageValue + 1);
  }
  last() {
    this.goToPage(this.totalPages);
  }

  /**
   * Set the active page. Clamps to [1, totalPages]. Dispatches
   * `pagination:change` if the value actually changed.
   */
  goToPage(page) {
    const clamped = Math.max(1, Math.min(this.totalPages, Math.floor(page)));
    if (clamped === this.pageValue) return;
    this.pageValue = clamped;
    this._dispatch();
  }

  /**
   * Wired via `data-action="change->pagination#changePageSize"` on the
   * NativeSelect's <select>. Parses the option value, updates pageSizeValue,
   * resets page to 1, and dispatches.
   */
  changePageSize(event) {
    const raw = event && event.target ? event.target.value : null;
    if (raw == null) return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    if (parsed === this.pageSizeValue) return;
    this.pageSizeValue = parsed;
    this.pageValue = 1;
    this._dispatch();
  }

  /** Stimulus auto-callbacks — re-render whenever any value changes. */
  pageValueChanged() {
    this._rerender();
  }
  pageSizeValueChanged() {
    this._rerender();
  }
  totalItemsValueChanged() {
    this._rerender();
  }

  /**
   * Update the range label text + the 4 button disabled states. Pure DOM
   * sync; no event dispatch (use `_dispatch()` for that).
   */
  _rerender() {
    if (this.hasRangeLabelTarget) {
      const text = t(this.labelKeyValue, {
        count: this.totalItemsValue,
        from: this.from,
        to: this.to,
        total: this.totalItemsValue,
      });
      this.rangeLabelTarget.textContent = text;
    }
    const isFirstPage = this.pageValue <= 1 || this.totalItemsValue <= 0;
    const isLastPage = this.pageValue >= this.totalPages || this.totalItemsValue <= 0;
    this._setDisabled(this.hasFirstButtonTarget ? this.firstButtonTarget : null, isFirstPage);
    this._setDisabled(this.hasPrevButtonTarget ? this.prevButtonTarget : null, isFirstPage);
    this._setDisabled(this.hasNextButtonTarget ? this.nextButtonTarget : null, isLastPage);
    this._setDisabled(this.hasLastButtonTarget ? this.lastButtonTarget : null, isLastPage);
  }

  _setDisabled(button, isDisabled) {
    if (!button) return;
    if (isDisabled) {
      button.setAttribute('disabled', '');
      button.setAttribute('aria-disabled', 'true');
    } else {
      button.removeAttribute('disabled');
      button.removeAttribute('aria-disabled');
    }
  }

  _dispatch() {
    this.element.dispatchEvent(
      new CustomEvent('pagination:change', {
        bubbles: true,
        composed: true,
        detail: {
          page: this.pageValue,
          pageSize: this.pageSizeValue,
          from: this.from,
          to: this.to,
          total: this.totalItemsValue,
          totalPages: this.totalPages,
        },
      }),
    );
  }
}
