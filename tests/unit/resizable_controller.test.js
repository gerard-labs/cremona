import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

const { default: ResizableController } = await import('../../src/js/controllers/resizable_controller.js');

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the Resizable compound's `resizable` controller.
 *
 * Per OQ-36 (sealed S2.4 opening): event-only persistence — the controller
 * dispatches resizable:change ; the consumer chooses persistence.
 *
 * Per WAI-ARIA APG "Window Splitter": role="separator" + aria-orientation
 *   + aria-valuemin/max/now + tabindex=0 + Arrow/Home/End keys.
 *
 * Per S1.4b descriptor-binding gotcha: tests call controller methods
 * directly (`ctrl._onKeyDown({...})`, `ctrl._onPointerDown({...})`).
 *
 * Responsibilities covered (14 tests):
 *   1. connect — stamps role="separator", aria-orientation, aria-valuemin/max/now, tabindex.
 *   2. connect — applies initial size via --cremona-resizable-size custom prop.
 *   3. ArrowRight on horizontal → size += step, dispatch.
 *   4. ArrowLeft on horizontal → size -= step.
 *   5. ArrowDown on vertical → size += step.
 *   6. ArrowUp on vertical → size -= step.
 *   7. Home → snap to minSize.
 *   8. End → snap to maxSize.
 *   9. Clamp at maxSize on ArrowRight at boundary.
 *  10. Clamp at minSize on ArrowLeft at boundary.
 *  11. Horizontal ArrowDown/Up → no-op (wrong axis).
 *  12. pointerdown + pointermove + pointerup → drag flow + final dispatch.
 *  13. resizable:change detail carries size + orientation.
 *  14. disconnect — removes pointer listeners (no leak).
 */
describe('ResizableController', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.dir = 'ltr';
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
  });

  async function mount({ orientation = 'horizontal', size = 50, minSize = 10, maxSize = 90, step = 5 } = {}) {
    document.body.innerHTML = `
      <div id="rs" class="cremona-resizable"
        data-orientation="${orientation}"
        data-controller="resizable"
        data-resizable-orientation-value="${orientation}"
        data-resizable-size-value="${size}"
        data-resizable-min-size-value="${minSize}"
        data-resizable-max-size-value="${maxSize}"
        data-resizable-step-value="${step}"
        style="--cremona-resizable-size: ${size}%; inline-size: 600px; block-size: 400px;">
        <div id="rs-start" class="cremona-resizable__pane cremona-resizable__pane--start" data-resizable-target="startPane">Start</div>
        <div id="rs-handle" class="cremona-resizable__handle" data-resizable-target="handle"
             aria-controls="rs-start"><span class="cremona-resizable__grip"></span></div>
        <div class="cremona-resizable__pane cremona-resizable__pane--end">End</div>
      </div>
    `;
    // Stub getBoundingClientRect for predictable pointer math.
    const wrap = document.getElementById('rs');
    wrap.getBoundingClientRect = () => ({
      x: 0, y: 0, top: 0, left: 0, right: 600, bottom: 400, width: 600, height: 400,
    });
    app = Application.start();
    app.register('resizable', ResizableController);
    await tick();
    await tick();
    return {
      wrap,
      handle: document.getElementById('rs-handle'),
      startPane: document.getElementById('rs-start'),
      ctrl: app.controllers.find((c) => c.identifier === 'resizable'),
    };
  }

  it('connect — stamps ARIA + tabindex on handle', async () => {
    const { handle } = await mount({ orientation: 'horizontal', size: 50, minSize: 10, maxSize: 90 });
    expect(handle.getAttribute('role')).toBe('separator');
    expect(handle.getAttribute('aria-orientation')).toBe('horizontal');
    expect(handle.getAttribute('aria-valuenow')).toBe('50');
    expect(handle.getAttribute('aria-valuemin')).toBe('10');
    expect(handle.getAttribute('aria-valuemax')).toBe('90');
    expect(handle.getAttribute('tabindex')).toBe('0');
  });

  it('connect — applies initial size as CSS custom prop', async () => {
    const { wrap } = await mount({ size: 35 });
    expect(wrap.style.getPropertyValue('--cremona-resizable-size')).toBe('35%');
  });

  it('ArrowRight on horizontal → size += step, dispatch', async () => {
    const { wrap, ctrl } = await mount({ orientation: 'horizontal', size: 50, step: 5 });
    const events = [];
    wrap.addEventListener('resizable:change', (e) => events.push(e.detail));
    ctrl._onKeyDown({ key: 'ArrowRight', preventDefault: () => {} });
    expect(ctrl.sizeValue).toBe(55);
    expect(wrap.style.getPropertyValue('--cremona-resizable-size')).toBe('55%');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ size: 55, orientation: 'horizontal' });
  });

  it('ArrowLeft on horizontal → size -= step', async () => {
    const { ctrl } = await mount({ orientation: 'horizontal', size: 50, step: 5 });
    ctrl._onKeyDown({ key: 'ArrowLeft', preventDefault: () => {} });
    expect(ctrl.sizeValue).toBe(45);
  });

  it('ArrowDown on vertical → size += step', async () => {
    const { ctrl } = await mount({ orientation: 'vertical', size: 50, step: 5 });
    ctrl._onKeyDown({ key: 'ArrowDown', preventDefault: () => {} });
    expect(ctrl.sizeValue).toBe(55);
  });

  it('ArrowUp on vertical → size -= step', async () => {
    const { ctrl } = await mount({ orientation: 'vertical', size: 50, step: 5 });
    ctrl._onKeyDown({ key: 'ArrowUp', preventDefault: () => {} });
    expect(ctrl.sizeValue).toBe(45);
  });

  it('Home → snap to minSize', async () => {
    const { ctrl } = await mount({ size: 50, minSize: 15 });
    ctrl._onKeyDown({ key: 'Home', preventDefault: () => {} });
    expect(ctrl.sizeValue).toBe(15);
  });

  it('End → snap to maxSize', async () => {
    const { ctrl } = await mount({ size: 50, maxSize: 85 });
    ctrl._onKeyDown({ key: 'End', preventDefault: () => {} });
    expect(ctrl.sizeValue).toBe(85);
  });

  it('clamp at maxSize on ArrowRight at boundary', async () => {
    const { wrap, ctrl } = await mount({ size: 88, maxSize: 90, step: 5 });
    const events = [];
    wrap.addEventListener('resizable:change', (e) => events.push(e.detail));
    ctrl._onKeyDown({ key: 'ArrowRight', preventDefault: () => {} });
    expect(ctrl.sizeValue).toBe(90); // 88+5=93 clamped to 90
    expect(events).toHaveLength(1);
    // Second press at boundary — no change, no dispatch.
    ctrl._onKeyDown({ key: 'ArrowRight', preventDefault: () => {} });
    expect(ctrl.sizeValue).toBe(90);
    expect(events).toHaveLength(1);
  });

  it('clamp at minSize on ArrowLeft at boundary', async () => {
    const { ctrl } = await mount({ size: 12, minSize: 10, step: 5 });
    ctrl._onKeyDown({ key: 'ArrowLeft', preventDefault: () => {} });
    expect(ctrl.sizeValue).toBe(10); // 12-5=7 clamped to 10
  });

  it('horizontal ArrowDown/Up → no-op (wrong axis)', async () => {
    const { ctrl } = await mount({ orientation: 'horizontal', size: 50 });
    ctrl._onKeyDown({ key: 'ArrowDown', preventDefault: () => {} });
    expect(ctrl.sizeValue).toBe(50);
    ctrl._onKeyDown({ key: 'ArrowUp', preventDefault: () => {} });
    expect(ctrl.sizeValue).toBe(50);
  });

  it('pointerdown + pointermove + pointerup → drag + final dispatch', async () => {
    const { wrap, ctrl, handle } = await mount({ orientation: 'horizontal', size: 50 });
    const events = [];
    wrap.addEventListener('resizable:change', (e) => events.push(e.detail));
    // Mock pointer capture (happy-dom may not implement it).
    handle.setPointerCapture = vi.fn();
    handle.releasePointerCapture = vi.fn();
    // Start drag at clientX=300 (50% of 600 px wrap).
    ctrl._onPointerDown({ button: 0, pointerId: 1, clientX: 300, clientY: 200, preventDefault: () => {} });
    expect(wrap.hasAttribute('data-dragging')).toBe(true);
    // Move pointer to clientX=420 (+120 px = +20% of 600 px wrap).
    ctrl._onPointerMove({ clientX: 420, clientY: 200 });
    expect(ctrl.sizeValue).toBe(70);
    expect(wrap.style.getPropertyValue('--cremona-resizable-size')).toBe('70%');
    // No dispatch yet — only on pointerup.
    expect(events).toHaveLength(0);
    // Release.
    ctrl._onPointerUp({ pointerId: 1 });
    expect(wrap.hasAttribute('data-dragging')).toBe(false);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ size: 70, orientation: 'horizontal' });
  });

  it('resizable:change detail carries size + orientation', async () => {
    const { wrap, ctrl } = await mount({ orientation: 'vertical', size: 50, step: 5 });
    const events = [];
    wrap.addEventListener('resizable:change', (e) => events.push(e.detail));
    ctrl._onKeyDown({ key: 'ArrowDown', preventDefault: () => {} });
    expect(events[0]).toEqual({ size: 55, orientation: 'vertical' });
  });

  it('disconnect — removes pointer listeners', async () => {
    const { ctrl, handle } = await mount();
    const removeSpy = vi.spyOn(handle, 'removeEventListener');
    ctrl.disconnect();
    expect(removeSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
