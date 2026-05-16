<!--
  Form-AddressAutocomplete story — 4 viewport variants.
  Sections : default · with-suggestions · validation-error.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderFormAddress({ id, label, help, error, placeholder, required = false, withSuggestions = false }) {
  const describedByIds = [];
  if (help) describedByIds.push(`${id}-help`);
  if (error) describedByIds.push(`${id}-error`);
  const describedBy = describedByIds.length ? ` aria-describedby="${describedByIds.join(' ')}"` : '';
  const invalid = error ? ' theme-field--invalid' : '';

  const demoSuggestions = withSuggestions ? [
    { label: '15 rue de la République, 75001 Paris', placeId: 'demo-1' },
    { label: '15 avenue de la République, 92120 Montrouge', placeId: 'demo-2' },
    { label: '15 boulevard de la République, 93100 Montreuil', placeId: 'demo-3' },
  ] : [];

  return `
    <div class="theme-field theme-form-address-autocomplete${invalid}">
      <label class="theme-label" for="${id}-input">${label}${required ? ' <span aria-hidden="true">*</span>' : ''}</label>
      <div class="theme-popover theme-form-address-autocomplete__wrap" data-controller="popover address-autocomplete" data-popover-placement-value="bottom-start" data-popover-offset-value="4" data-address-autocomplete-min-query-length-value="3" data-address-autocomplete-debounce-ms-value="250" data-address-autocomplete-consumer-endpoint-value="/api/addresses">
        <input type="text" class="theme-input theme-form-address-autocomplete__input" id="${id}-input" name="${id}-display" role="combobox" aria-autocomplete="list" aria-haspopup="listbox" aria-controls="${id}-suggestions" autocomplete="off" data-popover-target="trigger" data-address-autocomplete-target="input"${required ? ' required aria-required="true"' : ''}${error ? ' aria-invalid="true"' : ''}${describedBy}${placeholder ? ` placeholder="${placeholder}"` : ''}${withSuggestions ? ' value="15 rue"' : ''} />
        <input type="hidden" name="${id}" data-address-autocomplete-target="hiddenInput" />
        <div class="theme-popover__content theme-form-address-autocomplete__panel" data-popover-target="content" role="listbox" id="${id}-suggestions">
          <ul class="theme-form-address-autocomplete__suggestions" data-address-autocomplete-target="suggestionsList"${demoSuggestions.length ? '' : ' hidden'}>
            ${demoSuggestions.map((s, idx) => `<li role="option" tabindex="-1" data-address-autocomplete-target="suggestionItem" data-suggestion-index="${idx}">${s.label}</li>`).join('')}
          </ul>
        </div>
      </div>
      ${help ? `<p class="theme-field__help" id="${id}-help">${help}</p>` : ''}
      ${error ? `<p class="theme-field__error" id="${id}-error">${error}</p>` : ''}
    </div>
  `;
}

const bodyHtml = `
  <section class="form-address-story" aria-labelledby="form-address-story-title">
    <header class="form-address-story__header">
      <h1 id="form-address-story-title">${t('theme.form.address-autocomplete.story.title')}</h1>
      <p>${t('theme.form.address-autocomplete.story.subtitle')}</p>
    </header>

    <section class="form-address-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.form.address-autocomplete.story.section.default')}</h2>
      <div class="form-address-story__frame">${renderFormAddress({ id: 'story-default', label: t('theme.form.address-autocomplete.label.shipping'), help: t('theme.form.address-autocomplete.help.format'), placeholder: t('theme.form.address-autocomplete.placeholder'), required: true })}</div>
    </section>

    <section class="form-address-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.form.address-autocomplete.story.section.with-suggestions')}</h2>
      <div class="form-address-story__frame">${renderFormAddress({ id: 'story-suggestions', label: t('theme.form.address-autocomplete.label.shipping'), help: t('theme.form.address-autocomplete.help.format'), placeholder: t('theme.form.address-autocomplete.placeholder'), required: true, withSuggestions: true })}</div>
    </section>

    <section class="form-address-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.form.address-autocomplete.story.section.validation-error')}</h2>
      <div class="form-address-story__frame">${renderFormAddress({ id: 'story-error', label: t('theme.form.address-autocomplete.label.shipping'), help: t('theme.form.address-autocomplete.help.format'), error: t('theme.form.address-autocomplete.error.required'), placeholder: t('theme.form.address-autocomplete.placeholder'), required: true })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Form-AddressAutocomplete" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="form-address-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="form-address-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.form-address-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.form-address-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.form-address-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.form-address-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.form-address-story__frame { min-block-size: 12rem; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); overflow: hidden; padding: var(--spacing-4); }
.form-address-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
