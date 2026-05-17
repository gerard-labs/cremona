import { Controller } from '@hotwired/stimulus';
import { t } from '../utils/i18n.js';

/**
 * sonner — toast queue engine (Ring 2).
 *
 * The controller manages the single fixed-position viewport injected by
 * the `ensureSonnerViewport()` helper (called from boot() in index.js, or
 * pre-rendered by consumer markup, or pushed by test setup). Multiple
 * SonnerController connects target the same viewport — idempotent.
 *
 * Max 5 visible toasts + N queued. When `_queue.length > 0`, the queue
 * indicator button shows "+N autres" (Intl.PluralRules — CLDR FR
 * `one | other`, EN `one | other`). Click on the indicator promotes all
 * queued toasts to visible (capped at MAX_VISIBLE_EXPANDED).
 *
 * Per-variant default auto-dismiss durations (microcopy doctrine §Toasts):
 *   success         — 4 s
 *   success + undo  — 10 s (reach time for the user to find + click)
 *   info            — null (persistent)
 *   warning         — 6 s
 *   danger          — null (persistent)
 *
 * Consumer-passed `duration` overrides the variant default. `duration: 0`
 * or `duration: null` = persistent (no auto-dismiss).
 *
 * Polite vs assertive announcement (per Alert.md §"Alert role auto-derives
 * from variant"):
 *   - variant ∈ {success, info, warning} → toast is a native <output>
 *     (implicit role="status" + aria-live="polite" + aria-atomic="true").
 *     Controller pushes the message to `#cremona-announcer` as a backup
 *     for SR implementations that miss rapid <output> mutations.
 *   - variant === 'danger' → toast is `<div role="alert">` (assertive
 *     auto-bump). Announcer push is SKIPPED to avoid double-announce.
 *
 * Pause-on-hover doctrine (per spec §3 "Why viewport-level pause"):
 *   pointerenter on viewport freezes every visible toast's auto-dismiss
 *   timer (snapshot remaining time) ; pointerleave restarts each timer
 *   with `duration - elapsedPause`. Visible-toast-level pause prevents
 *   the flicker of adjacent toasts dismissing while the user reads one.
 *
 * Esc dismissAll: wired via window-scoped `keydown.esc@window->sonner#
 * dismissAll`. Mirror of Dialog / Popover Esc doctrine.
 *
 * Consumer API (mirrors spec §2):
 *   window.themeToast.show({ id?, variant?, message, title?, undoLabel?,
 *                            undoCallback?, duration? })
 *   window.themeToast.dismiss(id)
 *   window.themeToast.dismissAll()
 *
 * Or the equivalent document-level CustomEvent dispatch:
 *   document.dispatchEvent(new CustomEvent('theme:toast:show', { detail }))
 *   document.dispatchEvent(new CustomEvent('theme:toast:dismiss', { detail: {id} }))
 *   document.dispatchEvent(new CustomEvent('theme:toast:dismiss-all'))
 *
 * Events dispatched by the controller (raw CustomEvent, bubbles + composed):
 *   sonner:show     — detail = { id, variant, message }
 *   sonner:dismiss  — detail = { id, reason: 'auto' | 'manual' | 'undo' | 'all' }
 *   sonner:undo     — detail = { id }  (fired BEFORE the consumer callback)
 */

// Lucide v0.469.0 SVG paths — inlined to avoid the Icon primitive's Twig
// include dependency at runtime. The 4 icons used (check, info, alert-
// triangle, alert-circle) are all in the curated 30-icon set.
const ICONS = {
  success:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  info:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  warning:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  danger:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
};

const VARIANT_DEFAULT_DURATIONS = {
  success: 4000,
  info: null, // persistent
  warning: 6000,
  danger: null, // persistent
};

const UNDO_DURATION = 10000;
const MAX_VISIBLE = 5;
const MAX_VISIBLE_EXPANDED = 10;

const ENTITY_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ENTITY_MAP[c]);
}

function generateId() {
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default class SonnerController extends Controller {
  static targets = ['indicator'];

  connect() {
    this._visible = [];
    this._queue = [];
    this._timers = new Map(); // id -> { timeoutId, startedAt, duration, remaining }
    this._undoCallbacks = new Map(); // id -> function
    this._paused = false;

    this._onShowEvent = (e) => this._handleShow(e && e.detail);
    this._onDismissEvent = (e) => this._dismissOne(e && e.detail && e.detail.id, 'manual');
    this._onDismissAllEvent = () => this.dismissAll();
    document.addEventListener('theme:toast:show', this._onShowEvent);
    document.addEventListener('theme:toast:dismiss', this._onDismissEvent);
    document.addEventListener('theme:toast:dismiss-all', this._onDismissAllEvent);

    this._registerGlobalAPI();
    this._renderIndicator();
  }

  disconnect() {
    document.removeEventListener('theme:toast:show', this._onShowEvent);
    document.removeEventListener('theme:toast:dismiss', this._onDismissEvent);
    document.removeEventListener('theme:toast:dismiss-all', this._onDismissAllEvent);
    this._unregisterGlobalAPI();
    this._clearAllTimers();
    this._visible = [];
    this._queue = [];
    this._undoCallbacks.clear();
  }

  // ===== Stimulus actions (wired via data-action) =======================

  dismiss(event) {
    const id = event && event.currentTarget ? event.currentTarget.dataset.toastId : event;
    this._dismissOne(id, 'manual');
  }

  dismissAll() {
    const ids = this._visible.map((toast) => toast.id);
    this._queue = [];
    ids.forEach((id) => this._dismissOne(id, 'all'));
    this._renderIndicator();
  }

  undo(event) {
    const id = event.currentTarget.dataset.toastId;
    this._dispatch('sonner:undo', { id });
    const cb = this._undoCallbacks.get(id);
    if (typeof cb === 'function') cb();
    this._dismissOne(id, 'undo');
  }

  expandQueue() {
    while (this._visible.length < MAX_VISIBLE_EXPANDED && this._queue.length > 0) {
      this._promoteToVisible(this._queue.shift());
    }
    this._renderIndicator();
  }

  pauseAll() {
    if (this._paused) return;
    this._paused = true;
    for (const timer of this._timers.values()) {
      if (timer.timeoutId !== null) {
        clearTimeout(timer.timeoutId);
        timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
        timer.timeoutId = null;
      }
    }
  }

  resumeAll() {
    if (!this._paused) return;
    this._paused = false;
    for (const [id, timer] of this._timers) {
      if (timer.remaining > 0 && timer.timeoutId === null) {
        timer.startedAt = Date.now();
        timer.timeoutId = setTimeout(() => this._dismissOne(id, 'auto'), timer.remaining);
      }
    }
  }

  // ===== Internal =======================================================

  _handleShow(payload) {
    if (!payload) return;
    const toast = this._normalize(payload);
    if (toast.undoCallback) this._undoCallbacks.set(toast.id, toast.undoCallback);
    if (this._visible.length < MAX_VISIBLE) {
      this._promoteToVisible(toast);
    } else {
      this._queue.push(toast);
    }
    this._renderIndicator();
    this._dispatch('sonner:show', { id: toast.id, variant: toast.variant, message: toast.message });
  }

  _normalize(payload) {
    const variant = ['success', 'info', 'warning', 'danger'].includes(payload.variant)
      ? payload.variant
      : 'success';
    const id = payload.id || generateId();
    const hasUndo = !!payload.undoLabel && typeof payload.undoCallback === 'function';
    let duration;
    if (payload.duration === null || payload.duration === 0) {
      duration = null;
    } else if (typeof payload.duration === 'number' && payload.duration > 0) {
      duration = payload.duration;
    } else if (hasUndo && (variant === 'success' || variant === 'warning')) {
      duration = UNDO_DURATION;
    } else {
      duration = VARIANT_DEFAULT_DURATIONS[variant];
    }
    return {
      id,
      variant,
      message: payload.message || t(`theme.sonner.default-label.${variant}`),
      title: payload.title || null,
      undoLabel: hasUndo ? payload.undoLabel : null,
      undoCallback: hasUndo ? payload.undoCallback : null,
      duration,
      hasUndo,
    };
  }

  _promoteToVisible(toast) {
    this._visible.push(toast);
    const el = this._renderToast(toast);
    // Insert before the indicator (if present) so toasts stack from the
    // bottom (column-reverse) ; the indicator stays at the visual top.
    if (this.hasIndicatorTarget) {
      this.element.insertBefore(el, this.indicatorTarget);
    } else {
      this.element.appendChild(el);
    }
    // Trigger entry animation in next frame so the browser registers the
    // initial state="entering" (opacity 0 + translateY 100%) before the
    // transition to state="visible".
    requestAnimationFrame(() => {
      el.dataset.state = 'visible';
    });
    if (toast.duration) this._startTimer(toast);
    if (toast.variant !== 'danger') this._announce(toast);
  }

  _renderToast(toast) {
    const isDanger = toast.variant === 'danger';
    const el = document.createElement(isDanger ? 'div' : 'output');
    el.id = `sonner-toast-${toast.id}`;
    el.className = 'cremona-sonner__toast';
    el.dataset.variant = toast.variant;
    el.dataset.state = 'entering';
    el.dataset.toastId = toast.id;
    if (isDanger) el.setAttribute('role', 'alert');
    el.innerHTML = this._toastInnerHTML(toast);
    return el;
  }

  _toastInnerHTML(toast) {
    const icon = ICONS[toast.variant] || '';
    const dismissAria = t('theme.sonner.aria.dismiss');
    const titleHtml = toast.title
      ? `<strong class="cremona-sonner__title">${escapeHtml(toast.title)}</strong>`
      : '';
    const undoHtml = toast.hasUndo
      ? `<button type="button" class="cremona-sonner__undo cremona-button" data-variant="ghost" data-size="sm" data-action="click->sonner#undo" data-toast-id="${escapeHtml(toast.id)}">${escapeHtml(toast.undoLabel)}</button>`
      : '';
    return (
      `<span class="cremona-sonner__icon" aria-hidden="true">${icon}</span>` +
      `<div class="cremona-sonner__body">${titleHtml}<p class="cremona-sonner__message">${escapeHtml(toast.message)}</p></div>` +
      `${undoHtml}` +
      `<button type="button" class="cremona-sonner__dismiss" data-action="click->sonner#dismiss" data-toast-id="${escapeHtml(toast.id)}" aria-label="${escapeHtml(dismissAria)}"><span aria-hidden="true">×</span></button>`
    );
  }

  _startTimer(toast) {
    if (this._paused) {
      this._timers.set(toast.id, {
        timeoutId: null,
        startedAt: Date.now(),
        duration: toast.duration,
        remaining: toast.duration,
      });
      return;
    }
    const timeoutId = setTimeout(() => this._dismissOne(toast.id, 'auto'), toast.duration);
    this._timers.set(toast.id, {
      timeoutId,
      startedAt: Date.now(),
      duration: toast.duration,
      remaining: toast.duration,
    });
  }

  _clearTimer(id) {
    const timer = this._timers.get(id);
    if (timer && timer.timeoutId !== null) clearTimeout(timer.timeoutId);
    this._timers.delete(id);
  }

  _clearAllTimers() {
    for (const timer of this._timers.values()) {
      if (timer.timeoutId !== null) clearTimeout(timer.timeoutId);
    }
    this._timers.clear();
  }

  _dismissOne(id, reason) {
    if (!id) return;
    const visibleIdx = this._visible.findIndex((toast) => toast.id === id);
    if (visibleIdx >= 0) {
      const el = document.getElementById(`sonner-toast-${id}`);
      this._clearTimer(id);
      this._visible.splice(visibleIdx, 1);
      this._undoCallbacks.delete(id);
      if (el) {
        el.dataset.state = 'exiting';
        const finalize = (event) => {
          // Filter to the opacity transition so concurrent transform
          // transitions don't trigger the cleanup early — mirrors the
          // alert-dismiss + popover finalize pattern.
          if (event && event.propertyName && event.propertyName !== 'opacity') {
            el.addEventListener('transitionend', finalize, { once: true });
            return;
          }
          if (el.parentNode) el.parentNode.removeChild(el);
          if (this._queue.length > 0 && this._visible.length < MAX_VISIBLE) {
            this._promoteToVisible(this._queue.shift());
          }
          this._renderIndicator();
        };
        el.addEventListener('transitionend', finalize, { once: true });
      }
      this._dispatch('sonner:dismiss', { id, reason });
      return;
    }
    const queueIdx = this._queue.findIndex((toast) => toast.id === id);
    if (queueIdx >= 0) {
      this._queue.splice(queueIdx, 1);
      this._undoCallbacks.delete(id);
      this._renderIndicator();
      this._dispatch('sonner:dismiss', { id, reason });
    }
  }

  _renderIndicator() {
    if (!this.hasIndicatorTarget) return;
    const count = this._queue.length;
    if (count === 0) {
      this.indicatorTarget.hidden = true;
      this.indicatorTarget.textContent = '';
      return;
    }
    this.indicatorTarget.hidden = false;
    this.indicatorTarget.textContent = t('theme.sonner.queue-more', { count });
  }

  _announce(toast) {
    if (typeof document === 'undefined') return;
    const announcer = document.getElementById('cremona-announcer');
    if (!announcer) return;
    announcer.textContent = toast.title ? `${toast.title} : ${toast.message}` : toast.message;
  }

  _dispatch(name, detail) {
    this.element.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
  }

  _registerGlobalAPI() {
    if (typeof window === 'undefined') return;
    if (window.themeToast) return; // idempotent — first connect wins
    window.themeToast = {
      show(payload) {
        document.dispatchEvent(new CustomEvent('theme:toast:show', { detail: payload }));
      },
      dismiss(id) {
        document.dispatchEvent(new CustomEvent('theme:toast:dismiss', { detail: { id } }));
      },
      dismissAll() {
        document.dispatchEvent(new CustomEvent('theme:toast:dismiss-all'));
      },
    };
  }

  _unregisterGlobalAPI() {
    if (typeof window !== 'undefined' && window.themeToast) {
      delete window.themeToast;
    }
  }
}
