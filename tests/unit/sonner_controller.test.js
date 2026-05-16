import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import SonnerController from '../../src/js/controllers/sonner_controller.js';
import { setTranslations, setLocale, __reset } from '../../src/js/utils/i18n.js';

/**
 * Flush microtasks. Stimulus's value-changed callbacks + the controller's
 * `requestAnimationFrame(...)` inside _promoteToVisible are
 * microtask-/raf-scheduled, so DOM mutations need a tick after each
 * action.
 */
const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the Sonner compound's `sonner` controller.
 *
 * Coverage map (15 tests):
 *
 *   Lifecycle + DOM
 *   1. _handleShow — adds a visible toast (output, data-state goes
 *      entering → visible after raf) + dispatches sonner:show.
 *   2. variant="danger" renders <div role="alert"> (assertive auto-bump),
 *      _announce is skipped (no double-announce).
 *
 *   Timer + per-variant durations
 *   3. variant="success" auto-dismisses after 4 000 ms.
 *   4. variant="warning" auto-dismisses after 6 000 ms.
 *   5. variant="info" is persistent (no timer scheduled).
 *   6. variant="danger" is persistent.
 *   7. success + undo bumps duration to 10 000 ms.
 *
 *   Dismiss lifecycle (transitionend opacity filter)
 *   8. dismiss(id) → data-state="exiting" → transitionend opacity →
 *      DOM removed + sonner:dismiss event (detail.reason="manual").
 *   9. transitionend (background-color) does NOT remove the toast —
 *      filter to opacity (mirrors alert-dismiss S1.4b pattern).
 *
 *   Queue + indicator
 *  10. 6th show() pushes to queue ; indicator shows "+1 autre"
 *      (Intl.PluralRules — CLDR FR `one`).
 *  11. 8 toasts → 5 visible + 3 queued → "+3 autres" (CLDR FR `other`).
 *
 *   Pause / resume
 *  12. pauseAll() freezes timer ; advancing past nominal duration does
 *      not auto-dismiss ; resumeAll() restarts with remaining time.
 *
 *   Undo + dispatchAll + Esc
 *  13. undo(event) dispatches sonner:undo, invokes callback, dismisses.
 *  14. dismissAll() removes every visible + clears queue.
 *
 *   Announcer push
 *  15. polite variants push to #theme-announcer ; danger skips (covered
 *      by test #2 as the no-push assertion).
 *
 * Per S1.4b descriptor-binding gotcha: tests call controller methods
 * directly via app.controllers lookup or dispatch document events
 * rather than synthesising clicks through Stimulus action descriptors.
 */
describe('SonnerController', () => {
  let app;

  beforeEach(() => {
    __reset();
    setTranslations('fr', {
      'theme.sonner.aria.viewport': 'Notifications',
      'theme.sonner.aria.dismiss': 'Fermer la notification',
      'theme.sonner.queue-more.one': '+{count} autre',
      'theme.sonner.queue-more.other': '+{count} autres',
      'theme.sonner.default-label.success': 'Action effectuée.',
      'theme.sonner.default-label.info': 'Information.',
      'theme.sonner.default-label.warning': 'Attention.',
      'theme.sonner.default-label.danger': 'Une erreur est survenue.',
      'theme.sonner.default-undo-label': 'Annuler',
    });
    setLocale('fr');
    document.body.innerHTML = '';
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
    vi.useRealTimers();
    if (typeof window !== 'undefined' && window.themeToast) delete window.themeToast;
  });

  async function mount() {
    document.body.innerHTML = `
      <div id="theme-announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>
      <aside class="theme-sonner__viewport"
             aria-label="Notifications"
             data-controller="sonner"
             data-action="pointerenter->sonner#pauseAll pointerleave->sonner#resumeAll keydown.esc@window->sonner#dismissAll">
        <button type="button"
                class="theme-sonner__queue-indicator"
                data-action="click->sonner#expandQueue"
                data-sonner-target="indicator"
                hidden></button>
      </aside>
    `;
    app = Application.start();
    app.register('sonner', SonnerController);
    await tick();
    await tick();
    return {
      viewport: document.querySelector('.theme-sonner__viewport'),
      indicator: document.querySelector('.theme-sonner__queue-indicator'),
      announcer: document.getElementById('theme-announcer'),
      ctrl: app.controllers.find((c) => c.identifier === 'sonner'),
    };
  }

  function fireOpacityTransitionEnd(el) {
    const evt = new Event('transitionend', { bubbles: true });
    Object.defineProperty(evt, 'propertyName', { value: 'opacity', enumerable: true });
    el.dispatchEvent(evt);
  }

  function fireNonOpacityTransitionEnd(el) {
    const evt = new Event('transitionend', { bubbles: true });
    Object.defineProperty(evt, 'propertyName', { value: 'background-color', enumerable: true });
    el.dispatchEvent(evt);
  }

  // ============== 1: lifecycle + DOM ==============

  it('_handleShow — adds a visible toast + dispatches sonner:show', async () => {
    const { viewport, ctrl } = await mount();
    let captured = null;
    viewport.addEventListener('sonner:show', (e) => {
      captured = { type: e.type, bubbles: e.bubbles, composed: e.composed, detail: e.detail };
    });
    ctrl._handleShow({ id: 't1', variant: 'success', message: 'Hello' });
    await tick();
    const toast = document.getElementById('sonner-toast-t1');
    expect(toast).not.toBeNull();
    expect(toast.tagName).toBe('OUTPUT');
    expect(toast.dataset.variant).toBe('success');
    expect(toast.dataset.toastId).toBe('t1');
    expect(captured).not.toBeNull();
    expect(captured.type).toBe('sonner:show');
    expect(captured.bubbles).toBe(true);
    expect(captured.composed).toBe(true);
    expect(captured.detail).toEqual({ id: 't1', variant: 'success', message: 'Hello' });
  });

  it('variant="danger" renders <div role="alert"> + skips announcer push', async () => {
    const { ctrl, announcer } = await mount();
    ctrl._handleShow({ id: 'd1', variant: 'danger', message: 'Boom' });
    await tick();
    const toast = document.getElementById('sonner-toast-d1');
    expect(toast.tagName).toBe('DIV');
    expect(toast.getAttribute('role')).toBe('alert');
    // Announcer is NOT pushed for danger (role="alert" is already assertive).
    expect(announcer.textContent).toBe('');
  });

  // ============== 2: timers + per-variant durations ==============

  it('variant="success" auto-dismisses after 4 000 ms', async () => {
    const { ctrl } = await mount();
    vi.useFakeTimers();
    ctrl._handleShow({ id: 's1', variant: 'success', message: 'Saved.' });
    expect(document.getElementById('sonner-toast-s1')).not.toBeNull();
    vi.advanceTimersByTime(3999);
    expect(document.getElementById('sonner-toast-s1').dataset.state).not.toBe('exiting');
    vi.advanceTimersByTime(2);
    const el = document.getElementById('sonner-toast-s1');
    expect(el.dataset.state).toBe('exiting');
  });

  it('variant="warning" auto-dismisses after 6 000 ms', async () => {
    const { ctrl } = await mount();
    vi.useFakeTimers();
    ctrl._handleShow({ id: 'w1', variant: 'warning', message: 'Watch out.' });
    vi.advanceTimersByTime(5999);
    expect(document.getElementById('sonner-toast-w1').dataset.state).not.toBe('exiting');
    vi.advanceTimersByTime(2);
    expect(document.getElementById('sonner-toast-w1').dataset.state).toBe('exiting');
  });

  it('variant="info" is persistent — no timer scheduled', async () => {
    const { ctrl } = await mount();
    vi.useFakeTimers();
    ctrl._handleShow({ id: 'i1', variant: 'info', message: 'Syncing…' });
    vi.advanceTimersByTime(60000);
    expect(document.getElementById('sonner-toast-i1')).not.toBeNull();
    expect(document.getElementById('sonner-toast-i1').dataset.state).not.toBe('exiting');
  });

  it('variant="danger" is persistent', async () => {
    const { ctrl } = await mount();
    vi.useFakeTimers();
    ctrl._handleShow({ id: 'd2', variant: 'danger', message: 'Crashed.' });
    vi.advanceTimersByTime(60000);
    expect(document.getElementById('sonner-toast-d2')).not.toBeNull();
  });

  it('success + undo bumps duration to 10 000 ms', async () => {
    const { ctrl } = await mount();
    vi.useFakeTimers();
    ctrl._handleShow({
      id: 'u1',
      variant: 'success',
      message: 'Deleted.',
      undoLabel: 'Undo',
      undoCallback: () => {},
    });
    vi.advanceTimersByTime(9999);
    expect(document.getElementById('sonner-toast-u1').dataset.state).not.toBe('exiting');
    vi.advanceTimersByTime(2);
    expect(document.getElementById('sonner-toast-u1').dataset.state).toBe('exiting');
  });

  // ============== 3: dismiss lifecycle ==============

  it('dismiss(id) → exiting → transitionend opacity → DOM removed + sonner:dismiss', async () => {
    const { ctrl, viewport } = await mount();
    let captured = null;
    viewport.addEventListener('sonner:dismiss', (e) => {
      captured = { detail: e.detail };
    });
    ctrl._handleShow({ id: 'x1', variant: 'success', message: 'Hi.' });
    await tick();
    const el = document.getElementById('sonner-toast-x1');
    ctrl._dismissOne('x1', 'manual');
    expect(el.dataset.state).toBe('exiting');
    expect(captured).not.toBeNull();
    expect(captured.detail).toEqual({ id: 'x1', reason: 'manual' });
    // DOM still present until transitionend.
    expect(document.getElementById('sonner-toast-x1')).toBe(el);
    fireOpacityTransitionEnd(el);
    await tick();
    expect(document.getElementById('sonner-toast-x1')).toBeNull();
  });

  it('transitionend (background-color) does NOT remove the toast', async () => {
    const { ctrl } = await mount();
    ctrl._handleShow({ id: 'x2', variant: 'success', message: 'Hi.' });
    await tick();
    const el = document.getElementById('sonner-toast-x2');
    ctrl._dismissOne('x2', 'manual');
    fireNonOpacityTransitionEnd(el);
    await tick();
    expect(document.getElementById('sonner-toast-x2')).toBe(el);
  });

  // ============== 4: queue + indicator ==============

  it('6th show pushes to queue ; indicator shows "+1 autre" (CLDR FR one)', async () => {
    const { ctrl, indicator } = await mount();
    for (let i = 0; i < 5; i++) {
      ctrl._handleShow({ id: `q${i}`, variant: 'info', message: `m${i}` });
    }
    expect(indicator.hidden).toBe(true);
    ctrl._handleShow({ id: 'q5', variant: 'info', message: 'm5' });
    expect(indicator.hidden).toBe(false);
    expect(indicator.textContent).toBe('+1 autre');
    // q5 should NOT be in the DOM as a visible toast.
    expect(document.getElementById('sonner-toast-q5')).toBeNull();
  });

  it('8 toasts → 5 visible + 3 queued → "+3 autres" (CLDR FR other)', async () => {
    const { ctrl, indicator } = await mount();
    for (let i = 0; i < 8; i++) {
      ctrl._handleShow({ id: `b${i}`, variant: 'info', message: `m${i}` });
    }
    expect(indicator.hidden).toBe(false);
    expect(indicator.textContent).toBe('+3 autres');
    // First 5 are in DOM ; last 3 are queued.
    for (let i = 0; i < 5; i++) {
      expect(document.getElementById(`sonner-toast-b${i}`)).not.toBeNull();
    }
    for (let i = 5; i < 8; i++) {
      expect(document.getElementById(`sonner-toast-b${i}`)).toBeNull();
    }
  });

  // ============== 5: pause / resume ==============

  it('pauseAll freezes timer ; resumeAll restarts with remaining time', async () => {
    const { ctrl } = await mount();
    vi.useFakeTimers();
    ctrl._handleShow({ id: 'p1', variant: 'success', message: 'Hi.' });
    vi.advanceTimersByTime(2000); // halfway through 4s
    // Simulate viewport pointerenter via direct controller call (the
    // action descriptor wires this on real mounts).
    ctrl.pauseAll();
    vi.advanceTimersByTime(10000); // way past the 4s nominal duration
    expect(document.getElementById('sonner-toast-p1').dataset.state).not.toBe('exiting');
    // Resume — the controller restarts with remaining ~2000ms.
    ctrl.resumeAll();
    vi.advanceTimersByTime(1999);
    expect(document.getElementById('sonner-toast-p1').dataset.state).not.toBe('exiting');
    vi.advanceTimersByTime(2);
    expect(document.getElementById('sonner-toast-p1').dataset.state).toBe('exiting');
  });

  // ============== 6: undo + dismissAll + Esc ==============

  it('undo(event) dispatches sonner:undo, invokes callback, then dismisses', async () => {
    const { ctrl, viewport } = await mount();
    const undoCb = vi.fn();
    let undoEvent = null;
    viewport.addEventListener('sonner:undo', (e) => {
      undoEvent = e.detail;
    });
    ctrl._handleShow({
      id: 'undo1',
      variant: 'success',
      message: 'Deleted.',
      undoLabel: 'Annuler',
      undoCallback: undoCb,
    });
    await tick();
    const undoBtn = document.querySelector('[data-toast-id="undo1"].theme-sonner__undo');
    expect(undoBtn).not.toBeNull();
    // Simulate the Stimulus action: ctrl.undo(event) reads event.currentTarget.dataset.toastId.
    ctrl.undo({ currentTarget: undoBtn });
    expect(undoEvent).toEqual({ id: 'undo1' });
    expect(undoCb).toHaveBeenCalledTimes(1);
    expect(document.getElementById('sonner-toast-undo1').dataset.state).toBe('exiting');
  });

  it('dismissAll removes every visible toast + clears queue', async () => {
    const { ctrl, indicator } = await mount();
    for (let i = 0; i < 7; i++) {
      ctrl._handleShow({ id: `a${i}`, variant: 'info', message: `m${i}` });
    }
    expect(indicator.hidden).toBe(false);
    ctrl.dismissAll();
    // All visible are now exiting. Queue is cleared (no promotion).
    for (let i = 0; i < 5; i++) {
      const el = document.getElementById(`sonner-toast-a${i}`);
      if (el) expect(el.dataset.state).toBe('exiting');
    }
    expect(indicator.hidden).toBe(true);
  });

  it('_announce — polite variants push to #theme-announcer', async () => {
    const { ctrl, announcer } = await mount();
    ctrl._handleShow({ id: 's2', variant: 'success', title: 'Saved', message: 'Your changes are live.' });
    await tick();
    expect(announcer.textContent).toBe('Saved : Your changes are live.');
  });
});
