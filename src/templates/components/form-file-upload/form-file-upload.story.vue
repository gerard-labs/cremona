<!--
  Form-FileUpload story — 4 viewport variants.
  Sections : default-avatar · with-existing-value · validation-error · multi-file.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderFormFileUpload({ id, label, help, error, required = false, maxFiles = 1, acceptedFileTypes = [], maxFileSize }) {
  const describedByIds = [];
  if (help) describedByIds.push(`${id}-help`);
  if (error) describedByIds.push(`${id}-error`);
  const describedBy = describedByIds.length ? ` aria-describedby="${describedByIds.join(' ')}"` : '';
  const invalid = error ? ' theme-field--invalid' : '';
  return `
    <div class="theme-field theme-form-file-upload${invalid}">
      <label class="theme-label" for="${id}-input">${label}${required ? ' <span aria-hidden="true">*</span>' : ''}</label>
      <div class="theme-form-file-upload__widget" data-controller="file-upload" data-file-upload-accepted-file-types-value="${JSON.stringify(acceptedFileTypes).replace(/"/g, '&quot;')}"${maxFileSize ? ` data-file-upload-max-file-size-value="${maxFileSize}"` : ''} data-file-upload-max-files-value="${maxFiles}" data-file-upload-allow-image-preview-value="true">
        <input type="file" id="${id}-input" name="${id}" data-file-upload-target="input"${required ? ' required aria-required="true"' : ''}${error ? ' aria-invalid="true"' : ''}${describedBy}${acceptedFileTypes.length ? ` accept="${acceptedFileTypes.join(',')}"` : ''}${maxFiles > 1 ? ' multiple' : ''} />
      </div>
      ${help ? `<p class="theme-field__help" id="${id}-help">${help}</p>` : ''}
      ${error ? `<p class="theme-field__error" id="${id}-error">${error}</p>` : ''}
    </div>
  `;
}

const bodyHtml = `
  <section class="form-file-upload-story" aria-labelledby="form-file-upload-story-title">
    <header class="form-file-upload-story__header">
      <h1 id="form-file-upload-story-title">${t('theme.form.file-upload.story.title')}</h1>
      <p>${t('theme.form.file-upload.story.subtitle')}</p>
    </header>

    <section class="form-file-upload-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.form.file-upload.story.section.default-avatar')}</h2>
      <div class="form-file-upload-story__frame">${renderFormFileUpload({ id: 'story-avatar', label: t('theme.form.file-upload.label.avatar'), help: t('theme.form.file-upload.help.avatar-format'), required: true, acceptedFileTypes: ['image/jpeg', 'image/png'], maxFileSize: '2MB' })}</div>
    </section>

    <section class="form-file-upload-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.form.file-upload.story.section.with-error-format')}</h2>
      <div class="form-file-upload-story__frame">${renderFormFileUpload({ id: 'story-error-format', label: t('theme.form.file-upload.label.avatar'), help: t('theme.form.file-upload.help.avatar-format'), error: t('theme.form.file-upload.error.format'), required: true, acceptedFileTypes: ['image/jpeg', 'image/png'] })}</div>
    </section>

    <section class="form-file-upload-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.form.file-upload.story.section.multi-file')}</h2>
      <div class="form-file-upload-story__frame">${renderFormFileUpload({ id: 'story-multi', label: t('theme.form.file-upload.label.documents'), help: t('theme.form.file-upload.help.documents-format'), maxFiles: 5, acceptedFileTypes: ['application/pdf', 'image/png'], maxFileSize: '5MB' })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Form-FileUpload" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="form-file-upload-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="form-file-upload-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.form-file-upload-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.form-file-upload-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.form-file-upload-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.form-file-upload-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.form-file-upload-story__frame { min-block-size: 14rem; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); overflow: hidden; padding: var(--spacing-4); }
.form-file-upload-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
