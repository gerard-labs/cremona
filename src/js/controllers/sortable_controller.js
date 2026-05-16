/**
 * sortable_controller.js — Ring 4 PM domain — 10e lazy adapter cascade.
 *
 * Wraps Sortable.js v1.15.x with the kit's lazy-on-mount discipline per
 * ADR-0045 (mirror ADR-0023 Tagify verbatim). The ~12 kB Sortable.js chunk
 * is fetched lazily on first connect ; the drag-handle affordance becomes
 * functional within ~5-200 ms. Keyboard reorder (Space grab + Arrow keys +
 * Escape) is wired SYNC and works even before the lazy chunk arrives —
 * preserves a11y for screen-reader + keyboard-only users.
 *
 * Lazy adapter cascade : 10e after Floating UI / ApexCharts / FilePond /
 * zxcvbn-ts / driver.js / intl-tel-input / Tagify / signature_pad / Coloris.
 * Lazy-on-mount variant — 5e use after FilePond / Chart / Tagify / driver.js.
 *
 * Events emitted (bubbles + composed) :
 *   sortable:mount         — detail.{ group, itemCount }       on connect()
 *   sortable:ready         — detail.{ itemCount }              on Sortable.js init
 *   sortable:reorder       — detail.{ oldIndex, newIndex, from, to, itemId, source }
 *   sortable:cross-add     — detail.{ ...same shape }          on cross-list add
 *   sortable:cross-remove  — detail.{ ...same shape }          on cross-list remove
 *
 * Targets : list (the <ul> / <ol> / <tbody> Sortable.js attaches to) +
 *           item (each draggable child — listitem role + tabindex 0).
 *
 * Values : group (cross-list reorder grouping ; '' = no cross-list) +
 *          handleOnly (bool default true ; drag from .theme-sortable-handle only) +
 *          animation (ms default 150 ; 0 honors prefers-reduced-motion) +
 *          disabled (bool default false ; start disabled for archived boards).
 */

import { Controller } from '@hotwired/stimulus';
import { t } from '../utils/i18n.js';

let _Sortable = null;
let _SortablePromise = null;

function loadSortable() {
  if (_Sortable) return Promise.resolve(_Sortable);
  if (_SortablePromise) return _SortablePromise;
  _SortablePromise = import('sortablejs').then((mod) => {
    _Sortable = mod.default;
    return _Sortable;
  });
  return _SortablePromise;
}

export function __resetSortableCache() {
  _Sortable = null;
  _SortablePromise = null;
}

export default class SortableController extends Controller {
  static targets = ['list', 'item'];
  static values = {
    group: { type: String, default: '' },
    handleOnly: { type: Boolean, default: true },
    animation: { type: Number, default: 150 },
    disabled: { type: Boolean, default: false },
  };

  _destroyed = false;
  _sortable = null;
  _keydownBound = null;
  _reducedMotion = false;

  connect() {
    this._destroyed = false;
    this._sortable = null;
    this._reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (this.hasListTarget) {
      this.listTarget.setAttribute('role', 'list');
      this.listTarget.setAttribute('aria-label', t('theme.sortable.aria.list'));
    }
    this.itemTargets.forEach((item) => {
      item.setAttribute('role', 'listitem');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-grabbed', 'false');
      item.setAttribute('aria-roledescription', t('theme.sortable.aria.item'));
    });
    this.element.setAttribute('data-sortable-state', 'idle');
    this._dispatch('sortable:mount', { group: this.groupValue, itemCount: this.itemTargets.length });
    this._keydownBound = (e) => this._handleKeydown(e);
    this.element.addEventListener('keydown', this._keydownBound);
    if (!this.disabledValue) {
      this._initOnMount();
    }
  }

  disconnect() {
    this._destroyed = true;
    if (this._sortable) {
      this._sortable.destroy();
      this._sortable = null;
    }
    if (this._keydownBound) {
      this.element.removeEventListener('keydown', this._keydownBound);
      this._keydownBound = null;
    }
  }

  _initOnMount() {
    if (this._destroyed) return;
    if (this._sortable) return;
    if (_Sortable) {
      this._beginSortable(_Sortable);
    } else {
      loadSortable().then((Ctor) => {
        if (this._destroyed) return;
        if (this._sortable) return;
        this._beginSortable(Ctor);
      });
    }
  }

  _beginSortable(Ctor) {
    if (!this.hasListTarget) return;
    this._sortable = new Ctor(this.listTarget, {
      group: this.groupValue || undefined,
      handle: this.handleOnlyValue ? '.theme-sortable-handle' : undefined,
      animation: this._reducedMotion ? 0 : this.animationValue,
      ghostClass: 'theme-sortable-ghost',
      chosenClass: 'theme-sortable-chosen',
      dragClass: 'theme-sortable-drag',
      onUpdate: (e) => this._dispatchReorder('reorder', e, 'pointer'),
      onAdd: (e) => this._dispatchReorder('cross-add', e, 'pointer'),
      onRemove: (e) => this._dispatchReorder('cross-remove', e, 'pointer'),
      onStart: (e) => {
        if (e.item) e.item.setAttribute('aria-grabbed', 'true');
        this.element.setAttribute('data-sortable-state', 'dragging');
      },
      onEnd: (e) => {
        if (e.item) e.item.setAttribute('aria-grabbed', 'false');
        this.element.setAttribute('data-sortable-state', 'ready');
      },
    });
    this.element.setAttribute('data-sortable-state', 'ready');
    this._dispatch('sortable:ready', { itemCount: this.itemTargets.length });
  }

  _dispatchReorder(action, sortableEvent, source) {
    const detail = {
      oldIndex: sortableEvent.oldIndex,
      newIndex: sortableEvent.newIndex,
      from: sortableEvent.from?.id || null,
      to: sortableEvent.to?.id || null,
      itemId: sortableEvent.item?.dataset.itemId || null,
      source,
    };
    this._dispatch(`sortable:${action}`, detail);
  }

  _handleKeydown(e) {
    if (!e.target.matches('[role="listitem"]')) return;
    const item = e.target;
    const grabbed = item.getAttribute('aria-grabbed') === 'true';
    if (e.key === ' ' && !grabbed) {
      e.preventDefault();
      item.setAttribute('aria-grabbed', 'true');
      this.element.setAttribute('data-sortable-state', 'keyboard-grabbed');
    } else if (e.key === ' ' && grabbed) {
      e.preventDefault();
      item.setAttribute('aria-grabbed', 'false');
      this.element.setAttribute('data-sortable-state', 'ready');
      const idx = Array.from(item.parentNode.children).indexOf(item);
      this._dispatch('sortable:reorder', {
        oldIndex: -1,
        newIndex: idx,
        from: null,
        to: item.parentNode.id || null,
        itemId: item.dataset.itemId || null,
        source: 'keyboard',
      });
    } else if (grabbed && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const sibling = e.key === 'ArrowUp' ? item.previousElementSibling : item.nextElementSibling;
      if (sibling) {
        item.parentNode.insertBefore(item, e.key === 'ArrowUp' ? sibling : sibling.nextElementSibling);
        item.focus();
      }
    } else if (e.key === 'Escape' && grabbed) {
      e.preventDefault();
      item.setAttribute('aria-grabbed', 'false');
      this.element.setAttribute('data-sortable-state', 'ready');
    }
  }

  _dispatch(name, detail) {
    this.element.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
    }));
  }
}
