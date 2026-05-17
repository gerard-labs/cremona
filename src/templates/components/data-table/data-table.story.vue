<!--
  DataTable story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6):
    1. Default — sortable + selectable + bulk-bar visible (2 selected) +
       column-visibility trigger + Pagination footer. Verifies the canonical
       happy path.
    2. Column visibility menu open — same data, demonstrating column-vis
       interaction.
    3. Per-column filter row — 3 columns with filterType='text';
       1 filter pre-filled to demonstrate filter-active state.
    4. Empty state — filtered no-results. Renders the Empty primitive inside
       <tr><td colspan="N"> with a "Effacer les filtres" CTA.
    5. Bulk destructive flow — bulk-bar with "12 éléments sélectionnés" +
       Exporter ghost + Supprimer destructive ; AlertDialog inline wired
       to the destructive action via consumer JS in onMounted.
    6. Events log — wired to ALL 5 emitted events (sort/selection/column-vis/
       bulk-action/filter).

  Helpers (nested template-literal avoidance):
    `S(key)`, `nextId(prefix)`, `nativeSelect(...)`, `pagination(...)`,
    `checkbox(...)`, `sortableHeader(...)`, `nonSortableHeader(...)`,
    `dataTable(...)`. Each takes a config object and returns an HTML string.

  Vanilla implementation. Single-col sort default (opt-in multi-col).
  Text Input filter default. AlertDialog for bulk-destructive; Sonner
  Toast-Undo deferred to a future phase.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import chevronDownSvg from '../../../assets/icons/chevron-down.svg?raw';
import settingsSvg from '../../../assets/icons/settings.svg?raw';
import downloadSvg from '../../../assets/icons/download.svg?raw';
import trash2Svg from '../../../assets/icons/trash-2.svg?raw';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot(document.documentElement);

  // Wire the destructive bulk-action → AlertDialog open in the destructive
  // demo section. Consumer pattern : on data-table:bulk-action with
  // actionId='delete', open the AlertDialog. The AlertDialog is co-mounted
  // adjacent to the DataTable via its own dialog controller.
  for (const wrap of document.querySelectorAll('[data-bulk-destructive-demo]')) {
    const dataTableId = wrap.getAttribute('data-bulk-destructive-demo');
    const dt = document.getElementById(dataTableId);
    const dialog = document.getElementById(`${dataTableId}-alert-dialog`);
    if (!dt || !dialog) continue;
    dt.addEventListener('data-table:bulk-action', (e) => {
      if (e.detail.actionId !== 'delete') return;
      // Update the AlertDialog title + body with the selection count.
      const titleEl = dialog.querySelector('[data-destructive-title]');
      const bodyEl = dialog.querySelector('[data-destructive-body]');
      const count = e.detail.selectedRows.length;
      if (titleEl) {
        titleEl.textContent = t('theme.data-table.bulk-destructive.title', { count });
      }
      if (bodyEl) {
        bodyEl.textContent = t('theme.data-table.bulk-destructive.body', { count });
      }
      // Open the dialog programmatically — find its controller and call open().
      const dlgWrap = dialog.closest('.cremona-dialog-wrap');
      if (!dlgWrap) return;
      const app = document.documentElement.__themeApp;
      const dialogCtrl = app && app.getControllerForElementAndIdentifier(dlgWrap, 'dialog');
      if (dialogCtrl) dialogCtrl.open();
    });
  }

  // Wire the events log demo.
  for (const log of document.querySelectorAll('[data-events-log]')) {
    const dataTableId = log.getAttribute('data-events-log');
    const dt = document.getElementById(dataTableId);
    if (!dt) continue;
    const out = log.querySelector('[data-events-out]');
    const events = [
      'data-table:sort-change',
      'data-table:selection-change',
      'data-table:column-visibility-change',
      'data-table:bulk-action',
      'data-table:filter-change',
    ];
    for (const evtName of events) {
      dt.addEventListener(evtName, (e) => {
        const line = document.createElement('div');
        const detailSummary = Object.entries(e.detail || {})
          .map(([k, v]) => `${k}=${Array.isArray(v) ? `[${v.length}]` : JSON.stringify(v)}`)
          .join(', ');
        line.textContent = `${evtName} → ${detailSummary}`;
        if (out) out.appendChild(line);
      });
    }
  }
});

let _dtCounter = 0;
function nextId(prefix = 'dt') { return `${prefix}-${++_dtCounter}`; }

function S(key) { return t('theme.data-table.story.' + key); }

function checkbox({ id, ariaLabel, checked = false, indeterminate = false, rowId = null, columnVis = null, sizeAttr = 'sm' }) {
  const dataset = [];
  if (rowId !== null) {
    dataset.push(`data-data-table-target="rowCheckbox"`);
    dataset.push(`data-data-table-row-id="${rowId}"`);
    // NOTE: no individual data-action here — the table wrapper already has
    // change->data-table#toggleRow via event delegation. Adding it here too
    // causes the action to fire twice (once on the element, once via bubbling
    // to the wrapper), which makes toggleSelectAll run twice and undo itself.
  } else if (columnVis !== null) {
    dataset.push(`data-data-table-column-vis="${columnVis}"`);
    // No individual data-action — handled by the wrapper's event delegation.
  } else {
    dataset.push(`data-data-table-target="selectAllCheckbox"`);
    // No individual data-action — handled by the wrapper's event delegation.
  }
  if (indeterminate) dataset.push(`data-indeterminate="true"`);
  return `<span class="cremona-checkbox-wrap" data-size="${sizeAttr}">
    <span class="cremona-checkbox" data-size="${sizeAttr}">
      <input
        type="checkbox"
        id="${id}"
        class="cremona-checkbox__input"
        ${dataset.join(' ')}
        aria-label="${ariaLabel}"${checked ? ' checked' : ''}>
      <span class="cremona-checkbox__box" aria-hidden="true">
        <svg class="cremona-checkbox__glyph cremona-checkbox__glyph--check" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 8 7 12 13 4"></polyline></svg>
        <svg class="cremona-checkbox__glyph cremona-checkbox__glyph--dash" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="8" x2="13" y2="8"></line></svg>
      </span>
    </span>
  </span>`;
}

function sortableHeader({ column, label, sortDir = 'none' }) {
  return `<th
    data-data-table-column="${column}"
    data-data-table-column-cell="${column}"
    data-sortable="true"
    aria-sort="${sortDir}"
  >
    <button type="button" class="cremona-table__sort"
      data-data-table-column="${column}"
      data-sort-dir="${sortDir}"
    >
      <span class="cremona-table__sort-label">${label}</span>
      <span class="cremona-table__sort-icon" aria-hidden="true"></span>
    </button>
  </th>`;
}

function plainHeader({ column, label, numeric = false }) {
  const dataAttrs = [];
  if (numeric) {
    dataAttrs.push('data-align="end"');
    dataAttrs.push('data-numeric="true"');
  }
  return `<th
    data-data-table-column="${column}"
    data-data-table-column-cell="${column}"
    ${dataAttrs.join(' ')}
  >${label}</th>`;
}

function filterHeader({ column, value = '', placeholder = '' }) {
  if (!column) return `<th></th>`;
  return `<th data-data-table-column-cell="${column}">
    <input type="text" class="cremona-input cremona-data-table__filter-input"
      data-size="sm"
      data-data-table-filter-column="${column}"
      data-action="input->data-table#filter"
      value="${value}"
      placeholder="${placeholder}"
      aria-label="${column}">
  </th>`;
}

function bodyRow({ rowId, cells, selected = false, selectable = true }) {
  const trAttrs = [`data-data-table-row-id="${rowId}"`];
  if (selected) {
    trAttrs.push('data-selected="true"');
    trAttrs.push('aria-selected="true"');
  }
  const selectCell = selectable
    ? `<td class="cremona-data-table__select-cell">${checkbox({
        id: `cb-${rowId}`,
        ariaLabel: `${S('aria.select-row')} ${rowId}`,
        checked: selected,
        rowId,
        sizeAttr: 'sm',
      })}</td>`
    : '';
  const cellsHtml = cells.map(({ column, content, numeric = false }) => {
    const dataAttrs = [];
    if (numeric) {
      dataAttrs.push('data-align="end"');
      dataAttrs.push('data-numeric="true"');
    }
    return `<td data-data-table-column-cell="${column}" ${dataAttrs.join(' ')}>${content}</td>`;
  }).join('');
  return `<tr ${trAttrs.join(' ')}>${selectCell}${cellsHtml}</tr>`;
}

function nativeSelect({ htmlId, value, options, size = 'sm' }) {
  const optsHtml = options.map((o) => {
    const sel = String(o.value) === String(value) ? ' selected' : '';
    return `<option value="${o.value}"${sel}>${o.label}</option>`;
  }).join('');
  return `<div class="cremona-native-select-wrap" data-size="${size}">
    <select class="cremona-native-select" data-size="${size}" id="${htmlId}">${optsHtml}</select>
    <span class="cremona-icon cremona-native-select__chevron" data-size="sm" aria-hidden="true">${chevronDownSvg}</span>
  </div>`;
}

function pagination({ id, page = 1, pageSize = 25, totalItems = 142, pageSizes = [10, 25, 50, 100] }) {
  const navId = id || nextId('dt-pg');
  const selectOptions = pageSizes.map((s) => ({ value: String(s), label: String(s) }));
  return `<nav
    id="${navId}"
    class="cremona-pagination"
    role="navigation"
    aria-label="${S('aria.pagination')}"
    data-controller="pagination"
    data-action="change->pagination#changePageSize"
    data-pagination-page-value="${page}"
    data-pagination-page-size-value="${pageSize}"
    data-pagination-total-items-value="${totalItems}"
  >
    <span class="cremona-pagination__range" data-pagination-target="rangeLabel" aria-live="polite" aria-atomic="true"></span>
    <span class="cremona-pagination__page-size">
      <label class="cremona-pagination__page-size-label" for="${navId}-size">${S('page-size-label')}</label>
      ${nativeSelect({ htmlId: `${navId}-size`, value: pageSize, options: selectOptions, size: 'sm' })}
    </span>
    <span class="cremona-pagination__nav" role="group">
      <button type="button" class="cremona-button cremona-pagination__btn" data-variant="ghost" data-size="sm" data-pagination-target="firstButton" data-action="click->pagination#first" aria-label="${S('aria.first')}"><span class="cremona-pagination__icon cremona-pagination__icon--first" aria-hidden="true"></span></button>
      <button type="button" class="cremona-button cremona-pagination__btn" data-variant="ghost" data-size="sm" data-pagination-target="prevButton" data-action="click->pagination#prev" aria-label="${S('aria.prev')}"><span class="cremona-pagination__icon cremona-pagination__icon--prev" aria-hidden="true"></span></button>
      <button type="button" class="cremona-button cremona-pagination__btn" data-variant="ghost" data-size="sm" data-pagination-target="nextButton" data-action="click->pagination#next" aria-label="${S('aria.next')}"><span class="cremona-pagination__icon cremona-pagination__icon--next" aria-hidden="true"></span></button>
      <button type="button" class="cremona-button cremona-pagination__btn" data-variant="ghost" data-size="sm" data-pagination-target="lastButton" data-action="click->pagination#last" aria-label="${S('aria.last')}"><span class="cremona-pagination__icon cremona-pagination__icon--last" aria-hidden="true"></span></button>
    </span>
  </nav>`;
}

function dataTable({
  id,
  columns,
  rows,
  selectedRows = [],
  visibleColumns = null,
  page = 1,
  pageSize = 25,
  totalRows = null,
  withPagination = true,
  withFilter = false,
  withColumnVis = true,
  withBulkBar = true,
  bulkActions = [],
  selectable = true,
  showEmpty = false,
  emptyTitle = null,
  emptyBody = null,
  emptyCta = null,
  controllerExtras = [],
}) {
  const dtId = id || nextId('dt');
  const visIds = visibleColumns !== null
    ? visibleColumns
    : columns.filter((c) => c.visible !== false).map((c) => c.id);
  const colspanTotal = visIds.length + (selectable ? 1 : 0);
  const totalForPagination = totalRows == null ? rows.length : totalRows;

  // ---- Toolbar ----
  let toolbarHtml = '';
  if (selectable || bulkActions.length > 0 || withColumnVis) {
    let bulkBarHtml = '';
    if (selectable || bulkActions.length > 0) {
      const bulkActionsHtml = bulkActions.map((a) => {
        const icon = a.iconLeading === 'download'
          ? downloadSvg
          : a.iconLeading === 'trash-2'
            ? trash2Svg
            : '';
        const variant = a.variant || (a.destructive ? 'destructive' : 'secondary');
        return `<button type="button" class="cremona-button" data-variant="${variant}" data-size="sm"
          data-bulk-action-id="${a.id}"
          data-action="click->data-table#bulkAction">
          ${icon ? `<span class="cremona-icon cremona-button__icon cremona-button__icon--leading" data-size="sm" aria-hidden="true">${icon}</span>` : ''}
          <span class="cremona-button__label">${a.label}</span>
        </button>`;
      }).join('');
      const hidden = withBulkBar ? '' : 'hidden';
      bulkBarHtml = `<div class="cremona-data-table__bulk-bar" data-data-table-target="bulkBar" ${hidden}>
        <span class="cremona-data-table__bulk-count" data-data-table-target="bulkCount" aria-live="polite" aria-atomic="true"></span>
        <div class="cremona-data-table__bulk-actions" role="group">
          <button type="button" class="cremona-button" data-variant="ghost" data-size="sm"
            data-action="click->data-table#clearSelection">${S('aria.deselect')}</button>
          ${bulkActionsHtml}
        </div>
      </div>`;
    }
    let colVisHtml = '';
    if (withColumnVis) {
      const togglableCols = columns.filter((c) => c.togglable !== false);
      const colVisItems = togglableCols.map((c) => {
        const checked = visIds.includes(c.id);
        return `<div class="cremona-item" role="menuitem">
          <label class="cremona-data-table__column-visibility-option">
            <input type="checkbox" class="cremona-checkbox__input"
              data-data-table-column-vis="${c.id}"
              data-action="change->data-table#toggleColumnVisibility"${checked ? ' checked' : ''}>
            <span>${c.label}</span>
          </label>
        </div>`;
      }).join('');
      colVisHtml = `<div class="cremona-data-table__column-visibility" data-data-table-target="columnVisibilityTrigger">
        <div class="cremona-popover cremona-dropdown-menu cremona-data-table__column-visibility-menu"
          data-controller="popover dropdown-menu"
          data-action="click->popover#toggle keydown.esc@window->popover#close keydown->dropdown-menu#keydown"
          data-popover-placement-value="bottom-end"
          data-popover-offset-value="4"
          data-popover-open-value="false">
          <button type="button" class="cremona-button" data-variant="secondary" data-size="sm"
            data-popover-target="trigger"
            aria-haspopup="menu" aria-expanded="false" aria-controls="${dtId}-col-vis"
            aria-label="${S('aria.column-visibility')}">
            <span class="cremona-icon cremona-button__icon cremona-button__icon--leading" data-size="sm" aria-hidden="true">${settingsSvg}</span>
            <span class="cremona-button__label">${S('column-visibility.label')}</span>
          </button>
          <div id="${dtId}-col-vis" class="cremona-popover__content cremona-dropdown-menu__content"
            data-popover-target="content" data-state="closed" hidden>
            ${colVisItems}
          </div>
        </div>
      </div>`;
    }
    toolbarHtml = `<div class="cremona-data-table__toolbar">${bulkBarHtml}${colVisHtml}</div>`;
  }

  // ---- Header rows ----
  const selectAllTh = selectable
    ? `<th class="cremona-data-table__select-all-cell">${checkbox({
        id: `${dtId}-select-all`,
        ariaLabel: S('aria.select-all'),
      })}</th>`
    : '';
  const headerColsHtml = columns.map((c) => {
    const hidden = !visIds.includes(c.id) ? ' hidden' : '';
    if (hidden) {
      // Render a hidden <th> stub so DOM order stays consistent.
      if (c.sortable) {
        return `<th hidden data-data-table-column="${c.id}" data-data-table-column-cell="${c.id}" data-sortable="true" aria-sort="${c.sortDir || 'none'}">${c.label}</th>`;
      }
      return `<th hidden data-data-table-column="${c.id}" data-data-table-column-cell="${c.id}">${c.label}</th>`;
    }
    if (c.sortable) {
      return sortableHeader({ column: c.id, label: c.label, sortDir: c.sortDir || 'none' });
    }
    return plainHeader({ column: c.id, label: c.label, numeric: c.numeric || false });
  }).join('');
  let filterRowHtml = '';
  if (withFilter) {
    const filterCols = columns.map((c) => {
      const filtType = c.filterType;
      const filtValue = c.filterValue || '';
      const filtPlaceholder = c.filterPlaceholder || S('filter.placeholder');
      const hidden = !visIds.includes(c.id) ? ' hidden' : '';
      if (filtType === 'text') {
        return `<th data-data-table-column-cell="${c.id}"${hidden}>
          <input type="text" class="cremona-input cremona-data-table__filter-input" data-size="sm"
            data-data-table-filter-column="${c.id}"
            data-action="input->data-table#filter"
            value="${filtValue}"
            placeholder="${filtPlaceholder}"
            aria-label="${c.label}">
        </th>`;
      }
      return `<th data-data-table-column-cell="${c.id}"${hidden}></th>`;
    }).join('');
    filterRowHtml = `<tr class="cremona-data-table__filter-row" data-data-table-target="filterRow">
      ${selectable ? '<th></th>' : ''}
      ${filterCols}
    </tr>`;
  }

  // ---- Body rows / empty ----
  let bodyRowsHtml = '';
  if (showEmpty || rows.length === 0) {
    const ctaHtml = emptyCta
      ? `<div class="cremona-data-table__empty-cta">
          <button type="button" class="cremona-button" data-variant="secondary" data-size="sm">${emptyCta}</button>
        </div>`
      : '';
    bodyRowsHtml = `<tr class="cremona-data-table__empty-row" data-data-table-target="emptyState">
      <td colspan="${colspanTotal}">
        <div class="cremona-empty" data-size="sm" role="region" aria-labelledby="${dtId}-empty-title">
          <div class="cremona-empty__illustration" aria-hidden="true">
            <span class="cremona-icon" data-size="lg" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
          </div>
          <div class="cremona-empty__content">
            <h3 id="${dtId}-empty-title" class="cremona-empty__title">${emptyTitle || S('empty.title')}</h3>
            <div class="cremona-empty__body">${emptyBody || S('empty.body')}</div>
            ${ctaHtml}
          </div>
        </div>
      </td>
    </tr>`;
  } else {
    bodyRowsHtml = rows.map((r) => {
      const cells = r.cells.map((cellContent, i) => {
        const col = columns[i];
        if (!col) return '';
        const hidden = !visIds.includes(col.id);
        if (hidden) {
          return `<td hidden data-data-table-column-cell="${col.id}"></td>`;
        }
        if (typeof cellContent === 'object') {
          return `<td data-data-table-column-cell="${col.id}"${cellContent.numeric ? ' data-align="end" data-numeric="true"' : ''}>${cellContent.content}</td>`;
        }
        const numeric = col.numeric || false;
        const numericAttrs = numeric ? ' data-align="end" data-numeric="true"' : '';
        return `<td data-data-table-column-cell="${col.id}"${numericAttrs}>${cellContent}</td>`;
      }).join('');
      const isSelected = selectedRows.includes(r.id);
      const selectCellHtml = selectable
        ? `<td class="cremona-data-table__select-cell">${checkbox({
            id: `${dtId}-cb-${r.id}`,
            ariaLabel: `${S('aria.select-row')} ${r.id}`,
            checked: isSelected,
            rowId: r.id,
            sizeAttr: 'sm',
          })}</td>`
        : '';
      const trAttrs = [`data-data-table-row-id="${r.id}"`];
      if (isSelected) {
        trAttrs.push('data-selected="true"');
        trAttrs.push('aria-selected="true"');
      }
      return `<tr ${trAttrs.join(' ')}>${selectCellHtml}${cells}</tr>`;
    }).join('');
  }

  // ---- Pagination ----
  const paginationHtml = (withPagination && totalForPagination > pageSize)
    ? `<div class="cremona-data-table__pagination-wrap" data-data-table-target="paginationMount">
        ${pagination({ id: `${dtId}-pg`, page, pageSize, totalItems: totalForPagination })}
      </div>`
    : '';

  // ---- Final assembly ----
  const controllerAttr = ['data-table', ...controllerExtras].join(' ');
  return `<div
    id="${dtId}"
    class="cremona-data-table"
    data-controller="${controllerAttr}"
    data-action="click->data-table#toggleSort change->data-table#toggleRow change->data-table#toggleSelectAll change->data-table#toggleColumnVisibility input->data-table#filter click->data-table#bulkAction click->data-table#clearSelection"
    data-data-table-sort-column-value=""
    data-data-table-sort-dir-value="none"
    data-data-table-selected-rows-value='${JSON.stringify(selectedRows)}'
    data-data-table-visible-columns-value='${JSON.stringify(visIds)}'
    data-data-table-total-rows-value="${totalForPagination}"
    data-data-table-multi-column-sort-value="false"
  >
    ${toolbarHtml}
    <table class="cremona-table cremona-data-table__table" data-data-table-target="table" data-size="md" data-variant="default">
      <caption class="cremona-table__caption sr-only">${S('caption.team')}</caption>
      <thead class="cremona-table__thead">
        <tr>${selectAllTh}${headerColsHtml}</tr>
        ${filterRowHtml}
      </thead>
      <tbody class="cremona-table__tbody">
        ${bodyRowsHtml}
      </tbody>
    </table>
    ${paginationHtml}
  </div>`;
}

function alertDialog({ id }) {
  return `<div id="${id}-alert-dialog-wrap" class="cremona-dialog-wrap cremona-alert-dialog-wrap"
    data-controller="dialog"
    data-dialog-open-value="false"
    data-dialog-close-on-escape-value="false"
    data-dialog-close-on-backdrop-click-value="false">
    <dialog id="${id}-alert-dialog" class="cremona-dialog cremona-alert-dialog"
      data-dialog-target="dialog"
      data-size="sm"
      data-tone="danger"
      aria-labelledby="${id}-alert-dialog-title">
      <header class="cremona-dialog__header cremona-alert-dialog__header">
        <span class="cremona-alert-dialog__icon-wrap" aria-hidden="true">
          <span class="cremona-icon" data-size="md" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </span>
        </span>
        <h2 id="${id}-alert-dialog-title" class="cremona-dialog__title cremona-alert-dialog__title" data-destructive-title>${t('theme.data-table.bulk-destructive.title', { count: 12 })}</h2>
      </header>
      <div class="cremona-dialog__body cremona-alert-dialog__body">
        <p data-destructive-body>${t('theme.data-table.bulk-destructive.body', { count: 12 })}</p>
      </div>
      <footer class="cremona-dialog__footer cremona-alert-dialog__footer">
        <button type="button" class="cremona-button" data-variant="secondary"
          data-action="click->dialog#close">${S('bulk-destructive.cancel')}</button>
        <button type="button" class="cremona-button" data-variant="destructive"
          data-action="click->dialog#close">${S('bulk-destructive.confirm')}</button>
      </footer>
    </dialog>
  </div>`;
}

// ----- Sample data ------------------------------------------------------
const SAMPLE_COLUMNS = [
  { id: 'name', label: S('column.name'), sortable: true },
  { id: 'email', label: S('column.email'), sortable: true },
  { id: 'role', label: S('column.role') },
  { id: 'score', label: S('column.score'), sortable: true, numeric: true },
  { id: 'status', label: S('column.status') },
];
const SAMPLE_ROWS = [
  { id: 'user-1', cells: ['Marie Curie', 'marie@example.fr', S('role.admin'), '142', S('status.active')] },
  { id: 'user-2', cells: ['Pierre Bayard', 'pierre@example.fr', S('role.editor'), '98', S('status.active')] },
  { id: 'user-3', cells: ['Lucie Marchand', 'lucie@example.fr', S('role.viewer'), '76', S('status.inactive')] },
  { id: 'user-4', cells: ['Hugo Tessier', 'hugo@example.fr', S('role.editor'), '54', S('status.active')] },
  { id: 'user-5', cells: ['Aïcha Belkacem', 'aicha@example.fr', S('role.admin'), '203', S('status.active')] },
  { id: 'user-6', cells: ['Olivier Quentin', 'olivier@example.fr', S('role.viewer'), '31', S('status.inactive')] },
];
const SAMPLE_BULK_ACTIONS = [
  { id: 'export', label: S('bulk.export'), variant: 'secondary', iconLeading: 'download' },
  { id: 'delete', label: S('bulk.delete'), variant: 'destructive', iconLeading: 'trash-2', destructive: true },
];

const bodyHtml = `
  <section class="dt-story" data-testid="data-table-root">
    <header class="dt-story__header">
      <h1>${S('title')}</h1>
      <p>${S('subtitle')}</p>
    </header>

    <section class="dt-story__section" aria-labelledby="dt-section-default">
      <h2 id="dt-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.default')}</h2>
      <p class="dt-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.default')}</p>
      ${dataTable({
        columns: SAMPLE_COLUMNS,
        rows: SAMPLE_ROWS,
        selectedRows: [],
        page: 1, pageSize: 25, totalRows: 42,
        bulkActions: SAMPLE_BULK_ACTIONS,
      })}
    </section>

    <section class="dt-story__section" aria-labelledby="dt-section-vis">
      <h2 id="dt-section-vis" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.column-visibility')}</h2>
      <p class="dt-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.column-visibility')}</p>
      ${dataTable({
        columns: SAMPLE_COLUMNS,
        rows: SAMPLE_ROWS,
        visibleColumns: ['name', 'email', 'status'],
        selectedRows: [],
        page: 1, pageSize: 25, totalRows: 42,
        bulkActions: SAMPLE_BULK_ACTIONS,
      })}
    </section>

    <section class="dt-story__section" aria-labelledby="dt-section-filter">
      <h2 id="dt-section-filter" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.filter')}</h2>
      <p class="dt-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.filter')}</p>
      ${dataTable({
        columns: [
          { id: 'name', label: S('column.name'), sortable: true, filterType: 'text', filterValue: 'Marie', filterPlaceholder: S('filter.placeholder-name') },
          { id: 'email', label: S('column.email'), sortable: true, filterType: 'text', filterPlaceholder: S('filter.placeholder-email') },
          { id: 'role', label: S('column.role'), filterType: 'text', filterPlaceholder: S('filter.placeholder-role') },
          { id: 'score', label: S('column.score'), sortable: true, numeric: true },
        ],
        rows: SAMPLE_ROWS.map((r) => ({ id: r.id, cells: r.cells.slice(0, 4) })),
        withFilter: true,
        selectable: false,
        bulkActions: [],
        withBulkBar: false,
        page: 1, pageSize: 25, totalRows: 42,
      })}
    </section>

    <section class="dt-story__section" aria-labelledby="dt-section-empty">
      <h2 id="dt-section-empty" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.empty')}</h2>
      <p class="dt-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.empty')}</p>
      ${dataTable({
        columns: SAMPLE_COLUMNS,
        rows: [],
        showEmpty: true,
        emptyTitle: S('empty.title'),
        emptyBody: S('empty.body'),
        emptyCta: S('empty.cta'),
        bulkActions: [],
        withBulkBar: false,
        withPagination: false,
      })}
    </section>

    <section class="dt-story__section" aria-labelledby="dt-section-bulk-destructive">
      <h2 id="dt-section-bulk-destructive" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.bulk-destructive')}</h2>
      <p class="dt-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.bulk-destructive')}</p>
      <div data-bulk-destructive-demo="dt-destructive-demo">
        ${dataTable({
          id: 'dt-destructive-demo',
          columns: SAMPLE_COLUMNS,
          rows: SAMPLE_ROWS,
          selectedRows: ['user-1', 'user-2', 'user-3'],
          page: 1, pageSize: 25, totalRows: 42,
          bulkActions: SAMPLE_BULK_ACTIONS,
        })}
      </div>
      ${alertDialog({ id: 'dt-destructive-demo' })}
    </section>

    <section class="dt-story__section" aria-labelledby="dt-section-events">
      <h2 id="dt-section-events" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.events')}</h2>
      <p class="dt-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.events')}</p>
      ${dataTable({
        id: 'dt-events-demo',
        columns: SAMPLE_COLUMNS.slice(0, 4),
        rows: SAMPLE_ROWS.slice(0, 4),
        page: 1, pageSize: 25, totalRows: 4,
        bulkActions: [{ id: 'export', label: S('bulk.export'), variant: 'secondary', iconLeading: 'download' }],
      })}
      <div class="dt-story__log" data-events-log="dt-events-demo">
        <div class="cremona-typography" data-variant="overline" data-color="tertiary">${S('events.log')}</div>
        <div data-events-out class="dt-story__log-out"></div>
      </div>
    </section>

    <section class="dt-story__section" aria-labelledby="dt-section-controller-extras">
      <h2 id="dt-section-controller-extras" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.controller-extras')}</h2>
      <p class="dt-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.controller-extras')}</p>
      ${dataTable({
        id: 'dt-controller-extras-demo',
        columns: SAMPLE_COLUMNS.slice(0, 4),
        rows: SAMPLE_ROWS.slice(0, 4),
        page: 1, pageSize: 25, totalRows: 4,
        controllerExtras: ['sortable'],
      })}
    </section>
  </section>
`;
</script>

<template>
  <Story title="Data Table" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="dt-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="dt-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.dt-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.dt-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.dt-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.dt-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.dt-story__explainer { max-inline-size: 70ch; }
.dt-story__log { display: grid; gap: var(--spacing-2); padding: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); font: var(--typography-code); font-size: var(--font-size-xs); }
.dt-story__log-out { display: grid; gap: var(--spacing-1); color: var(--color-text-secondary); min-block-size: var(--spacing-8); word-break: break-all; }
.dt-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
