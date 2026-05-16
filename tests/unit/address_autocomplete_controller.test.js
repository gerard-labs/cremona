import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import AddressAutocompleteController from '../../src/js/controllers/address_autocomplete_controller.js';

async function tick() {
  await Promise.resolve();
}

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('address-autocomplete', AddressAutocompleteController);
  return app;
}

function defaultMarkup() {
  return `
    <div data-controller="address-autocomplete"
         data-address-autocomplete-min-query-length-value="3"
         data-address-autocomplete-debounce-ms-value="50"
         data-address-autocomplete-consumer-endpoint-value="/api/addresses">
      <input type="text" data-address-autocomplete-target="input" />
      <input type="hidden" data-address-autocomplete-target="hiddenInput" />
      <ul data-address-autocomplete-target="suggestionsList" hidden></ul>
    </div>
  `;
}

describe('address-autocomplete controller', () => {
  let app;
  let fetchMock;

  beforeEach(() => {
    document.body.innerHTML = '';
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    app?.stop();
    vi.useRealTimers();
  });

  it('dispatches address-autocomplete:mount on connect', async () => {
    const handler = vi.fn();
    document.addEventListener('address-autocomplete:mount', handler);
    app = mount(defaultMarkup());
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({ minQueryLength: 3, debounceMs: 50 });
    document.removeEventListener('address-autocomplete:mount', handler);
  });

  it('does not fetch when query length < minQueryLength', async () => {
    app = mount(defaultMarkup());
    await tick();
    const input = document.querySelector('[data-address-autocomplete-target="input"]');
    input.value = 'ab';
    input.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 80));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('debounces input and fetches when query >= minQueryLength', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve([{ label: '15 rue de Rivoli, Paris', placeId: 'A1' }]) });
    app = mount(defaultMarkup());
    await tick();
    const input = document.querySelector('[data-address-autocomplete-target="input"]');
    input.value = '15 rue';
    input.dispatchEvent(new Event('input'));
    expect(fetchMock).not.toHaveBeenCalled();
    await new Promise((r) => setTimeout(r, 80));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain('q=15%20rue');
  });

  it('renders suggestions in the listbox after fetch resolves', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve([
      { label: '15 rue de Rivoli, Paris', placeId: 'A1' },
      { label: '15 avenue de la République, Paris', placeId: 'A2' },
    ]) });
    app = mount(defaultMarkup());
    await tick();
    const input = document.querySelector('[data-address-autocomplete-target="input"]');
    input.value = '15 rue';
    input.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 80));
    await tick();
    const list = document.querySelector('[data-address-autocomplete-target="suggestionsList"]');
    expect(list.hasAttribute('hidden')).toBe(false);
    expect(list.querySelectorAll('[data-address-autocomplete-target="suggestionItem"]').length).toBe(2);
  });

  it('dispatches address-autocomplete:fetch (cancellable) and skips default fetch on preventDefault', async () => {
    const handler = vi.fn((e) => e.preventDefault());
    document.addEventListener('address-autocomplete:fetch', handler);
    app = mount(defaultMarkup());
    await tick();
    const input = document.querySelector('[data-address-autocomplete-target="input"]');
    input.value = '15 rue';
    input.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 80));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
    document.removeEventListener('address-autocomplete:fetch', handler);
  });

  it('renders suggestions from external address-autocomplete:suggestions event', async () => {
    app = mount(defaultMarkup());
    await tick();
    const root = document.querySelector('[data-controller="address-autocomplete"]');
    root.dispatchEvent(new CustomEvent('address-autocomplete:suggestions', {
      detail: { suggestions: [{ label: '1 place de la Concorde, Paris', placeId: 'X1' }] },
    }));
    await tick();
    const list = document.querySelector('[data-address-autocomplete-target="suggestionsList"]');
    expect(list.hasAttribute('hidden')).toBe(false);
    expect(list.querySelectorAll('[data-address-autocomplete-target="suggestionItem"]').length).toBe(1);
  });

  it('clears suggestions when input is emptied', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve([{ label: 'A', placeId: '1' }]) });
    app = mount(defaultMarkup());
    await tick();
    const input = document.querySelector('[data-address-autocomplete-target="input"]');
    input.value = '15 rue';
    input.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 80));
    await tick();

    const clearHandler = vi.fn();
    document.addEventListener('address-autocomplete:clear', clearHandler);
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(clearHandler).toHaveBeenCalledTimes(1);
    const list = document.querySelector('[data-address-autocomplete-target="suggestionsList"]');
    expect(list.hasAttribute('hidden')).toBe(true);
    document.removeEventListener('address-autocomplete:clear', clearHandler);
  });

  it('select via click commits the suggestion and dispatches address-autocomplete:select', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve([{ label: '1 Place X', placeId: 'Z' }]) });
    app = mount(defaultMarkup());
    await tick();
    const input = document.querySelector('[data-address-autocomplete-target="input"]');
    input.value = '15 rue';
    input.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 80));
    await tick();

    const selectHandler = vi.fn();
    document.addEventListener('address-autocomplete:select', selectHandler);
    const item = document.querySelector('[data-address-autocomplete-target="suggestionItem"]');
    item.click();
    expect(selectHandler).toHaveBeenCalledTimes(1);
    expect(selectHandler.mock.calls[0][0].detail).toMatchObject({ label: '1 Place X', placeId: 'Z' });
    expect(input.value).toBe('1 Place X');
    const hidden = document.querySelector('[data-address-autocomplete-target="hiddenInput"]');
    expect(hidden.value).toBe('Z');
    document.removeEventListener('address-autocomplete:select', selectHandler);
  });

  it('idempotency cache — same query in a row does not refetch', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve([]) });
    app = mount(defaultMarkup());
    await tick();
    const input = document.querySelector('[data-address-autocomplete-target="input"]');
    input.value = '15 rue';
    input.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 80));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    input.dispatchEvent(new Event('input'));  // same value, no re-fetch
    await new Promise((r) => setTimeout(r, 80));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('Esc on input clears suggestions', async () => {
    fetchMock.mockResolvedValue({ json: () => Promise.resolve([{ label: 'A', placeId: '1' }]) });
    app = mount(defaultMarkup());
    await tick();
    const input = document.querySelector('[data-address-autocomplete-target="input"]');
    input.value = '15 rue';
    input.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 80));
    await tick();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    const list = document.querySelector('[data-address-autocomplete-target="suggestionsList"]');
    expect(list.hasAttribute('hidden')).toBe(true);
    expect(input.value).toBe('');
  });
});
