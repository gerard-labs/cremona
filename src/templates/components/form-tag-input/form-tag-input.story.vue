<!--
  Form-TagInput story — 4 viewport variants.
  Sections : default-empty · pre-filled · with-whitelist · max-5.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderFormTagInput({ id, label, help, error, placeholder, whitelist = [], maxTags = 0, duplicates = false, initialTags = [] }) {
  const describedByIds = [`${id}-counter`];
  if (help) describedByIds.push(`${id}-help`);
  if (error) describedByIds.push(`${id}-error`);
  const describedBy = ` aria-describedby="${describedByIds.join(' ')}"`;
  const invalid = error ? ' cremona-field--invalid' : '';
  const initialCount = initialTags.length;
  const countText = initialCount === 0
    ? t('theme.form.tag-input.count.zero')
    : initialCount === 1
      ? t('theme.form.tag-input.count.one')
      : t('theme.form.tag-input.count.other').replace('{count}', String(initialCount));

  return `
    <div class="cremona-field cremona-form-tag-input${invalid}" data-controller="tag-input" data-tag-input-whitelist-value='${JSON.stringify(whitelist)}' data-tag-input-max-tags-value="${maxTags}" data-tag-input-duplicates-value="${duplicates}" data-tag-input-delimiters-value=",|\\n">
      <label class="cremona-label" for="${id}-input">${label}</label>
      <input type="text" class="cremona-input cremona-form-tag-input__input" id="${id}-input" name="${id}-display" role="textbox" aria-multiline="false" aria-label="${t('theme.form.tag-input.aria.label')}" data-tag-input-target="input" autocomplete="off" value="${initialTags.join(',')}"${error ? ' aria-invalid="true"' : ''}${describedBy}${placeholder ? ` placeholder="${placeholder}"` : ''} />
      <input type="hidden" name="${id}" data-tag-input-target="hiddenInput" value='${JSON.stringify(initialTags)}' />
      <p class="cremona-field__help cremona-form-tag-input__counter" id="${id}-counter" data-tag-input-target="counter" aria-live="polite">${countText}</p>
      ${help ? `<p class="cremona-field__help" id="${id}-help">${help}</p>` : ''}
      ${error ? `<p class="cremona-field__error" id="${id}-error">${error}</p>` : ''}
    </div>
  `;
}

const bodyHtml = `
  <section class="form-tag-input-story" aria-labelledby="form-tag-input-story-title">
    <header class="form-tag-input-story__header">
      <h1 id="form-tag-input-story-title">${t('theme.form.tag-input.story.title')}</h1>
      <p>${t('theme.form.tag-input.story.subtitle')}</p>
    </header>

    <section class="form-tag-input-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.tag-input.story.section.default')}</h2>
      <div class="form-tag-input-story__frame">${renderFormTagInput({ id: 'story-default', label: t('theme.form.tag-input.label.projects'), help: t('theme.form.tag-input.help.format'), placeholder: t('theme.form.tag-input.placeholder') })}</div>
    </section>

    <section class="form-tag-input-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.tag-input.story.section.pre-filled')}</h2>
      <div class="form-tag-input-story__frame">${renderFormTagInput({ id: 'story-pre-filled', label: t('theme.form.tag-input.label.skills'), help: t('theme.form.tag-input.help.format'), placeholder: t('theme.form.tag-input.placeholder'), initialTags: ['javascript', 'typescript', 'css'] })}</div>
    </section>

    <section class="form-tag-input-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.tag-input.story.section.with-whitelist')}</h2>
      <div class="form-tag-input-story__frame">${renderFormTagInput({ id: 'story-whitelist', label: t('theme.form.tag-input.label.projects'), help: t('theme.form.tag-input.help.whitelist'), placeholder: t('theme.form.tag-input.placeholder'), whitelist: ['frontend', 'backend', 'design', 'ops', 'docs', 'qa', 'product'] })}</div>
    </section>

    <section class="form-tag-input-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.tag-input.story.section.max-5')}</h2>
      <div class="form-tag-input-story__frame">${renderFormTagInput({ id: 'story-max-5', label: t('theme.form.tag-input.label.projects'), help: t('theme.form.tag-input.help.max5'), placeholder: t('theme.form.tag-input.placeholder'), maxTags: 5, initialTags: ['one', 'two'] })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Forms/Tag Input" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="form-tag-input-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="form-tag-input-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.form-tag-input-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.form-tag-input-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.form-tag-input-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.form-tag-input-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.form-tag-input-story__frame { min-block-size: 8rem; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); padding: var(--spacing-4); }
.form-tag-input-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
