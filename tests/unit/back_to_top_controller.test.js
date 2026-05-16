import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import BackToTopController from '../../src/js/controllers/back_to_top_controller.js';

const tick = () => new Promise((r) => setTimeout(r, 0));

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('back-to-top', BackToTopController);
  return app;
}

describe('back-to-top controller', () => {
  let app;
  let originalScrollY;
  let scrollToSpy;

  beforeEach(() => {
    document.body.innerHTML = '';
    originalScrollY = window.scrollY;
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
    scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy;
    if (!window.matchMedia) {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    }
  });

  afterEach(() => {
    app?.stop();
    Object.defineProperty(window, 'scrollY', { value: originalScrollY, configurable: true, writable: true });
  });

  it('starts hidden when scrollY is below threshold', async () => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
    app = mount('<button data-controller="back-to-top" data-back-to-top-threshold-value="400"></button>');
    await tick();
    const button = document.querySelector('button');
    expect(button.getAttribute('data-visible')).toBe('false');
  });

  it('starts visible when initial scrollY exceeds threshold', async () => {
    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true, writable: true });
    app = mount('<button data-controller="back-to-top" data-back-to-top-threshold-value="400"></button>');
    await tick();
    const button = document.querySelector('button');
    expect(button.getAttribute('data-visible')).toBe('true');
  });

  it('flips to visible after scroll crosses threshold', async () => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
    app = mount('<button data-controller="back-to-top" data-back-to-top-threshold-value="400"></button>');
    await tick();
    const button = document.querySelector('button');
    expect(button.getAttribute('data-visible')).toBe('false');

    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true, writable: true });
    window.dispatchEvent(new Event('scroll'));
    await tick();
    expect(button.getAttribute('data-visible')).toBe('true');
  });

  it('dispatches back-to-top:show event on visibility flip', async () => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
    app = mount('<button data-controller="back-to-top" data-back-to-top-threshold-value="400"></button>');
    await tick();
    const button = document.querySelector('button');
    const handler = vi.fn();
    button.addEventListener('back-to-top:show', handler);

    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true, writable: true });
    window.dispatchEvent(new Event('scroll'));
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('scrollToTop calls window.scrollTo with smooth behavior', async () => {
    app = mount('<button data-controller="back-to-top"></button>');
    await tick();
    const button = document.querySelector('button');
    const ctrl = app.getControllerForElementAndIdentifier(button, 'back-to-top');
    ctrl.scrollToTop({ preventDefault: () => {} });
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' });
  });

  it('scrollToTop uses auto behavior under prefers-reduced-motion', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    app = mount('<button data-controller="back-to-top"></button>');
    await tick();
    const button = document.querySelector('button');
    const ctrl = app.getControllerForElementAndIdentifier(button, 'back-to-top');
    ctrl.scrollToTop({ preventDefault: () => {} });
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });

  it('dispatches back-to-top:click on scrollToTop', async () => {
    app = mount('<button data-controller="back-to-top"></button>');
    await tick();
    const button = document.querySelector('button');
    const handler = vi.fn();
    button.addEventListener('back-to-top:click', handler);
    const ctrl = app.getControllerForElementAndIdentifier(button, 'back-to-top');
    ctrl.scrollToTop({ preventDefault: () => {} });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not re-fire event when scroll state has not changed', async () => {
    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true, writable: true });
    app = mount('<button data-controller="back-to-top" data-back-to-top-threshold-value="400"></button>');
    await tick();
    const button = document.querySelector('button');
    const handler = vi.fn();
    button.addEventListener('back-to-top:show', handler);
    window.dispatchEvent(new Event('scroll'));
    await tick();
    expect(handler).toHaveBeenCalledTimes(0);
  });
});
