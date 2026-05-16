import { Controller } from '@hotwired/stimulus';

/**
 * select — Single-select listbox, Input-anchored Popover trigger, with
 * aria-activedescendant pattern (per WAI-ARIA APG "Listbox").
 *
 * Composes the `popover` controller on the same wrap (data-controller=
 * "popover select") for surface positioning + animation + Esc/click-
 * outside dismiss. Adds:
 *
 *   1. role="listbox" on content + role="option" on each option (Twig-
 *      stamped — see select.html.twig).
 *   2. aria-activedescendant pattern (focus STAYS on the trigger button;
 *      `aria-activedescendant` points to the currently-active option's
 *      id). Different from DropdownMenu's roving tabindex — but the
 *      listbox pattern is the WAI-ARIA APG canonical for selection
 *      surfaces, AND it pre-pares Combobox (which mandates this pattern)
 *      to land in S2.3b without re-architecture.
 *   3. ArrowDown/Up + Home/End + Enter/Space + typeahead-friendly stub
 *      (typeahead implementation deferred — placeholder for amend).
 *   4. Hidden <input type="hidden" name="..."> for form integration.
 *      The select's value flows into form-data on submit, indistinguishable
 *      from <select>.
 *
 * Per OQ-28 doctrine: vanilla implementation, no Tom Select adapter in
 * S2.3a. Combobox (S2.3b) uses the same controller as foundation +
 * adds the search-as-you-type filter.
 *
 * Per S1.4b descriptor-binding gotcha (Collapsible §2 + ADR-0008): tests
 * call controller methods directly (`ctrl.keydown({key, ...})`).
 *
 * Targets:
 *   button       (required) — the visible trigger button (looks like Input).
 *   listbox      (required) — the popover content with role="listbox".
 *   option       (required, multiple) — each role="option" element.
 *   label        (required) — the span inside the button showing selected
 *                              label / placeholder.
 *   hiddenInput  (optional) — `<input type="hidden">` for form submit.
 *
 * Values:
 *   value       (String, default '') — currently-selected option value.
 *                                       Reflected on hiddenInput + button label.
 *   placeholder (String, default '') — text shown when no value selected.
 *
 * Events emitted:
 *   select:change — bubbles + composed. detail = { value, label }.
 *                   Fires on user selection (Enter or click); does NOT fire
 *                   on programmatic this.valueValue = '...'.
 */
export default class SelectController extends Controller {
  static targets = ['button', 'listbox', 'option', 'label', 'hiddenInput'];

  static values = {
    value: { type: String, default: '' },
    placeholder: { type: String, default: '' },
  };

  connect() {
    this._activeIdx = -1;
    this.element.addEventListener('popover:open', this._onPopoverOpen);
  }

  disconnect() {
    this.element.removeEventListener('popover:open', this._onPopoverOpen);
  }

  /**
   * Active (non-disabled) options in DOM order. Disabled options are
   * excluded from keyboard nav AND aren't selectable via click handler.
   */
  get options() {
    return this.optionTargets.filter(
      (o) => o.getAttribute('aria-disabled') !== 'true',
    );
  }

  _onPopoverOpen = () => {
    const opts = this.options;
    if (opts.length === 0) return;
    // Initial activedescendant: the currently-selected option, or first.
    const selectedIdx = opts.findIndex(
      (o) => o.getAttribute('aria-selected') === 'true',
    );
    const initialIdx = selectedIdx >= 0 ? selectedIdx : 0;
    this._setActive(initialIdx);
    // Per aria-activedescendant pattern: focus STAYS on trigger.
    if (this.hasButtonTarget) this.buttonTarget.focus();
  };

  _setActive(idx) {
    this._activeIdx = idx;
    const opts = this.options;
    if (idx < 0 || idx >= opts.length) return;
    opts.forEach((o, i) => {
      o.dataset.active = i === idx ? 'true' : 'false';
    });
    if (this.hasButtonTarget) {
      this.buttonTarget.setAttribute('aria-activedescendant', opts[idx].id);
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
   * Wired via `data-action="keydown->select#keydown"` on the wrap.
   * Handles open-on-keydown (when closed) AND nav-on-keydown (when open).
   */
  keydown(event) {
    const popover = this._popoverController;
    const isOpen = popover && popover.openValue;

    // Closed: ArrowDown/Up/Enter/Space open the listbox.
    if (!isOpen) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        if (popover) popover.open();
      }
      return;
    }

    // Open: navigate or select.
    const opts = this.options;
    if (opts.length === 0) return;
    let nextIdx = this._activeIdx;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        nextIdx = Math.min(opts.length - 1, this._activeIdx + 1);
        this._setActive(nextIdx);
        return;
      case 'ArrowUp':
        event.preventDefault();
        nextIdx = Math.max(0, this._activeIdx - 1);
        this._setActive(nextIdx);
        return;
      case 'Home':
        event.preventDefault();
        this._setActive(0);
        return;
      case 'End':
        event.preventDefault();
        this._setActive(opts.length - 1);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this._activeIdx >= 0) this._selectIdx(this._activeIdx);
        return;
      default:
        return;
    }
  }

  /**
   * Wired via `data-action="click->select#onOptionClick"` on the wrap.
   * Catches bubbled clicks from options (the role="option" elements).
   */
  onOptionClick(event) {
    const allOpts = this.optionTargets;
    const clickedOpt = allOpts.find(
      (o) => o === event.target || o.contains(event.target),
    );
    if (!clickedOpt) return;
    if (clickedOpt.getAttribute('aria-disabled') === 'true') return;
    const enabledIdx = this.options.indexOf(clickedOpt);
    if (enabledIdx >= 0) this._selectIdx(enabledIdx);
  }

  _selectIdx(idx) {
    const opts = this.options;
    if (idx < 0 || idx >= opts.length) return;
    const opt = opts[idx];
    const value = opt.dataset.value || '';
    const label =
      opt.querySelector('.cremona-item__label')?.textContent ||
      opt.textContent.trim() ||
      '';

    // Update aria-selected on ALL options (including disabled — they
    // could in theory be the currently-selected if SSR put them so).
    this.optionTargets.forEach((o) => {
      o.setAttribute('aria-selected', o === opt ? 'true' : 'false');
    });

    this.valueValue = value;
    if (this.hasLabelTarget) {
      this.labelTarget.textContent = label;
      this.labelTarget.dataset.placeholder = 'false';
    }
    if (this.hasHiddenInputTarget) this.hiddenInputTarget.value = value;

    this.element.dispatchEvent(
      new CustomEvent('select:change', {
        bubbles: true,
        composed: true,
        detail: { value, label },
      }),
    );

    const popover = this._popoverController;
    if (popover) popover.close();
  }

  get _popoverController() {
    return this.application.getControllerForElementAndIdentifier(
      this.element,
      'popover',
    );
  }
}
