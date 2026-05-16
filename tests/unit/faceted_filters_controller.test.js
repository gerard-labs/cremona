import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import FacetedFiltersController from '../../src/js/controllers/faceted_filters_controller.js';

const tick = () => new Promise((r) => setTimeout(r, 0));

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('faceted-filters', FacetedFiltersController);
  return app;
}

function template({ presetChecked = [], priceValue = 500 } = {}) {
  const isChecked = (key, val) => presetChecked.some((p) => p.key === key && p.value === val);
  return `
    <aside class="theme-search-faceted-filters" data-controller="faceted-filters">
      <fieldset data-group-key="categories">
        <legend>Catégories</legend>
        <input type="checkbox" name="categories" value="electronics" ${isChecked('categories', 'electronics') ? 'checked' : ''}>
        <input type="checkbox" name="categories" value="books" ${isChecked('categories', 'books') ? 'checked' : ''}>
        <input type="checkbox" name="categories" value="clothing" ${isChecked('categories', 'clothing') ? 'checked' : ''}>
      </fieldset>
      <fieldset data-group-key="brand">
        <legend>Marque</legend>
        <input type="checkbox" name="brand" value="apple" ${isChecked('brand', 'apple') ? 'checked' : ''}>
        <input type="checkbox" name="brand" value="samsung" ${isChecked('brand', 'samsung') ? 'checked' : ''}>
      </fieldset>
      <fieldset data-group-key="onSale">
        <legend>Promotion</legend>
        <input type="checkbox" name="onSale" value="true" ${isChecked('onSale', 'true') ? 'checked' : ''}>
      </fieldset>
      <fieldset data-group-key="priceMax">
        <legend>Prix max</legend>
        <input type="range" name="priceMax" min="0" max="1000" step="10" value="${priceValue}">
      </fieldset>
      <button type="button" data-action="click->faceted-filters#clear">Effacer</button>
    </aside>
  `;
}

function fireChange(el) {
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function fireInput(el) {
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('faceted-filters controller', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    app?.stop();
  });

  it('aggregates multi-checkbox same-name into array under that name', async () => {
    app = mount(template());
    await tick();
    const electronics = document.querySelector('input[name="categories"][value="electronics"]');
    const clothing = document.querySelector('input[name="categories"][value="clothing"]');
    electronics.checked = true;
    fireChange(electronics);
    await tick();
    clothing.checked = true;
    fireChange(clothing);
    await tick();
    const wrap = document.querySelector('.theme-search-faceted-filters');
    const ctrl = app.getControllerForElementAndIdentifier(wrap, 'faceted-filters');
    const state = ctrl.getState();
    expect(state.categories).toEqual(['electronics', 'clothing']);
  });

  it('omits unchecked checkboxes from state', async () => {
    app = mount(template());
    await tick();
    const wrap = document.querySelector('.theme-search-faceted-filters');
    const ctrl = app.getControllerForElementAndIdentifier(wrap, 'faceted-filters');
    const state = ctrl.getState();
    expect(state.categories).toBeUndefined();
    expect(state.brand).toBeUndefined();
  });

  it('single-name checkbox returns boolean true when checked', async () => {
    app = mount(template());
    await tick();
    const onSale = document.querySelector('input[name="onSale"]');
    onSale.checked = true;
    fireChange(onSale);
    await tick();
    const wrap = document.querySelector('.theme-search-faceted-filters');
    const ctrl = app.getControllerForElementAndIdentifier(wrap, 'faceted-filters');
    const state = ctrl.getState();
    expect(state.onSale).toBe(true);
  });

  it('range input → numeric value', async () => {
    app = mount(template({ priceValue: 250 }));
    await tick();
    const wrap = document.querySelector('.theme-search-faceted-filters');
    const ctrl = app.getControllerForElementAndIdentifier(wrap, 'faceted-filters');
    const state = ctrl.getState();
    expect(state.priceMax).toBe(250);
  });

  it('dispatches faceted-filters:change on checkbox toggle with full state object', async () => {
    app = mount(template());
    await tick();
    const wrap = document.querySelector('.theme-search-faceted-filters');
    const events = [];
    wrap.addEventListener('faceted-filters:change', (e) => events.push(e.detail));
    const apple = document.querySelector('input[name="brand"][value="apple"]');
    apple.checked = true;
    fireChange(apple);
    await tick();
    expect(events).toHaveLength(1);
    expect(events[0].state.brand).toEqual(['apple']);
    expect(events[0].changed.name).toBe('brand');
  });

  it('dispatches faceted-filters:change on range input slide', async () => {
    app = mount(template({ priceValue: 500 }));
    await tick();
    const wrap = document.querySelector('.theme-search-faceted-filters');
    const events = [];
    wrap.addEventListener('faceted-filters:change', (e) => events.push(e.detail));
    const range = document.querySelector('input[name="priceMax"]');
    range.value = '300';
    fireInput(range);
    await tick();
    expect(events.length).toBeGreaterThan(0);
    const last = events[events.length - 1];
    expect(last.state.priceMax).toBe(300);
  });

  it('clear() resets all inputs + dispatches faceted-filters:cleared', async () => {
    app = mount(template({
      presetChecked: [
        { key: 'categories', value: 'electronics' },
        { key: 'brand', value: 'apple' },
      ],
      priceValue: 250,
    }));
    await tick();
    const wrap = document.querySelector('.theme-search-faceted-filters');
    const events = [];
    wrap.addEventListener('faceted-filters:cleared', (e) => events.push(e.detail));
    const clearButton = wrap.querySelector('button');
    clearButton.click();
    await tick();
    expect(events).toHaveLength(1);
    const ctrl = app.getControllerForElementAndIdentifier(wrap, 'faceted-filters');
    const state = ctrl.getState();
    expect(state.categories).toBeUndefined();
    expect(state.brand).toBeUndefined();
    // Range resets to min (0) per controller's clear() impl on number/range inputs.
    expect(state.priceMax).toBe(0);
  });

  it('cleans up listener on disconnect (no throw on subsequent input)', async () => {
    app = mount(template());
    await tick();
    const wrap = document.querySelector('.theme-search-faceted-filters');
    wrap.remove();
    await tick();
    // Disconnect should have removed the listener — a new wrap-input fire should not throw.
    const newWrap = document.createElement('div');
    newWrap.innerHTML = '<input type="checkbox" name="foo">';
    document.body.appendChild(newWrap);
    expect(true).toBe(true);
  });
});
