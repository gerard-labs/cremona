import { Controller } from '@hotwired/stimulus';

/**
 * tabs — accessible tab interface with WAI-ARIA APG "Tabs" semantics.
 *
 *  - **Activation mode default = `automatic`** (Arrow keys focus + select
 *    immediately — pattern Stripe / Vercel / Notion / Linear, per WAI-ARIA
 *    APG "Tabs with Automatic Activation").
 *  - **Opt-in `activation: 'manual'`** for heavy-content tabs (data fetch
 *    on activate) — Arrow keys focus only, Enter / Space activates.
 *
 * Per WAI-ARIA APG :
 *  - `role="tablist"` on the wrap of triggers (consumer-stamped via Twig).
 *  - `role="tab"` + `aria-selected` + `aria-controls` on each trigger.
 *  - `role="tabpanel"` + `aria-labelledby` on each panel.
 *  - **Roving tabindex** : active tab has `tabindex="0"`, inactive
 *    have `tabindex="-1"`. Tab key exits the tab list (focus moves to
 *    panel content or next tab-stop after).
 *  - Arrow Left / Right (horizontal) OR Arrow Up / Down (vertical) cycle
 *    among non-disabled triggers ; Home / End jump first / last.
 *
 * Events emitted (raw CustomEvent — mirrors Combobox / Pagination doctrine ;
 *                  avoids Stimulus `dispatch()` prefix interpretation) :
 *   tabs:change — bubbles + composed. detail = { value, previousValue }.
 *                 Fires AFTER the activation transition (NOT on initial render).
 *
 * Stimulus value-changed guard pattern :
 *  - `valueValueChanged` fires BEFORE `connect()` with `previous = null`
 *    (not `undefined`). Defensive `if (this._lastRenderedValue === value)
 *    return` cache prevents double-render + spurious dispatch.
 *
 * Targets :
 *   list (required)    — the `role="tablist"` wrap.
 *   trigger (required) — every `role="tab"` button. Each carries
 *                        `data-tab-id="<id>"` as the value identifier.
 *   panel (required)   — every `role="tabpanel"` panel. Each carries
 *                        `data-tab-id="<id>"` matching one trigger.
 *
 * Values :
 *   value (String) — currently active tab id (matches one `data-tab-id`).
 *                    If empty / unset at `connect`, falls back to the first
 *                    non-disabled trigger.
 *   orientation (String, default 'horizontal') — 'horizontal' | 'vertical'.
 *                Affects Arrow key direction (Left/Right vs Up/Down).
 *   activation (String, default 'automatic') — 'automatic' | 'manual'.
 */
export default class TabsController extends Controller {
  static targets = ['list', 'trigger', 'panel'];

  static values = {
    value: { type: String, default: '' },
    orientation: { type: String, default: 'horizontal' },
    activation: { type: String, default: 'automatic' },
  };

  connect() {
    this._lastRenderedValue = null;
    // If value is unset at connect, default to the first non-disabled
    // trigger. This handles the common SSR case where the consumer doesn't
    // pre-stamp a default selection.
    if (!this.valueValue && this.hasTriggerTarget) {
      const firstEnabled = this.triggerTargets.find((t) => !this._isDisabled(t));
      if (firstEnabled) {
        // Set valueValue — triggers valueValueChanged which calls _sync().
        this.valueValue = firstEnabled.dataset.tabId || '';
        return;
      }
    }
    // value already set (SSR pre-stamped) — sync DOM to it.
    this._sync();
    this._lastRenderedValue = this.valueValue;
  }

  /** Wired via `click->tabs#activate` on every trigger. */
  activate(event) {
    const trigger = event.currentTarget;
    if (!trigger || this._isDisabled(trigger)) return;
    const tabId = trigger.dataset.tabId;
    if (!tabId || tabId === this.valueValue) return;
    this.valueValue = tabId;
  }

  /** Wired via `keydown->tabs#onKeydown` on every trigger. */
  onKeydown(event) {
    const isHoriz = this.orientationValue !== 'vertical';
    const prevKey = isHoriz ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = isHoriz ? 'ArrowRight' : 'ArrowDown';
    const triggers = this.triggerTargets.filter((t) => !this._isDisabled(t));
    if (triggers.length === 0) return;
    const focusIdx = triggers.indexOf(event.currentTarget);
    if (focusIdx === -1) return;

    // Manual activation : Enter / Space on the focused tab selects it.
    if (
      this.activationValue === 'manual'
      && (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault();
      const tabId = event.currentTarget.dataset.tabId;
      if (tabId && tabId !== this.valueValue) this.valueValue = tabId;
      return;
    }

    let nextIdx = -1;
    if (event.key === prevKey) {
      nextIdx = focusIdx === 0 ? triggers.length - 1 : focusIdx - 1;
    } else if (event.key === nextKey) {
      nextIdx = focusIdx === triggers.length - 1 ? 0 : focusIdx + 1;
    } else if (event.key === 'Home') {
      nextIdx = 0;
    } else if (event.key === 'End') {
      nextIdx = triggers.length - 1;
    }

    if (nextIdx === -1) return;
    event.preventDefault();
    const target = triggers[nextIdx];
    target.focus();
    if (this.activationValue === 'automatic') {
      const tabId = target.dataset.tabId;
      if (tabId && tabId !== this.valueValue) this.valueValue = tabId;
    }
  }

  /**
   * Stimulus auto-callback : re-sync DOM whenever the value changes.
   * Skips spurious initial-fire (Calendar guard pattern) + idempotency cache.
   */
  valueValueChanged(value, previous) {
    if (this._lastRenderedValue === value) return;
    this._sync();
    if (this._lastRenderedValue !== null && previous !== value && previous !== '') {
      this._dispatch(value, previous);
    }
    this._lastRenderedValue = value;
  }

  /**
   * Stamp `aria-selected` + `tabindex` on every trigger + `hidden` on every
   * panel based on `valueValue`. Pure DOM sync, no event dispatch.
   */
  _sync() {
    const active = this.valueValue;
    if (this.hasTriggerTarget) {
      for (const trigger of this.triggerTargets) {
        const id = trigger.dataset.tabId;
        const isActive = id === active;
        trigger.setAttribute('aria-selected', isActive ? 'true' : 'false');
        trigger.setAttribute('tabindex', isActive ? '0' : '-1');
        trigger.dataset.state = isActive ? 'active' : 'inactive';
      }
    }
    if (this.hasPanelTarget) {
      for (const panel of this.panelTargets) {
        const id = panel.dataset.tabId;
        const isActive = id === active;
        if (isActive) {
          panel.hidden = false;
          panel.dataset.state = 'active';
        } else {
          panel.hidden = true;
          panel.dataset.state = 'inactive';
        }
      }
    }
  }

  _isDisabled(trigger) {
    return trigger.disabled || trigger.getAttribute('aria-disabled') === 'true';
  }

  _dispatch(value, previousValue) {
    this.element.dispatchEvent(
      new CustomEvent('tabs:change', {
        bubbles: true,
        composed: true,
        detail: { value, previousValue },
      }),
    );
  }
}
