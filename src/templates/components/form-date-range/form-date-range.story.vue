<!--
  Form-DateRange story — 4 viewport variants.
  Sections : default · with-values · invalid-range · with-min-max.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderDatePickerStub({ id, name, value, placeholder, min, max }) {
  // Stub render for the DatePicker — Story-level static representation only.
  return `
    <div class="theme-popover theme-date-picker" data-controller="popover date-picker" data-popover-placement-value="bottom-start" data-popover-offset-value="4" data-date-picker-value-value="${value || ''}"${min ? ` data-date-picker-min-value="${min}"` : ''}${max ? ` data-date-picker-max-value="${max}"` : ''} data-date-picker-locale-value="fr">
      <div class="theme-date-picker__trigger">
        <input type="text" class="theme-input theme-date-picker__input" id="${id}-input" data-popover-target="trigger" data-date-picker-target="input" role="combobox" aria-haspopup="dialog" aria-expanded="false" readonly placeholder="${placeholder}" value="${value || ''}" />
      </div>
      <input type="hidden" name="${name}" data-date-picker-target="hiddenInput" value="${value || ''}" />
    </div>
  `;
}

function renderFormDateRange({ id, label, startValue = '', endValue = '', invalid = false, help, min, max }) {
  return `
    <div class="theme-field theme-form-date-range${invalid ? ' theme-field--invalid' : ''}">
      <fieldset class="theme-form-date-range__fieldset" aria-labelledby="${id}-legend">
        <legend id="${id}-legend" class="theme-label theme-form-date-range__legend">${label}</legend>
        <div class="theme-form-date-range__wrap" data-controller="form-date-range" data-form-date-range-start-date-value="${startValue}" data-form-date-range-end-date-value="${endValue}">
          <div class="theme-form-date-range__field" data-form-date-range-target="startInput">
            <label class="theme-form-date-range__label" for="${id}-start-input">${t('theme.form.date-range.label.start')}</label>
            ${renderDatePickerStub({ id: `${id}-start`, name: `${id}_start`, value: startValue, placeholder: t('theme.form.date-range.placeholder.start'), min, max })}
          </div>
          <span class="theme-form-date-range__separator" aria-hidden="true">→</span>
          <div class="theme-form-date-range__field" data-form-date-range-target="endInput">
            <label class="theme-form-date-range__label" for="${id}-end-input">${t('theme.form.date-range.label.end')}</label>
            ${renderDatePickerStub({ id: `${id}-end`, name: `${id}_end`, value: endValue, placeholder: t('theme.form.date-range.placeholder.end'), min: startValue || min, max })}
          </div>
          <p class="theme-form-date-range__error" data-form-date-range-target="errorMessage" role="alert"${invalid ? '' : ' hidden'}>${t('theme.form.date-range.error.start-after-end')}</p>
        </div>
      </fieldset>
      ${help ? `<p class="theme-field__help">${help}</p>` : ''}
    </div>
  `;
}

const bodyHtml = `
  <section class="form-date-range-story" aria-labelledby="form-date-range-story-title">
    <header class="form-date-range-story__header">
      <h1 id="form-date-range-story-title">${t('theme.form.date-range.story.title')}</h1>
      <p>${t('theme.form.date-range.story.subtitle')}</p>
    </header>

    <section class="form-date-range-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.form.date-range.story.section.default')}</h2>
      <div class="form-date-range-story__frame">${renderFormDateRange({ id: 'story-default', label: t('theme.form.date-range.label.booking'), help: t('theme.form.date-range.help.booking') })}</div>
    </section>

    <section class="form-date-range-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.form.date-range.story.section.with-values')}</h2>
      <div class="form-date-range-story__frame">${renderFormDateRange({ id: 'story-values', label: t('theme.form.date-range.label.booking'), startValue: '2026-05-15', endValue: '2026-05-22' })}</div>
    </section>

    <section class="form-date-range-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.form.date-range.story.section.invalid-range')}</h2>
      <div class="form-date-range-story__frame">${renderFormDateRange({ id: 'story-invalid', label: t('theme.form.date-range.label.booking'), startValue: '2026-05-22', endValue: '2026-05-15', invalid: true })}</div>
    </section>

    <section class="form-date-range-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.form.date-range.story.section.with-min-max')}</h2>
      <div class="form-date-range-story__frame">${renderFormDateRange({ id: 'story-bounded', label: t('theme.form.date-range.label.booking'), startValue: '2026-06-01', min: '2026-06-01', max: '2026-08-31', help: t('theme.form.date-range.help.bounded') })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Form-DateRange" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="form-date-range-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="form-date-range-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.form-date-range-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.form-date-range-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.form-date-range-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.form-date-range-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.form-date-range-story__frame { min-block-size: 10rem; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); overflow: hidden; padding: var(--spacing-4); }
.form-date-range-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
