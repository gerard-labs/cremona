import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

const { mockSortable, mockSortableInstance, mockSortableOptions } = vi.hoisted(() => {
  const destroy = vi.fn();
  const instance = { destroy };
  const captured = { options: null };
  const ctor = vi.fn(function MockSortable(el, options) {
    Object.assign(this, instance);
    captured.options = options;
    return this;
  });
  return { mockSortable: ctor, mockSortableInstance: instance, mockSortableOptions: captured };
});

vi.mock('sortablejs', () => ({ default: mockSortable }));

const SortableImport = await import('../../src/js/controllers/sortable_controller.js');
const SortableController = SortableImport.default;
const { __resetSortableCache } = SortableImport;

const tick = () => new Promise((r) => setTimeout(r, 0));

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('sortable', SortableController);
  return app;
}

function defaultMarkup({ group = '', items = ['a', 'b', 'c'] } = {}) {
  const itemHtml = items.map((id) => `<li data-sortable-target="item" data-item-id="${id}">Card ${id}</li>`).join('');
  return `
    <div data-controller="sortable"
         data-sortable-group-value="${group}"
         data-sortable-handle-only-value="true">
      <ul data-sortable-target="list" id="board-col-todo">${itemHtml}</ul>
    </div>
  `;
}

describe('sortable controller', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
    __resetSortableCache();
    mockSortable.mockClear();
    mockSortableInstance.destroy.mockClear();
    mockSortableOptions.options = null;
  });

  afterEach(() => {
    app?.stop();
  });

  it('mounts with idle state and stamps role/tabindex/aria-grabbed on items', async () => {
    app = mount(defaultMarkup());
    await tick();
    const root = document.querySelector('[data-controller="sortable"]');
    expect(['idle', 'ready']).toContain(root.getAttribute('data-sortable-state'));
    const list = document.querySelector('[data-sortable-target="list"]');
    expect(list.getAttribute('role')).toBe('list');
    const items = document.querySelectorAll('[data-sortable-target="item"]');
    items.forEach((item) => {
      expect(item.getAttribute('role')).toBe('listitem');
      expect(item.getAttribute('tabindex')).toBe('0');
      expect(item.getAttribute('aria-grabbed')).toBe('false');
    });
  });

  it('dispatches sortable:mount on connect with group and itemCount', async () => {
    const handler = vi.fn();
    document.addEventListener('sortable:mount', handler);
    app = mount(defaultMarkup({ group: 'pm-board-sprint-42' }));
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.group).toBe('pm-board-sprint-42');
    expect(handler.mock.calls[0][0].detail.itemCount).toBe(3);
    document.removeEventListener('sortable:mount', handler);
  });

  it('lazy-loads Sortable.js on mount (immediate)', async () => {
    app = mount(defaultMarkup());
    await tick();
    await tick();
    expect(mockSortable).toHaveBeenCalledTimes(1);
    const root = document.querySelector('[data-controller="sortable"]');
    expect(root.getAttribute('data-sortable-state')).toBe('ready');
  });

  it('passes group + handle + animation + ghostClass config to Sortable.js', async () => {
    app = mount(defaultMarkup({ group: 'pm-board-foo' }));
    await tick();
    await tick();
    const options = mockSortableOptions.options;
    expect(options.group).toBe('pm-board-foo');
    expect(options.handle).toBe('.cremona-sortable-handle');
    expect(options.animation).toBe(150);
    expect(options.ghostClass).toBe('cremona-sortable-ghost');
    expect(options.chosenClass).toBe('cremona-sortable-chosen');
    expect(options.dragClass).toBe('cremona-sortable-drag');
  });

  it('dispatches sortable:ready after Sortable.js init', async () => {
    const handler = vi.fn();
    document.addEventListener('sortable:ready', handler);
    app = mount(defaultMarkup());
    await tick();
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.itemCount).toBe(3);
    document.removeEventListener('sortable:ready', handler);
  });

  it('dispatches sortable:reorder when Sortable.js onUpdate fires', async () => {
    const handler = vi.fn();
    document.addEventListener('sortable:reorder', handler);
    app = mount(defaultMarkup());
    await tick();
    await tick();

    const fromEl = document.querySelector('[data-sortable-target="list"]');
    const itemEl = document.querySelectorAll('[data-sortable-target="item"]')[0];
    mockSortableOptions.options.onUpdate({
      oldIndex: 0,
      newIndex: 2,
      from: fromEl,
      to: fromEl,
      item: itemEl,
    });

    expect(handler).toHaveBeenCalledTimes(1);
    const detail = handler.mock.calls[0][0].detail;
    expect(detail.oldIndex).toBe(0);
    expect(detail.newIndex).toBe(2);
    expect(detail.from).toBe('board-col-todo');
    expect(detail.to).toBe('board-col-todo');
    expect(detail.itemId).toBe('a');
    expect(detail.source).toBe('pointer');

    document.removeEventListener('sortable:reorder', handler);
  });

  it('dispatches sortable:cross-add when Sortable.js onAdd fires', async () => {
    const handler = vi.fn();
    document.addEventListener('sortable:cross-add', handler);
    app = mount(defaultMarkup({ group: 'pm-board-foo' }));
    await tick();
    await tick();

    const toEl = document.querySelector('[data-sortable-target="list"]');
    const otherList = document.createElement('ul');
    otherList.id = 'board-col-doing';
    const itemEl = document.createElement('li');
    itemEl.dataset.itemId = 'moved';
    mockSortableOptions.options.onAdd({
      oldIndex: 1,
      newIndex: 0,
      from: otherList,
      to: toEl,
      item: itemEl,
    });

    expect(handler).toHaveBeenCalledTimes(1);
    const detail = handler.mock.calls[0][0].detail;
    expect(detail.from).toBe('board-col-doing');
    expect(detail.to).toBe('board-col-todo');
    expect(detail.itemId).toBe('moved');
    expect(detail.source).toBe('pointer');

    document.removeEventListener('sortable:cross-add', handler);
  });

  it('keyboard Space grab + Space commit dispatches sortable:reorder source=keyboard', async () => {
    const handler = vi.fn();
    document.addEventListener('sortable:reorder', handler);
    app = mount(defaultMarkup());
    await tick();

    const item = document.querySelectorAll('[data-sortable-target="item"]')[1];
    item.focus();
    // First Space — grab.
    item.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    expect(item.getAttribute('aria-grabbed')).toBe('true');
    // Second Space — commit.
    item.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    expect(item.getAttribute('aria-grabbed')).toBe('false');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.source).toBe('keyboard');
    expect(handler.mock.calls[0][0].detail.itemId).toBe('b');
    expect(handler.mock.calls[0][0].detail.newIndex).toBe(1);

    document.removeEventListener('sortable:reorder', handler);
  });

  it('keyboard Escape cancels grab without dispatching reorder', async () => {
    const handler = vi.fn();
    document.addEventListener('sortable:reorder', handler);
    app = mount(defaultMarkup());
    await tick();

    const item = document.querySelectorAll('[data-sortable-target="item"]')[0];
    item.focus();
    item.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    expect(item.getAttribute('aria-grabbed')).toBe('true');
    item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(item.getAttribute('aria-grabbed')).toBe('false');
    expect(handler).not.toHaveBeenCalled();

    document.removeEventListener('sortable:reorder', handler);
  });

  it('skips post-disconnect lazy load (race-check via _destroyed flag)', async () => {
    app = mount(defaultMarkup());
    const root = document.querySelector('[data-controller="sortable"]');
    root.remove();
    await tick();
    await tick();
    expect(mockSortable).not.toHaveBeenCalled();
  });

  it('destroys Sortable.js instance on disconnect', async () => {
    app = mount(defaultMarkup());
    await tick();
    await tick();
    expect(mockSortable).toHaveBeenCalledTimes(1);

    const root = document.querySelector('[data-controller="sortable"]');
    root.remove();
    await tick();
    expect(mockSortableInstance.destroy).toHaveBeenCalledTimes(1);
  });

  it('does NOT init Sortable.js when disabled value is true', async () => {
    document.body.innerHTML = `
      <div data-controller="sortable" data-sortable-disabled-value="true">
        <ul data-sortable-target="list" id="archived"><li data-sortable-target="item">a</li></ul>
      </div>
    `;
    app = Application.start();
    app.register('sortable', SortableController);
    await tick();
    await tick();
    expect(mockSortable).not.toHaveBeenCalled();
    const root = document.querySelector('[data-controller="sortable"]');
    expect(root.getAttribute('data-sortable-state')).toBe('idle');
  });
});
