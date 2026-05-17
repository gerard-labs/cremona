import { Controller } from '@hotwired/stimulus';

/**
 * stepper — step-by-step progress indicator (declarative, consumer-driven).
 *
 *  **Pure declarative — consumer drives `currentStep` via the value attribute.**
 *  The controller computes derived per-step state (completed / current /
 *  upcoming) + stamps `aria-current="step"` on the current step + emits
 *  `stepper:step-change` on transition. No setStep() / next() / prev() API
 *  surface — the consumer owns the state (typical : a multi-step form
 *  Stimulus controller listens to validation events and increments
 *  `currentStep` after each step passes).
 *
 *  Kit doctrine "no implicit side effects" + "consumer owns state" :
 *  controller doesn't persist size to localStorage.
 *
 * Per WAI-ARIA :
 *  - `<ol>` for ordered list semantics (linear flow).
 *  - `aria-current="step"` on the active step (per ARIA 1.2 token values).
 *  - `aria-label` on the ordered list (e.g. "Création de compte, étape 2 sur 4").
 *  - Number indicators are decorative (`aria-hidden="true"`) — the label /
 *    description carries the accessible name. Completed step paints a
 *    check-mark icon in the indicator (decorative).
 *
 * Stimulus value-changed guard pattern :
 *  - `currentStepValueChanged` fires BEFORE `connect()` with `previous = null`
 *    (not `undefined`). The defensive `if (this._lastRenderedStep === value)
 *    return` cache prevents double-render + spurious dispatch on initial fire.
 *
 * Targets :
 *   step (required) — every `<li>` step element. Each carries `data-step-
 *                     index="N"` (1-indexed) as the identifier.
 *
 * Values :
 *   currentStep (Number, default 1) — 1-indexed active step.
 *   totalSteps  (Number, default 0) — total step count (0 = derive from
 *                                     stepTargets.length at connect).
 *
 * Events emitted (raw CustomEvent) :
 *   stepper:step-change — bubbles + composed. detail = { currentStep,
 *                         previousStep, totalSteps, completed: boolean }.
 *                         `completed` is true when the new currentStep
 *                         exceeds totalSteps (consumer reached the end).
 */
export default class StepperController extends Controller {
  static targets = ['step'];

  static values = {
    currentStep: { type: Number, default: 1 },
    totalSteps: { type: Number, default: 0 },
  };

  // Class field initialized BEFORE any Stimulus callback fires (constructor
  // runs first, then Stimulus reads values + invokes `currentStepValueChanged`
  // BEFORE `connect()`). Null sentinel lets the value-changed callback detect
  // "first fire vs real transition" — the `undefined`-vs-`null` strict
  // inequality trap is sidestepped by class-field init.
  _lastRenderedStep = null;

  connect() {
    // Derive totalSteps from the step targets if not explicitly set.
    if (this.totalStepsValue <= 0 && this.hasStepTarget) {
      this.totalStepsValue = this.stepTargets.length;
    }
    // _sync() is idempotent — already ran from currentStepValueChanged's
    // initial fire ; this re-run covers the rare case where the consumer
    // mounts without a value attribute (totalSteps defaulted to 0, no
    // valueChanged fired) AND ensures DOM consistency even if SSR drifted.
    this._sync();
    this._lastRenderedStep = this.currentStepValue;
  }

  /**
   * Stimulus auto-callback : re-sync DOM whenever currentStep changes.
   * Initial-fire detection : `_lastRenderedStep === null` means
   * pre-`connect()` first fire (class-field default value).
   */
  currentStepValueChanged(value, previous) {
    if (this._lastRenderedStep === value) return;
    this._sync();
    const isInitialFire = this._lastRenderedStep === null;
    this._lastRenderedStep = value;
    if (!isInitialFire) {
      this._dispatch(value, previous);
    }
  }

  /** Stamp `data-state` + `aria-current` on every step based on currentStep. */
  _sync() {
    if (!this.hasStepTarget) return;
    const current = this.currentStepValue;
    for (const step of this.stepTargets) {
      const idx = parseInt(step.dataset.stepIndex || '0', 10);
      if (!Number.isFinite(idx) || idx <= 0) continue;
      // Disabled steps preserve their data-state="disabled" stamp from SSR ;
      // the controller doesn't override consumer-set disabled state.
      if (step.dataset.state === 'disabled') {
        step.removeAttribute('aria-current');
        continue;
      }
      let state;
      if (idx < current) state = 'completed';
      else if (idx === current) state = 'current';
      else state = 'upcoming';
      step.dataset.state = state;
      if (state === 'current') step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    }
  }

  _dispatch(currentStep, previousStep) {
    const completed = this.totalStepsValue > 0 && currentStep > this.totalStepsValue;
    this.element.dispatchEvent(
      new CustomEvent('stepper:step-change', {
        bubbles: true,
        composed: true,
        detail: {
          currentStep,
          previousStep,
          totalSteps: this.totalStepsValue,
          completed,
        },
      }),
    );
  }
}
