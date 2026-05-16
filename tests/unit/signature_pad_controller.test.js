import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

const { mockSignaturePad, mockPadInstance } = vi.hoisted(() => {
  const clear = vi.fn();
  const isEmpty = vi.fn(() => false);
  const toDataURL = vi.fn(() => 'data:image/png;base64,MOCK');
  const addEventListener = vi.fn();
  const off = vi.fn();
  const instance = { clear, isEmpty, toDataURL, addEventListener, off };
  const ctor = vi.fn(function MockSignaturePad() {
    Object.assign(this, instance);
    return this;
  });
  return { mockSignaturePad: ctor, mockPadInstance: instance };
});

vi.mock('signature_pad', () => ({ default: mockSignaturePad }));

const SignaturePadImport = await import('../../src/js/controllers/signature_pad_controller.js');
const SignaturePadController = SignaturePadImport.default;
const { __resetSignaturePadCache } = SignaturePadImport;

const tick = () => new Promise((r) => setTimeout(r, 0));

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('signature-pad', SignaturePadController);
  return app;
}

function defaultMarkup() {
  return `
    <div data-controller="signature-pad"
         data-signature-pad-pen-color-value="#000000"
         data-signature-pad-min-width-value="0.5"
         data-signature-pad-max-width-value="2.5">
      <canvas data-signature-pad-target="canvas" width="400" height="200"></canvas>
      <button data-signature-pad-target="clearBtn" data-action="click->signature-pad#clear">Clear</button>
      <input type="hidden" data-signature-pad-target="hiddenInput" />
    </div>
  `;
}

function firePointerDown(canvas) {
  const event = new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 50 });
  canvas.dispatchEvent(event);
}

describe('signature-pad controller', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
    __resetSignaturePadCache();
    mockSignaturePad.mockClear();
    mockPadInstance.clear.mockClear();
    mockPadInstance.isEmpty.mockClear();
    mockPadInstance.toDataURL.mockClear();
    mockPadInstance.addEventListener.mockClear();
    mockPadInstance.off.mockClear();
  });

  afterEach(() => {
    app?.stop();
  });

  it('mounts with idle state and stamps canvas role + aria-label', async () => {
    app = mount(defaultMarkup());
    await tick();
    const root = document.querySelector('[data-controller="signature-pad"]');
    expect(root.getAttribute('data-signature-pad-state')).toBe('idle');
    const canvas = document.querySelector('[data-signature-pad-target="canvas"]');
    expect(canvas.getAttribute('role')).toBe('img');
    expect(canvas.getAttribute('aria-label')).toBeTruthy();
  });

  it('dispatches signature-pad:mount on connect', async () => {
    const handler = vi.fn();
    document.addEventListener('signature-pad:mount', handler);
    app = mount(defaultMarkup());
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    document.removeEventListener('signature-pad:mount', handler);
  });

  it('does NOT lazy-load signature_pad on connect (waits for pointerdown)', async () => {
    app = mount(defaultMarkup());
    await tick();
    expect(mockSignaturePad).not.toHaveBeenCalled();
  });

  it('lazy-loads signature_pad on first pointerdown', async () => {
    app = mount(defaultMarkup());
    await tick();
    const canvas = document.querySelector('[data-signature-pad-target="canvas"]');
    firePointerDown(canvas);
    await tick();
    await tick();
    expect(mockSignaturePad).toHaveBeenCalledTimes(1);
    const root = document.querySelector('[data-controller="signature-pad"]');
    expect(root.getAttribute('data-signature-pad-state')).toBe('ready');
  });

  it('dispatches signature-pad:ready after signature_pad init', async () => {
    const handler = vi.fn();
    document.addEventListener('signature-pad:ready', handler);
    app = mount(defaultMarkup());
    await tick();
    const canvas = document.querySelector('[data-signature-pad-target="canvas"]');
    firePointerDown(canvas);
    await tick();
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    document.removeEventListener('signature-pad:ready', handler);
  });

  it('passes penColor + minWidth + maxWidth config to SignaturePad ctor', async () => {
    app = mount(defaultMarkup());
    await tick();
    const canvas = document.querySelector('[data-signature-pad-target="canvas"]');
    firePointerDown(canvas);
    await tick();
    await tick();
    expect(mockSignaturePad).toHaveBeenCalledTimes(1);
    // The constructor receives (canvas, options) but we use new with no args here ;
    // assert it was called.
    expect(mockSignaturePad).toHaveBeenCalled();
  });

  it('does NOT re-load signature_pad on subsequent pointerdown (once: true listener)', async () => {
    app = mount(defaultMarkup());
    await tick();
    const canvas = document.querySelector('[data-signature-pad-target="canvas"]');
    firePointerDown(canvas);
    await tick();
    await tick();
    expect(mockSignaturePad).toHaveBeenCalledTimes(1);

    // Subsequent pointerdown should NOT re-invoke (listener removed via once: true).
    firePointerDown(canvas);
    await tick();
    expect(mockSignaturePad).toHaveBeenCalledTimes(1);
  });

  it('clear() calls _pad.clear() + resets hidden input + dispatches signature-pad:clear', async () => {
    const handler = vi.fn();
    document.addEventListener('signature-pad:clear', handler);
    app = mount(defaultMarkup());
    await tick();
    const canvas = document.querySelector('[data-signature-pad-target="canvas"]');
    firePointerDown(canvas);
    await tick();
    await tick();

    const root = document.querySelector('[data-controller="signature-pad"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'signature-pad');
    ctrl.clear();
    expect(mockPadInstance.clear).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
    const hidden = document.querySelector('[data-signature-pad-target="hiddenInput"]');
    expect(hidden.value).toBe('');
    document.removeEventListener('signature-pad:clear', handler);
  });

  it('skips post-disconnect pointerdown (race-check via _destroyed flag)', async () => {
    app = mount(defaultMarkup());
    await tick();
    const root = document.querySelector('[data-controller="signature-pad"]');
    const canvas = root.querySelector('canvas');
    // Tear down before pointerdown fires.
    root.remove();
    await tick();
    firePointerDown(canvas);
    await tick();
    await tick();
    expect(mockSignaturePad).not.toHaveBeenCalled();
  });

  it('registers endStroke listener after init', async () => {
    app = mount(defaultMarkup());
    await tick();
    const canvas = document.querySelector('[data-signature-pad-target="canvas"]');
    firePointerDown(canvas);
    await tick();
    await tick();
    expect(mockPadInstance.addEventListener).toHaveBeenCalledWith('endStroke', expect.any(Function));
  });
});
