import { Controller } from '@hotwired/stimulus';
import { t } from '../utils/i18n.js';

/**
 * alert-dismiss — minimal dismiss handler for the Alert primitive.
 *
 * Responsibilities:
 *   1. On click of the inner dismiss button, stamp `data-state="dismissing"`
 *      on the Alert root so CSS fades the opacity 1 → 0 in 120 ms accelerate.
 *   2. After the opacity transition ends, remove the Alert from the DOM,
 *      dispatch `alert:dismissed` (bubbles + composed) so external listeners
 *      can react, and announce the dismissal via the shared
 *      `#theme-announcer` live region.
 *
 * Why a 2-step dismiss instead of an instant remove:
 *   The CSS fade-out is the visual feedback that "the action registered".
 *   An instant `element.remove()` looks abrupt and can desync with the user's
 *   cursor still hovering the dismiss button. The transitionend gate keeps
 *   the animation honest under reduced-motion (the global override compresses
 *   the duration to 0.01 ms — transitionend still fires, the remove still
 *   happens, no UX regression).
 *
 * Doctrine (OQ-15): Alert is INLINE status, not modal. This controller does
 * NOT trap focus, does NOT push focus, does NOT create a backdrop. For modal
 * alert flows, see the Ring 2 `AlertDialog` compound.
 *
 * Values:
 *   message (string) — i18n key resolved via t() and posted into
 *                      #theme-announcer at dismiss time. Defaults to
 *                      'theme.alert.aria.dismissed' if absent.
 */
export default class AlertDismissController extends Controller {
  static values = { message: { type: String, default: 'theme.alert.aria.dismissed' } };

  dismiss() {
    this.element.dataset.state = 'dismissing';
    this.element.addEventListener('transitionend', this.finalize, { once: true });
  }

  finalize = (event) => {
    // Filter to the opacity transition so other transitioning properties
    // (background-color tweens, etc.) don't double-fire the cleanup.
    if (event.propertyName && event.propertyName !== 'opacity') {
      this.element.addEventListener('transitionend', this.finalize, { once: true });
      return;
    }
    this.announce();
    this.dispatch('dismissed', { prefix: 'alert', bubbles: true });
    this.element.remove();
  };

  announce() {
    const announcer = typeof document !== 'undefined'
      ? document.getElementById('theme-announcer')
      : null;
    if (!announcer) return;
    announcer.textContent = t(this.messageValue);
  }
}
