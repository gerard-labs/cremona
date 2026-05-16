<!--
  Form-PhoneInput story — 4 viewport variants.
  Sections : default-fr · preferred-countries · separate-dial-code · validation-error.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderFormPhoneInput({ id, label, help, error, placeholder, initialCountry = 'fr', preferredCountries = ['fr', 'us', 'gb', 'de', 'es'], separateDialCode = false, nationalMode = true, required = false }) {
  const describedByIds = [];
  if (help) describedByIds.push(`${id}-help`);
  if (error) describedByIds.push(`${id}-error`);
  const describedBy = describedByIds.length ? ` aria-describedby="${describedByIds.join(' ')}"` : '';
  const invalid = error ? ' cremona-field--invalid' : '';

  return `
    <div class="cremona-field cremona-form-phone-input${invalid}" data-controller="phone-input" data-phone-input-initial-country-value="${initialCountry}" data-phone-input-preferred-countries-value='${JSON.stringify(preferredCountries)}' data-phone-input-separate-dial-code-value="${separateDialCode}" data-phone-input-national-mode-value="${nationalMode}">
      <label class="cremona-label" for="${id}-input">${label}${required ? ' <span aria-hidden="true">*</span>' : ''}</label>
      <input type="tel" class="cremona-input cremona-form-phone-input__input" id="${id}-input" name="${id}-display" autocomplete="tel" inputmode="tel" aria-label="${t('theme.form.phone-input.aria.label')}" data-phone-input-target="input"${required ? ' required aria-required="true"' : ''}${error ? ' aria-invalid="true"' : ''}${describedBy}${placeholder ? ` placeholder="${placeholder}"` : ''} />
      <input type="hidden" name="${id}" data-phone-input-target="hiddenInput" />
      ${help ? `<p class="cremona-field__help" id="${id}-help">${help}</p>` : ''}
      ${error ? `<p class="cremona-field__error" id="${id}-error">${error}</p>` : ''}
    </div>
  `;
}

const bodyHtml = `
  <section class="form-phone-input-story" aria-labelledby="form-phone-input-story-title">
    <header class="form-phone-input-story__header">
      <h1 id="form-phone-input-story-title">${t('theme.form.phone-input.story.title')}</h1>
      <p>${t('theme.form.phone-input.story.subtitle')}</p>
    </header>

    <section class="form-phone-input-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.phone-input.story.section.default-fr')}</h2>
      <div class="form-phone-input-story__frame">${renderFormPhoneInput({ id: 'story-default-fr', label: t('theme.form.phone-input.label.contact'), help: t('theme.form.phone-input.help.format'), placeholder: t('theme.form.phone-input.placeholder'), required: true })}</div>
    </section>

    <section class="form-phone-input-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.phone-input.story.section.preferred-countries')}</h2>
      <div class="form-phone-input-story__frame">${renderFormPhoneInput({ id: 'story-preferred', label: t('theme.form.phone-input.label.support'), help: t('theme.form.phone-input.help.preferred'), placeholder: t('theme.form.phone-input.placeholder'), preferredCountries: ['fr', 'be', 'ch', 'lu', 'ca'] })}</div>
    </section>

    <section class="form-phone-input-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.phone-input.story.section.separate-dial-code')}</h2>
      <div class="form-phone-input-story__frame">${renderFormPhoneInput({ id: 'story-separate', label: t('theme.form.phone-input.label.contact'), help: t('theme.form.phone-input.help.dial-code'), placeholder: t('theme.form.phone-input.placeholder.no-prefix'), separateDialCode: true, nationalMode: false })}</div>
    </section>

    <section class="form-phone-input-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.phone-input.story.section.validation-error')}</h2>
      <div class="form-phone-input-story__frame">${renderFormPhoneInput({ id: 'story-error', label: t('theme.form.phone-input.label.contact'), help: t('theme.form.phone-input.help.format'), error: t('theme.form.phone-input.error.invalid'), placeholder: t('theme.form.phone-input.placeholder'), required: true })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Form-PhoneInput" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="form-phone-input-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="form-phone-input-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.form-phone-input-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.form-phone-input-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.form-phone-input-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.form-phone-input-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.form-phone-input-story__frame { min-block-size: 6rem; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); padding: var(--spacing-4); }
.form-phone-input-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
