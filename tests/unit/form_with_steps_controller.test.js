import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import FormWithStepsController from '../../src/js/controllers/form_with_steps_controller.js';

const tick = () => new Promise((r) => setTimeout(r, 0));

function mount(html) {
  document.body.innerHTML = html;
  const app = Application.start();
  app.register('form-with-steps', FormWithStepsController);
  return app;
}

function defaultMarkup({ currentStep = 1, totalSteps = 3, allowSkip = false } = {}) {
  return `
    <div data-controller="form-with-steps"
         data-form-with-steps-current-step-value="${currentStep}"
         data-form-with-steps-total-steps-value="${totalSteps}"
         data-form-with-steps-allow-skip-value="${allowSkip}">
      <fieldset data-form-with-steps-target="step" data-step-index="1"${currentStep === 1 ? '' : ' hidden'}>
        <input type="email" name="email" />
      </fieldset>
      <fieldset data-form-with-steps-target="step" data-step-index="2"${currentStep === 2 ? '' : ' hidden'}>
        <input type="text" name="name" />
      </fieldset>
      <fieldset data-form-with-steps-target="step" data-step-index="3"${currentStep === 3 ? '' : ' hidden'}>
        <input type="text" name="confirm" />
      </fieldset>
      <div data-form-with-steps-target="announcer" aria-live="polite"></div>
      <button type="button" data-form-with-steps-target="skipBtn"${allowSkip ? '' : ' hidden'}>Plus tard</button>
      <button type="button" data-form-with-steps-target="prevBtn"${currentStep === 1 ? ' hidden' : ''}>Précédent</button>
      <button type="button" data-form-with-steps-target="nextBtn"${currentStep === totalSteps ? ' hidden' : ''}>Continuer</button>
      <button type="submit" data-form-with-steps-target="submitBtn"${currentStep !== totalSteps ? ' hidden' : ''}>Créer le compte</button>
    </div>
  `;
}

describe('form-with-steps controller', () => {
  let app;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    app?.stop();
  });

  it('dispatches form-with-steps:mount on connect with stepCount and currentStep', async () => {
    const handler = vi.fn();
    document.addEventListener('form-with-steps:mount', handler);
    app = mount(defaultMarkup());
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({ stepCount: 3, currentStep: 1 });
    document.removeEventListener('form-with-steps:mount', handler);
  });

  it('hides all steps except the current one on connect', async () => {
    app = mount(defaultMarkup({ currentStep: 2 }));
    await tick();
    const steps = document.querySelectorAll('[data-form-with-steps-target="step"]');
    expect(steps[0].hasAttribute('hidden')).toBe(true);
    expect(steps[1].hasAttribute('hidden')).toBe(false);
    expect(steps[2].hasAttribute('hidden')).toBe(true);
  });

  it('hides prevBtn on step 1 and submitBtn until last step', async () => {
    app = mount(defaultMarkup({ currentStep: 1 }));
    await tick();
    const prev = document.querySelector('[data-form-with-steps-target="prevBtn"]');
    const next = document.querySelector('[data-form-with-steps-target="nextBtn"]');
    const submit = document.querySelector('[data-form-with-steps-target="submitBtn"]');
    expect(prev.hasAttribute('hidden')).toBe(true);
    expect(next.hasAttribute('hidden')).toBe(false);
    expect(submit.hasAttribute('hidden')).toBe(true);
  });

  it('shows submitBtn and hides nextBtn on last step', async () => {
    app = mount(defaultMarkup({ currentStep: 3 }));
    await tick();
    const next = document.querySelector('[data-form-with-steps-target="nextBtn"]');
    const submit = document.querySelector('[data-form-with-steps-target="submitBtn"]');
    expect(next.hasAttribute('hidden')).toBe(true);
    expect(submit.hasAttribute('hidden')).toBe(false);
  });

  it('hides skipBtn by default and reveals when allowSkipValue=true', async () => {
    app = mount(defaultMarkup({ allowSkip: false }));
    await tick();
    const skip = document.querySelector('[data-form-with-steps-target="skipBtn"]');
    expect(skip.hasAttribute('hidden')).toBe(true);
    app.stop();

    app = mount(defaultMarkup({ allowSkip: true }));
    await tick();
    const skip2 = document.querySelector('[data-form-with-steps-target="skipBtn"]');
    expect(skip2.hasAttribute('hidden')).toBe(false);
  });

  it('next() advances currentStepValue and toggles visibility', async () => {
    app = mount(defaultMarkup({ currentStep: 1 }));
    await tick();
    const root = document.querySelector('[data-controller="form-with-steps"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'form-with-steps');
    ctrl.next();
    await tick();
    expect(ctrl.currentStepValue).toBe(2);
    const steps = document.querySelectorAll('[data-form-with-steps-target="step"]');
    expect(steps[0].hasAttribute('hidden')).toBe(true);
    expect(steps[1].hasAttribute('hidden')).toBe(false);
  });

  it('previous() regresses currentStepValue', async () => {
    app = mount(defaultMarkup({ currentStep: 2 }));
    await tick();
    const root = document.querySelector('[data-controller="form-with-steps"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'form-with-steps');
    ctrl.previous();
    await tick();
    expect(ctrl.currentStepValue).toBe(1);
  });

  it('next() at last step does nothing (clamped)', async () => {
    app = mount(defaultMarkup({ currentStep: 3 }));
    await tick();
    const root = document.querySelector('[data-controller="form-with-steps"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'form-with-steps');
    ctrl.next();
    expect(ctrl.currentStepValue).toBe(3);
  });

  it('previous() at first step does nothing (clamped)', async () => {
    app = mount(defaultMarkup({ currentStep: 1 }));
    await tick();
    const root = document.querySelector('[data-controller="form-with-steps"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'form-with-steps');
    ctrl.previous();
    expect(ctrl.currentStepValue).toBe(1);
  });

  it('dispatches form-with-steps:before-next (cancellable) before advancing', async () => {
    const handler = vi.fn((e) => e.preventDefault());
    document.addEventListener('form-with-steps:before-next', handler);
    app = mount(defaultMarkup({ currentStep: 1 }));
    await tick();
    const root = document.querySelector('[data-controller="form-with-steps"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'form-with-steps');
    ctrl.next();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(ctrl.currentStepValue).toBe(1); // not advanced because handler called preventDefault
    document.removeEventListener('form-with-steps:before-next', handler);
  });

  it('dispatches form-with-steps:step-change on real transition with direction', async () => {
    const handler = vi.fn();
    document.addEventListener('form-with-steps:step-change', handler);
    app = mount(defaultMarkup({ currentStep: 1 }));
    await tick();
    const root = document.querySelector('[data-controller="form-with-steps"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'form-with-steps');
    ctrl.next();
    await tick();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({
      currentStep: 2,
      previousStep: 1,
      totalSteps: 3,
      direction: 'forward',
    });
    document.removeEventListener('form-with-steps:step-change', handler);
  });

  it('skip() dispatches form-with-steps:skip event', async () => {
    const handler = vi.fn();
    document.addEventListener('form-with-steps:skip', handler);
    app = mount(defaultMarkup({ allowSkip: true }));
    await tick();
    const root = document.querySelector('[data-controller="form-with-steps"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'form-with-steps');
    ctrl.skip();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toEqual({ currentStep: 1, totalSteps: 3 });
    document.removeEventListener('form-with-steps:skip', handler);
  });

  it('submit() with preventDefault on before-submit cancels native submit', async () => {
    const handler = vi.fn((e) => e.preventDefault());
    document.addEventListener('form-with-steps:before-submit', handler);
    app = mount(defaultMarkup({ currentStep: 3 }));
    await tick();
    const root = document.querySelector('[data-controller="form-with-steps"]');
    const ctrl = app.getControllerForElementAndIdentifier(root, 'form-with-steps');
    const domEvent = { preventDefault: vi.fn() };
    ctrl.submit(domEvent);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(domEvent.preventDefault).toHaveBeenCalledTimes(1);
    document.removeEventListener('form-with-steps:before-submit', handler);
  });

  it('does not dispatch step-change on initial fire (class-field guard)', async () => {
    const handler = vi.fn();
    document.addEventListener('form-with-steps:step-change', handler);
    app = mount(defaultMarkup({ currentStep: 2 }));
    await tick();
    // step-change should NOT fire on connect — only on transition.
    expect(handler).toHaveBeenCalledTimes(0);
    document.removeEventListener('form-with-steps:step-change', handler);
  });
});
