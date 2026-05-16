<!--
  Form-ColorPicker story — 4 viewport variants.
  Sections : default · with-swatches · with-alpha · validation-error.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderFormColorPicker({ id, label, help, error, defaultColor = '#6366F1', alpha = false, swatches = [], required = false }) {
  const describedByIds = [];
  if (help) describedByIds.push(`${id}-help`);
  if (error) describedByIds.push(`${id}-error`);
  const describedBy = describedByIds.length ? ` aria-describedby="${describedByIds.join(' ')}"` : '';
  const invalid = error ? ' theme-field--invalid' : '';
  const swatchesAttr = swatches.length ? ` data-color-picker-swatches-value='${JSON.stringify(swatches)}'` : '';

  return `
    <div class="theme-field theme-form-color-picker${invalid}" data-controller="popover color-picker" data-popover-placement-value="bottom-start" data-popover-offset-value="4" data-color-picker-alpha-value="${alpha}" data-color-picker-default-color-value="${defaultColor}" data-color-picker-format-value="hex"${swatchesAttr}>
      <label class="theme-label" for="${id}-input">${label}${required ? ' <span aria-hidden="true">*</span>' : ''}</label>
      <div class="theme-popover theme-form-color-picker__wrap">
        <button type="button" class="theme-button theme-form-color-picker__trigger" data-popover-target="trigger" data-color-picker-target="trigger" data-variant="outline" aria-label="${t('theme.form.color-picker.aria.trigger')}" aria-haspopup="dialog">
          <span class="theme-form-color-picker__preview" data-color-picker-target="preview" style="background-color: ${defaultColor};" aria-hidden="true"></span>
          <input type="text" class="theme-input theme-form-color-picker__hex" id="${id}-input" name="${id}" value="${defaultColor}" data-color-picker-target="input" placeholder="${t('theme.form.color-picker.placeholder.hex')}"${required ? ' required aria-required="true"' : ''}${error ? ' aria-invalid="true"' : ''}${describedBy} />
        </button>
        <div class="theme-popover__content theme-form-color-picker__panel" data-popover-target="content" role="dialog" aria-label="${t('theme.form.color-picker.aria.trigger')}"></div>
      </div>
      ${help ? `<p class="theme-field__help" id="${id}-help">${help}</p>` : ''}
      ${error ? `<p class="theme-field__error" id="${id}-error">${error}</p>` : ''}
    </div>
  `;
}

const bodyHtml = `
  <section class="form-color-picker-story" aria-labelledby="form-color-picker-story-title">
    <header class="form-color-picker-story__header">
      <h1 id="form-color-picker-story-title">${t('theme.form.color-picker.story.title')}</h1>
      <p>${t('theme.form.color-picker.story.subtitle')}</p>
    </header>

    <section class="form-color-picker-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.form.color-picker.story.section.default')}</h2>
      <div class="form-color-picker-story__frame">${renderFormColorPicker({ id: 'story-default', label: t('theme.form.color-picker.label.brand'), help: t('theme.form.color-picker.help.format') })}</div>
    </section>

    <section class="form-color-picker-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.form.color-picker.story.section.with-swatches')}</h2>
      <div class="form-color-picker-story__frame">${renderFormColorPicker({ id: 'story-swatches', label: t('theme.form.color-picker.label.brand'), help: t('theme.form.color-picker.help.format'), defaultColor: '#10B981', swatches: ['#000000', '#FFFFFF', '#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'] })}</div>
    </section>

    <section class="form-color-picker-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.form.color-picker.story.section.with-alpha')}</h2>
      <div class="form-color-picker-story__frame">${renderFormColorPicker({ id: 'story-alpha', label: t('theme.form.color-picker.label.overlay'), help: t('theme.form.color-picker.help.alpha'), defaultColor: '#3B82F680', alpha: true })}</div>
    </section>

    <section class="form-color-picker-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.form.color-picker.story.section.validation-error')}</h2>
      <div class="form-color-picker-story__frame">${renderFormColorPicker({ id: 'story-error', label: t('theme.form.color-picker.label.brand'), help: t('theme.form.color-picker.help.format'), error: t('theme.form.color-picker.error.required'), required: true })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Form-ColorPicker" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="form-color-picker-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="form-color-picker-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.form-color-picker-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.form-color-picker-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.form-color-picker-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.form-color-picker-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.form-color-picker-story__frame { min-block-size: 6rem; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); padding: var(--spacing-4); }
.form-color-picker-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
