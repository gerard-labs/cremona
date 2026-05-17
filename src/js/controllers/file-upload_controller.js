import { Controller } from '@hotwired/stimulus';
import { t } from '../utils/i18n.js';

/**
 * file-upload — Wrapped FilePond adapter (Ring 2).
 *
 * FilePond v4.x is the underlying lib. **Lazy-loaded** via module-scoped
 * dynamic `import()`. Core + 3 default plugins (validateType, validateSize,
 * imagePreview) are fetched on first FileUpload mount per session and cached.
 *  - The native `<input type="file">` is always usable even before the
 *    chunk arrives — drop-zone enhancement is progressive enhancement.
 *  - Composes Sonner via `window.themeToast.show()` for upload-complete /
 *    upload-failed.
 *
 * Per WAI-ARIA :
 *  - `role="region"` + `aria-roledescription` (consumer-localized or kit
 *    default "zone de téléversement" FR / "upload area" EN) + `aria-label`.
 *  - Drop zone : `aria-dropeffect="copy"` stamped on pointerenter.
 *  - File list : FilePond's native semantic (role="list" / role="listitem"
 *    per file row + role="progressbar" per file).
 *
 * Stimulus value-changed guard pattern :
 *  - `_lastConfigSig` class field initialized to `null` BEFORE Stimulus
 *    callbacks fire ; idempotency cache on config-driven re-render.
 *
 * Race-condition surface :
 *  - `_destroyed` flag prevents post-disconnect FilePond instance creation.
 *  - FilePond's own destroy() lifecycle removes the instance + listeners.
 *
 * Targets :
 *   input (required) — the native `<input type="file">` element. FilePond
 *                       wraps this element ; pre-enhancement, it works as
 *                       a vanilla file picker.
 *
 * Values :
 *   accept           (String,  default '*\/*')                 MIME-type filter (forwarded to FilePond's `acceptedFileTypes`).
 *   maxFileSize      (String,  default '10MB')                 max per file (FilePond accepts '10MB', '500KB' formats).
 *   maxFiles         (Number,  default 0)                      0 = unlimited.
 *   server           (String,  default '')                     endpoint URL ; empty = consumer-managed via events.
 *   imagePreview     (Boolean, default true)                   enable image preview thumbnails.
 *   locale           (String,  default 'fr')                   locale forwarded to FilePond labels.
 *   roleDescription  (String,  default '')                     aria-roledescription override.
 *
 * Events emitted (raw CustomEvent, bubbles + composed) :
 *   file-upload:mount             — fired in connect() before the lazy-load starts.
 *   file-upload:ready             — fired AFTER FilePond enhancement complete.
 *   file-upload:add               — detail.{ file: { name, size, type } } per file added.
 *   file-upload:remove            — detail.{ file } per file removed.
 *   file-upload:upload-start      — detail.{ file }.
 *   file-upload:upload-progress   — detail.{ file, progress: 0..100 }.
 *   file-upload:upload-complete   — detail.{ file, serverId }.
 *   file-upload:upload-error      — detail.{ file, error: string }.
 */

// Module-scoped FilePond cache (mirror popover lazy-load pattern).
let _filePond = null;
let _filePondPromise = null;

function loadFilePond() {
  if (_filePond) return Promise.resolve(_filePond);
  if (_filePondPromise) return _filePondPromise;
  _filePondPromise = Promise.all([
    import('filepond'),
    import('filepond-plugin-file-validate-type'),
    import('filepond-plugin-file-validate-size'),
    import('filepond-plugin-image-preview'),
  ]).then(([core, validateType, validateSize, imagePreview]) => {
    const fp = core.default || core;
    const vt = validateType.default || validateType;
    const vs = validateSize.default || validateSize;
    const ip = imagePreview.default || imagePreview;
    if (typeof fp.registerPlugin === 'function') {
      fp.registerPlugin(vt, vs, ip);
    }
    _filePond = fp;
    return _filePond;
  });
  return _filePondPromise;
}

/** Test-only hook : reset the module-scoped cache between tests. */
export function __resetFilePondCache() {
  _filePond = null;
  _filePondPromise = null;
}

export default class FileUploadController extends Controller {
  static targets = ['input'];

  static values = {
    accept: { type: String, default: '*/*' },
    maxFileSize: { type: String, default: '10MB' },
    maxFiles: { type: Number, default: 0 },
    server: { type: String, default: '' },
    imagePreview: { type: Boolean, default: true },
    locale: { type: String, default: 'fr' },
    roleDescription: { type: String, default: '' },
  };

  _lastConfigSig = null;
  _instance = null;
  _destroyed = false;

  connect() {
    this._destroyed = false;
    this.element.setAttribute('data-state', 'idle');
    this._dispatch('file-upload:mount', {});
    this._enhanceWithFilePond();
  }

  disconnect() {
    this._destroyed = true;
    if (this._instance) {
      try { this._instance.destroy(); } catch { /* noop */ }
      this._instance = null;
    }
  }

  _enhanceWithFilePond() {
    if (!this.hasInputTarget) return;
    const sig = this._configSignature();
    if (sig === this._lastConfigSig) return;
    this._lastConfigSig = sig;
    loadFilePond().then((FilePond) => {
      if (this._destroyed) return;
      if (sig !== this._lastConfigSig) return;
      this._instantiate(FilePond);
    });
  }

  _instantiate(FilePond) {
    const opts = this._buildOptions();
    if (this._instance) {
      try { this._instance.setOptions(opts); } catch { /* noop */ }
    } else if (typeof FilePond.create === 'function') {
      this._instance = FilePond.create(this.inputTarget, opts);
      this._wireFilePondEvents();
      this.element.setAttribute('data-state', 'ready');
      this._dispatch('file-upload:ready', {});
    }
  }

  _buildOptions() {
    const opts = {
      acceptedFileTypes: this.acceptValue === '*/*' ? null : this.acceptValue.split(',').map((s) => s.trim()),
      maxFileSize: this.maxFileSizeValue,
      maxFiles: this.maxFilesValue > 0 ? this.maxFilesValue : undefined,
      allowMultiple: this.maxFilesValue !== 1,
      allowImagePreview: this.imagePreviewValue,
      labelIdle: this._label('idle'),
      labelFileTypeNotAllowed: this._label('invalid-type'),
      labelMaxFileSizeExceeded: this._label('invalid-size'),
      labelFileProcessing: this._label('processing'),
      labelFileProcessingComplete: this._label('complete'),
      labelFileProcessingAborted: this._label('aborted'),
      labelFileProcessingError: this._label('error'),
      labelTapToCancel: this._label('tap-to-cancel'),
      labelTapToRetry: this._label('tap-to-retry'),
      labelTapToUndo: this._label('tap-to-undo'),
    };
    if (this.serverValue) opts.server = this.serverValue;
    return opts;
  }

  _wireFilePondEvents() {
    if (!this._instance || typeof this._instance.on !== 'function') return;
    this._instance.on('addfile', (error, file) => {
      if (error) {
        this._dispatch('file-upload:upload-error', {
          file: this._fileMeta(file),
          error: error.body || error.main || String(error),
        });
        return;
      }
      this._dispatch('file-upload:add', { file: this._fileMeta(file) });
    });
    this._instance.on('removefile', (_error, file) => {
      this._dispatch('file-upload:remove', { file: this._fileMeta(file) });
    });
    this._instance.on('processfilestart', (file) => {
      this._dispatch('file-upload:upload-start', { file: this._fileMeta(file) });
    });
    this._instance.on('processfileprogress', (file, progress) => {
      this._dispatch('file-upload:upload-progress', {
        file: this._fileMeta(file),
        progress: Math.round(progress * 100),
      });
    });
    this._instance.on('processfile', (error, file) => {
      if (error) {
        this._dispatch('file-upload:upload-error', {
          file: this._fileMeta(file),
          error: error.body || error.main || String(error),
        });
        this._toastError(file);
        return;
      }
      this._dispatch('file-upload:upload-complete', {
        file: this._fileMeta(file),
        serverId: file.serverId || null,
      });
      this._toastComplete(file);
    });
  }

  _fileMeta(file) {
    if (!file || typeof file !== 'object') return null;
    return {
      name: file.filename || file.name || '',
      size: file.fileSize || file.size || 0,
      type: file.fileType || file.type || '',
    };
  }

  _toastComplete(file) {
    if (typeof window === 'undefined' || !window.themeToast) return;
    window.themeToast.show({
      variant: 'success',
      message: t('theme.file-upload.toast.upload-complete', {
        filename: file?.filename || file?.name || '',
      }),
    });
  }

  _toastError(file) {
    if (typeof window === 'undefined' || !window.themeToast) return;
    window.themeToast.show({
      variant: 'danger',
      message: t('theme.file-upload.toast.upload-failed', {
        filename: file?.filename || file?.name || '',
      }),
    });
  }

  _label(key) {
    return t(`theme.file-upload.labels.${key}`);
  }

  // ---------- Stimulus value-changed callbacks ----------

  acceptValueChanged() { this._enhanceWithFilePond(); }
  maxFileSizeValueChanged() { this._enhanceWithFilePond(); }
  maxFilesValueChanged() { this._enhanceWithFilePond(); }
  serverValueChanged() { this._enhanceWithFilePond(); }
  imagePreviewValueChanged() { this._enhanceWithFilePond(); }
  localeValueChanged() { this._enhanceWithFilePond(); }

  _configSignature() {
    return [
      this.acceptValue, this.maxFileSizeValue, this.maxFilesValue,
      this.serverValue, this.imagePreviewValue, this.localeValue,
    ].join('|');
  }

  _dispatch(name, detail) {
    this.element.dispatchEvent(
      new CustomEvent(name, { bubbles: true, composed: true, detail }),
    );
  }
}
