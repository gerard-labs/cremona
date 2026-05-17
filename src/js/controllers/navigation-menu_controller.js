import MenubarController from './menubar_controller.js';

/**
 * navigation-menu — Horizontal web-navigation menu. Extends MenubarController
 * with NO behavior changes — same Arrow nav (cyclic ArrowLeft/Right + Home/End),
 * same cascading-open, same role stamping mechanics (role="menubar" on the
 * inner wrap, role="menuitem" + aria-haspopup="menu" on each trigger), same
 * cross-controller Popover calls for opening submenus.
 *
 * What's different at the COMPOUND level (not the controller level):
 *
 *   1. The whole structure is wrapped in a `<nav aria-label="...">` landmark
 *      (per [13-accessibility-baseline §13 Landmarks](../../13-accessibility-baseline.md))
 *      so AT users can jump straight to the navigation region.
 *   2. Submenu items use Item with `as: 'a' href="..."` instead of `as: 'div'`
 *      (Menubar's DropdownMenu doctrine).
 *      Rationale: NavigationMenu items are typically real navigation
 *      destinations (URLs) — `<a href>` preserves middle-click open-in-new-tab,
 *      right-click open-in-new-window, scraper-followable links, and SR's
 *      "link" announcement.
 *   3. Per Item.md §7: `aria-current="page"` on the active item — consumer
 *      stamps this at server render time per the request's current URL.
 *   4. Mega-menu support (multi-column grid layout inside dropdown) is
 *      DEFERRED to Ring 3 `pattern:Nav-MegaMenu` (which composes NavigationMenu
 *      with a custom dropdown content layout). Simple-column dropdowns only
 *      at this stage.
 *
 * The controller exists for identifier symmetry — consumers mount
 * `data-controller="navigation-menu"` to signal the compound's identity
 * (analytics, debugging, manifest tracking) even though the behavior is
 * inherited verbatim from MenubarController. Stimulus's static targets +
 * values inherit unchanged via the ES prototype chain.
 *
 * Note on `<a href>` triggers (not submenu items — the TOP-LEVEL nav items):
 * for the case where a consumer wants a direct nav link at the menubar level
 * (no submenu), they can place an `<a href>` outside the NavigationMenu wrap.
 * NavigationMenu's controller assumes every `data-menubar-target="trigger"` is
 * a button that opens a submenu (matches Menubar's contract). Mixing
 * direct-link top-level items with submenu triggers would require an `is-link`
 * discriminator — out of scope; defer to a Ring 3 amend if real demand emerges.
 *
 * Tests call controller methods directly.
 */
export default class NavigationMenuController extends MenubarController {}
