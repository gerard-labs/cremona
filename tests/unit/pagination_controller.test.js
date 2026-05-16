import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';

const { default: PaginationController } = await import('../../src/js/controllers/pagination_controller.js');
const { setTranslations, setLocale, __reset } = await import('../../src/js/utils/i18n.js');

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the Pagination compound's `pagination` controller.
 *
 * Per OQ-35 (sealed S2.4 opening): inline page-size selector. Per WAI-ARIA
 * APG "Pagination": role="navigation" + aria-live on the range label.
 *
 * Per S1.4b descriptor-binding gotcha: tests call controller methods
 * directly (`ctrl.next()`, `ctrl.changePageSize({target: select})`).
 *
 * Responsibilities covered (14 tests):
 *   1. connect → initial range label rendered.
 *   2. connect → initial disabled state (page 1: first/prev disabled).
 *   3. next() → page increments + dispatches pagination:change.
 *   4. prev() → page decrements when above 1.
 *   5. prev() at page 1 → no-op (no dispatch).
 *   6. first() → page = 1.
 *   7. last() → page = totalPages.
 *   8. last() then next() → no-op (no dispatch).
 *   9. changePageSize → pageSize updated + page reset to 1 + dispatch.
 *  10. changePageSize with same value → no-op (no dispatch).
 *  11. totalItems = 0 → range "0-0 sur 0", all 4 buttons disabled.
 *  12. totalItems < pageSize → single page, all 4 buttons disabled.
 *  13. pagination:change detail carries page/pageSize/from/to/total/totalPages.
 *  14. goToPage() clamps out-of-range values.
 */
describe('PaginationController', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
    __reset();
    setTranslations('fr', {
      'theme.pagination.range.one': '{from}-{to} sur {total} élément',
      'theme.pagination.range.other': '{from}-{to} sur {total} éléments',
    });
    setLocale('fr');
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
  });

  async function mount({ page = 1, pageSize = 25, totalItems = 142 } = {}) {
    document.body.innerHTML = `
      <nav id="pg" class="theme-pagination"
        role="navigation" aria-label="Pagination"
        data-controller="pagination"
        data-action="change->pagination#changePageSize"
        data-pagination-page-value="${page}"
        data-pagination-page-size-value="${pageSize}"
        data-pagination-total-items-value="${totalItems}">
        <span class="theme-pagination__range" data-pagination-target="rangeLabel" aria-live="polite"></span>
        <select id="size-select">
          <option value="10">10</option>
          <option value="25"${pageSize === 25 ? ' selected' : ''}>25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <button id="first" data-pagination-target="firstButton" data-action="click->pagination#first">first</button>
        <button id="prev" data-pagination-target="prevButton" data-action="click->pagination#prev">prev</button>
        <button id="next" data-pagination-target="nextButton" data-action="click->pagination#next">next</button>
        <button id="last" data-pagination-target="lastButton" data-action="click->pagination#last">last</button>
      </nav>
    `;
    app = Application.start();
    app.register('pagination', PaginationController);
    await tick();
    await tick();
    return {
      nav: document.getElementById('pg'),
      range: document.querySelector('[data-pagination-target="rangeLabel"]'),
      sizeSelect: document.getElementById('size-select'),
      first: document.getElementById('first'),
      prev: document.getElementById('prev'),
      next: document.getElementById('next'),
      last: document.getElementById('last'),
      ctrl: app.controllers.find((c) => c.identifier === 'pagination'),
    };
  }

  it('connect — renders initial range label', async () => {
    const { range } = await mount({ page: 1, pageSize: 25, totalItems: 142 });
    expect(range.textContent).toBe('1-25 sur 142 éléments');
  });

  it('connect — page 1: first/prev disabled, next/last enabled', async () => {
    const { first, prev, next, last } = await mount({ page: 1, pageSize: 25, totalItems: 142 });
    expect(first.hasAttribute('disabled')).toBe(true);
    expect(prev.hasAttribute('disabled')).toBe(true);
    expect(next.hasAttribute('disabled')).toBe(false);
    expect(last.hasAttribute('disabled')).toBe(false);
  });

  it('next() — increments page, updates range, dispatches', async () => {
    const { nav, range, ctrl } = await mount({ page: 1, pageSize: 25, totalItems: 142 });
    const events = [];
    nav.addEventListener('pagination:change', (e) => events.push(e.detail));
    ctrl.next();
    await tick();
    expect(ctrl.pageValue).toBe(2);
    expect(range.textContent).toBe('26-50 sur 142 éléments');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ page: 2, pageSize: 25, from: 26, to: 50, total: 142, totalPages: 6 });
  });

  it('prev() — decrements when above 1', async () => {
    const { ctrl, range } = await mount({ page: 3, pageSize: 25, totalItems: 142 });
    ctrl.prev();
    await tick();
    expect(ctrl.pageValue).toBe(2);
    expect(range.textContent).toBe('26-50 sur 142 éléments');
  });

  it('prev() at page 1 → no-op, no dispatch', async () => {
    const { nav, ctrl } = await mount({ page: 1, pageSize: 25, totalItems: 142 });
    const events = [];
    nav.addEventListener('pagination:change', (e) => events.push(e.detail));
    ctrl.prev();
    await tick();
    expect(ctrl.pageValue).toBe(1);
    expect(events).toHaveLength(0);
  });

  it('first() — sets page to 1', async () => {
    const { ctrl } = await mount({ page: 5, pageSize: 25, totalItems: 142 });
    ctrl.first();
    await tick();
    expect(ctrl.pageValue).toBe(1);
  });

  it('last() — sets page to totalPages', async () => {
    const { ctrl, range } = await mount({ page: 1, pageSize: 25, totalItems: 142 });
    ctrl.last();
    await tick();
    expect(ctrl.pageValue).toBe(6); // ceil(142/25) = 6
    expect(range.textContent).toBe('126-142 sur 142 éléments');
  });

  it('last() then next() → no-op (already at last)', async () => {
    const { nav, ctrl } = await mount({ page: 1, pageSize: 25, totalItems: 142 });
    ctrl.last();
    await tick();
    const events = [];
    nav.addEventListener('pagination:change', (e) => events.push(e.detail));
    ctrl.next();
    await tick();
    expect(ctrl.pageValue).toBe(6);
    expect(events).toHaveLength(0);
  });

  it('changePageSize — updates pageSize, resets page to 1, dispatches', async () => {
    const { nav, ctrl, sizeSelect, range } = await mount({ page: 3, pageSize: 25, totalItems: 142 });
    const events = [];
    nav.addEventListener('pagination:change', (e) => events.push(e.detail));
    sizeSelect.value = '50';
    ctrl.changePageSize({ target: sizeSelect });
    await tick();
    expect(ctrl.pageSizeValue).toBe(50);
    expect(ctrl.pageValue).toBe(1);
    expect(range.textContent).toBe('1-50 sur 142 éléments');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ page: 1, pageSize: 50, totalPages: 3 });
  });

  it('changePageSize with same value → no-op, no dispatch', async () => {
    const { nav, ctrl, sizeSelect } = await mount({ page: 1, pageSize: 25, totalItems: 142 });
    const events = [];
    nav.addEventListener('pagination:change', (e) => events.push(e.detail));
    sizeSelect.value = '25';
    ctrl.changePageSize({ target: sizeSelect });
    await tick();
    expect(ctrl.pageSizeValue).toBe(25);
    expect(events).toHaveLength(0);
  });

  it('totalItems = 0 — range "0-0 sur 0", all buttons disabled', async () => {
    // CLDR FR: count=0 selects "one" (singular). Different from EN where 0→"other".
    // The kit ships FR plural rules; tests assert FR linguistic correctness.
    const { first, prev, next, last, range } = await mount({ page: 1, pageSize: 25, totalItems: 0 });
    expect(range.textContent).toBe('0-0 sur 0 élément');
    expect(first.hasAttribute('disabled')).toBe(true);
    expect(prev.hasAttribute('disabled')).toBe(true);
    expect(next.hasAttribute('disabled')).toBe(true);
    expect(last.hasAttribute('disabled')).toBe(true);
  });

  it('totalItems < pageSize — single page, all nav disabled', async () => {
    const { first, prev, next, last, range, ctrl } = await mount({ page: 1, pageSize: 25, totalItems: 8 });
    expect(range.textContent).toBe('1-8 sur 8 éléments');
    expect(ctrl.totalPages).toBe(1);
    expect(first.hasAttribute('disabled')).toBe(true);
    expect(prev.hasAttribute('disabled')).toBe(true);
    expect(next.hasAttribute('disabled')).toBe(true);
    expect(last.hasAttribute('disabled')).toBe(true);
  });

  it('pagination:change detail carries page/pageSize/from/to/total/totalPages', async () => {
    const { nav, ctrl } = await mount({ page: 2, pageSize: 10, totalItems: 87 });
    const events = [];
    nav.addEventListener('pagination:change', (e) => events.push(e.detail));
    ctrl.next();
    await tick();
    expect(events[0]).toEqual({
      page: 3,
      pageSize: 10,
      from: 21,
      to: 30,
      total: 87,
      totalPages: 9, // ceil(87/10) = 9
    });
  });

  it('goToPage() clamps out-of-range values', async () => {
    const { ctrl } = await mount({ page: 1, pageSize: 25, totalItems: 142 });
    ctrl.goToPage(99);
    await tick();
    expect(ctrl.pageValue).toBe(6); // clamped to totalPages
    ctrl.goToPage(-5);
    await tick();
    expect(ctrl.pageValue).toBe(1); // clamped to 1
  });
});
