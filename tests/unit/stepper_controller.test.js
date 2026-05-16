import { describe, it, expect, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import StepperController from '../../src/js/controllers/stepper_controller.js';

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the Stepper compound's `stepper` controller (S2.8).
 *
 * Per the mini-OQ Stepper resolution (declarative consumer-driven currentStep) :
 *  - Controller stamps data-state + aria-current on each step.
 *  - No setStep / next / prev API — consumer mutates `currentStepValue`
 *    via Stimulus value attribute, controller reflects in DOM.
 *
 * Coverage map (10 tests) :
 *
 *  Initial render
 *   1. connect → totalSteps auto-derives from stepTargets.length.
 *   2. connect with currentStep=2 → step 1 completed, step 2 current, step 3 upcoming.
 *   3. aria-current="step" stamped on the current step only.
 *
 *  State transitions
 *   4. currentStepValue change → re-syncs DOM + dispatches stepper:step-change.
 *   5. dispatch detail carries { currentStep, previousStep, totalSteps, completed }.
 *   6. completed flag true when currentStep > totalSteps.
 *   7. completed flag false on intermediate transitions.
 *
 *  Edge cases
 *   8. SSR data-state="disabled" preserved by _sync (controller doesn't override).
 *   9. connect → _sync runs before initial dispatch (no spurious event on mount).
 *  10. step with non-numeric data-step-index → skipped silently.
 */
describe('StepperController', () => {
  let app;

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
  });

  async function mount({ currentStep = 1, totalSteps = 0, disabledIdx = null } = {}) {
    const steps = [1, 2, 3, 4].map((i) => {
      const dis = disabledIdx === i ? ' data-state="disabled"' : '';
      return `<li id="s${i}" class="cremona-stepper__step"
        data-stepper-target="step"
        data-step-index="${i}"${dis}>
        <span class="cremona-stepper__indicator">${i}</span>
        <div class="cremona-stepper__text">
          <span class="cremona-stepper__label">Step ${i}</span>
        </div>
      </li>`;
    }).join('');
    document.body.innerHTML = `
      <ol id="stp" class="cremona-stepper"
        data-controller="stepper"
        data-stepper-current-step-value="${currentStep}"
        data-stepper-total-steps-value="${totalSteps}">${steps}</ol>
    `;
    app = Application.start();
    app.register('stepper', StepperController);
    await tick();
    await tick();
    return {
      wrap: document.getElementById('stp'),
      ctrl: app.controllers.find((c) => c.identifier === 'stepper'),
      step: (i) => document.getElementById(`s${i}`),
    };
  }

  // 1
  it('connect → totalSteps auto-derives from stepTargets.length', async () => {
    const { ctrl } = await mount({ currentStep: 1, totalSteps: 0 });
    expect(ctrl.totalStepsValue).toBe(4);
  });

  // 2
  it('connect with currentStep=2 → step 1 completed, step 2 current, step 3 upcoming', async () => {
    const { step } = await mount({ currentStep: 2 });
    expect(step(1).dataset.state).toBe('completed');
    expect(step(2).dataset.state).toBe('current');
    expect(step(3).dataset.state).toBe('upcoming');
    expect(step(4).dataset.state).toBe('upcoming');
  });

  // 3
  it('aria-current="step" stamped on the current step only', async () => {
    const { step } = await mount({ currentStep: 2 });
    expect(step(1).getAttribute('aria-current')).toBeNull();
    expect(step(2).getAttribute('aria-current')).toBe('step');
    expect(step(3).getAttribute('aria-current')).toBeNull();
    expect(step(4).getAttribute('aria-current')).toBeNull();
  });

  // 4
  it('currentStepValue change → re-syncs DOM + dispatches stepper:step-change', async () => {
    const { wrap, ctrl, step } = await mount({ currentStep: 1 });
    const events = [];
    wrap.addEventListener('stepper:step-change', (e) => events.push(e.detail));
    ctrl.currentStepValue = 3;
    await tick();
    expect(step(1).dataset.state).toBe('completed');
    expect(step(2).dataset.state).toBe('completed');
    expect(step(3).dataset.state).toBe('current');
    expect(step(4).dataset.state).toBe('upcoming');
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ currentStep: 3, previousStep: 1 });
  });

  // 5
  it('dispatch detail carries { currentStep, previousStep, totalSteps, completed }', async () => {
    const { wrap, ctrl } = await mount({ currentStep: 1 });
    const events = [];
    wrap.addEventListener('stepper:step-change', (e) => events.push(e.detail));
    ctrl.currentStepValue = 2;
    await tick();
    expect(events[0]).toEqual({
      currentStep: 2,
      previousStep: 1,
      totalSteps: 4,
      completed: false,
    });
  });

  // 6
  it('completed flag true when currentStep > totalSteps', async () => {
    const { wrap, ctrl } = await mount({ currentStep: 4 });
    const events = [];
    wrap.addEventListener('stepper:step-change', (e) => events.push(e.detail));
    ctrl.currentStepValue = 5;
    await tick();
    expect(events[0].completed).toBe(true);
  });

  // 7
  it('completed flag false on intermediate transitions', async () => {
    const { wrap, ctrl } = await mount({ currentStep: 1 });
    const events = [];
    wrap.addEventListener('stepper:step-change', (e) => events.push(e.detail));
    ctrl.currentStepValue = 3;
    await tick();
    expect(events[0].completed).toBe(false);
  });

  // 8
  it('SSR data-state="disabled" preserved by _sync (controller does not override)', async () => {
    const { step } = await mount({ currentStep: 2, disabledIdx: 4 });
    expect(step(4).dataset.state).toBe('disabled');
    expect(step(4).getAttribute('aria-current')).toBeNull();
  });

  // 9
  it('connect → _sync runs before initial dispatch (no spurious event on mount)', async () => {
    document.body.innerHTML = `
      <ol id="stp" class="cremona-stepper"
        data-controller="stepper"
        data-stepper-current-step-value="2">
        <li class="cremona-stepper__step" data-stepper-target="step" data-step-index="1"></li>
        <li class="cremona-stepper__step" data-stepper-target="step" data-step-index="2"></li>
      </ol>
    `;
    const wrap = document.getElementById('stp');
    const events = [];
    wrap.addEventListener('stepper:step-change', (e) => events.push(e.detail));
    app = Application.start();
    app.register('stepper', StepperController);
    await tick();
    await tick();
    expect(events).toHaveLength(0);
  });

  // 10
  it('step with non-numeric data-step-index → skipped silently', async () => {
    document.body.innerHTML = `
      <ol id="stp" class="cremona-stepper"
        data-controller="stepper"
        data-stepper-current-step-value="1">
        <li id="bad" class="cremona-stepper__step" data-stepper-target="step" data-step-index="oops"></li>
        <li id="ok"  class="cremona-stepper__step" data-stepper-target="step" data-step-index="1"></li>
      </ol>
    `;
    app = Application.start();
    app.register('stepper', StepperController);
    await tick();
    await tick();
    // Should not throw, and the bad item gets no data-state stamp.
    expect(document.getElementById('bad').dataset.state).toBeUndefined();
    expect(document.getElementById('ok').dataset.state).toBe('current');
  });
});
