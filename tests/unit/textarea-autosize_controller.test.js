import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Application } from '@hotwired/stimulus';
import TextareaAutosizeController from '../../src/js/controllers/textarea-autosize_controller.js';

/**
 * Unit tests for the Textarea primitive's `textarea-autosize` Stimulus
 * controller.
 *
 * happy-dom limitation: text-layout-driven measurements like `scrollHeight`
 * aren't computed from real content reflow — happy-dom returns the box's
 * declared height. We stub `scrollHeight` per test via Object.defineProperty
 * to exercise the clamp logic deterministically. The same trick is used by
 * Stimulus' own JSDOM tests (see hotwired/stimulus#480).
 *
 * Likewise getComputedStyle is patched to return sensible defaults so the
 * line-height / padding / border arithmetic produces stable numbers.
 */
describe('TextareaAutosizeController', () => {
  let app;
  // Defaults expressed in CSS pixels. padding-{top,bottom} = 8 (total 16),
  // border-{top,bottom} = 1 (total 2) — these are documentation values for the
  // expectations below; the test only needs LINE_HEIGHT in the stub.
  // Min 2 rows = 24*2 + 16 + 2 = 66 px; Max 8 rows = 24*8 + 16 + 2 = 210 px.
  const LINE_HEIGHT = 24;

  beforeEach(() => {
    // Patch getComputedStyle so the arithmetic is deterministic.
    window.getComputedStyle = () => ({
      lineHeight: `${LINE_HEIGHT}px`,
      fontSize: '16px',
      paddingTop: '8px',
      paddingBottom: '8px',
      borderTopWidth: '1px',
      borderBottomWidth: '1px',
    });
  });

  afterEach(() => {
    if (app) app.stop();
    document.body.innerHTML = '';
  });

  async function mountWithScrollHeight(initialScrollHeight, { value = '', minRows = 2, maxRows = 8 } = {}) {
    document.body.innerHTML = `
      <textarea
        class="theme-textarea"
        data-controller="textarea-autosize"
        data-action="input->textarea-autosize#resize"
        data-textarea-autosize-min-rows-value="${minRows}"
        data-textarea-autosize-max-rows-value="${maxRows}">${value}</textarea>
    `;
    const el = document.querySelector('textarea');
    // The controller resets height='auto' then reads scrollHeight. Stub it
    // here so the post-reset read returns our deterministic value.
    let current = initialScrollHeight;
    Object.defineProperty(el, 'scrollHeight', {
      configurable: true,
      get: () => current,
    });
    app = Application.start();
    app.register('textarea-autosize', TextareaAutosizeController);
    // Wait one microtask for Stimulus to connect.
    await new Promise((r) => setTimeout(r, 0));
    return { el, setScrollHeight: (v) => { current = v; } };
  }

  it('connect() runs an initial resize — empty textarea snaps to minRows height', async () => {
    const { el } = await mountWithScrollHeight(0);
    // minHeight = 24*2 + 16 + 2 = 66; contentHeight = 0+2 = 2 < min → clamps up to 66.
    expect(el.style.height).toBe('66px');
    expect(el.style.overflowY).toBe('hidden');
  });

  it('resize() sets height to content when it fits between min and max', async () => {
    // Make scrollHeight correspond to ~4 rows of content (98 px = 24*4 + 2 padding+border slack).
    const { el } = await mountWithScrollHeight(94);
    // contentHeight = 94 + 2 = 96. min = 66, max = 210. → 96
    expect(el.style.height).toBe('96px');
    expect(el.style.overflowY).toBe('hidden');
  });

  it('resize() clamps at maxRows when content exceeds', async () => {
    const { el } = await mountWithScrollHeight(500);
    // contentHeight = 500 + 2 = 502 > maxHeight (210) → clamps to 210, overflow auto.
    expect(el.style.height).toBe('210px');
    expect(el.style.overflowY).toBe('auto');
  });

  it('resize() honours custom min/max values from data attributes', async () => {
    const { el } = await mountWithScrollHeight(0, { minRows: 1, maxRows: 3 });
    // minHeight = 24*1 + 16 + 2 = 42; contentHeight = 2 < 42 → 42.
    expect(el.style.height).toBe('42px');
  });

  it('resize() can be re-invoked manually and recomputes height', async () => {
    const ctx = await mountWithScrollHeight(50);
    // Initial: contentHeight 52 < min 66 → 66
    expect(ctx.el.style.height).toBe('66px');
    // Grow the content, then dispatch the input event the action listens to.
    ctx.setScrollHeight(120);
    ctx.el.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 0));
    // contentHeight = 122; between min (66) and max (210) → 122
    expect(ctx.el.style.height).toBe('122px');
  });
});
