/**
 * product_tour_controller.js — Onboarding-ProductTour (Ring 3 S3.2).
 *
 * Lazy-loads driver.js v1.x on first ProductTour mount per
 * ADR-0020. Mirror
 * [ADR-0011 / 0012 / 0013 / 0018] verbatim — module-scoped cache +
 * sync mount/ARIA + async tour start + race-check on disconnect.
 *
 * Surface :
 *   data-controller="product-tour"
 *   data-product-tour-steps-value='[{"element":"#anchor","popover":{"title":"…","description":"…"}}]'
 *   data-product-tour-auto-start-value="false"
 *   data-product-tour-show-progress-value="true"
 *
 *   data-action="click->product-tour#start"
 *
 *   Events (bubbles + composed) :
 *     product-tour:mount  (detail.stepCount)
 *     product-tour:start  (detail.stepCount)
 *     product-tour:skip
 *     product-tour:end
 */

import { Controller } from '@hotwired/stimulus';
import { t } from '../utils/i18n.js';

let _driver = null;
let _driverPromise = null;

function loadDriver() {
  if (_driver) return Promise.resolve(_driver);
  if (_driverPromise) return _driverPromise;
  _driverPromise = import('driver.js').then((mod) => {
    _driver = mod.driver;
    return _driver;
  });
  return _driverPromise;
}

export function __resetDriverCache() {
  _driver = null;
  _driverPromise = null;
}

export default class ProductTourController extends Controller {
  static targets = ['trigger'];
  static values = {
    steps: { type: Array, default: [] },
    autoStart: { type: Boolean, default: false },
    showProgress: { type: Boolean, default: true },
  };

  connect() {
    this._destroyed = false;
    this._driverInstance = null;
    this.element.setAttribute('data-product-tour-state', 'idle');
    this.element.dispatchEvent(
      new CustomEvent('product-tour:mount', {
        bubbles: true,
        composed: true,
        detail: { stepCount: this.stepsValue.length },
      }),
    );
    if (this.autoStartValue) this.start();
  }

  disconnect() {
    this._destroyed = true;
    if (this._driverInstance) {
      try {
        this._driverInstance.destroy();
      } catch {
        // driver.js may already be torn down — swallow.
      }
      this._driverInstance = null;
    }
  }

  /** Wired via `data-action="click->product-tour#start"`. */
  start() {
    if (_driver) {
      this._beginTour(_driver);
    } else {
      loadDriver().then((driverFn) => {
        if (this._destroyed) return;
        this._beginTour(driverFn);
      });
    }
  }

  _beginTour(driverFn) {
    this._driverInstance = driverFn({
      steps: this.stepsValue,
      showProgress: this.showProgressValue,
      popoverClass: 'cremona-product-tour',
      nextBtnText: t('theme.onboarding.product-tour.next'),
      prevBtnText: t('theme.onboarding.product-tour.previous'),
      doneBtnText: t('theme.onboarding.product-tour.finish'),
      progressText: t('theme.onboarding.product-tour.progress'),
      onDestroyStarted: () => {
        this.element.dispatchEvent(
          new CustomEvent('product-tour:skip', { bubbles: true, composed: true }),
        );
        this._driverInstance?.destroy();
      },
      onDestroyed: () => {
        if (this._destroyed) return;
        this.element.setAttribute('data-product-tour-state', 'idle');
        this.element.dispatchEvent(
          new CustomEvent('product-tour:end', { bubbles: true, composed: true }),
        );
      },
    });
    this.element.setAttribute('data-product-tour-state', 'active');
    this._driverInstance.drive();
    this.element.dispatchEvent(
      new CustomEvent('product-tour:start', {
        bubbles: true,
        composed: true,
        detail: { stepCount: this.stepsValue.length },
      }),
    );
  }
}
