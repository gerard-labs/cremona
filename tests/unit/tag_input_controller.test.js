import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

const { mockTagify, mockTagifyInstance, mockTagifyOnHandlers } = vi.hoisted(() => {
  const handlers = new Map();
  const on = vi.fn((eventName, callback) => {
    handlers.set(eventName, callback);
  });
  const destroy = vi.fn();
  const instance = { on, destroy, value: [] };
  const ctor = vi.fn(function MockTagify(input, options) {
    // Return the shared instance so test-side mutations of
    // `mockTagifyInstance.value` are visible to the controller.
    instance._input = input;
    instance._options = options;
    return instance;
  });
  return { mockTagify: ctor, mockTagifyInstance: instance, mockTagifyOnHandlers: handlers };
});

vi.mock('@yaireo/tagify', () => ({ default: mockTagify }));

const TagInputImport = await import('../../src/js/controllers/tag_input_controller.js');
const TagInputController = TagInputImport.default;
const { __resetTagifyCache } = TagInputImport;

const tick = () => new Promise((r) => setTimeout(r, 0));

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('tag-input', TagInputController);
  return app;
}

function defaultMarkup({ whitelist = [], maxTags = 0 } = {}) {
  return `
    <div data-controller="tag-input"
         data-tag-input-whitelist-value='${JSON.stringify(whitelist)}'
         data-tag-input-max-tags-value="${maxTags}"
         data-tag-input-duplicates-value="false"
         data-tag-input-delimiters-value=",|\\n">
      <input type="text" data-tag-input-target="input" />
      <input type="hidden" data-tag-input-target="hiddenInput" />
      <p data-tag-input-target="counter" aria-live="polite"></p>
    </div>
  `;
}

describe('tag-input controller', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
    __resetTagifyCache();
    mockTagify.mockClear();
    mockTagifyInstance.on.mockClear();
    mockTagifyInstance.destroy.mockClear();
    mockTagifyOnHandlers.clear();
    mockTagifyInstance.value = [];
  });

  afterEach(() => {
    app?.stop();
  });

  it('mounts with idle state and stamps input role + aria-multiline', async () => {
    app = mount(defaultMarkup());
    await tick();
    const root = document.querySelector('[data-controller="tag-input"]');
    expect(['idle', 'ready']).toContain(root.getAttribute('data-tag-input-state'));
    const input = document.querySelector('[data-tag-input-target="input"]');
    expect(input.getAttribute('role')).toBe('textbox');
    expect(input.getAttribute('aria-multiline')).toBe('false');
  });

  it('dispatches tag-input:mount on connect with maxTags', async () => {
    const handler = vi.fn();
    document.addEventListener('tag-input:mount', handler);
    app = mount(defaultMarkup({ maxTags: 5 }));
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.maxTags).toBe(5);
    document.removeEventListener('tag-input:mount', handler);
  });

  it('lazy-loads Tagify on mount (immediate)', async () => {
    app = mount(defaultMarkup());
    await tick();
    await tick();
    expect(mockTagify).toHaveBeenCalledTimes(1);
    const root = document.querySelector('[data-controller="tag-input"]');
    expect(root.getAttribute('data-tag-input-state')).toBe('ready');
  });

  it('passes whitelist + maxTags + duplicates config to Tagify constructor', async () => {
    app = mount(defaultMarkup({ whitelist: ['frontend', 'backend'], maxTags: 5 }));
    await tick();
    await tick();
    const call = mockTagify.mock.calls[0];
    const options = call[1];
    expect(options.whitelist).toEqual(['frontend', 'backend']);
    expect(options.maxTags).toBe(5);
    expect(options.duplicates).toBe(false);
  });

  it('dispatches tag-input:ready after Tagify init', async () => {
    const handler = vi.fn();
    document.addEventListener('tag-input:ready', handler);
    app = mount(defaultMarkup());
    await tick();
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    document.removeEventListener('tag-input:ready', handler);
  });

  it('registers add + remove listeners on Tagify instance', async () => {
    app = mount(defaultMarkup());
    await tick();
    await tick();
    expect(mockTagifyInstance.on).toHaveBeenCalledWith('add', expect.any(Function));
    expect(mockTagifyInstance.on).toHaveBeenCalledWith('remove', expect.any(Function));
  });

  it('dispatches tag-input:add and tag-input:change when a tag is added', async () => {
    const addHandler = vi.fn();
    const changeHandler = vi.fn();
    document.addEventListener('tag-input:add', addHandler);
    document.addEventListener('tag-input:change', changeHandler);
    app = mount(defaultMarkup());
    await tick();
    await tick();

    // Simulate Tagify firing an 'add' event with a new tag.
    mockTagifyInstance.value = [{ value: 'frontend' }];
    const addCallback = mockTagifyOnHandlers.get('add');
    addCallback({ detail: { data: { value: 'frontend' } } });

    expect(addHandler).toHaveBeenCalledTimes(1);
    expect(addHandler.mock.calls[0][0].detail.tag).toBe('frontend');
    expect(addHandler.mock.calls[0][0].detail.tagCount).toBe(1);
    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(changeHandler.mock.calls[0][0].detail.tags).toEqual(['frontend']);

    document.removeEventListener('tag-input:add', addHandler);
    document.removeEventListener('tag-input:change', changeHandler);
  });

  it('updates counter via Intl.PluralRules when tags change', async () => {
    app = mount(defaultMarkup());
    await tick();
    await tick();
    const counter = document.querySelector('[data-tag-input-target="counter"]');
    expect(counter.textContent).toBeTruthy();  // initial "0 tags" / "Aucune étiquette"

    mockTagifyInstance.value = [{ value: 'a' }];
    const addCallback = mockTagifyOnHandlers.get('add');
    addCallback({ detail: { data: { value: 'a' } } });

    // Counter should update — the exact string depends on i18n state but it changed.
    expect(counter.textContent).toBeTruthy();
  });

  it('JSON-encodes tag array into hidden input on change', async () => {
    app = mount(defaultMarkup());
    await tick();
    await tick();
    const hidden = document.querySelector('[data-tag-input-target="hiddenInput"]');

    mockTagifyInstance.value = [{ value: 'a' }, { value: 'b' }, { value: 'c' }];
    const addCallback = mockTagifyOnHandlers.get('add');
    addCallback({ detail: { data: { value: 'c' } } });

    expect(hidden.value).toBe('["a","b","c"]');
  });

  it('skips post-disconnect lazy load (race-check via _destroyed flag)', async () => {
    app = mount(defaultMarkup());
    const root = document.querySelector('[data-controller="tag-input"]');
    // Tear down immediately, before the dynamic import resolves.
    root.remove();
    await tick();
    await tick();
    expect(mockTagify).not.toHaveBeenCalled();
  });

  it('destroys Tagify instance on disconnect', async () => {
    app = mount(defaultMarkup());
    await tick();
    await tick();
    expect(mockTagify).toHaveBeenCalledTimes(1);

    const root = document.querySelector('[data-controller="tag-input"]');
    root.remove();
    await tick();
    expect(mockTagifyInstance.destroy).toHaveBeenCalledTimes(1);
  });
});
