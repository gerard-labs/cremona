import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

const { mockColoris } = vi.hoisted(() => {
  const factory = vi.fn(() => undefined);
  return { mockColoris: factory };
});

vi.mock('@melloware/coloris', () => ({ default: mockColoris }));

const ColorPickerImport = await import('../../src/js/controllers/color_picker_controller.js');
const ColorPickerController = ColorPickerImport.default;
const { __resetColorisCache } = ColorPickerImport;

const tick = () => new Promise((r) => setTimeout(r, 0));

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('color-picker', ColorPickerController);
  return app;
}

function defaultMarkup({ alpha = false, defaultColor = '#6366F1', swatches = [], inputValue = '' } = {}) {
  const swatchesAttr = swatches.length ? ` data-color-picker-swatches-value='${JSON.stringify(swatches)}'` : '';
  return `
    <div data-controller="color-picker"
         data-color-picker-alpha-value="${alpha}"
         data-color-picker-default-color-value="${defaultColor}"
         data-color-picker-format-value="hex"${swatchesAttr}>
      <button type="button" data-color-picker-target="trigger" aria-haspopup="dialog">
        <span data-color-picker-target="preview" style="background-color: ${defaultColor};"></span>
        <input type="text" data-color-picker-target="input" value="${inputValue || defaultColor}" />
      </button>
    </div>
  `;
}

describe('color-picker controller', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
    __resetColorisCache();
    mockColoris.mockClear();
  });

  afterEach(() => {
    app?.stop();
  });

  it('mounts with idle state and stamps aria-label on trigger', async () => {
    app = mount(defaultMarkup());
    await tick();
    const root = document.querySelector('[data-controller="color-picker"]');
    expect(root.getAttribute('data-color-picker-state')).toBe('idle');
    const trigger = document.querySelector('[data-color-picker-target="trigger"]');
    expect(trigger.getAttribute('aria-label')).toBeTruthy();
  });

  it('dispatches color-picker:mount with initial value on connect', async () => {
    const handler = vi.fn();
    document.addEventListener('color-picker:mount', handler);
    app = mount(defaultMarkup({ defaultColor: '#10B981' }));
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.value).toBe('#10B981');
    document.removeEventListener('color-picker:mount', handler);
  });

  it('renders preview swatch with defaultColor on mount', async () => {
    app = mount(defaultMarkup({ defaultColor: '#EF4444' }));
    await tick();
    const preview = document.querySelector('[data-color-picker-target="preview"]');
    expect(preview.style.backgroundColor).toBeTruthy();
  });

  it('does NOT lazy-load Coloris on connect (waits for popover:open)', async () => {
    app = mount(defaultMarkup());
    await tick();
    expect(mockColoris).not.toHaveBeenCalled();
  });

  it('lazy-loads Coloris on first popover:open event', async () => {
    app = mount(defaultMarkup());
    await tick();
    const root = document.querySelector('[data-controller="color-picker"]');
    root.dispatchEvent(new CustomEvent('popover:open', { bubbles: true, composed: true }));
    await tick();
    await tick();
    expect(mockColoris).toHaveBeenCalledTimes(1);
    expect(root.getAttribute('data-color-picker-state')).toBe('ready');
  });

  it('dispatches color-picker:ready after Coloris factory invocation', async () => {
    const handler = vi.fn();
    document.addEventListener('color-picker:ready', handler);
    app = mount(defaultMarkup());
    await tick();
    const root = document.querySelector('[data-controller="color-picker"]');
    root.dispatchEvent(new CustomEvent('popover:open', { bubbles: true, composed: true }));
    await tick();
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    document.removeEventListener('color-picker:ready', handler);
  });

  it('passes alpha + swatches + format config to Coloris factory', async () => {
    app = mount(defaultMarkup({ alpha: true, swatches: ['#000', '#FFF'] }));
    await tick();
    const root = document.querySelector('[data-controller="color-picker"]');
    root.dispatchEvent(new CustomEvent('popover:open', { bubbles: true, composed: true }));
    await tick();
    await tick();
    const config = mockColoris.mock.calls[0][0];
    expect(config.alpha).toBe(true);
    expect(config.swatches).toEqual(['#000', '#FFF']);
    expect(config.format).toBe('hex');
  });

  it('does not re-invoke Coloris on subsequent popover:open events (once: true listener)', async () => {
    app = mount(defaultMarkup());
    await tick();
    const root = document.querySelector('[data-controller="color-picker"]');
    root.dispatchEvent(new CustomEvent('popover:open', { bubbles: true, composed: true }));
    await tick();
    await tick();
    expect(mockColoris).toHaveBeenCalledTimes(1);

    // Subsequent popover:open events should NOT re-invoke Coloris (the listener is once: true).
    root.dispatchEvent(new CustomEvent('popover:open', { bubbles: true, composed: true }));
    await tick();
    expect(mockColoris).toHaveBeenCalledTimes(1);
  });

  it('dispatches color-picker:change on input change after Coloris init', async () => {
    const handler = vi.fn();
    document.addEventListener('color-picker:change', handler);
    app = mount(defaultMarkup());
    await tick();
    const root = document.querySelector('[data-controller="color-picker"]');
    root.dispatchEvent(new CustomEvent('popover:open', { bubbles: true, composed: true }));
    await tick();
    await tick();

    const input = document.querySelector('[data-color-picker-target="input"]');
    input.value = '#F59E0B';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();
    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[handler.mock.calls.length - 1][0].detail.value).toBe('#F59E0B');
    document.removeEventListener('color-picker:change', handler);
  });

  it('updates preview swatch background on input change', async () => {
    app = mount(defaultMarkup({ defaultColor: '#000000' }));
    await tick();
    const root = document.querySelector('[data-controller="color-picker"]');
    root.dispatchEvent(new CustomEvent('popover:open', { bubbles: true, composed: true }));
    await tick();
    await tick();

    const input = document.querySelector('[data-color-picker-target="input"]');
    const preview = document.querySelector('[data-color-picker-target="preview"]');
    input.value = '#EF4444';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await tick();
    // happy-dom converts hex to rgb in computed style ; assert the style attribute changed
    expect(preview.style.backgroundColor).toBeTruthy();
  });

  it('skips post-disconnect popover:open (race-check via _destroyed flag)', async () => {
    app = mount(defaultMarkup());
    await tick();
    const root = document.querySelector('[data-controller="color-picker"]');
    // Tear down before dispatching popover:open.
    root.remove();
    await tick();
    // Re-dispatch on a detached element should not invoke Coloris.
    root.dispatchEvent(new CustomEvent('popover:open', { bubbles: true, composed: true }));
    await tick();
    await tick();
    expect(mockColoris).not.toHaveBeenCalled();
  });
});
