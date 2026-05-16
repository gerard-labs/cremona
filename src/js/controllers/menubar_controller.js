import { Controller } from '@hotwired/stimulus';

/**
 * menubar — Pure orchestrator coordinating N standalone DropdownMenu
 * compounds along a horizontal menubar (File / Edit / View / ...).
 *
 * Per OQ-30 (sealed S2.3a opening): per-submenu DropdownMenus (each fully
 * standalone) + a thin menubar orchestrator (~70 effective lines). The N
 * DropdownMenu controllers handle their own role="menu" / role="menuitem"
 * stamping + roving tabindex + Arrow Up/Down + Esc dismiss; Menubar adds
 * the horizontal nav between triggers (ArrowLeft/Right cyclic + Home/End)
 * + ArrowDown to open the active trigger's submenu + Enter/Space activate.
 *
 * Targets:
 *   trigger (required, multiple) — each top-level menubar item (a button
 *                                   that triggers a DropdownMenu submenu).
 *
 * The trigger MUST be `data-popover-target="trigger"` (so its co-mounted
 * DropdownMenu can wire it as the popover anchor) AND `data-menubar-target="trigger"`
 * (so Menubar can find it for the roving nav).
 *
 * Per WAI-ARIA APG "Menubar (menu of menus)":
 *   - role="menubar" on the wrap (stamped here, idempotent).
 *   - role="menuitem" on each trigger (stamped here, idempotent).
 *   - aria-haspopup="menu" on each trigger (stamped here, idempotent).
 *   - aria-expanded is owned by each DropdownMenu's popover controller
 *     (Menubar does NOT touch this attribute — Popover does).
 *   - Roving tabindex among triggers (one tabindex=0; rest tabindex=-1).
 *   - ArrowLeft / ArrowRight: move focus + roving (cyclic).
 *   - Home / End: jump to first / last.
 *   - ArrowDown / Enter / Space: open the active trigger's submenu
 *     (focus auto-moves to the first menu item via the inherited
 *     DropdownMenu's `_onPopoverOpen` listener).
 *   - Esc (when any submenu is open): closes the submenu (handled by
 *     each DropdownMenu's window-scoped `keydown.esc@window->popover#close`
 *     action — Menubar does NOT need to coordinate this).
 *
 * **Cascading-open**: when a submenu is open and the user presses
 * ArrowLeft/Right/Home/End, the orchestrator closes the active submenu
 * AND opens the destination's submenu — matching macOS / Apple HIG menubar
 * idiom where "moving along the bar with menus open" feels native.
 *
 * Hover-open is NOT implemented at this layer (per S2.3b decision —
 * keyboard-first orchestrator). Hover-open is opt-in for a future Phase 4
 * `hoverOpen: true` value if real demand emerges. Documented in Menubar.md
 * §"Open trade-offs".
 *
 * Per S1.4b descriptor-binding gotcha: tests call controller methods
 * directly (`ctrl.keydown({key, ...})`, `ctrl.focusTrigger(idx)`).
 */
export default class MenubarController extends Controller {
  static targets = ['trigger'];

  connect() {
    this._initRoles();
    this._initRovingTabindex();
  }

  /**
   * Stamp role="menubar" on the wrap + role="menuitem" + aria-haspopup="menu"
   * on each trigger. Idempotent — skip if already set by the consumer.
   */
  _initRoles() {
    if (!this.element.hasAttribute('role')) {
      this.element.setAttribute('role', 'menubar');
    }
    for (const trigger of this.triggerTargets) {
      if (!trigger.hasAttribute('role')) {
        trigger.setAttribute('role', 'menuitem');
      }
      if (!trigger.hasAttribute('aria-haspopup')) {
        trigger.setAttribute('aria-haspopup', 'menu');
      }
    }
  }

  /** First non-disabled trigger gets tabindex=0; the rest get -1. */
  _initRovingTabindex() {
    const triggers = this.triggerTargets;
    if (triggers.length === 0) return;
    triggers.forEach((t, i) => {
      t.tabIndex = i === 0 ? 0 : -1;
    });
  }

  /**
   * Wired via `data-action="keydown->menubar#keydown"` on the menubar wrap.
   * Handles ArrowLeft/Right (cyclic with cascading-open), Home/End,
   * ArrowDown/Enter/Space (opens submenu).
   *
   * Esc inside an open submenu is handled by that DropdownMenu's
   * window-scoped Esc action — not here.
   */
  keydown(event) {
    const triggers = this.triggerTargets;
    if (triggers.length === 0) return;
    let currentIdx = triggers.indexOf(document.activeElement);

    // If focus is NOT on a trigger, check whether it's inside one of our
    // open submenus (the DropdownMenu's `_onPopoverOpen` auto-focuses the
    // first menu item on open — so the user's focus lands inside the
    // submenu, not on the trigger). Per WAI-ARIA APG "Menubar": when focus
    // is in an open submenu, ArrowLeft/Right/Home/End should cascade to
    // the adjacent trigger AND its submenu. DropdownMenu's keydown handler
    // ignores ArrowLeft/Right (only handles Up/Down/Home/End/Enter/Space),
    // so they bubble up here cleanly.
    if (currentIdx === -1) {
      const openTriggerIdx = triggers.findIndex((_t, i) => {
        const popover = this._popoverForIdx(i);
        return popover && popover.openValue;
      });
      if (
        openTriggerIdx !== -1 &&
        ['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)
      ) {
        currentIdx = openTriggerIdx;
      } else {
        return; // Focus is elsewhere — Menubar doesn't apply.
      }
    }

    let nextIdx;
    switch (event.key) {
      case 'ArrowRight':
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        nextIdx = (currentIdx + 1) % triggers.length;
        this._cascadeOpen(currentIdx, nextIdx);
        return;
      case 'ArrowLeft':
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        nextIdx = (currentIdx - 1 + triggers.length) % triggers.length;
        this._cascadeOpen(currentIdx, nextIdx);
        return;
      case 'Home':
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        this._cascadeOpen(currentIdx, 0);
        return;
      case 'End':
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        this._cascadeOpen(currentIdx, triggers.length - 1);
        return;
      case 'ArrowDown':
      case 'Enter':
      case ' ':
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        this._openAt(currentIdx);
        return;
      default:
        return;
    }
  }

  /**
   * Move focus + roving tabindex from `fromIdx` to `toIdx`. If a submenu
   * was open at the source, CLOSE it AND OPEN the destination's submenu
   * — the cascading-open behavior matching macOS / Apple HIG menubar idiom.
   *
   * Cross-controller calls find the Popover controller attached to each
   * DropdownMenu wrap (the wrap is the trigger's nearest `.cremona-popover`
   * ancestor — the same element that carries `data-controller="popover dropdown-menu"`).
   */
  _cascadeOpen(fromIdx, toIdx) {
    if (fromIdx === toIdx) return;
    const triggers = this.triggerTargets;
    if (toIdx < 0 || toIdx >= triggers.length) return;
    const sourcePopover = this._popoverForIdx(fromIdx);
    const wasOpen = sourcePopover ? sourcePopover.openValue : false;
    if (wasOpen) sourcePopover.close();
    this.focusTrigger(toIdx);
    if (wasOpen) {
      const destPopover = this._popoverForIdx(toIdx);
      if (destPopover) destPopover.open();
    }
  }

  /** Open the submenu at the given trigger index (idempotent). */
  _openAt(idx) {
    const popover = this._popoverForIdx(idx);
    if (popover && !popover.openValue) {
      popover.open();
    }
  }

  /** Move focus + roving tabindex to the trigger at the given index. */
  focusTrigger(idx) {
    const triggers = this.triggerTargets;
    if (idx < 0 || idx >= triggers.length) return;
    triggers.forEach((t, i) => {
      t.tabIndex = i === idx ? 0 : -1;
    });
    triggers[idx].focus();
  }

  /**
   * Find the Popover controller attached to the DropdownMenu wrap that
   * contains the trigger at the given index. The DropdownMenu wrap is
   * the trigger's nearest `.cremona-popover` ancestor — both DropdownMenu
   * and Popover controllers are mounted on that same element.
   */
  _popoverForIdx(idx) {
    const trigger = this.triggerTargets[idx];
    if (!trigger) return null;
    const wrap = trigger.closest('.cremona-popover');
    if (!wrap) return null;
    return this.application.getControllerForElementAndIdentifier(
      wrap,
      'popover',
    );
  }
}
