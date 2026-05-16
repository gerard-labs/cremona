import DropdownMenuController from './dropdown-menu_controller.js';

/**
 * context-menu — DropdownMenu opened by `contextmenu` (right-click) at the
 * pointer coordinates instead of by clicking a visible trigger.
 *
 * Architecture (per Ring 2 S2.3 doctrine):
 *   - Inherits DropdownMenuController for ALL menu mechanics: role="menu" +
 *     role="menuitem" stamping, roving tabindex, Arrow Up/Down (cyclic),
 *     Home/End, Enter/Space activate, close-on-item-click, focusout
 *     dismiss (OQ-27 from S2.2).
 *   - Composes `popover` co-controller on the same wrap (data-controller=
 *     "popover dropdown-menu context-menu") for surface positioning +
 *     animation + Esc/click-outside dismiss — ZERO modification to the
 *     locked-in Popover code.
 *   - Adds: a `contextmenu` event listener on a configurable area (the
 *     wrap by default; `parent`, `window`, or a CSS selector also work).
 *     On fire: `event.preventDefault()` (suppresses the native browser
 *     context menu in that region), positions a phantom `<span>` trigger
 *     at (clientX, clientY) via `position: fixed`, and triggers
 *     popover.open() — Floating UI computes the position relative to the
 *     phantom, so flip / shift / autoUpdate apply unchanged.
 *
 * Per WAI-ARIA APG: same keyboard / SR pattern as DropdownMenu (the user
 * doesn't perceive a difference except for the right-click trigger).
 *
 * Per S1.4b descriptor-binding gotcha (Collapsible §2 + ADR-0008): tests
 * call controller methods directly (`ctrl.openAt({clientX, clientY, ...})`)
 * rather than synthesising contextmenu events through descriptors.
 *
 * Trade-off documented in [ContextMenu.md §1]: by suppressing the native
 * context menu in the area, we lose access to the browser's
 * back/forward/inspect entries inside that region. Standard for in-app
 * menus (Notion, Linear, Figma) — accepted.
 *
 * Targets (additional to inherited from DropdownMenuController):
 *   phantom (required) — the 0×0 <span> Floating UI uses as positioning
 *                        anchor. Stamped with data-popover-target="trigger"
 *                        in the Twig template so Popover sees it as its
 *                        trigger.
 *
 * Values:
 *   area (String, default 'self') — where right-clicks open the menu.
 *     'self'    — the wrap itself
 *     'parent'  — the wrap's parent element (typical for table-row context
 *                 menus where the menu is a child of the row)
 *     'window'  — anywhere in the document (use sparingly; only when the
 *                 menu is truly global)
 *     <css>     — any selector resolved via document.querySelector
 *
 * Events emitted (raw CustomEvent, bubbles + composed):
 *   context-menu:open  — detail = { x: clientX, y: clientY }. Fires
 *                        before popover.open() so consumers can mutate
 *                        items (e.g. enable/disable based on the
 *                        right-clicked element) BEFORE the menu shows.
 *   context-menu:close — fired in addition to popover:close for ergonomic
 *                        listener filtering on the consumer side.
 */
export default class ContextMenuController extends DropdownMenuController {
  static targets = ['phantom'];

  static values = {
    area: { type: String, default: 'self' },
  };

  connect() {
    super.connect();
    this._areaElement = this._resolveArea();
    if (this._areaElement && this._areaElement !== this.element) {
      this._areaElement.addEventListener('contextmenu', this._onAreaContextMenu);
    }
    // For the 'self' case, the data-action="contextmenu->context-menu#openAt"
    // on the wrap handles the listener via Stimulus — no manual listener.
    this.element.addEventListener('popover:close', this._onPopoverClose);
  }

  disconnect() {
    super.disconnect();
    if (this._areaElement && this._areaElement !== this.element) {
      this._areaElement.removeEventListener('contextmenu', this._onAreaContextMenu);
    }
    this.element.removeEventListener('popover:close', this._onPopoverClose);
    this._areaElement = null;
  }

  /**
   * Wired via `data-action="contextmenu->context-menu#openAt"` on the wrap
   * for the default 'self' area case. For non-self areas, the listener is
   * attached imperatively in connect() and routes through this same path.
   */
  openAt(event) {
    if (!event || typeof event.preventDefault !== 'function') return;
    event.preventDefault();
    if (!this.hasPhantomTarget) return;
    const x = typeof event.clientX === 'number' ? event.clientX : 0;
    const y = typeof event.clientY === 'number' ? event.clientY : 0;
    this._positionPhantom(x, y);
    this.element.dispatchEvent(
      new CustomEvent('context-menu:open', {
        bubbles: true,
        composed: true,
        detail: { x, y },
      }),
    );
    const popover = this._popoverController;
    if (!popover) return;
    if (popover.openValue) {
      // Already open elsewhere on the page — close + reopen at new coords.
      popover.close();
      // Defer the re-open one microtask so Popover's hide() finishes wiring.
      Promise.resolve().then(() => {
        if (!this.hasPhantomTarget) return;
        this._positionPhantom(x, y);
        const p2 = this._popoverController;
        if (p2) p2.open();
      });
    } else {
      popover.open();
    }
  }

  _onAreaContextMenu = (event) => {
    this.openAt(event);
  };

  _onPopoverClose = () => {
    this.element.dispatchEvent(
      new CustomEvent('context-menu:close', {
        bubbles: true,
        composed: true,
      }),
    );
  };

  _positionPhantom(x, y) {
    const phantom = this.phantomTarget;
    phantom.style.position = 'fixed';
    phantom.style.left = `${x}px`;
    phantom.style.top = `${y}px`;
    phantom.style.inlineSize = '0';
    phantom.style.blockSize = '0';
    phantom.style.pointerEvents = 'none';
  }

  _resolveArea() {
    const area = this.areaValue;
    if (!area || area === 'self') return this.element;
    if (area === 'parent') return this.element.parentElement;
    if (area === 'window' || area === 'document') return document.documentElement;
    if (typeof document !== 'undefined') {
      try {
        return document.querySelector(area);
      } catch {
        return null;
      }
    }
    return null;
  }
}
