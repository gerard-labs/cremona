<!--
  FileUpload story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5) :
    1. Default — multi-file drop zone, MIME-agnostic.
    2. Image-only — accept="image/*" + image preview on.
    3. Single-file — maxFiles=1.
    4. Per-file size limit — maxFileSize="2MB" stress test.
    5. Events log — file-upload:upload-complete + Sonner toast demo.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot(document.documentElement);
  for (const log of document.querySelectorAll('[data-events-log]')) {
    const id = log.getAttribute('data-events-log');
    const wrap = document.getElementById(id);
    if (!wrap) continue;
    const out = log.querySelector('[data-events-out]');
    const append = (txt) => {
      const line = document.createElement('div');
      line.textContent = txt;
      if (out) out.appendChild(line);
    };
    wrap.addEventListener('file-upload:ready', () => append('file-upload:ready'));
    wrap.addEventListener('file-upload:add', (e) => append('file-upload:add → ' + e.detail.file?.name));
    wrap.addEventListener('file-upload:upload-complete', (e) => append('file-upload:upload-complete → ' + e.detail.file?.name));
    wrap.addEventListener('file-upload:upload-error', (e) => append('file-upload:upload-error → ' + e.detail.error));
  }
});

let _fuCounter = 0;
function nextId(prefix = 'fu') { return `${prefix}-${++_fuCounter}`; }

function S(key) { return t('theme.file-upload.story.' + key); }

function fileUpload({
  id, name = 'files', label = '', accept = '*/*', maxFileSize = '10MB',
  maxFiles = 0, server = '', imagePreview = true, locale = 'fr',
}) {
  const wrapId = id || nextId('fu');
  const multiple = maxFiles !== 1;
  return `<div id="${wrapId}" class="cremona-file-upload"
    data-controller="file-upload"
    data-file-upload-accept-value="${accept}"
    data-file-upload-max-file-size-value="${maxFileSize}"
    data-file-upload-max-files-value="${maxFiles}"
    data-file-upload-server-value="${server}"
    data-file-upload-image-preview-value="${imagePreview}"
    data-file-upload-locale-value="${locale}"
    data-state="idle"
    role="region"
    aria-roledescription="${S('aria.role-description')}"
    aria-label="${label}">
    <input type="file" id="${wrapId}-input" name="${name}${multiple ? '[]' : ''}"
      data-file-upload-target="input"
      accept="${accept}"
      ${multiple ? 'multiple' : ''}
      aria-describedby="${wrapId}-affordance" />
    <label for="${wrapId}-input" class="cremona-file-upload__affordance" id="${wrapId}-affordance">
      <span class="cremona-file-upload__icon" aria-hidden="true"></span>
      <span class="cremona-file-upload__affordance-text">${label}</span>
    </label>
  </div>`;
}

const bodyHtml = `
  <section class="fu-story" data-testid="file-upload-root">
    <header class="fu-story__header">
      <h1>${t('theme.file-upload.story.title')}</h1>
      <p>${t('theme.file-upload.story.subtitle')}</p>
    </header>

    <section class="fu-story__section" aria-labelledby="fu-section-default">
      <h2 id="fu-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.default')}</h2>
      <p class="fu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.default')}</p>
      ${fileUpload({ name: 'documents', label: S('label.default'), accept: '*/*', maxFileSize: '10MB' })}
    </section>

    <section class="fu-story__section" aria-labelledby="fu-section-image">
      <h2 id="fu-section-image" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.image')}</h2>
      <p class="fu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.image')}</p>
      ${fileUpload({ name: 'photos', label: S('label.image'), accept: 'image/*', maxFileSize: '5MB', imagePreview: true })}
    </section>

    <section class="fu-story__section" aria-labelledby="fu-section-single">
      <h2 id="fu-section-single" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.single')}</h2>
      <p class="fu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.single')}</p>
      ${fileUpload({ name: 'avatar', label: S('label.single'), accept: 'image/*', maxFileSize: '2MB', maxFiles: 1, imagePreview: true })}
    </section>

    <section class="fu-story__section" aria-labelledby="fu-section-strict">
      <h2 id="fu-section-strict" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.strict')}</h2>
      <p class="fu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.strict')}</p>
      ${fileUpload({ name: 'pdfs', label: S('label.strict'), accept: 'application/pdf', maxFileSize: '2MB', maxFiles: 3 })}
    </section>

    <section class="fu-story__section" aria-labelledby="fu-section-events">
      <h2 id="fu-section-events" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.events')}</h2>
      <p class="fu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.events')}</p>
      ${fileUpload({ id: 'fu-events-demo', name: 'events', label: S('label.events'), maxFileSize: '5MB' })}
      <div class="fu-story__log" data-events-log="fu-events-demo">
        <div class="cremona-typography" data-variant="overline" data-color="tertiary">${S('events.log')}</div>
        <div data-events-out class="fu-story__log-out"></div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/FileUpload" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="fu-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="fu-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.fu-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.fu-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.fu-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.fu-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.fu-story__explainer { max-inline-size: 70ch; }
.fu-story__log { display: grid; gap: var(--spacing-2); padding: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); font: var(--typography-code); font-size: var(--font-size-xs); }
.fu-story__log-out { display: grid; gap: var(--spacing-1); color: var(--color-text-secondary); min-block-size: var(--spacing-8); }
.fu-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
