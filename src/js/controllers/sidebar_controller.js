import { Controller } from '@hotwired/stimulus';

/**
 * sidebar — vertical application navigation with collapsible icon-only mode.
 *
 *  - **Event-only persistence** : the controller dispatches
 *    `sidebar:collapse-change` detail.{collapsed} on every toggle ; the
 *    consumer chooses persistance (localStorage / cookie / URL / no persist).
 *  - Kit doctrine "no implicit side effects" — mirrors Resizable, Combobox /
 *    Select / Tabs / Stepper dispatch patterns.
 *
 *  Mobile mode at < 768 px is consumer-owned composition — the Sidebar's
 *  content is wrapped inside a Sheet
 *  (`data-controller="sheet" data-sheet-edge-value="start"`) for the
 *  hamburger-driven drawer. The Sidebar controller itself does NOT inspect
 *  `window.matchMedia` — keeps the responsibility surface clean and the
 *  test pattern simple. CSS handles the mobile presentation : the
 *  desktop `<aside>` is `display: none` under 768 px ; consumer's Sheet
 *  carries the mobile entry point. See spec §9 for the documented pattern.
 *
 * Per WAI-ARIA :
 *  - `<aside>` landmark with `aria-label`.
 *  - Inner `<nav aria-label>` for the nav cluster (single landmark per
 *    Sidebar, distinct from <aside> via aria-label).
 *  - Active items carry `aria-current="page"` (consumer-stamped via SSR).
 *  - Collapsed mode hides labels via CSS sr-only (preserving the accessible
 *    name) — no controller-side aria-label manipulation needed.
 *
 * Targets :
 *   collapseToggle (optional) — the collapse toggle button. Stamps
 *                               `aria-expanded` to match the inverse of
 *                               `collapsedValue` (collapsed=false →
 *                               aria-expanded=true).
 *
 * Values :
 *   collapsed (Boolean, default false) — icon-only mode toggle.
 *
 * Events emitted (raw CustomEvent) :
 *   sidebar:collapse-change — bubbles + composed. detail = { collapsed:
 *                             boolean }. Fires AFTER the transition
 *                             (NOT on initial render — class-field guard).
 */
export default class SidebarController extends Controller {
  static targets = ['collapseToggle'];

  static values = {
    collapsed: { type: Boolean, default: false },
  };

  // Class field initialized BEFORE any Stimulus callback fires.
  // Null sentinel lets `collapsedValueChanged` detect initial-fire vs real
  // transition. Mirror Stepper guard pattern.
  _lastRenderedCollapsed = null;

  connect() {
    this._sync();
    this._lastRenderedCollapsed = this.collapsedValue;
  }

  /** Wired via `click->sidebar#toggleCollapse` on the collapse toggle button. */
  toggleCollapse() {
    this.collapsedValue = !this.collapsedValue;
  }

  /** Stimulus auto-callback : re-sync DOM + dispatch on real transition. */
  collapsedValueChanged(value, previous) {
    if (this._lastRenderedCollapsed === value) return;
    this._sync();
    const isInitialFire = this._lastRenderedCollapsed === null;
    this._lastRenderedCollapsed = value;
    if (!isInitialFire && previous !== value) {
      this._dispatch(value);
    }
  }

  /**
   * Stamp `data-collapsed` on the element (CSS paints icon-only mode) +
   * `aria-expanded` on the toggle button (inverse of collapsed — when the
   * sidebar is expanded, the toggle visually says "you can collapse me").
   */
  _sync() {
    const isCollapsed = !!this.collapsedValue;
    this.element.dataset.collapsed = isCollapsed ? 'true' : 'false';
    if (this.hasCollapseToggleTarget) {
      this.collapseToggleTarget.setAttribute(
        'aria-expanded',
        isCollapsed ? 'false' : 'true',
      );
    }
  }

  _dispatch(collapsed) {
    this.element.dispatchEvent(
      new CustomEvent('sidebar:collapse-change', {
        bubbles: true,
        composed: true,
        detail: { collapsed: !!collapsed },
      }),
    );
  }
}
