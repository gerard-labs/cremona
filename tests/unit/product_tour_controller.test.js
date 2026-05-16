import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';

const { mockDriver, mockDriveFn, mockDestroyFn } = vi.hoisted(() => {
  const driveFn = vi.fn();
  const destroyFn = vi.fn();
  const driverFn = vi.fn((config) => ({ drive: driveFn, destroy: destroyFn, ...config }));
  return { mockDriver: driverFn, mockDriveFn: driveFn, mockDestroyFn: destroyFn };
});

vi.mock('driver.js', () => ({ driver: mockDriver }));

const ProductTourImport = await import('../../src/js/controllers/product_tour_controller.js');
const ProductTourController = ProductTourImport.default;
const { __resetDriverCache } = ProductTourImport;

const tick = () => new Promise((r) => setTimeout(r, 0));

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('product-tour', ProductTourController);
  return app;
}

describe('product-tour controller', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
    __resetDriverCache();
    mockDriver.mockClear();
    mockDriveFn.mockClear();
    mockDestroyFn.mockClear();
  });

  afterEach(() => {
    app?.stop();
  });

  it('mounts with idle state', async () => {
    app = mount('<div data-controller="product-tour" data-product-tour-steps-value="[]"></div>');
    await tick();
    const el = document.querySelector('[data-controller="product-tour"]');
    expect(el.getAttribute('data-product-tour-state')).toBe('idle');
  });

  it('dispatches product-tour:mount with stepCount on connect', async () => {
    const handler = vi.fn();
    document.body.addEventListener('product-tour:mount', handler);
    app = mount('<div data-controller="product-tour" data-product-tour-steps-value=\'[{"element":"#a"}]\'></div>');
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.stepCount).toBe(1);
    document.body.removeEventListener('product-tour:mount', handler);
  });

  it('lazy-loads driver.js on first start() and calls drive()', async () => {
    app = mount('<div data-controller="product-tour" data-product-tour-steps-value=\'[{"element":"#a"}]\'></div>');
    await tick();
    const el = document.querySelector('[data-controller="product-tour"]');
    const ctrl = app.getControllerForElementAndIdentifier(el, 'product-tour');

    expect(mockDriver).not.toHaveBeenCalled();
    ctrl.start();
    await tick();
    await tick();
    expect(mockDriver).toHaveBeenCalledTimes(1);
    expect(mockDriveFn).toHaveBeenCalledTimes(1);
    expect(el.getAttribute('data-product-tour-state')).toBe('active');
  });

  it('dispatches product-tour:start after drive()', async () => {
    const handler = vi.fn();
    document.body.addEventListener('product-tour:start', handler);
    app = mount('<div data-controller="product-tour" data-product-tour-steps-value=\'[{"element":"#a"},{"element":"#b"}]\'></div>');
    await tick();
    const el = document.querySelector('[data-controller="product-tour"]');
    const ctrl = app.getControllerForElementAndIdentifier(el, 'product-tour');
    ctrl.start();
    await tick();
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.stepCount).toBe(2);
    document.body.removeEventListener('product-tour:start', handler);
  });

  it('does not re-import driver.js on subsequent start() calls (module-scoped cache)', async () => {
    app = mount('<div data-controller="product-tour" data-product-tour-steps-value=\'[{"element":"#a"}]\'></div>');
    await tick();
    const el = document.querySelector('[data-controller="product-tour"]');
    const ctrl = app.getControllerForElementAndIdentifier(el, 'product-tour');

    ctrl.start();
    await tick();
    await tick();
    expect(mockDriver).toHaveBeenCalledTimes(1);

    ctrl.start();
    await tick();
    // mockDriver is called every time _beginTour runs ; the LAZY-LOAD chunk
    // is what's cached. The driver factory itself is still invoked.
    expect(mockDriver).toHaveBeenCalledTimes(2);
    expect(mockDriveFn).toHaveBeenCalledTimes(2);
  });

  it('auto-starts when data-product-tour-auto-start-value="true"', async () => {
    app = mount('<div data-controller="product-tour" data-product-tour-steps-value=\'[{"element":"#a"}]\' data-product-tour-auto-start-value="true"></div>');
    await tick();
    await tick();
    expect(mockDriver).toHaveBeenCalledTimes(1);
    expect(mockDriveFn).toHaveBeenCalledTimes(1);
  });

  it('skips post-disconnect start() (race-check via _destroyed flag)', async () => {
    app = mount('<div data-controller="product-tour" data-product-tour-steps-value=\'[{"element":"#a"}]\'></div>');
    await tick();
    const el = document.querySelector('[data-controller="product-tour"]');
    const ctrl = app.getControllerForElementAndIdentifier(el, 'product-tour');
    ctrl.start();             // lazy-load now in flight, _destroyed still false
    ctrl._destroyed = true;   // race: the controller disconnects first
    await tick();
    await tick();
    // _beginTour should NOT have been called on the destroyed controller.
    expect(mockDriveFn).not.toHaveBeenCalled();
  });

  it('config passed to driver.js carries showProgress + popoverClass', async () => {
    app = mount('<div data-controller="product-tour" data-product-tour-steps-value=\'[{"element":"#a"}]\' data-product-tour-show-progress-value="true"></div>');
    await tick();
    const el = document.querySelector('[data-controller="product-tour"]');
    const ctrl = app.getControllerForElementAndIdentifier(el, 'product-tour');
    ctrl.start();
    await tick();
    await tick();
    const config = mockDriver.mock.calls[0][0];
    expect(config.showProgress).toBe(true);
    expect(config.popoverClass).toBe('theme-product-tour');
  });

  it('config localized button labels via t()', async () => {
    app = mount('<div data-controller="product-tour" data-product-tour-steps-value=\'[{"element":"#a"}]\'></div>');
    await tick();
    const el = document.querySelector('[data-controller="product-tour"]');
    const ctrl = app.getControllerForElementAndIdentifier(el, 'product-tour');
    ctrl.start();
    await tick();
    await tick();
    const config = mockDriver.mock.calls[0][0];
    // Without i18n loaded, t() falls back to the key — assert the key shape.
    expect(config.nextBtnText).toMatch(/theme\.onboarding\.product-tour\.next|Suivant/);
    expect(config.prevBtnText).toMatch(/theme\.onboarding\.product-tour\.previous|Précédent/);
  });
});
