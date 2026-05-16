import { Controller } from '@hotwired/stimulus';
import { t } from '../utils/i18n.js';

/**
 * tag-dismiss — minimal dismiss handler for the Tag compound (S2.6 — opt-in).
 *
 * Mirrors the alert-dismiss S1.4b pattern verbatim — the only differences :
 *   - The Tag's label is interpolated into the announcer message
 *     ("Étiquette « Java » retirée.") so SR users know which tag was
 *     removed when several are present.
 *   - The dispatched event prefix is `tag` (not `alert`).
 *
 * Responsibilities:
 *   1. On click of the inner dismiss button, stamp `data-state="dismissing"`
 *      on the Tag root so CSS fades the opacity 1 → 0 in 120 ms accelerate.
 *   2. After the opacity transition ends, remove the Tag from the DOM,
 *      dispatch `tag:dismissed` (bubbles + composed, detail = { label }),
 *      and announce the dismissal via the shared `#cremona-announcer` live
 *      region.
 *
 * Why a 2-step dismiss instead of an instant remove :
 *   The CSS fade-out is the visual feedback that "the action registered".
 *   An instant `element.remove()` looks abrupt and can desync with the user's
 *   cursor still hovering the dismiss button. The transitionend gate keeps
 *   the animation honest under reduced-motion (the global override compresses
 *   the duration to 0.01 ms — transitionend still fires, the remove still
 *   happens, no UX regression).
 *
 * Doctrine (OQ-mini Tag — S2.6) : Tag is opt-in dismissable via the
 * consumer's `dismissable: true` Twig flag. The default Tag is read-only
 * (no controller, no dismiss button) — same "smallest viable surface +
 * opt-in via prop" doctrine as OQ-37 / OQ-38.
 *
 * Values:
 *   label (string, default '') — the visible Tag label (consumer-resolved).
 *                                 Interpolated into the announcer message.
 */
export default class TagDismissController extends Controller {
  static values = { label: { type: String, default: '' } };

  dismiss() {
    this.element.dataset.state = 'dismissing';
    this.element.addEventListener('transitionend', this.finalize, { once: true });
  }

  finalize = (event) => {
    if (event.propertyName && event.propertyName !== 'opacity') {
      this.element.addEventListener('transitionend', this.finalize, { once: true });
      return;
    }
    const label = this.labelValue;
    this.announce(label);
    this.element.dispatchEvent(
      new CustomEvent('tag:dismissed', {
        bubbles: true,
        composed: true,
        detail: { label },
      }),
    );
    this.element.remove();
  };

  announce(label) {
    const announcer = typeof document !== 'undefined'
      ? document.getElementById('cremona-announcer')
      : null;
    if (!announcer) return;
    announcer.textContent = t('theme.tag.aria.dismissed', { label });
  }
}
