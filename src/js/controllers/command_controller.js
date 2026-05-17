import { Controller } from '@hotwired/stimulus';

/**
 * command — ⌘K Command palette (Ring 2).
 *
 * Vanilla custom implementation — no ninja-keys adapter.
 *  - **Cross-controller compose** via `data-controller="dialog combobox command"`
 *    on the same wrap (mirrors DatePicker cross-controller lookup).
 *  - **⌘K / Ctrl+K global hotkey** (window-scoped) opens the palette.
 *  - **Grouped results** rendered as Twig-level `<li role="presentation">`
 *    section headers between options ; controller doesn't manage groups.
 *  - **Consumer registry surface** : `window.themeCommand.register([{...}])`
 *    populates the option list at boot time (idempotent).
 *
 * Compose stack :
 *   - Dialog — modal lifecycle (showModal +
 *     backdrop + Esc dismiss + focus return).
 *   - Combobox — search-as-you-type filter +
 *     listbox + option semantics + aria-activedescendant.
 *   - Kbd — footer hint render (consumer-Twig).
 *
 * Stimulus value-changed guard pattern :
 *  - `_lastSelectedId = null` initialized BEFORE Stimulus callbacks fire ;
 *    sidesteps the undefined-vs-null trap on selection idempotency.
 *
 * Per WAI-ARIA APG "Combobox with listbox popup" + "Dialog" :
 *  - The wrap's `data-controller="dialog combobox command"` cascades :
 *    Dialog stamps role="dialog" + aria-modal ; Combobox stamps role="combobox"
 *    + aria-haspopup="listbox" + aria-expanded ; Command orchestrates.
 *  - The combobox input has the dialog's aria-describedby for the Kbd footer
 *    hint (consumer-rendered, e.g. "Esc pour fermer, ⏎ pour exécuter").
 *
 * Targets :
 *   (No required targets at the Command layer — relies on the co-mounted
 *    `dialog` and `combobox` controllers' targets.)
 *   emptyState (optional) — element shown when the filtered results are empty.
 *
 * Values :
 *   hotkey         (String,  default 'k')          single-character hotkey (with ⌘/Ctrl modifier).
 *   placeholder    (String,  default '')           input placeholder ; empty → falls back to i18n key.
 *   autoFocusInput (Boolean, default true)         focus input on dialog:open.
 *
 * Events emitted (raw CustomEvent, bubbles + composed) :
 *   command:open      — on the wrap when the dialog opens via hotkey.
 *   command:close     — on the wrap when the dialog closes.
 *   command:execute   — detail = { id, label, group }. Fires when the user
 *                       selects a command (Enter / click). Consumer's action
 *                       callback is invoked BEFORE this event.
 *
 * Consumer API (global) :
 *   window.themeCommand.register(commands)
 *   window.themeCommand.unregister(id)
 *   window.themeCommand.open()
 *   window.themeCommand.close()
 *   commands = [{ id, label, group?, icon?, kbdHint?, action: () => void }]
 */
export default class CommandController extends Controller {
  static targets = ['emptyState'];

  static values = {
    hotkey: { type: String, default: 'k' },
    placeholder: { type: String, default: '' },
    autoFocusInput: { type: Boolean, default: true },
  };

  _lastSelectedId = null;
  _commands = [];
  _registered = false;

  connect() {
    this._onGlobalKeydown = (e) => this._handleGlobalKeydown(e);
    window.addEventListener('keydown', this._onGlobalKeydown);
    this._onDialogOpen = () => this._handleDialogOpen();
    this._onDialogClose = () => this._handleDialogClose();
    this._onComboboxChange = (e) => this._handleComboboxChange(e);
    this.element.addEventListener('dialog:open', this._onDialogOpen);
    this.element.addEventListener('dialog:close', this._onDialogClose);
    this.element.addEventListener('combobox:change', this._onComboboxChange);
    this._registerGlobalAPI();
  }

  disconnect() {
    window.removeEventListener('keydown', this._onGlobalKeydown);
    this.element.removeEventListener('dialog:open', this._onDialogOpen);
    this.element.removeEventListener('dialog:close', this._onDialogClose);
    this.element.removeEventListener('combobox:change', this._onComboboxChange);
    this._unregisterGlobalAPI();
  }

  /** Wired via `data-action="click->command#open"` if consumer wants a button-
      driven open path alongside the global hotkey. */
  open() {
    const dialog = this._dialogController;
    if (dialog) dialog.open();
  }

  /** Wired via `data-action="click->command#close"`. */
  close() {
    const dialog = this._dialogController;
    if (dialog) dialog.close();
  }

  toggle() {
    const dialog = this._dialogController;
    if (!dialog) return;
    if (dialog.openValue) dialog.close();
    else dialog.open();
  }

  /**
   * Register commands into the palette. Consumer typically calls this at boot :
   *
   *   window.themeCommand.register([
   *     { id: 'goto.home', label: 'Aller à l'accueil', group: 'Navigation', action: () => Turbo.visit('/') },
   *     { id: 'create.project', label: 'Nouveau projet', group: 'Création', action: openProjectModal },
   *   ]);
   *
   * Idempotent — registering the same id replaces the existing entry.
   */
  register(commands) {
    if (!Array.isArray(commands)) return;
    for (const cmd of commands) {
      if (!cmd || typeof cmd.id !== 'string') continue;
      const idx = this._commands.findIndex((c) => c.id === cmd.id);
      if (idx >= 0) this._commands[idx] = cmd;
      else this._commands.push(cmd);
    }
  }

  unregister(id) {
    const idx = this._commands.findIndex((c) => c.id === id);
    if (idx >= 0) this._commands.splice(idx, 1);
  }

  // ---------- Internal ----------

  _handleGlobalKeydown(event) {
    if (!event) return;
    const isHotkey = (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey;
    if (!isHotkey) return;
    if (event.key !== this.hotkeyValue && event.key !== this.hotkeyValue.toUpperCase()) return;
    if (typeof event.preventDefault === 'function') event.preventDefault();
    this.toggle();
  }

  _handleDialogOpen() {
    this._dispatch('command:open');
    if (this.autoFocusInputValue) {
      Promise.resolve().then(() => {
        const input = this._comboboxInput;
        if (input && typeof input.focus === 'function') {
          try { input.focus(); } catch { /* noop */ }
        }
      });
    }
    // Reset selection cache so the next selection always fires.
    this._lastSelectedId = null;
  }

  _handleDialogClose() {
    this._dispatch('command:close');
  }

  /**
   * The combobox dispatches `combobox:change` with `detail.{ value, label }`.
   * The `value` is the option's `data-value` — which the consumer Twig has
   * mapped to the command's `id`. We look up the command by id, invoke its
   * action(), dispatch `command:execute`, and close the palette.
   */
  _handleComboboxChange(event) {
    const id = event && event.detail && event.detail.value;
    if (!id) return;
    if (this._lastSelectedId === id) return;
    this._lastSelectedId = id;
    const cmd = this._commands.find((c) => c.id === id);
    if (cmd && typeof cmd.action === 'function') {
      try { cmd.action(); } catch (err) { console.error('[theme/command] action threw', err); }
    }
    this._dispatch('command:execute', {
      id,
      label: cmd?.label || event.detail.label,
      group: cmd?.group || null,
    });
    this.close();
  }

  get _dialogController() {
    if (!this.application) return null;
    return this.application.getControllerForElementAndIdentifier(this.element, 'dialog');
  }

  get _comboboxController() {
    if (!this.application) return null;
    return this.application.getControllerForElementAndIdentifier(this.element, 'combobox');
  }

  get _comboboxInput() {
    // Locate the combobox's input target. The combobox target name is 'input'.
    return this.element.querySelector('[data-combobox-target="input"]');
  }

  _dispatch(name, detail = {}) {
    this.element.dispatchEvent(
      new CustomEvent(name, { bubbles: true, composed: true, detail }),
    );
  }

  _registerGlobalAPI() {
    if (typeof window === 'undefined') return;
    if (this._registered) return;
    if (window.themeCommand && window.themeCommand.__owner && window.themeCommand.__owner !== this) {
      // Another instance already owns the global API ; bail (idempotent).
      return;
    }
    const self = this;
    window.themeCommand = {
      __owner: self,
      register(commands) { self.register(commands); },
      unregister(id) { self.unregister(id); },
      open() { self.open(); },
      close() { self.close(); },
    };
    this._registered = true;
  }

  _unregisterGlobalAPI() {
    if (typeof window === 'undefined') return;
    if (window.themeCommand && window.themeCommand.__owner === this) {
      delete window.themeCommand;
    }
    this._registered = false;
  }
}
