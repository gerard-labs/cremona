import { Controller } from '@hotwired/stimulus';

/**
 * hover-card — Popover variant opened by hover (with delay) for visual
 * previews. Composes the `popover` controller on the same wrap
 * (`data-controller="popover hover-card"`). Popover handles surface +
 * positioning + dismiss; hover-card adds the hover-with-delay trigger.
 *
 * Per OQ-29 doctrine (sealed S2.3a opening): reuse Tooltip's 400 ms open
 * doctrine via inline timing, NO new motion token. Close delay 200 ms
 * (anti-flash on fast pointer movements). HoverCard is a *visual preview*
 * surface (≠ Tooltip which is descriptive metadata) — it intentionally
 * does NOT open on focus (would distract keyboard users with non-essential
 * content). Esc still dismisses (inherited from Popover) for keyboard
 * recovery.
 *
 * Touch behavior: HoverCard is desktop-first. On touch (no hover
 * capability), mouseenter/mouseleave events fire unreliably, so HoverCards
 * effectively don't open on tap. For touch-friendly preview surfaces, use
 * Popover or DropdownMenu instead. Documented trade-off.
 *
 * The mouse-into-content guard:
 *   The popover content is `position: fixed` — outside the wrap's bounding
 *   box. When the user hovers from trigger into the floating popover, the
 *   wrap's mouseleave fires (mouse left trigger element). Without the
 *   content-mouseenter guard, the close timer would fire mid-read. The
 *   controller listens on the content for mouseenter (cancel close) +
 *   mouseleave (schedule close).
 *
 * Per S1.4b descriptor-binding gotcha (Collapsible §2 + ADR-0008): tests
 * call controller methods directly (`ctrl.enter()`, `ctrl.leave()`).
 *
 * Targets: none direct (relies on cross-controller lookup for popover +
 * querySelector for the content element).
 *
 * Values:
 *   openDelay  (Number, default 400) — ms to wait after enter before opening.
 *                                      400 ms matches Tooltip's anti-flash
 *                                      doctrine (per 14-motion-baseline §1).
 *   closeDelay (Number, default 200) — ms to wait after leave before closing.
 *                                      Allows the user to move mouse from
 *                                      trigger to content without losing
 *                                      the card.
 *
 * Events emitted: none direct. Bubbled from Popover:
 *   popover:open / popover:close (consumers can filter to HoverCard wraps
 *   via `event.target.closest('.cremona-hover-card')`).
 */
export default class HoverCardController extends Controller {
  static values = {
    openDelay: { type: Number, default: 400 },
    closeDelay: { type: Number, default: 200 },
  };

  connect() {
    this._openTimer = null;
    this._closeTimer = null;
    this._content = this.element.querySelector('[data-popover-target="content"]');
    if (this._content) {
      this._content.addEventListener('mouseenter', this._onContentEnter);
      this._content.addEventListener('mouseleave', this._onContentLeave);
    }
  }

  disconnect() {
    if (this._content) {
      this._content.removeEventListener('mouseenter', this._onContentEnter);
      this._content.removeEventListener('mouseleave', this._onContentLeave);
    }
    this._content = null;
    this._clearTimers();
  }

  /**
   * Wired via `data-action="mouseenter->hover-card#enter"` on the wrap.
   * Cancels any pending close, schedules open after openDelayValue.
   */
  enter() {
    this._cancelClose();
    if (this._openTimer) return;
    this._openTimer = setTimeout(() => {
      this._openTimer = null;
      const popover = this._popoverController;
      if (popover && typeof popover.open === 'function') popover.open();
    }, this.openDelayValue);
  }

  /**
   * Wired via `data-action="mouseleave->hover-card#leave"` on the wrap.
   * Cancels any pending open, schedules close after closeDelayValue.
   */
  leave() {
    this._cancelOpen();
    if (this._closeTimer) return;
    this._closeTimer = setTimeout(() => {
      this._closeTimer = null;
      const popover = this._popoverController;
      if (popover && typeof popover.close === 'function') popover.close();
    }, this.closeDelayValue);
  }

  _onContentEnter = () => {
    this._cancelClose();
  };

  _onContentLeave = () => {
    this.leave();
  };

  _cancelOpen() {
    if (this._openTimer) {
      clearTimeout(this._openTimer);
      this._openTimer = null;
    }
  }

  _cancelClose() {
    if (this._closeTimer) {
      clearTimeout(this._closeTimer);
      this._closeTimer = null;
    }
  }

  _clearTimers() {
    this._cancelOpen();
    this._cancelClose();
  }

  get _popoverController() {
    return this.application.getControllerForElementAndIdentifier(
      this.element,
      'popover',
    );
  }
}
