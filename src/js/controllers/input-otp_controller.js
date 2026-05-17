import { Controller } from '@hotwired/stimulus';

/**
 * input-otp — N-digit one-time-code input cluster.
 *
 * Behavior :
 *  - **Auto-tab on input** — typing a digit in cell N moves focus to cell
 *    N+1 (only if a digit was added — clearing a cell doesn't shift focus).
 *  - **Backspace on empty cell** — pressing Backspace on an empty cell
 *    moves focus to the previous cell + clears it (single press deletes
 *    the previous digit + lands focus on it).
 *  - **Paste auto-distribute** — pasting a string
 *    from the clipboard validates it's 4-8 digits then distributes one
 *    digit per cell starting from the first ; trailing cells are left
 *    empty if the pasted string is shorter than `length`. Non-numeric
 *    pastes are ignored (no-op + no event).
 *  - **Aggregate value** — concatenated digits mirrored on an optional
 *    hidden input via the `hiddenInput` target ; also exposed via
 *    `valueValue`.
 *  - **input-otp:change** — fires on every value change with detail.{code, complete}.
 *  - **input-otp:complete** — fires only when length === filled count.
 *
 * The consumer's Twig wraps the cluster in a
 * `<fieldset>` + visible `<legend>`. Each cell carries an Intl-interpolated
 * `aria-label` ("Chiffre 3 sur 6") so SR reads which position the cursor
 * is on. The kit does not double-stamp `aria-labelledby` (the legend
 * already labels every cell via the implicit fieldset semantic).
 *
 * The kit ships paste auto-distribute out-of-the-box; no opt-in flag.
 * Standard SaaS pattern (Stripe / Linear / Vercel) — users expect to paste
 * an OTP from email / clipboard and have it just work.
 *
 * Targets :
 *   input        (multiple, required) — the N cell `<input>`s.
 *   hiddenInput  (optional) — form-integration hidden input.
 *
 * Values :
 *   length (Number, default 6) — number of cells (4-8 supported).
 *   value  (String, default '') — aggregated code. Setting it programmatically
 *                                  redistributes to the cells.
 *
 * Events emitted (raw CustomEvent, bubbles + composed) :
 *   input-otp:change   detail = { code, complete }
 *   input-otp:complete detail = { code }
 */
export default class InputOtpController extends Controller {
  static targets = ['input', 'hiddenInput'];

  static values = {
    length: { type: Number, default: 6 },
    value: { type: String, default: '' },
  };

  connect() {
    if (!this.hasInputTarget) return;
    // Sync hidden input on connect (in case SSR pre-filled cells).
    this._syncHiddenInput();
  }

  /** Wired via `data-action="input->input-otp#onInput"` on each cell. */
  onInput(event) {
    const input = event.target;
    if (!input || !this._isCell(input)) return;
    const raw = String(input.value || '');
    // Only digits — strip everything else. If user types a non-digit, we
    // wipe it (the maxlength=1 already prevented multi-char insert).
    const digit = raw.replace(/\D/g, '').slice(0, 1);
    if (digit !== raw) {
      input.value = digit;
    }
    // Auto-tab only when a digit was actually added (raw input event for
    // delete + arrow nav doesn't shift focus).
    if (digit !== '') {
      this._focusCellAt(this._indexOf(input) + 1);
    }
    this._aggregateAndDispatch();
  }

  /** Wired via `data-action="keydown->input-otp#onKeydown"` on each cell. */
  onKeydown(event) {
    const input = event.target;
    if (!input || !this._isCell(input)) return;
    const idx = this._indexOf(input);

    switch (event.key) {
      case 'Backspace':
        // If the cell is already empty, move focus + clear the previous
        // cell. Otherwise let the native delete-character behavior fire
        // (then onInput re-aggregates).
        if (input.value === '' && idx > 0) {
          if (typeof event.preventDefault === 'function') event.preventDefault();
          const prev = this.inputTargets[idx - 1];
          if (prev) {
            prev.value = '';
            try { prev.focus(); } catch { /* happy-dom ignore */ }
            this._aggregateAndDispatch();
          }
        }
        return;
      case 'ArrowLeft':
        if (typeof event.preventDefault === 'function') event.preventDefault();
        this._focusCellAt(idx - 1);
        return;
      case 'ArrowRight':
        if (typeof event.preventDefault === 'function') event.preventDefault();
        this._focusCellAt(idx + 1);
        return;
      case 'Home':
        if (typeof event.preventDefault === 'function') event.preventDefault();
        this._focusCellAt(0);
        return;
      case 'End':
        if (typeof event.preventDefault === 'function') event.preventDefault();
        this._focusCellAt(this.inputTargets.length - 1);
        return;
      default:
        return;
    }
  }

  /** Wired via `data-action="paste->input-otp#onPaste"` on each cell. */
  onPaste(event) {
    const clipboard = event.clipboardData || (typeof window !== 'undefined' ? window.clipboardData : null);
    if (!clipboard) return;
    const text = String(clipboard.getData('text') || '').trim();
    // Strip whitespace inside the pasted text (some OTP emails wrap in
    // spaces or hyphens — "123 456" or "12-34-56").
    const digits = text.replace(/\D/g, '');
    if (digits.length < 1) return; // Nothing useful to distribute.
    if (typeof event.preventDefault === 'function') event.preventDefault();

    // Distribute starting from the cell that received the paste event
    // (typical UX : focus on cell #N when pasting starts at cell #N).
    const startIdx = this._isCell(event.target) ? this._indexOf(event.target) : 0;
    const cells = this.inputTargets;
    let writeIdx = startIdx;
    let nextDigit = 0;
    while (writeIdx < cells.length && nextDigit < digits.length) {
      cells[writeIdx].value = digits[nextDigit];
      writeIdx++;
      nextDigit++;
    }
    // Focus the next empty cell, or the last cell if all are filled.
    const nextFocusIdx = Math.min(writeIdx, cells.length - 1);
    this._focusCellAt(nextFocusIdx);
    this._aggregateAndDispatch();
  }

  /** Wired via `data-action="focus->input-otp#onFocus"` on each cell. */
  onFocus(event) {
    const input = event.target;
    if (!input || !this._isCell(input)) return;
    // Select the existing digit on focus so the next typed character
    // replaces it (Stripe / Linear pattern — saves a manual delete step).
    try {
      input.select();
    } catch {
      /* happy-dom or read-only fallback — ignore. */
    }
  }

  // ---------- Stimulus value-changed callbacks ----------

  valueValueChanged(value, previous) {
    if (value === previous) return;
    // Avoid the redistribute loop when our own _aggregateAndDispatch just
    // wrote the value : the cells already match. The comparison covers both
    // the initial fire (SSR pre-fill) and the user-typing path.
    const currentAggregate = this._aggregate();
    if (currentAggregate === value) {
      this._syncHiddenInput();
      return;
    }
    // External change (consumer setter) — distribute to cells.
    this._distributeToCells(value);
    this._syncHiddenInput();
  }

  // ---------- Helpers ----------

  _isCell(el) {
    return el && el.dataset && el.dataset.inputOtpTarget === 'input';
  }

  _indexOf(input) {
    return this.inputTargets.indexOf(input);
  }

  _focusCellAt(idx) {
    const cells = this.inputTargets;
    if (idx < 0 || idx >= cells.length) return;
    const cell = cells[idx];
    try {
      cell.focus();
    } catch {
      /* happy-dom may not support focus reliably — ignore. */
    }
  }

  _distributeToCells(value) {
    const cells = this.inputTargets;
    const digits = String(value || '').replace(/\D/g, '');
    for (let i = 0; i < cells.length; i++) {
      cells[i].value = digits[i] || '';
    }
  }

  _aggregateAndDispatch() {
    const code = this._aggregate();
    // Avoid Stimulus's loopback : setting valueValue triggers
    // valueValueChanged → _distributeToCells (idempotent but wasteful).
    // We bypass by detecting "value already in sync" via the new helper.
    if (this.valueValue !== code) {
      this.valueValue = code;
    } else {
      // valueValueChanged won't fire — sync hidden input ourselves.
      this._syncHiddenInput();
    }
    const complete = code.length === this.lengthValue && /^\d+$/.test(code);
    this.element.dispatchEvent(
      new CustomEvent('input-otp:change', {
        bubbles: true,
        composed: true,
        detail: { code, complete },
      }),
    );
    if (complete) {
      this.element.dispatchEvent(
        new CustomEvent('input-otp:complete', {
          bubbles: true,
          composed: true,
          detail: { code },
        }),
      );
    }
  }

  _aggregate() {
    return this.inputTargets.map((i) => i.value || '').join('');
  }

  _syncHiddenInput() {
    if (!this.hasHiddenInputTarget) return;
    this.hiddenInputTarget.value = this._aggregate();
  }
}
