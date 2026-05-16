import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { Application } from '@hotwired/stimulus';
import { __reset as resetI18n, setTranslations, setLocale } from '../../src/js/utils/i18n.js';

// Hoisted FilePond mocks — mirror popover_controller.test.js pattern.
const { mockCreate, mockRegisterPlugin, mockSetOptions, mockDestroy, instances } =
  vi.hoisted(() => {
    const instances = [];
    const on = vi.fn();
    const setOptions = vi.fn();
    const destroy = vi.fn();
    const create = vi.fn((el, opts) => {
      const handlers = {};
      const inst = {
        el,
        opts,
        on: vi.fn((event, cb) => { handlers[event] = cb; }),
        setOptions,
        destroy,
        _fire: (event, ...args) => { if (handlers[event]) handlers[event](...args); },
      };
      instances.push(inst);
      return inst;
    });
    return {
      mockCreate: create,
      mockRegisterPlugin: vi.fn(),
      mockOn: on,
      mockSetOptions: setOptions,
      mockDestroy: destroy,
      instances,
    };
  });

vi.mock('filepond', () => ({
  default: { create: mockCreate, registerPlugin: mockRegisterPlugin },
  create: mockCreate,
  registerPlugin: mockRegisterPlugin,
}));
vi.mock('filepond-plugin-file-validate-type', () => ({ default: { name: 'validateType' } }));
vi.mock('filepond-plugin-file-validate-size', () => ({ default: { name: 'validateSize' } }));
vi.mock('filepond-plugin-image-preview', () => ({ default: { name: 'imagePreview' } }));

const { default: FileUploadController, __resetFilePondCache } = await import(
  '../../src/js/controllers/file-upload_controller.js'
);

const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Unit tests for the FileUpload compound's `file-upload` controller (S2.9).
 *
 * Per [ADR-0013](../docs/adr/0013-lib-fileupload-filepond.md) :
 *   - Lazy-load FilePond core + 3 plugins via Promise.all mirror [ADR-0011] popover pattern.
 *   - Sync drop-zone + ARIA + native input on connect ; async FilePond enhancement.
 *   - Sonner compose via window.themeToast.show on upload-complete / upload-failed.
 *
 * Coverage map (12 tests) :
 *   1. connect → data-state="idle" + file-upload:mount fired.
 *   2. lazy-load resolves → FilePond.create called with the input target + options.
 *   3. registerPlugin called with the 3 plugins on first load.
 *   4. file-upload:ready fired after FilePond.create.
 *   5. disconnect → instance.destroy() called + _destroyed flag set.
 *   6. addfile event → file-upload:add dispatched with detail.file meta.
 *   7. removefile event → file-upload:remove dispatched.
 *   8. processfile (success) → file-upload:upload-complete + Sonner toast (success variant).
 *   9. processfile (error) → file-upload:upload-error + Sonner toast (danger variant).
 *  10. processfileprogress → file-upload:upload-progress with detail.progress (0..100).
 *  11. acceptValue mutation → setOptions called (not new ctor).
 *  12. disconnect before lazy-load → no ctor invoked (race-condition).
 */
describe('FileUploadController', () => {
  let app;

  beforeEach(() => {
    __resetFilePondCache();
    mockCreate.mockClear();
    mockRegisterPlugin.mockClear();
    mockSetOptions.mockClear();
    mockDestroy.mockClear();
    instances.length = 0;
    document.body.innerHTML = '';
    resetI18n();
    setTranslations('fr', {
      'theme.file-upload.labels.idle': 'Glisse-dépose tes fichiers ou clique pour parcourir',
      'theme.file-upload.labels.invalid-type': 'Type de fichier non autorisé',
      'theme.file-upload.labels.invalid-size': 'Fichier trop volumineux',
      'theme.file-upload.toast.upload-complete': 'Fichier téléversé : {filename}',
      'theme.file-upload.toast.upload-failed': 'Échec du téléversement : {filename}',
    });
    setLocale('fr');
    // Stub window.themeToast for Sonner compose tests.
    window.themeToast = { show: vi.fn(), dismiss: vi.fn(), dismissAll: vi.fn() };
  });

  afterEach(() => {
    if (app) app.stop();
    app = null;
    document.body.innerHTML = '';
    delete window.themeToast;
  });

  async function mount({
    accept = '*/*',
    maxFileSize = '10MB',
    maxFiles = 0,
    server = '',
    imagePreview = true,
  } = {}) {
    document.body.innerHTML = `
      <div id="fu-wrap" class="cremona-file-upload"
        data-controller="file-upload"
        data-file-upload-accept-value="${accept}"
        data-file-upload-max-file-size-value="${maxFileSize}"
        data-file-upload-max-files-value="${maxFiles}"
        data-file-upload-server-value="${server}"
        data-file-upload-image-preview-value="${imagePreview}"
        role="region" aria-roledescription="zone de téléversement"
        aria-label="Téléverse tes fichiers">
        <input id="fu-input" type="file" data-file-upload-target="input" />
      </div>
    `;
    app = Application.start();
    app.register('file-upload', FileUploadController);
    await tick();
    await tick();
    return {
      wrap: document.getElementById('fu-wrap'),
      ctrl: app.controllers.find((c) => c.identifier === 'file-upload'),
      input: document.getElementById('fu-input'),
      instance: instances[0],
    };
  }

  // 1
  it('connect → data-state="idle" + file-upload:mount fired', async () => {
    const events = [];
    document.body.addEventListener('file-upload:mount', (e) => events.push(e.detail), { once: false });
    const { wrap } = await mount({});
    expect(events).toHaveLength(1);
    // After lazy-load resolves the state flips to 'ready'.
    expect(['idle', 'ready']).toContain(wrap.getAttribute('data-state'));
  });

  // 2
  it('lazy-load resolves → FilePond.create called with the input + options', async () => {
    const { input } = await mount({ accept: 'image/*', maxFileSize: '5MB' });
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate.mock.calls[0][0]).toBe(input);
    const opts = mockCreate.mock.calls[0][1];
    expect(opts.acceptedFileTypes).toEqual(['image/*']);
    expect(opts.maxFileSize).toBe('5MB');
  });

  // 3
  it('registerPlugin called with the 3 plugins on first load', async () => {
    await mount({});
    expect(mockRegisterPlugin).toHaveBeenCalledTimes(1);
    const args = mockRegisterPlugin.mock.calls[0];
    expect(args).toHaveLength(3); // 3 plugins passed as separate args
  });

  // 4
  it('file-upload:ready fired after FilePond.create', async () => {
    const events = [];
    document.body.addEventListener('file-upload:ready', (e) => events.push(e.detail), { once: false });
    await mount({});
    expect(events).toHaveLength(1);
  });

  // 5
  it('disconnect → instance.destroy() called + _destroyed flag set', async () => {
    const { ctrl, wrap } = await mount({});
    wrap.remove(); // element removal is what Stimulus observes to disconnect
    await tick();
    expect(ctrl._destroyed).toBe(true);
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  // 6
  it('addfile event → file-upload:add dispatched with detail.file meta', async () => {
    const { wrap, instance } = await mount({});
    const events = [];
    wrap.addEventListener('file-upload:add', (e) => events.push(e.detail));
    instance._fire('addfile', null, { filename: 'photo.jpg', fileSize: 1024, fileType: 'image/jpeg' });
    expect(events).toHaveLength(1);
    expect(events[0].file).toEqual({ name: 'photo.jpg', size: 1024, type: 'image/jpeg' });
  });

  // 7
  it('removefile event → file-upload:remove dispatched', async () => {
    const { wrap, instance } = await mount({});
    const events = [];
    wrap.addEventListener('file-upload:remove', (e) => events.push(e.detail));
    instance._fire('removefile', null, { filename: 'old.pdf', fileSize: 2048, fileType: 'application/pdf' });
    expect(events).toHaveLength(1);
    expect(events[0].file.name).toBe('old.pdf');
  });

  // 8
  it('processfile (success) → file-upload:upload-complete + Sonner toast (success)', async () => {
    const { wrap, instance } = await mount({});
    const events = [];
    wrap.addEventListener('file-upload:upload-complete', (e) => events.push(e.detail));
    instance._fire('processfile', null, { filename: 'report.pdf', fileSize: 5000, fileType: 'application/pdf', serverId: 'abc123' });
    expect(events).toHaveLength(1);
    expect(events[0].file.name).toBe('report.pdf');
    expect(events[0].serverId).toBe('abc123');
    expect(window.themeToast.show).toHaveBeenCalledTimes(1);
    expect(window.themeToast.show.mock.calls[0][0].variant).toBe('success');
  });

  // 9
  it('processfile (error) → file-upload:upload-error + Sonner toast (danger)', async () => {
    const { wrap, instance } = await mount({});
    const events = [];
    wrap.addEventListener('file-upload:upload-error', (e) => events.push(e.detail));
    instance._fire('processfile',
      { body: 'Server returned 500', main: 'Upload failed' },
      { filename: 'bad.pdf', fileSize: 100, fileType: 'application/pdf' });
    expect(events).toHaveLength(1);
    expect(events[0].error).toContain('500');
    expect(window.themeToast.show).toHaveBeenCalledTimes(1);
    expect(window.themeToast.show.mock.calls[0][0].variant).toBe('danger');
  });

  // 10
  it('processfileprogress → file-upload:upload-progress with detail.progress (0..100)', async () => {
    const { wrap, instance } = await mount({});
    const events = [];
    wrap.addEventListener('file-upload:upload-progress', (e) => events.push(e.detail));
    instance._fire('processfileprogress', { filename: 'x.jpg', fileSize: 1, fileType: 'image/jpeg' }, 0.42);
    expect(events).toHaveLength(1);
    expect(events[0].progress).toBe(42);
  });

  // 11
  it('acceptValue mutation → setOptions called (not new ctor)', async () => {
    const { ctrl } = await mount({});
    mockSetOptions.mockClear();
    ctrl.acceptValue = 'image/png';
    await tick();
    await tick();
    expect(mockSetOptions).toHaveBeenCalledTimes(1);
    expect(instances).toHaveLength(1); // no new ctor
  });

  // 12
  it('disconnect before lazy-load → no ctor invoked', async () => {
    // Mount, then start a fresh (cold-cache) async enhancement and flip the
    // _destroyed flag synchronously — before loadFilePond().then() resolves.
    // The guard inside the .then() must skip FilePond.create().
    const { ctrl } = await mount({});
    __resetFilePondCache();
    instances.length = 0;
    mockCreate.mockClear();
    ctrl._instance = null;
    ctrl._lastConfigSig = null;
    ctrl._enhanceWithFilePond();  // load now in flight, _destroyed still false
    ctrl._destroyed = true;       // race: the controller disconnects first
    await tick();
    await tick();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
