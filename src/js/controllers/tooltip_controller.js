import { Controller } from '@hotwired/stimulus';

/**
 * tooltip — minimal Esc-dismiss handler for the Tooltip primitive.
 *
 * The visibility itself is CSS-only (`.cremona-tooltip-wrap:hover` /
 * `:focus-within` reveals the tooltip with a 400 ms show delay). This
 * controller adds the WAI-ARIA APG "Esc dismisses" requirement that CSS
 * alone can't implement:
 *
 *   - `dismiss(event)` fires on Escape keydown anywhere inside the wrap.
 *     It stamps `data-state="dismissed"` on the wrapper so CSS forces
 *     the tooltip back to `opacity: 0`. The dismissal lasts until the
 *     user moves focus OUT and back IN — or hovers out — both of which
 *     `reset()` handles.
 *
 *   - `reset(event)` fires on `focusout` from the wrap. Removes the
 *     `data-state="dismissed"` so the next focus/hover shows the tooltip
 *     again. (Mouseleave is handled implicitly: when the mouse leaves
 *     the wrap, the `:hover` rule already drops opacity to 0 ; the next
 *     mouseenter re-triggers the 400 ms show. The dismissed flag stays
 *     set across hover-out/hover-in, which is correct — the user
 *     explicitly dismissed it, so it shouldn't pop right back on a
 *     same-focus re-hover. Only a fresh focus session restores it.)
 *
 * No targets, no values — the controller writes a single `data-state`
 * attribute on its own element.
 */
export default class TooltipController extends Controller {
  dismiss(event) {
    if (event.key !== 'Escape') return;
    this.element.dataset.state = 'dismissed';
    event.preventDefault();
  }

  reset(event) {
    // Only clear when focus has truly left the wrapper (focusout.relatedTarget
    // is the new focus owner; if it's still inside this.element, do nothing).
    if (event.relatedTarget && this.element.contains(event.relatedTarget)) return;
    delete this.element.dataset.state;
  }
}
