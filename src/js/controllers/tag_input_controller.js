/**
 * tag-input controller — Form-TagInput (Ring 3).
 *
 * Lazy-loads Tagify v4.x on mount. Lazy-on-mount because the chip affordance
 * must render immediately (first-focus deferral would jank the input → chip
 * transform visually).
 *
 * Plurals via Intl.PluralRules for the chip counter (1 étiquette / X étiquettes).
 *
 * Surface :
 *   data-controller="tag-input"
 *   data-tag-input-whitelist-value='[...]'
 *   data-tag-input-max-tags-value="0"
 *   data-tag-input-duplicates-value="false"
 *   data-tag-input-delimiters-value=",|\\n"
 *
 *   Events (bubbles + composed) :
 *     tag-input:mount    (detail.maxTags)
 *     tag-input:ready    (detail.tagCount)
 *     tag-input:add      (detail.{ tag, tagCount })
 *     tag-input:remove   (detail.{ tag, tagCount })
 *     tag-input:change   (detail.{ tags, tagCount })
 */

import { Controller } from '@hotwired/stimulus';
import { t, getLocale } from '../utils/i18n.js';

let _Tagify = null;
let _TagifyPromise = null;

function loadTagify() {
  if (_Tagify) return Promise.resolve(_Tagify);
  if (_TagifyPromise) return _TagifyPromise;
  _TagifyPromise = import('@yaireo/tagify').then((mod) => {
    _Tagify = mod.default;
    return _Tagify;
  });
  return _TagifyPromise;
}

/**
 * Reset the module-scoped lazy-load cache. Test-only — exposed for the
 * Vitest unit suite to isolate per-test mock state.
 */
export function __resetTagifyCache() {
  _Tagify = null;
  _TagifyPromise = null;
}

export default class TagInputController extends Controller {
  static targets = ['input', 'hiddenInput', 'counter'];
  static values = {
    whitelist: { type: Array, default: [] },
    maxTags: { type: Number, default: 0 },
    duplicates: { type: Boolean, default: false },
    delimiters: { type: String, default: ',|\\n' },
  };

  _destroyed = false;
  _tagify = null;
  _pluralRules = null;

  connect() {
    this._destroyed = false;
    this._tagify = null;
    try {
      this._pluralRules = new Intl.PluralRules(getLocale() || 'fr');
    } catch {
      this._pluralRules = null;
    }
    if (this.hasInputTarget) {
      if (!this.inputTarget.getAttribute('role')) {
        this.inputTarget.setAttribute('role', 'textbox');
      }
      this.inputTarget.setAttribute('aria-multiline', 'false');
    }
    this.element.setAttribute('data-tag-input-state', 'idle');
    this.element.dispatchEvent(
      new CustomEvent('tag-input:mount', {
        bubbles: true,
        composed: true,
        detail: { maxTags: this.maxTagsValue },
      }),
    );
    this._initOnMount();
  }

  disconnect() {
    this._destroyed = true;
    if (this._tagify && typeof this._tagify.destroy === 'function') {
      this._tagify.destroy();
    }
    this._tagify = null;
  }

  _initOnMount() {
    if (this._destroyed) return;
    if (this._tagify) return;
    if (_Tagify) {
      this._beginTagify(_Tagify);
    } else {
      loadTagify().then((Ctor) => {
        if (this._destroyed) return;
        if (this._tagify) return;
        this._beginTagify(Ctor);
      });
    }
  }

  _beginTagify(Ctor) {
    if (!this.hasInputTarget) return;
    let delimitersRegex;
    try {
      delimitersRegex = new RegExp(this.delimitersValue);
    } catch {
      delimitersRegex = /,|\n/;
    }
    this._tagify = new Ctor(this.inputTarget, {
      whitelist: this.whitelistValue,
      maxTags: this.maxTagsValue || undefined,
      duplicates: this.duplicatesValue,
      delimiters: delimitersRegex,
      classNames: { tags: 'cremona-tag-input' },
    });
    this.element.setAttribute('data-tag-input-state', 'ready');

    if (typeof this._tagify.on === 'function') {
      this._tagify.on('add', (e) => this._dispatchChange('add', e.detail));
      this._tagify.on('remove', (e) => this._dispatchChange('remove', e.detail));
    }

    const initialCount = Array.isArray(this._tagify.value) ? this._tagify.value.length : 0;
    this._updateCounter(initialCount);
    this._syncHiddenInput();

    this.element.dispatchEvent(
      new CustomEvent('tag-input:ready', {
        bubbles: true,
        composed: true,
        detail: { tagCount: initialCount },
      }),
    );
  }

  _dispatchChange(action, detail) {
    if (!this._tagify) return;
    const tagValue = (detail && detail.data && detail.data.value) || (detail && detail.value) || '';
    const tagCount = Array.isArray(this._tagify.value) ? this._tagify.value.length : 0;
    this.element.dispatchEvent(
      new CustomEvent(`tag-input:${action}`, {
        bubbles: true,
        composed: true,
        detail: { tag: tagValue, tagCount },
      }),
    );
    const tags = Array.isArray(this._tagify.value) ? this._tagify.value.map((t) => t.value) : [];
    this.element.dispatchEvent(
      new CustomEvent('tag-input:change', {
        bubbles: true,
        composed: true,
        detail: { tags, tagCount },
      }),
    );
    this._updateCounter(tagCount);
    this._syncHiddenInput();
  }

  _updateCounter(count) {
    if (!this.hasCounterTarget) return;
    const category = this._pluralRules
      ? this._pluralRules.select(count)
      : count === 0 ? 'zero' : count === 1 ? 'one' : 'other';
    const key = count === 0
      ? 'theme.form.tag-input.count.zero'
      : category === 'one'
        ? 'theme.form.tag-input.count.one'
        : 'theme.form.tag-input.count.other';
    this.counterTarget.textContent = t(key, { count });
  }

  _syncHiddenInput() {
    if (!this._tagify || !this.hasHiddenInputTarget) return;
    const tags = Array.isArray(this._tagify.value) ? this._tagify.value.map((t) => t.value) : [];
    this.hiddenInputTarget.value = JSON.stringify(tags);
  }
}
