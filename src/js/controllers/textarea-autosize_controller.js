import { Controller } from '@hotwired/stimulus';

/**
 * textarea-autosize — grows the textarea's height to fit the content,
 * clamped between `minRows` and `maxRows`. Past maxRows, the textarea
 * scrolls internally — the page doesn't grow further.
 *
 * The controller attaches DIRECTLY to the <textarea> element (not a
 * wrapper). `this.element` IS the textarea.
 *
 * Values:
 *   minRows (Number, default 2) — floor in rows of text
 *   maxRows (Number, default 8) — ceiling in rows of text
 *
 * Action:
 *   data-action="input->textarea-autosize#resize" on the textarea itself.
 *
 * Connect:
 *   Initial `resize()` so pre-filled values are sized correctly on mount.
 *
 * Resize implementation:
 *   1. Reset height to 'auto' so scrollHeight reflects content (browsers
 *      compute scrollHeight against the *current* height — leaving the
 *      old height in place would prevent shrinking).
 *   2. Measure line-height + vertical padding + vertical border from
 *      getComputedStyle.
 *   3. Compute min/max in CSS pixels.
 *   4. Set height = clamp(min, scrollHeight, max).
 *   5. Toggle overflow-y so the native scrollbar only appears past max.
 */
export default class TextareaAutosizeController extends Controller {
  static values = {
    minRows: { type: Number, default: 2 },
    maxRows: { type: Number, default: 8 },
  };

  connect() {
    this.resize();
  }

  resize() {
    const el = this.element;
    const cs = window.getComputedStyle(el);

    // Reset so scrollHeight is content-driven, not height-driven.
    el.style.height = 'auto';

    const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
    const paddingY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const borderY = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);

    const minHeight = lineHeight * this.minRowsValue + paddingY + borderY;
    const maxHeight = lineHeight * this.maxRowsValue + paddingY + borderY;
    const contentHeight = el.scrollHeight + borderY; // scrollHeight excludes border

    const target = Math.min(Math.max(contentHeight, minHeight), maxHeight);
    el.style.height = `${target}px`;
    el.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
  }
}
