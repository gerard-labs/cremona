import { Controller } from '@hotwired/stimulus';

/**
 * dropdown-menu — orchestrates `role="menu"` + `role="menuitem"` semantics
 * on a Popover-positioned list of Items. Composes with the `popover`
 * controller on the SAME element (the wrap carries
 * `data-controller="popover dropdown-menu"`).
 *
 * Responsibilities:
 *   1. Stamp `role="menuitem"` on each `.cremona-item` descendant of the
 *      popover content. Idempotent: if the consumer already wrote a role
 *      on the Item, we don't overwrite. The Popover content gets
 *      `role="menu"` (also idempotent).
 *
 *   2. Roving tabindex — exactly ONE item carries `tabindex=0`; the rest
 *      have `tabindex=-1`. Initial roving lands on the first non-disabled
 *      item. The user Tabs into the menu and lands on that item; from
 *      there, Arrow Up/Down (cyclic) + Home/End move focus. The Tab key
 *      itself leaves the menu (per WAI-ARIA APG "Menu Button").
 *
 *   3. Enter/Space on a focused item → trigger native click(). For
 *      `<a>` items, native Enter navigation runs and our synthetic
 *      .click() is a no-op (we intercept before Enter would natively
 *      fire). For `<button>` items, Enter/Space fire native click; we
 *      preventDefault before to avoid double-firing. For `<div>` items
 *      (the canonical Item form per Item.md §2 — DropdownMenu the
 *      orchestrator), the synthetic .click() dispatches a click event
 *      that consumer-side `data-action="click->..."` listeners receive.
 *
 *   4. Close-on-item-click — clicking ANY item inside the menu also
 *      closes the popover. The consumer's data-action runs first (it's
 *      on the deeper Item element); our handler on the wrap fires after
 *      bubble; we call popover.close().
 *
 *   5. Focus first item on open — listens for `popover:open` and moves
 *      focus + roving to the first non-disabled item.
 *
 * Per S1.4b descriptor-binding gotcha (Collapsible §2 + ADR-0008): tests
 * call controller methods directly (`ctrl.keydown({key:'ArrowDown', ...})`)
 * rather than synthesising keydown events through Stimulus's descriptors.
 */
export default class DropdownMenuController extends Controller {
  connect() {
    this._initRoles();
    this._initRovingTabindex();
    this.element.addEventListener('popover:open', this._onPopoverOpen);
    // Tab-out dismiss (OQ-27 — sealed S2.2 opening). When focus leaves the
    // wrap (relatedTarget outside this.element), close the popover via
    // cross-controller lookup. WCAG SC 2.4.7 focus-management; prevents
    // an "aria-expanded=true while focus is gone" inconsistency that
    // Menubar / NavigationMenu (Ring 2 future) would otherwise inherit.
    this.element.addEventListener('focusout', this._onFocusOut);
  }

  disconnect() {
    this.element.removeEventListener('popover:open', this._onPopoverOpen);
    this.element.removeEventListener('focusout', this._onFocusOut);
  }

  _onFocusOut = (event) => {
    const next = event.relatedTarget;
    // null relatedTarget = focus leaving the document entirely (window blur,
    // devtools, alt-tab). Treat as outside-the-wrap and dismiss.
    if (next && this.element.contains(next)) return;
    const popover = this._popoverController;
    if (popover && popover.openValue && typeof popover.close === 'function') {
      popover.close();
    }
  };

  /** Stamp role="menu" on the popover content + role="menuitem" on every
      .cremona-item descendant. Non-destructive: existing roles are kept. */
  _initRoles() {
    const content = this._content;
    if (content && !content.hasAttribute('role')) {
      content.setAttribute('role', 'menu');
    }
    for (const item of this._allItems) {
      if (!item.hasAttribute('role')) item.setAttribute('role', 'menuitem');
    }
  }

  _initRovingTabindex() {
    const items = this.items;
    if (items.length === 0) return;
    items.forEach((item, i) => {
      item.tabIndex = i === 0 ? 0 : -1;
    });
  }

  /** `role="menuitem"` items that are NOT disabled, in DOM order. */
  get items() {
    return this._allItems.filter(
      (el) =>
        !el.hasAttribute('aria-disabled') ||
        el.getAttribute('aria-disabled') !== 'true',
    );
  }

  get _allItems() {
    if (!this._content) return [];
    return Array.from(this._content.querySelectorAll('.cremona-item'));
  }

  get _content() {
    return this.element.querySelector('[data-popover-target="content"]');
  }

  get _popoverController() {
    return this.application.getControllerForElementAndIdentifier(
      this.element,
      'popover',
    );
  }

  _onPopoverOpen = () => {
    const items = this.items;
    if (items.length === 0) return;
    items[0].focus();
    this._setRovingTabindex(0);
  };

  /**
   * Wired via `data-action="keydown->dropdown-menu#keydown"` on the wrap.
   * Handles Arrow Up/Down (cyclic), Home/End, Enter/Space (activate),
   * Esc (close menu via popover).
   */
  keydown(event) {
    const items = this.items;
    if (items.length === 0) return;
    const currentIdx = items.indexOf(document.activeElement);
    // Allow keydown even when focus is on the trigger before first item —
    // ArrowDown should jump to first item.
    if (currentIdx === -1) {
      if (event.key === 'ArrowDown' || event.key === 'Home') {
        event.preventDefault();
        items[0].focus();
        this._setRovingTabindex(0);
      } else if (event.key === 'ArrowUp' || event.key === 'End') {
        event.preventDefault();
        const last = items.length - 1;
        items[last].focus();
        this._setRovingTabindex(last);
      }
      return;
    }

    let nextIdx = -1;
    switch (event.key) {
      case 'ArrowDown':
        nextIdx = (currentIdx + 1) % items.length;
        break;
      case 'ArrowUp':
        nextIdx = (currentIdx - 1 + items.length) % items.length;
        break;
      case 'Home':
        nextIdx = 0;
        break;
      case 'End':
        nextIdx = items.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        items[currentIdx].click();
        return;
      default:
        return;
    }
    event.preventDefault();
    this._setRovingTabindex(nextIdx);
    items[nextIdx].focus();
  }

  /**
   * Wired via `data-action="click->dropdown-menu#onItemClick"` on the wrap.
   * Catches bubbled clicks from items (after the item's own `data-action`
   * consumer handler runs). Closes the popover via cross-controller
   * lookup.
   */
  onItemClick(event) {
    const items = this._allItems;
    const clickedItem = items.find(
      (item) => item === event.target || item.contains(event.target),
    );
    if (!clickedItem) return;
    if (
      clickedItem.hasAttribute('aria-disabled') &&
      clickedItem.getAttribute('aria-disabled') === 'true'
    ) {
      return;
    }
    const popover = this._popoverController;
    if (popover && typeof popover.close === 'function') {
      popover.close();
    }
  }

  _setRovingTabindex(activeIdx) {
    this.items.forEach((item, i) => {
      item.tabIndex = i === activeIdx ? 0 : -1;
    });
  }
}
