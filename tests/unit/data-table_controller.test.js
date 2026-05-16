import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';

const { default: DataTableController } = await import('../../src/js/controllers/data-table_controller.js');
const { setTranslations, setLocale, __reset } = await import('../../src/js/utils/i18n.js');

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the DataTable compound's `data-table` controller.
 *
 * Per S1.4b descriptor-binding gotcha + Pagination/Combobox/Resizable
 * doctrine: tests call controller methods directly (`ctrl.toggleSort({...})`,
 * `ctrl.toggleRow({target: rowCheckbox})`) rather than synthesising events
 * through Stimulus's action descriptors.
 *
 * Responsibilities covered (30 tests):
 *
 * Sort (OQ-37 single-col default + opt-in multi-col):
 *   1. connect → no initial sort, aria-sort=none on all sortable headers.
 *   2. toggleSort on a sortable column → ascending + aria-sort+data-sort-dir sync.
 *   3. toggleSort re-clicked → descending.
 *   4. toggleSort re-re-clicked → back to ascending.
 *   5. toggleSort on a different column → switches column, previous resets to 'none'.
 *   6. toggleSort on a non-sortable column → no-op.
 *   7. toggleSort with shiftKey + multiColumnSort=true → detail.isMultiCol=true.
 *   8. toggleSort with shiftKey + multiColumnSort=false → detail.isMultiCol=false.
 *
 * Selection (per-row + select-all + indeterminate):
 *   9. toggleRow check → row added to selectedRows + data-selected on <tr>.
 *  10. toggleRow uncheck → row removed.
 *  11. toggleRow on already-selected → no duplicate (idempotent).
 *  12. toggleSelectAll on empty selection → all rows selected.
 *  13. toggleSelectAll on all-selected → all rows deselected.
 *  14. clearSelection → selectedRows = [], all checkboxes unchecked.
 *  15. _recomputeSelectAllState empty → header checkbox unchecked + non-indeterminate.
 *  16. _recomputeSelectAllState all → header checked + non-indeterminate.
 *  17. _recomputeSelectAllState partial → header unchecked + indeterminate=true.
 *  18. data-table:selection-change dispatched with detail.{selectedRows, count}.
 *
 * Bulk-bar:
 *  19. bulkBar.hidden initially true (no selection).
 *  20. selection grows → bulkBar visible + count text set via Intl.PluralRules.
 *  21. selection clears → bulkBar hidden, count empty.
 *  22. bulkAction(actionId='delete') → data-table:bulk-action with detail.{actionId, selectedRows snapshot}.
 *
 * Column visibility:
 *  23. connect → visibleColumns initialized from rendered <th> data-attrs.
 *  24. toggleColumnVisibility uncheck → column id removed + <th> + <td> hidden.
 *  25. toggleColumnVisibility re-check → column id added + cells visible.
 *  26. data-table:column-visibility-change dispatched with detail.visibleColumns.
 *
 * Filter (OQ-38):
 *  27. filter input → data-table:filter-change with detail.{column, query, allFilters}.
 *  28. filter with multiple active inputs → allFilters reflects all values.
 *
 * Event invariants:
 *  29. All 5 emitted events bubble + are composed.
 *  30. multiColumnSort=true + Cmd-click (metaKey) → detail.isMultiCol=true.
 */
describe('DataTableController', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
    __reset();
    setTranslations('fr', {
      'theme.data-table.selection.bar.one': '{count} élément sélectionné',
      'theme.data-table.selection.bar.other': '{count} éléments sélectionnés',
    });
    setLocale('fr');
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
  });

  async function mount({
    selectedRows = [],
    visibleColumns = null,
    multiColumnSort = false,
    totalRows = 4,
    withFilter = true,
    withSelectable = true,
  } = {}) {
    const visAttr = visibleColumns != null
      ? `data-data-table-visible-columns-value='${JSON.stringify(visibleColumns)}'`
      : '';
    const selAttr = `data-data-table-selected-rows-value='${JSON.stringify(selectedRows)}'`;
    const selectAllTh = withSelectable
      ? `<th class="theme-data-table__select-all-cell">
          <input type="checkbox" id="select-all"
                 data-data-table-target="selectAllCheckbox"
                 data-action="change->data-table#toggleSelectAll"
                 aria-label="Tout sélectionner">
        </th>`
      : '';
    const filterRow = withFilter
      ? `<tr class="theme-data-table__filter-row" data-data-table-target="filterRow">
          ${withSelectable ? '<th></th>' : ''}
          <th data-data-table-column-cell="name">
            <input type="text" id="filter-name"
                   data-data-table-filter-column="name"
                   data-action="input->data-table#filter">
          </th>
          <th data-data-table-column-cell="email">
            <input type="text" id="filter-email"
                   data-data-table-filter-column="email"
                   data-action="input->data-table#filter">
          </th>
          <th data-data-table-column-cell="score"></th>
        </tr>`
      : '';

    document.body.innerHTML = `
      <div id="dt" class="theme-data-table"
        data-controller="data-table"
        data-action="click->data-table#toggleSort change->data-table#toggleRow change->data-table#toggleSelectAll change->data-table#toggleColumnVisibility input->data-table#filter click->data-table#bulkAction click->data-table#clearSelection"
        ${selAttr}
        ${visAttr}
        data-data-table-total-rows-value="${totalRows}"
        data-data-table-multi-column-sort-value="${multiColumnSort ? 'true' : 'false'}">

        <div class="theme-data-table__toolbar">
          <div id="bulk-bar" class="theme-data-table__bulk-bar"
               data-data-table-target="bulkBar" hidden>
            <span id="bulk-count" class="theme-data-table__bulk-count"
                  data-data-table-target="bulkCount"
                  aria-live="polite" aria-atomic="true"></span>
            <button id="clear-btn" type="button" data-action="click->data-table#clearSelection">Désélectionner</button>
            <button id="bulk-export" type="button"
                    data-bulk-action-id="export"
                    data-action="click->data-table#bulkAction">Exporter</button>
            <button id="bulk-delete" type="button"
                    data-bulk-action-id="delete"
                    data-action="click->data-table#bulkAction">Supprimer</button>
          </div>
          <div id="col-vis-wrap">
            <label><input id="vis-name" type="checkbox" checked
                          data-data-table-column-vis="name"
                          data-action="change->data-table#toggleColumnVisibility"> Nom</label>
            <label><input id="vis-email" type="checkbox" checked
                          data-data-table-column-vis="email"
                          data-action="change->data-table#toggleColumnVisibility"> Email</label>
            <label><input id="vis-score" type="checkbox" checked
                          data-data-table-column-vis="score"
                          data-action="change->data-table#toggleColumnVisibility"> Score</label>
          </div>
        </div>

        <table id="tbl" class="theme-table theme-data-table__table"
               data-data-table-target="table">
          <thead>
            <tr>
              ${selectAllTh}
              <th data-data-table-column="name" data-data-table-column-cell="name"
                  data-sortable="true" aria-sort="none">
                <button type="button" class="theme-table__sort"
                        data-data-table-column="name"
                        data-sort-dir="none">Nom</button>
              </th>
              <th data-data-table-column="email" data-data-table-column-cell="email"
                  data-sortable="true" aria-sort="none">
                <button type="button" class="theme-table__sort"
                        data-data-table-column="email"
                        data-sort-dir="none">Email</button>
              </th>
              <th data-data-table-column="score" data-data-table-column-cell="score"
                  data-sortable="false">Score</th>
            </tr>
            ${filterRow}
          </thead>
          <tbody>
            ${['user-1', 'user-2', 'user-3', 'user-4'].map((id) => `
              <tr data-data-table-row-id="${id}">
                ${withSelectable ? `<td class="theme-data-table__select-cell">
                  <input type="checkbox" id="cb-${id}"
                         data-data-table-target="rowCheckbox"
                         data-data-table-row-id="${id}"
                         data-action="change->data-table#toggleRow"
                         aria-label="Sélectionner ${id}">
                </td>` : ''}
                <td data-data-table-column-cell="name">${id}</td>
                <td data-data-table-column-cell="email">${id}@example.fr</td>
                <td data-data-table-column-cell="score">${id === 'user-1' ? '142' : '90'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    app = Application.start();
    app.register('data-table', DataTableController);
    await tick();
    await tick();
    return {
      wrap: document.getElementById('dt'),
      table: document.getElementById('tbl'),
      bulkBar: document.getElementById('bulk-bar'),
      bulkCount: document.getElementById('bulk-count'),
      selectAll: document.getElementById('select-all'),
      cb: (id) => document.getElementById(`cb-${id}`),
      tr: (id) => document.querySelector(`tr[data-data-table-row-id="${id}"]`),
      thName: document.querySelector('th[data-data-table-column="name"]'),
      thEmail: document.querySelector('th[data-data-table-column="email"]'),
      thScore: document.querySelector('th[data-data-table-column="score"]'),
      sortBtnName: document.querySelector('button.theme-table__sort[data-data-table-column="name"]'),
      sortBtnEmail: document.querySelector('button.theme-table__sort[data-data-table-column="email"]'),
      filterName: document.getElementById('filter-name'),
      filterEmail: document.getElementById('filter-email'),
      visName: document.getElementById('vis-name'),
      visEmail: document.getElementById('vis-email'),
      visScore: document.getElementById('vis-score'),
      bulkExport: document.getElementById('bulk-export'),
      bulkDelete: document.getElementById('bulk-delete'),
      ctrl: app.controllers.find((c) => c.identifier === 'data-table'),
    };
  }

  // --- Sort -------------------------------------------------------

  it('connect — no initial sort, aria-sort=none on all sortable headers', async () => {
    const { thName, thEmail } = await mount();
    expect(thName.getAttribute('aria-sort')).toBe('none');
    expect(thEmail.getAttribute('aria-sort')).toBe('none');
  });

  it('toggleSort on a sortable column → ascending + aria-sort+data-sort-dir sync', async () => {
    const { ctrl, thName, sortBtnName } = await mount();
    ctrl.toggleSort({ target: sortBtnName });
    expect(thName.getAttribute('aria-sort')).toBe('ascending');
    expect(sortBtnName.getAttribute('data-sort-dir')).toBe('ascending');
    expect(ctrl.sortColumnValue).toBe('name');
    expect(ctrl.sortDirValue).toBe('ascending');
  });

  it('toggleSort re-clicked on the same column → descending', async () => {
    const { ctrl, thName, sortBtnName } = await mount();
    ctrl.toggleSort({ target: sortBtnName });
    ctrl.toggleSort({ target: sortBtnName });
    expect(thName.getAttribute('aria-sort')).toBe('descending');
    expect(ctrl.sortDirValue).toBe('descending');
  });

  it('toggleSort re-re-clicked → back to ascending', async () => {
    const { ctrl, thName, sortBtnName } = await mount();
    ctrl.toggleSort({ target: sortBtnName });
    ctrl.toggleSort({ target: sortBtnName });
    ctrl.toggleSort({ target: sortBtnName });
    expect(thName.getAttribute('aria-sort')).toBe('ascending');
    expect(ctrl.sortDirValue).toBe('ascending');
  });

  it('toggleSort on a different column → switches, previous resets to none', async () => {
    const { ctrl, thName, thEmail, sortBtnName, sortBtnEmail } = await mount();
    ctrl.toggleSort({ target: sortBtnName });
    expect(thName.getAttribute('aria-sort')).toBe('ascending');
    ctrl.toggleSort({ target: sortBtnEmail });
    expect(thName.getAttribute('aria-sort')).toBe('none');
    expect(thEmail.getAttribute('aria-sort')).toBe('ascending');
    expect(ctrl.sortColumnValue).toBe('email');
  });

  it('toggleSort on a non-sortable column → no-op', async () => {
    const { ctrl, thScore } = await mount();
    // Score th has data-sortable="false" — but it has no .theme-table__sort
    // button child, so we pass the th itself which doesn't carry the column
    // data attr on the button-closest path.
    ctrl.toggleSort({ target: thScore });
    expect(ctrl.sortColumnValue).toBe('');
    expect(ctrl.sortDirValue).toBe('none');
  });

  it('toggleSort with shiftKey + multiColumnSort=true → detail.isMultiCol=true', async () => {
    const { wrap, ctrl, sortBtnName } = await mount({ multiColumnSort: true });
    let captured = null;
    wrap.addEventListener('data-table:sort-change', (e) => {
      captured = e.detail;
    });
    ctrl.toggleSort({ target: sortBtnName, shiftKey: true });
    expect(captured).not.toBeNull();
    expect(captured.isMultiCol).toBe(true);
    expect(captured.column).toBe('name');
    expect(captured.direction).toBe('ascending');
  });

  it('toggleSort with shiftKey but multiColumnSort=false → detail.isMultiCol=false', async () => {
    const { wrap, ctrl, sortBtnName } = await mount({ multiColumnSort: false });
    let captured = null;
    wrap.addEventListener('data-table:sort-change', (e) => {
      captured = e.detail;
    });
    ctrl.toggleSort({ target: sortBtnName, shiftKey: true });
    expect(captured.isMultiCol).toBe(false);
  });

  // --- Selection --------------------------------------------------

  it('toggleRow check → row added to selectedRows + data-selected on <tr>', async () => {
    const { ctrl, cb, tr } = await mount();
    const box = cb('user-1');
    box.checked = true;
    ctrl.toggleRow({ target: box });
    expect(ctrl.selectedRowsValue).toEqual(['user-1']);
    expect(tr('user-1').dataset.selected).toBe('true');
    expect(tr('user-1').getAttribute('aria-selected')).toBe('true');
  });

  it('toggleRow uncheck → row removed', async () => {
    const { ctrl, cb, tr } = await mount({ selectedRows: ['user-1'] });
    const box = cb('user-1');
    box.checked = false;
    ctrl.toggleRow({ target: box });
    expect(ctrl.selectedRowsValue).toEqual([]);
    expect(tr('user-1').dataset.selected).toBeUndefined();
    expect(tr('user-1').hasAttribute('aria-selected')).toBe(false);
  });

  it('toggleRow on already-selected → no duplicate (idempotent)', async () => {
    const { ctrl, cb } = await mount({ selectedRows: ['user-1'] });
    const box = cb('user-1');
    box.checked = true;
    ctrl.toggleRow({ target: box });
    expect(ctrl.selectedRowsValue).toEqual(['user-1']);
  });

  it('toggleSelectAll on empty selection → all rows selected', async () => {
    const { ctrl } = await mount();
    ctrl.toggleSelectAll();
    expect(ctrl.selectedRowsValue).toEqual(['user-1', 'user-2', 'user-3', 'user-4']);
  });

  it('toggleSelectAll on all-selected → all rows deselected', async () => {
    const { ctrl } = await mount({
      selectedRows: ['user-1', 'user-2', 'user-3', 'user-4'],
    });
    ctrl.toggleSelectAll();
    expect(ctrl.selectedRowsValue).toEqual([]);
  });

  it('clearSelection → selectedRows = [], all checkboxes unchecked', async () => {
    const { ctrl, cb } = await mount({
      selectedRows: ['user-1', 'user-2'],
    });
    ctrl.clearSelection();
    expect(ctrl.selectedRowsValue).toEqual([]);
    expect(cb('user-1').checked).toBe(false);
    expect(cb('user-2').checked).toBe(false);
  });

  it('_recomputeSelectAllState empty → header unchecked + non-indeterminate', async () => {
    const { ctrl, selectAll } = await mount();
    expect(selectAll.checked).toBe(false);
    expect(selectAll.indeterminate).toBe(false);
    expect(selectAll.dataset.indeterminate).toBe('false');
    void ctrl;
  });

  it('_recomputeSelectAllState all → header checked + non-indeterminate', async () => {
    const { selectAll } = await mount({
      selectedRows: ['user-1', 'user-2', 'user-3', 'user-4'],
    });
    expect(selectAll.checked).toBe(true);
    expect(selectAll.indeterminate).toBe(false);
    expect(selectAll.dataset.indeterminate).toBe('false');
  });

  it('_recomputeSelectAllState partial → header unchecked + indeterminate=true', async () => {
    const { selectAll } = await mount({
      selectedRows: ['user-1', 'user-2'],
    });
    expect(selectAll.checked).toBe(false);
    expect(selectAll.indeterminate).toBe(true);
    expect(selectAll.dataset.indeterminate).toBe('true');
  });

  it('data-table:selection-change dispatched with detail.{selectedRows, count}', async () => {
    const { wrap, ctrl, cb } = await mount();
    let captured = null;
    wrap.addEventListener('data-table:selection-change', (e) => {
      captured = e.detail;
    });
    const box = cb('user-3');
    box.checked = true;
    ctrl.toggleRow({ target: box });
    expect(captured).not.toBeNull();
    expect(captured.selectedRows).toEqual(['user-3']);
    expect(captured.count).toBe(1);
  });

  // --- Bulk-bar ---------------------------------------------------

  it('bulkBar.hidden initially true (no selection)', async () => {
    const { bulkBar } = await mount();
    expect(bulkBar.hidden).toBe(true);
  });

  it('selection grows → bulkBar visible + count text set via Intl.PluralRules', async () => {
    const { ctrl, bulkBar, bulkCount, cb } = await mount();
    const box = cb('user-1');
    box.checked = true;
    ctrl.toggleRow({ target: box });
    expect(bulkBar.hidden).toBe(false);
    // CLDR FR: count=1 → 'one' → "1 élément sélectionné"
    expect(bulkCount.textContent).toBe('1 élément sélectionné');
    // Add another → 'other' resolves
    const box2 = cb('user-2');
    box2.checked = true;
    ctrl.toggleRow({ target: box2 });
    expect(bulkCount.textContent).toBe('2 éléments sélectionnés');
  });

  it('selection clears → bulkBar hidden, count empty', async () => {
    const { ctrl, bulkBar, bulkCount } = await mount({
      selectedRows: ['user-1', 'user-2'],
    });
    expect(bulkBar.hidden).toBe(false);
    ctrl.clearSelection();
    expect(bulkBar.hidden).toBe(true);
    expect(bulkCount.textContent).toBe('');
  });

  it('bulkAction(actionId=delete) → data-table:bulk-action with detail snapshot', async () => {
    const { wrap, ctrl, bulkDelete } = await mount({
      selectedRows: ['user-1', 'user-2'],
    });
    let captured = null;
    wrap.addEventListener('data-table:bulk-action', (e) => {
      captured = e.detail;
    });
    ctrl.bulkAction({ target: bulkDelete });
    expect(captured).not.toBeNull();
    expect(captured.actionId).toBe('delete');
    expect(captured.selectedRows).toEqual(['user-1', 'user-2']);
    // Ensure it's a snapshot (mutating after dispatch shouldn't affect captured)
    ctrl.clearSelection();
    expect(captured.selectedRows).toEqual(['user-1', 'user-2']);
  });

  // --- Column visibility ------------------------------------------

  it('connect — visibleColumns initialized from rendered <th> data-attrs', async () => {
    const { ctrl } = await mount();
    expect(ctrl.visibleColumnsValue).toEqual(['name', 'email', 'score']);
  });

  it('toggleColumnVisibility uncheck → column removed + cells hidden', async () => {
    const { ctrl, table, visEmail } = await mount();
    visEmail.checked = false;
    ctrl.toggleColumnVisibility({ target: visEmail });
    expect(ctrl.visibleColumnsValue).toEqual(['name', 'score']);
    const cells = table.querySelectorAll('[data-data-table-column-cell="email"]');
    cells.forEach((c) => expect(c.hidden).toBe(true));
    // Other columns stay visible
    const nameCells = table.querySelectorAll('[data-data-table-column-cell="name"]');
    nameCells.forEach((c) => expect(c.hidden).toBe(false));
  });

  it('toggleColumnVisibility re-check → column re-added + cells visible', async () => {
    const { ctrl, table, visEmail } = await mount();
    visEmail.checked = false;
    ctrl.toggleColumnVisibility({ target: visEmail });
    visEmail.checked = true;
    ctrl.toggleColumnVisibility({ target: visEmail });
    expect(ctrl.visibleColumnsValue).toContain('email');
    const cells = table.querySelectorAll('[data-data-table-column-cell="email"]');
    cells.forEach((c) => expect(c.hidden).toBe(false));
  });

  it('data-table:column-visibility-change dispatched with detail.visibleColumns', async () => {
    const { wrap, ctrl, visScore } = await mount();
    let captured = null;
    wrap.addEventListener('data-table:column-visibility-change', (e) => {
      captured = e.detail;
    });
    visScore.checked = false;
    ctrl.toggleColumnVisibility({ target: visScore });
    expect(captured).not.toBeNull();
    expect(captured.visibleColumns).toEqual(['name', 'email']);
  });

  // --- Filter (OQ-38) ---------------------------------------------

  it('filter input → data-table:filter-change with detail.{column, query, allFilters}', async () => {
    const { wrap, ctrl, filterName } = await mount();
    let captured = null;
    wrap.addEventListener('data-table:filter-change', (e) => {
      captured = e.detail;
    });
    filterName.value = 'mar';
    ctrl.filter({ target: filterName });
    expect(captured).not.toBeNull();
    expect(captured.column).toBe('name');
    expect(captured.query).toBe('mar');
    expect(captured.allFilters).toEqual({ name: 'mar', email: '' });
  });

  it('filter with multiple active inputs → allFilters reflects all values', async () => {
    const { wrap, ctrl, filterName, filterEmail } = await mount();
    let captured = null;
    wrap.addEventListener('data-table:filter-change', (e) => {
      captured = e.detail;
    });
    filterName.value = 'mar';
    filterEmail.value = '@example.fr';
    ctrl.filter({ target: filterEmail });
    expect(captured.allFilters).toEqual({
      name: 'mar',
      email: '@example.fr',
    });
  });

  // --- Event invariants -------------------------------------------

  it('all 5 emitted events bubble + are composed', async () => {
    const { wrap, ctrl, cb, sortBtnName, visEmail, bulkExport, filterName } = await mount();
    const captured = {};
    [
      'data-table:sort-change',
      'data-table:selection-change',
      'data-table:column-visibility-change',
      'data-table:bulk-action',
      'data-table:filter-change',
    ].forEach((name) => {
      wrap.addEventListener(name, (e) => {
        captured[name] = { bubbles: e.bubbles, composed: e.composed };
      });
    });

    ctrl.toggleSort({ target: sortBtnName });
    const box = cb('user-1');
    box.checked = true;
    ctrl.toggleRow({ target: box });
    visEmail.checked = false;
    ctrl.toggleColumnVisibility({ target: visEmail });
    ctrl.bulkAction({ target: bulkExport });
    filterName.value = 'a';
    ctrl.filter({ target: filterName });

    Object.values(captured).forEach((evt) => {
      expect(evt.bubbles).toBe(true);
      expect(evt.composed).toBe(true);
    });
    expect(Object.keys(captured)).toHaveLength(5);
  });

  it('multiColumnSort=true + Cmd-click (metaKey) → detail.isMultiCol=true', async () => {
    const { wrap, ctrl, sortBtnName } = await mount({ multiColumnSort: true });
    let captured = null;
    wrap.addEventListener('data-table:sort-change', (e) => {
      captured = e.detail;
    });
    ctrl.toggleSort({ target: sortBtnName, metaKey: true });
    expect(captured.isMultiCol).toBe(true);
  });
});
