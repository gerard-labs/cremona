import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import FormDateRangeController from '../../src/js/controllers/form_date_range_controller.js';

const tick = () => new Promise((r) => setTimeout(r, 0));

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('form-date-range', FormDateRangeController);
  return app;
}

function defaultMarkup({ startDate = '', endDate = '' } = {}) {
  return `
    <div data-controller="form-date-range"
         data-form-date-range-start-date-value="${startDate}"
         data-form-date-range-end-date-value="${endDate}">
      <div data-form-date-range-target="startInput"></div>
      <div data-form-date-range-target="endInput"></div>
      <p data-form-date-range-target="errorMessage" hidden>start-after-end</p>
    </div>
  `;
}

describe('form-date-range controller', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    app?.stop();
  });

  it('dispatches form-date-range:mount on connect', async () => {
    const handler = vi.fn();
    document.addEventListener('form-date-range:mount', handler);
    app = mount(defaultMarkup());
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({ startDate: '', endDate: '' });
    document.removeEventListener('form-date-range:mount', handler);
  });

  it('does not dispatch select until both dates are set', async () => {
    const handler = vi.fn();
    document.addEventListener('form-date-range:select', handler);
    app = mount(defaultMarkup({ startDate: '2026-05-15' }));
    await tick();
    expect(handler).toHaveBeenCalledTimes(0);  // endDate still empty
    document.removeEventListener('form-date-range:select', handler);
  });

  it('dispatches form-date-range:select when both dates are set + valid', async () => {
    const handler = vi.fn();
    document.addEventListener('form-date-range:select', handler);
    app = mount(defaultMarkup({ startDate: '2026-05-15', endDate: '2026-05-22' }));
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({ startDate: '2026-05-15', endDate: '2026-05-22' });
    document.removeEventListener('form-date-range:select', handler);
  });

  it('dispatches form-date-range:invalid when start > end', async () => {
    const handler = vi.fn();
    document.addEventListener('form-date-range:invalid', handler);
    app = mount(defaultMarkup({ startDate: '2026-05-22', endDate: '2026-05-15' }));
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      reason: 'start-after-end',
      startDate: '2026-05-22',
      endDate: '2026-05-15',
    });
    document.removeEventListener('form-date-range:invalid', handler);
  });

  it('shows the error message when invalid range is set', async () => {
    app = mount(defaultMarkup({ startDate: '2026-05-22', endDate: '2026-05-15' }));
    await tick();
    const err = document.querySelector('[data-form-date-range-target="errorMessage"]');
    expect(err.hasAttribute('hidden')).toBe(false);
  });

  it('hides the error message when range becomes valid', async () => {
    app = mount(defaultMarkup({ startDate: '2026-05-22', endDate: '2026-05-15' }));
    await tick();
    const err = document.querySelector('[data-form-date-range-target="errorMessage"]');
    expect(err.hasAttribute('hidden')).toBe(false);

    const root = document.querySelector('[data-controller="form-date-range"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'form-date-range');
    ctrl.endDateValue = '2026-06-01';
    await tick();
    expect(err.hasAttribute('hidden')).toBe(true);
  });

  it('listens to descendant date-picker:select events and updates startDate', async () => {
    app = mount(defaultMarkup());
    await tick();
    const startInput = document.querySelector('[data-form-date-range-target="startInput"]');
    startInput.dispatchEvent(new CustomEvent('date-picker:select', {
      bubbles: true,
      composed: true,
      detail: { value: '2026-05-15' },
    }));
    await tick();
    const root = document.querySelector('[data-controller="form-date-range"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'form-date-range');
    expect(ctrl.startDateValue).toBe('2026-05-15');
  });

  it('listens to descendant date-picker:select events and updates endDate', async () => {
    app = mount(defaultMarkup({ startDate: '2026-05-15' }));
    await tick();
    const endInput = document.querySelector('[data-form-date-range-target="endInput"]');
    endInput.dispatchEvent(new CustomEvent('date-picker:select', {
      bubbles: true,
      composed: true,
      detail: { value: '2026-05-22' },
    }));
    await tick();
    const root = document.querySelector('[data-controller="form-date-range"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'form-date-range');
    expect(ctrl.endDateValue).toBe('2026-05-22');
  });

  it('clear() resets both dates and dispatches form-date-range:clear', async () => {
    const handler = vi.fn();
    document.addEventListener('form-date-range:clear', handler);
    app = mount(defaultMarkup({ startDate: '2026-05-15', endDate: '2026-05-22' }));
    await tick();
    const root = document.querySelector('[data-controller="form-date-range"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'form-date-range');
    ctrl.clear();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({ which: 'both' });
    expect(ctrl.startDateValue).toBe('');
    expect(ctrl.endDateValue).toBe('');
    document.removeEventListener('form-date-range:clear', handler);
  });
});
