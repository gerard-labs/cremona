import { Controller } from '@hotwired/stimulus';
import { t } from '../utils/i18n.js';

/**
 * data-table — the kit's fully-featured DataTable workhorse.
 *
 * Composition pure (PAS d'héritage ES). Coordinates 6 UX concerns:
 *   1. Sort — single-col by default (OQ-37), opt-in multi-col via
 *      multiColumnSortValue + event.shiftKey | event.metaKey.
 *   2. Selection — per-row checkbox + bulk-select header with
 *      indeterminate state (per S1.3 doctrine: el.indeterminate = true,
 *      browser owns aria-checked="mixed").
 *   3. Column visibility — toggles `hidden` attribute on every
 *      [data-data-table-column-cell="<id>"] in <th> + <td>. Composed via
 *      DropdownMenu (its own popover + dropdown-menu controllers).
 *   4. Bulk actions — emits `data-table:bulk-action` with detail.{actionId,
 *      selectedRows}. Destructive actions wired by consumer to AlertDialog
 *      open (per OQ-39 — Sonner Toast-with-Undo deferred to S2.5+).
 *   5. Filter — emits `data-table:filter-change` with detail.{column, query,
 *      allFilters}. The controller does NOT mutate row visibility for
 *      filters — that's data-source concern (consumer-owned, server-side
 *      or client-side).
 *   6. Pagination — composed via the Pagination compound (its own controller).
 *      Bubbled `pagination:change` events available to consumers.
 *
 * Events emitted (raw CustomEvent — mirrors Combobox / Drawer / Pagination
 * doctrine; avoids Stimulus's dispatch() prefix interpretation):
 *   data-table:sort-change — detail.{column, direction, isMultiCol}
 *   data-table:selection-change — detail.{selectedRows, count}
 *   data-table:column-visibility-change — detail.{visibleColumns}
 *   data-table:bulk-action — detail.{actionId, selectedRows}
 *   data-table:filter-change — detail.{column, query, allFilters}
 *
 * Per S1.4b descriptor-binding gotcha (Collapsible §2 + ADR-0008): tests
 * call controller methods directly (`ctrl.toggleSort({...})`) rather than
 * synthesising events through Stimulus's action descriptors.
 *
 * Targets:
 *   table (required)           — the inner <table>.
 *   bulkBar (optional)         — visible when selectedRows.length > 0.
 *   bulkCount (optional)       — child of bulkBar, carries aria-live text.
 *   selectAllCheckbox (optional) — header checkbox, manages indeterminate.
 *   rowCheckbox (multiple)     — per-row checkboxes.
 *   columnVisibilityTrigger (optional) — DropdownMenu trigger button.
 *   filterRow (optional)       — second <tr> in <thead> holding filter inputs.
 *   emptyState (optional)      — <tr> with Empty primitive inside.
 *   paginationMount (optional) — wrapping <div> for the Pagination compound.
 *
 * Values:
 *   sortColumn (String, default '') — current sorted column id.
 *   sortDir (String, default 'none') — 'none' | 'ascending' | 'descending'.
 *   selectedRows (Array, default []) — row IDs.
 *   visibleColumns (Array, default []) — column IDs (default = all from DOM).
 *   totalRows (Number, default 0) — drives Pagination footer.
 *   multiColumnSort (Boolean, default false) — OQ-37 opt-in.
 */
export default class DataTableController extends Controller {
  static targets = [
    'table',
    'bulkBar',
    'bulkCount',
    'selectAllCheckbox',
    'rowCheckbox',
    'columnVisibilityTrigger',
    'filterRow',
    'emptyState',
    'paginationMount',
  ];

  static values = {
    sortColumn: { type: String, default: '' },
    sortDir: { type: String, default: 'none' },
    selectedRows: { type: Array, default: [] },
    visibleColumns: { type: Array, default: [] },
    totalRows: { type: Number, default: 0 },
    multiColumnSort: { type: Boolean, default: false },
  };

  connect() {
    // Initialize visibleColumns from rendered <th> data-attrs if no SSR value.
    if (this.visibleColumnsValue.length === 0 && this.hasTableTarget) {
      const ids = Array.from(
        this.tableTarget.querySelectorAll('thead th[data-data-table-column]'),
      ).map((th) => th.dataset.dataTableColumn).filter(Boolean);
      // Set the value as a deduplicated array via Set — preserves the first
      // occurrence order so column reordering at the consumer side is honored.
      this.visibleColumnsValue = Array.from(new Set(ids));
    }
    this._recomputeSelectAllState();
    this._updateBulkBar();
  }

  // --- Sort ----------------------------------------------------------------

  /**
   * Wired via `data-action="click->data-table#toggleSort"` on the wrap.
   * Walks up from event.target to find the nearest [data-data-table-column]
   * button (sortable header). If not found, returns silently — clicks on
   * non-sortable columns or non-header elements are ignored.
   *
   * Behavior:
   *   - Same column re-clicked: ascending → descending → ascending (cycle).
   *   - Different column clicked: switches column, sets ascending.
   *   - Shift-click OR Cmd-click + multiColumnSortValue=true:
   *     event flag is set in detail.isMultiCol; visual stays single-col in
   *     S2.4b (multi-col priority indicators deferred to a future amend).
   */
  toggleSort(event) {
    if (!event || !event.target) return;
    const button = event.target.closest('[data-data-table-column]');
    if (!button) return;
    const column = button.dataset.dataTableColumn;
    if (!column) return;
    // Only sortable headers (the Twig template stamps data-sortable on the th).
    const th = button.closest('th');
    if (!th || th.getAttribute('data-sortable') !== 'true') return;

    const isMultiCol = Boolean(this.multiColumnSortValue && (event.shiftKey || event.metaKey));

    let newDir;
    if (this.sortColumnValue === column) {
      newDir = this.sortDirValue === 'ascending' ? 'descending' : 'ascending';
    } else {
      newDir = 'ascending';
    }

    this.sortColumnValue = column;
    this.sortDirValue = newDir;
    this._syncSortAria();
    this._dispatch('sort-change', {
      column,
      direction: newDir,
      isMultiCol,
    });
  }

  /**
   * Sync aria-sort on each sortable <th> + data-sort-dir on the inner
   * `.cremona-table__sort` button. Only the current sortColumn carries the
   * active direction; all others reset to 'none'.
   */
  _syncSortAria() {
    if (!this.hasTableTarget) return;
    const headers = this.tableTarget.querySelectorAll('thead th[data-sortable="true"]');
    headers.forEach((th) => {
      const col = th.dataset.dataTableColumn;
      const sortBtn = th.querySelector('.cremona-table__sort');
      if (col === this.sortColumnValue) {
        th.setAttribute('aria-sort', this.sortDirValue);
        if (sortBtn) sortBtn.setAttribute('data-sort-dir', this.sortDirValue);
      } else {
        th.setAttribute('aria-sort', 'none');
        if (sortBtn) sortBtn.setAttribute('data-sort-dir', 'none');
      }
    });
  }

  // --- Selection -----------------------------------------------------------

  /**
   * Wired via `data-action="change->data-table#toggleSelectAll"` on the
   * header checkbox. Toggles all CURRENT-PAGE rows. Union-with semantics:
   * if all current-page rows are already in selectedRowsValue, removes them;
   * otherwise adds the union (preserving any cross-page selections).
   */
  toggleSelectAll() {
    const pageIds = this._currentPageRowIds;
    if (pageIds.length === 0) return;
    const allHere = pageIds.every((id) => this.selectedRowsValue.includes(id));
    if (allHere) {
      this.selectedRowsValue = this.selectedRowsValue.filter((id) => !pageIds.includes(id));
    } else {
      const merged = new Set([...this.selectedRowsValue, ...pageIds]);
      this.selectedRowsValue = Array.from(merged);
    }
    this._syncRowCheckboxes();
    this._recomputeSelectAllState();
    this._updateBulkBar();
    this._dispatch('selection-change', {
      selectedRows: this.selectedRowsValue,
      count: this.selectedRowsValue.length,
    });
  }

  /**
   * Wired via `data-action="change->data-table#toggleRow"` on each row
   * checkbox. Reads data-data-table-row-id from event.target.
   */
  toggleRow(event) {
    if (!event || !event.target) return;
    const checkbox = event.target;
    // Guard: only respond to row checkboxes (not the select-all header or
    // a column-vis menu checkbox, which use different data attributes).
    const rowId = checkbox.dataset && checkbox.dataset.dataTableRowId;
    if (!rowId) return;
    // Reject the select-all checkbox (which carries data-data-table-target
    // but not data-data-table-row-id; the guard above handles it).

    if (checkbox.checked) {
      if (!this.selectedRowsValue.includes(rowId)) {
        this.selectedRowsValue = [...this.selectedRowsValue, rowId];
      }
    } else {
      this.selectedRowsValue = this.selectedRowsValue.filter((id) => id !== rowId);
    }
    this._syncRowAriaSelected(checkbox);
    this._recomputeSelectAllState();
    this._updateBulkBar();
    this._dispatch('selection-change', {
      selectedRows: this.selectedRowsValue,
      count: this.selectedRowsValue.length,
    });
  }

  /**
   * Public method — wired via `data-action="click->data-table#clearSelection"`
   * on the bulk-bar's "Désélectionner" button.
   */
  clearSelection() {
    if (this.selectedRowsValue.length === 0) return;
    this.selectedRowsValue = [];
    this._syncRowCheckboxes();
    this._recomputeSelectAllState();
    this._updateBulkBar();
    this._dispatch('selection-change', { selectedRows: [], count: 0 });
  }

  /**
   * Recompute the header select-all checkbox state based on the current-page
   * row IDs intersected with selectedRowsValue:
   *   - 0 selected here → checked=false, indeterminate=false
   *   - all selected here → checked=true, indeterminate=false
   *   - some selected here → checked=false, indeterminate=true (browser emits
   *     aria-checked="mixed" automatically — per S1.3 doctrine, NEVER stamp
   *     aria-checked manually).
   *
   * Also stamps data-indeterminate on the checkbox so a future reconnect
   * (HTMX morphdom swap, async re-render) doesn't resurrect a stale state
   * via the checkbox-indeterminate controller.
   */
  _recomputeSelectAllState() {
    if (!this.hasSelectAllCheckboxTarget) return;
    const cb = this.selectAllCheckboxTarget;
    const pageIds = this._currentPageRowIds;
    if (pageIds.length === 0) {
      cb.checked = false;
      cb.indeterminate = false;
      cb.dataset.indeterminate = 'false';
      return;
    }
    const selectedHere = pageIds.filter((id) => this.selectedRowsValue.includes(id));
    if (selectedHere.length === 0) {
      cb.checked = false;
      cb.indeterminate = false;
      cb.dataset.indeterminate = 'false';
    } else if (selectedHere.length === pageIds.length) {
      cb.checked = true;
      cb.indeterminate = false;
      cb.dataset.indeterminate = 'false';
    } else {
      cb.checked = false;
      cb.indeterminate = true;
      cb.dataset.indeterminate = 'true';
    }
  }

  /** Returns the row IDs for rows currently rendered in the <tbody>. */
  get _currentPageRowIds() {
    if (!this.hasRowCheckboxTarget) return [];
    return this.rowCheckboxTargets
      .map((cb) => cb.dataset.dataTableRowId)
      .filter(Boolean);
  }

  /** Syncs each row checkbox's `.checked` + the row's data-selected/aria-selected. */
  _syncRowCheckboxes() {
    if (!this.hasRowCheckboxTarget) return;
    this.rowCheckboxTargets.forEach((cb) => {
      const rowId = cb.dataset.dataTableRowId;
      if (!rowId) return;
      const selected = this.selectedRowsValue.includes(rowId);
      cb.checked = selected;
      this._syncRowAriaSelected(cb);
    });
  }

  /** Toggles data-selected + aria-selected on the row containing the checkbox. */
  _syncRowAriaSelected(checkbox) {
    const tr = checkbox.closest('tr');
    if (!tr) return;
    const rowId = checkbox.dataset.dataTableRowId;
    const selected = rowId ? this.selectedRowsValue.includes(rowId) : false;
    if (selected) {
      tr.dataset.selected = 'true';
      tr.setAttribute('aria-selected', 'true');
    } else {
      delete tr.dataset.selected;
      tr.removeAttribute('aria-selected');
    }
  }

  // --- Column visibility ---------------------------------------------------

  /**
   * Wired via `data-action="change->data-table#toggleColumnVisibility"` on
   * the column-vis menu's checkboxes (or directly if consumer wires elsewhere).
   * Reads data-data-table-column-vis from event.target.
   */
  toggleColumnVisibility(event) {
    if (!event || !event.target) return;
    const checkbox = event.target;
    const columnId = checkbox.dataset && checkbox.dataset.dataTableColumnVis;
    if (!columnId) return;
    if (checkbox.checked) {
      if (!this.visibleColumnsValue.includes(columnId)) {
        this.visibleColumnsValue = [...this.visibleColumnsValue, columnId];
      }
    } else {
      this.visibleColumnsValue = this.visibleColumnsValue.filter((id) => id !== columnId);
    }
    this._applyColumnVisibility();
    this._dispatch('column-visibility-change', {
      visibleColumns: this.visibleColumnsValue,
    });
  }

  /**
   * Apply `hidden` attribute on every [data-data-table-column-cell="<id>"]
   * element (both <th> AND each row's <td>) based on the current
   * visibleColumnsValue. Used both at controller init and after each toggle.
   */
  _applyColumnVisibility() {
    if (!this.hasTableTarget) return;
    const cells = this.tableTarget.querySelectorAll('[data-data-table-column-cell]');
    cells.forEach((el) => {
      const col = el.dataset.dataTableColumnCell;
      if (!col) return;
      const visible = this.visibleColumnsValue.includes(col);
      el.hidden = !visible;
    });
  }

  // --- Bulk actions --------------------------------------------------------

  /**
   * Update bulk-bar visibility + count text. The bar is hidden when
   * selectedRowsValue.length === 0. The count text uses Intl.PluralRules
   * via t() to resolve CLDR categories ('one' / 'other').
   */
  _updateBulkBar() {
    if (!this.hasBulkBarTarget) return;
    const count = this.selectedRowsValue.length;
    const hasSelection = count > 0;
    this.bulkBarTarget.hidden = !hasSelection;
    if (this.hasBulkCountTarget) {
      this.bulkCountTarget.textContent = hasSelection
        ? t('theme.data-table.selection.bar', { count })
        : '';
    }
  }

  /**
   * Wired via `data-action="click->data-table#bulkAction"` on the wrap.
   * Walks up from event.target to find the nearest [data-bulk-action-id]
   * button. Dispatches `data-table:bulk-action` with detail.{actionId,
   * selectedRows}. The consumer wires the destination (e.g. open
   * AlertDialog for destructive, route to export endpoint for export).
   */
  bulkAction(event) {
    if (!event || !event.target) return;
    const button = event.target.closest('[data-bulk-action-id]');
    if (!button) return;
    const actionId = button.dataset.bulkActionId;
    if (!actionId) return;
    this._dispatch('bulk-action', {
      actionId,
      selectedRows: [...this.selectedRowsValue],
    });
  }

  // --- Filter --------------------------------------------------------------

  /**
   * Wired via `data-action="input->data-table#filter"` on the wrap.
   * Catches input events from the per-column filter inputs (each carries
   * data-data-table-filter-column="<id>"). Dispatches `data-table:filter-change`
   * with the full filter state so the consumer can reapply all active
   * filters in one round-trip.
   *
   * The controller does NOT mutate row visibility for filters — that's
   * data-source concern (consumer-owned).
   */
  filter(event) {
    if (!event || !event.target) return;
    const input = event.target;
    const column = input.dataset && input.dataset.dataTableFilterColumn;
    if (!column) return;
    const query = typeof input.value === 'string' ? input.value : '';
    const allFilters = this._collectAllFilters();
    this._dispatch('filter-change', { column, query, allFilters });
  }

  /**
   * Read every filter input's current value into a flat Object keyed by
   * column id. Empty values are kept (empty string = "filter cleared for
   * this column") so the consumer sees the explicit clear and can update
   * URL params accordingly.
   */
  _collectAllFilters() {
    if (!this.hasTableTarget) return {};
    const out = {};
    const inputs = this.tableTarget.querySelectorAll('[data-data-table-filter-column]');
    inputs.forEach((input) => {
      const col = input.dataset.dataTableFilterColumn;
      if (col) out[col] = typeof input.value === 'string' ? input.value : '';
    });
    return out;
  }

  // --- Internal ------------------------------------------------------------

  _dispatch(name, detail) {
    this.element.dispatchEvent(
      new CustomEvent(`data-table:${name}`, {
        bubbles: true,
        composed: true,
        detail,
      }),
    );
  }
}
