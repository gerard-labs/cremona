/**
 * form-with-steps controller — multi-step form wizard (foundation pattern of the Forms family).
 *
 * Ring 3 controller (multi-step form wizard — foundation pattern of the Forms family).
 *
 *  - Consumer-side validation only — kit dispatches `form-with-steps:before-next`
 *    (cancellable) before advancing ; consumer wires preventDefault if validation
 *    fails.
 *  - Cross-step state owned by consumer — kit dispatches events, consumer persists.
 *  - Cross-controller compose with Stepper Ring 2 via `data-controller="stepper
 *    form-with-steps"`. Stepper observes the same `currentStepValue` Stimulus value
 *    via shared data attribute.
 *  - Pure declarative consumer-driven `currentStep`.
 *
 * Class-field initial-fire guard (`_lastRenderedStep = null`) — initialized at
 * construction (BEFORE Stimulus callbacks fire) to distinguish "initial fire vs
 * real transition" without the `undefined`-vs-`null`
 * strict-inequality trap.
 *
 * Events dispatched on `this.element` (all bubble + composed) :
 *  form-with-steps:mount            { stepCount, currentStep }
 *  form-with-steps:step-change      { currentStep, previousStep, totalSteps, direction }
 *  form-with-steps:before-next      { currentStep, nextStep, totalSteps }     — cancellable
 *  form-with-steps:before-previous  { currentStep, previousStep, totalSteps } — cancellable
 *  form-with-steps:before-submit    { currentStep, totalSteps }               — cancellable
 *  form-with-steps:skip             { currentStep, totalSteps }
 */

import { Controller } from '@hotwired/stimulus';

export default class FormWithStepsController extends Controller {
  static targets = ['step', 'prevBtn', 'nextBtn', 'submitBtn', 'skipBtn', 'announcer'];
  static values = {
    currentStep: { type: Number, default: 1 },
    totalSteps:  { type: Number, default: 0 },
    allowSkip:   { type: Boolean, default: false },
  };

  // Class fields initialized at construction — runs BEFORE Stimulus callbacks fire,
  // sidesteps the `undefined`-vs-`null` strict-inequality trap.
  _lastRenderedStep = null;
  _destroyed = false;

  connect() {
    if (this.totalStepsValue === 0 && this.hasStepTarget) {
      this.totalStepsValue = this.stepTargets.length;
    }
    this._sync();
    this._dispatch('form-with-steps:mount', {
      stepCount: this.totalStepsValue,
      currentStep: this.currentStepValue,
    });
  }

  disconnect() {
    this._destroyed = true;
  }

  // Stimulus value-changed auto-callback ; fires on initial connect AND on every value transition.
  currentStepValueChanged(value, _previous) {
    this._sync();
    if (this._lastRenderedStep !== null && this._lastRenderedStep !== value) {
      const direction = value > this._lastRenderedStep ? 'forward'
                      : value < this._lastRenderedStep ? 'backward'
                      : 'jump';
      this._dispatch('form-with-steps:step-change', {
        currentStep: value,
        previousStep: this._lastRenderedStep,
        totalSteps: this.totalStepsValue,
        direction,
      });
      this._announce(value);
      this._focusFirstInput();
    }
    this._lastRenderedStep = value;
  }

  next() {
    const current = this.currentStepValue;
    if (current >= this.totalStepsValue) return;
    const nextStep = current + 1;
    const event = this._dispatch('form-with-steps:before-next', {
      currentStep: current,
      nextStep,
      totalSteps: this.totalStepsValue,
    }, /* cancellable */ true);
    if (event.defaultPrevented) return;
    this.currentStepValue = nextStep;
  }

  previous() {
    const current = this.currentStepValue;
    if (current <= 1) return;
    const previousStep = current - 1;
    const event = this._dispatch('form-with-steps:before-previous', {
      currentStep: current,
      previousStep,
      totalSteps: this.totalStepsValue,
    }, /* cancellable */ true);
    if (event.defaultPrevented) return;
    this.currentStepValue = previousStep;
  }

  submit(domEvent) {
    const event = this._dispatch('form-with-steps:before-submit', {
      currentStep: this.currentStepValue,
      totalSteps: this.totalStepsValue,
    }, /* cancellable */ true);
    if (event.defaultPrevented && domEvent) {
      domEvent.preventDefault();
    }
    // Else let the native <form> submit proceed.
  }

  skip() {
    this._dispatch('form-with-steps:skip', {
      currentStep: this.currentStepValue,
      totalSteps: this.totalStepsValue,
    });
  }

  // --- Internals ---

  _sync() {
    if (!this.hasStepTarget) return;
    const current = this.currentStepValue;
    const total = this.totalStepsValue;

    // Toggle visibility per step : only the current step's <fieldset> is NOT hidden.
    this.stepTargets.forEach((stepEl) => {
      const idx = parseInt(stepEl.dataset.stepIndex || '0', 10);
      if (idx === current) {
        stepEl.removeAttribute('hidden');
      } else {
        stepEl.setAttribute('hidden', '');
      }
    });

    // CTA visibility per state.
    if (this.hasPrevBtnTarget) {
      this._toggleHidden(this.prevBtnTarget, current === 1);
    }
    if (this.hasNextBtnTarget) {
      this._toggleHidden(this.nextBtnTarget, current === total);
    }
    if (this.hasSubmitBtnTarget) {
      this._toggleHidden(this.submitBtnTarget, current !== total);
    }
    if (this.hasSkipBtnTarget) {
      this._toggleHidden(this.skipBtnTarget, !this.allowSkipValue);
    }
  }

  _announce(stepIndex) {
    if (!this.hasAnnouncerTarget) return;
    // The announcer's text is mostly set by SSR (per-step transition message Twig-rendered) ;
    // here we just rewrite it to trigger the aria-live re-read. Consumer i18n keys are namespaced
    // under `theme.form.with-steps.aria.step-of` per Form-WithSteps.md §6.
    const msg = `${stepIndex} / ${this.totalStepsValue}`;
    this.announcerTarget.textContent = msg;
  }

  _focusFirstInput() {
    if (!this.hasStepTarget) return;
    const current = this.currentStepValue;
    const stepEl = this.stepTargets.find((el) => parseInt(el.dataset.stepIndex || '0', 10) === current);
    if (!stepEl) return;
    const firstInput = stepEl.querySelector('input, textarea, select, button:not([data-form-with-steps-target])');
    if (firstInput && typeof firstInput.focus === 'function') {
      firstInput.focus({ preventScroll: false });
    }
  }

  _toggleHidden(el, shouldHide) {
    if (shouldHide) {
      el.setAttribute('hidden', '');
    } else {
      el.removeAttribute('hidden');
    }
  }

  _dispatch(name, detail, cancellable = false) {
    const event = new CustomEvent(name, {
      bubbles: true,
      composed: true,
      cancelable: cancellable,
      detail,
    });
    this.element.dispatchEvent(event);
    return event;
  }
}
