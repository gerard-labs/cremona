import SelectController from './select_controller.js';
import { t } from '../utils/i18n.js';

/**
 * combobox — Search-as-you-type single-select listbox, Input-anchored, with
 * aria-autocomplete="list" (WAI-ARIA APG "Combobox with listbox popup").
 *
 * Architecture: `ComboboxController extends SelectController` (per OQ-32
 * sealed S2.3b opening). Combobox IS-A Select with an Input trigger + filter
 * logic. The inheritance reuses, unchanged:
 *
 *   - aria-activedescendant nav loop (Arrow Up/Down clamp, Home/End, Enter)
 *   - role="listbox" + role="option" surface semantics (Twig-stamped)
 *   - hidden <input type="hidden"> form-data wiring
 *   - cross-controller lookup of the co-mounted `popover` controller
 *   - SelectController's `options` getter — overridden here to also exclude
 *     filter-hidden options from keyboard nav.
 *
 * Adds:
 *   1. Input trigger (`<input type="text" role="combobox">`) in place of
 *      Select's <button>. Targets the same `aria-activedescendant` semantics.
 *   2. `filter(event)` — wired via `data-action="input->combobox#filter"`.
 *      Substring case-insensitive match on each option's label. Hidden
 *      options are excluded from nav; empty state renders inline when count = 0.
 *   3. `_announceResults(count)` — pushes a localized "N résultats" message
 *      to the shared `#theme-announcer` aria-live region (per OQ-31 sealed
 *      S2.3b — single shared region from base/reset.css, NOT per-instance).
 *   4. Esc-clear semantics (per WAI-ARIA APG Combobox): first Esc clears the
 *      input query; second Esc (or Esc when query is empty) closes via the
 *      window-scoped popover#close.
 *   5. Focusout dismiss (mirror DropdownMenu OQ-27 S2.2). Tab-out closes the
 *      listbox so aria-expanded never desyncs from focus location.
 *
 * Per S1.4b descriptor-binding gotcha (Collapsible §2, ADR-0008): tests call
 * controller methods directly (`ctrl.filter({target: ...})` / `ctrl.keydown(...)`).
 *
 * Per OQ-28 doctrine (sealed S2.3a): vanilla implementation, no Tom Select
 * adapter. Async-loading + virtual-scroll + multi-select are out of scope at
 * Ring 2 primitive; a Phase 4 ADR can revisit if real demand emerges.
 *
 * Targets (in ADDITION to inherited `option`, `hiddenInput` from Select —
 * Stimulus walks the prototype chain for static targets):
 *   input            (required) — the visible <input role="combobox"> trigger.
 *                                  Also serves as `data-popover-target="trigger"`.
 *   empty            (required) — the empty-state element rendered inline in
 *                                  the listbox; toggled `hidden` based on count.
 *   emptyQuery       (required) — the <strong> placeholder inside empty whose
 *                                  textContent reflects the current query
 *                                  (so the empty message reads "Aucun
 *                                  résultat pour « marie »").
 *   optionsContainer (required) — wrap around the rendered options, sibling
 *                                  to `empty` inside the listbox.
 *
 * Values (in ADDITION to inherited `value`, `placeholder` from Select):
 *   query (String, default '') — current filter query (reflected on
 *                                  `data-combobox-query-value` attribute).
 *
 * Events emitted:
 *   combobox:change — bubbles + composed. detail = { value, label }. Fires
 *                     on user selection (Enter or click); does NOT fire on
 *                     programmatic this.valueValue = '...'.
 *   combobox:filter — bubbles + composed. detail = { query, count }. Fires
 *                     on every filter() call so analytics can correlate query
 *                     length with result count (drives suggestion quality
 *                     metrics).
 *
 * Microcopy keys (rendered via i18n.t()):
 *   theme.combobox.aria.results-count.{one,other} — announced via aria-live.
 *
 * Inherited events from SelectController (kept identical):
 *   select:change is NOT emitted by ComboboxController — `combobox:change`
 *   carries the same payload but with the combobox namespace, mirroring the
 *   ContextMenu / Drawer / Sheet naming convention for inherited compounds.
 */
export default class ComboboxController extends SelectController {
  static targets = ['input', 'empty', 'emptyQuery', 'optionsContainer'];

  static values = {
    query: { type: String, default: '' },
  };

  connect() {
    super.connect();
    // Tab-out dismiss — mirror DropdownMenu OQ-27 (sealed S2.2). The user
    // tabs from the input past the last option (the listbox has no tab stops
    // — aria-activedescendant pattern) → focus leaves the wrap → close.
    this.element.addEventListener('focusout', this._onFocusOut);
  }

  disconnect() {
    super.disconnect();
    this.element.removeEventListener('focusout', this._onFocusOut);
  }

  /**
   * Override: include the filter-hidden status in the "navigable options"
   * filter so Arrow nav skips options the query has eliminated.
   */
  get options() {
    return this.optionTargets.filter(
      (o) =>
        o.getAttribute('aria-disabled') !== 'true' &&
        o.dataset.hidden !== 'true',
    );
  }

  /**
   * Override: set aria-activedescendant on the INPUT (not on a button — the
   * Combobox's trigger IS an input). Mirror SelectController's logic
   * otherwise.
   */
  _setActive(idx) {
    this._activeIdx = idx;
    const opts = this.options;
    if (idx < 0 || idx >= opts.length) {
      // No visible option to mark active — clear activedescendant if present.
      if (this.hasInputTarget) this.inputTarget.removeAttribute('aria-activedescendant');
      this.optionTargets.forEach((o) => {
        o.dataset.active = 'false';
      });
      return;
    }
    opts.forEach((o, i) => {
      o.dataset.active = i === idx ? 'true' : 'false';
    });
    // Hide-flagged options are NOT in `opts` — make sure their data-active is reset.
    this.optionTargets.forEach((o) => {
      if (!opts.includes(o)) o.dataset.active = 'false';
    });
    if (this.hasInputTarget) {
      this.inputTarget.setAttribute('aria-activedescendant', opts[idx].id);
    }
    if (typeof opts[idx].scrollIntoView === 'function') {
      try {
        opts[idx].scrollIntoView({ block: 'nearest' });
      } catch {
        // happy-dom may not support scrollIntoView options — ignore.
      }
    }
  }

  /**
   * Override: focus stays on the input (not button). The inherited
   * `_onPopoverOpen` from Select called `this.buttonTarget.focus()` which
   * doesn't exist here. We replace with the input.
   */
  _onPopoverOpen = () => {
    const opts = this.options;
    if (opts.length === 0) {
      // Listbox open but no visible options — empty state visible; no
      // activedescendant to set.
      return;
    }
    const selectedIdx = opts.findIndex(
      (o) => o.getAttribute('aria-selected') === 'true',
    );
    const initialIdx = selectedIdx >= 0 ? selectedIdx : 0;
    this._setActive(initialIdx);
    if (this.hasInputTarget) this.inputTarget.focus();
  };

  /**
   * Wired via `data-action="focus->combobox#openOnFocus"` on the input.
   * Opens the listbox when the input receives focus (per WAI-ARIA APG
   * Combobox — focus opens the listbox so AT users can navigate
   * immediately). Idempotent — popover.open() no-ops when already open.
   */
  openOnFocus() {
    const popover = this._popoverController;
    if (popover && !popover.openValue) popover.open();
  }

  /**
   * Wired via `data-action="input->combobox#filter"` on the input.
   * Filters options by case-insensitive substring match on the option's
   * label. Sets `data-hidden` + `hidden` on each option, toggles the empty
   * state, announces results count, and auto-opens the popover if closed.
   */
  filter(event) {
    const rawQuery = event && event.target ? event.target.value || '' : '';
    const query = rawQuery.trim().toLowerCase();
    this.queryValue = query;

    let visibleCount = 0;
    for (const opt of this.optionTargets) {
      const label = (
        opt.querySelector('.theme-item__label')?.textContent ||
        opt.textContent ||
        ''
      )
        .trim()
        .toLowerCase();
      const matches = query === '' || label.includes(query);
      opt.dataset.hidden = matches ? 'false' : 'true';
      opt.hidden = !matches;
      if (matches && opt.getAttribute('aria-disabled') !== 'true') {
        visibleCount++;
      }
    }

    // Empty state: visible iff visibleCount === 0.
    if (this.hasEmptyTarget) {
      this.emptyTarget.hidden = visibleCount > 0;
      if (visibleCount === 0 && this.hasEmptyQueryTarget) {
        // Show the user's UNTRIMMED query so they see what they typed
        // (preserves spaces / case in the empty message).
        this.emptyQueryTarget.textContent = rawQuery;
      }
    }

    this._announceResults(visibleCount);

    // Reset activedescendant to the first visible option (or clear).
    if (visibleCount > 0) {
      this._setActive(0);
    } else {
      this._setActive(-1);
    }

    // Auto-open the popover if user typed in a closed state.
    const popover = this._popoverController;
    if (popover && !popover.openValue) popover.open();

    // Fire analytics-friendly event with query + count.
    this.element.dispatchEvent(
      new CustomEvent('combobox:filter', {
        bubbles: true,
        composed: true,
        detail: { query, count: visibleCount },
      }),
    );
  }

  /**
   * Override: handle Esc-clear semantics + skip Space (which must be inserted
   * into the input). Otherwise delegate to SelectController.keydown via super.
   */
  keydown(event) {
    if (event.key === 'Escape') {
      // First Esc when query is non-empty: clear the query, keep popover open.
      if (
        this.queryValue !== '' &&
        this.hasInputTarget &&
        this.inputTarget.value !== ''
      ) {
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        this.inputTarget.value = '';
        this.filter({ target: this.inputTarget });
        return;
      }
      // Second Esc (or query was empty): let the window-scoped Esc->popover#close
      // action fire (Combobox doesn't preventDefault here).
      return;
    }

    const popover = this._popoverController;
    const isOpen = popover && popover.openValue;

    if (!isOpen) {
      // Closed: ArrowDown/Up opens (per APG Combobox — printable keys auto-open
      // via the input event, NOT this keydown path).
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        if (popover) popover.open();
      }
      return;
    }

    // Open: nav + select. NOTE: Space is intentionally NOT handled — it must
    // be inserted into the input as a literal character.
    const opts = this.options;
    if (opts.length === 0) {
      // Empty state visible — Enter does nothing, Arrow nav has nothing to move to.
      return;
    }
    let nextIdx = this._activeIdx;
    switch (event.key) {
      case 'ArrowDown':
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        nextIdx = Math.min(opts.length - 1, this._activeIdx + 1);
        this._setActive(nextIdx);
        return;
      case 'ArrowUp':
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        nextIdx = Math.max(0, this._activeIdx - 1);
        this._setActive(nextIdx);
        return;
      case 'Enter':
        if (this._activeIdx >= 0) {
          if (event && typeof event.preventDefault === 'function') {
            event.preventDefault();
          }
          this._selectIdx(this._activeIdx);
        }
        return;
      // Home / End / Space / typeahead: let native input behavior win.
      default:
        return;
    }
  }

  /**
   * Override: also (1) set the input.value to the selected option's label so
   * the user sees what they picked, (2) reset filter state so re-opening
   * shows all options, (3) dispatch `combobox:change` instead of
   * `select:change`.
   */
  _selectIdx(idx) {
    const opts = this.options;
    if (idx < 0 || idx >= opts.length) return;
    const opt = opts[idx];
    const value = opt.dataset.value || '';
    const label =
      opt.querySelector('.theme-item__label')?.textContent ||
      opt.textContent.trim() ||
      '';

    this.optionTargets.forEach((o) => {
      o.setAttribute('aria-selected', o === opt ? 'true' : 'false');
    });

    this.valueValue = value;

    if (this.hasInputTarget) {
      this.inputTarget.value = label;
      // Reset filter so the next open shows all options unfiltered.
      for (const o of this.optionTargets) {
        o.dataset.hidden = 'false';
        o.hidden = false;
      }
      if (this.hasEmptyTarget) this.emptyTarget.hidden = true;
      this.queryValue = '';
    }

    if (this.hasHiddenInputTarget) this.hiddenInputTarget.value = value;

    this.element.dispatchEvent(
      new CustomEvent('combobox:change', {
        bubbles: true,
        composed: true,
        detail: { value, label },
      }),
    );

    const popover = this._popoverController;
    if (popover) popover.close();
  }

  /**
   * Push a localized "N résultats" message to the shared #theme-announcer
   * aria-live region (per OQ-31 sealed S2.3b — single shared region).
   *
   * For count = 0, we deliberately do NOT announce here — the empty state
   * element rendered inline in the listbox carries the message visually AND
   * is announced by AT via DOM-mutation observation (NVDA / VoiceOver pick
   * up textContent change inside an `aria-live`-less region too, via
   * automatic announce-on-change heuristics).
   */
  _announceResults(count) {
    if (typeof document === 'undefined') return;
    const announcer = document.getElementById('theme-announcer');
    if (!announcer) return;
    if (count === 0) {
      // Empty state covers this — clear to avoid double-announce.
      announcer.textContent = '';
      return;
    }
    // i18n key per [11-naming §i18n]: theme.combobox.aria.results-count.{one,other}.
    // t() resolves the plural category via Intl.PluralRules.
    announcer.textContent = t('theme.combobox.aria.results-count', { count });
  }

  _onFocusOut = (event) => {
    const next = event.relatedTarget;
    // null relatedTarget = focus leaving the document entirely (window blur,
    // alt-tab, devtools). Treat as outside-the-wrap and dismiss — keeps
    // aria-expanded in sync with focus location (WCAG SC 2.4.7).
    if (next && this.element.contains(next)) return;
    const popover = this._popoverController;
    if (popover && popover.openValue && typeof popover.close === 'function') {
      popover.close();
    }
  };
}
