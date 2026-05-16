<!--
  Field story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (8): default · required · with-error · disabled · textarea
  · native-select · input-group · help-and-error.

  Field is the keystone composition primitive: Label + control + help +
  error, with automatic id wiring and aria-describedby/aria-invalid/
  aria-required propagation. This story renders all four control flavors
  to prove the composition works end-to-end. axe runs WITHOUT the
  `label`-rule disable (unlike Input/Textarea/NativeSelect/InputGroup
  bare-primitive stories) — the composition wires the binding properly,
  so the rule MUST pass here.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

const ICON_MODULES = import.meta.glob('../../../assets/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const ICONS = Object.fromEntries(
  Object.entries(ICON_MODULES).map(([path, raw]) => [
    path.match(/([^/]+)\.svg$/)[1],
    raw,
  ]),
);

function renderIcon(name, size = 'sm') {
  return `<span class="theme-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] ?? ''}</span>`;
}

// ---------------- helpers: build the bare controls ---------------------

function renderLabel({ content, htmlFor, required, optionalText, hint, disabled, size = 'sm' }) {
  const attrs = [
    `class="theme-label"`,
    `data-size="${size}"`,
    htmlFor ? `for="${htmlFor}"` : '',
    disabled ? `data-state="disabled"` : '',
  ].filter(Boolean).join(' ');
  let suffix = '';
  if (required) {
    suffix = `<span class="theme-label__required" aria-hidden="true">*</span><span class="theme-sr-only">${t('theme.label.required-aria')}</span>`;
  } else if (optionalText) {
    suffix = `<span class="theme-label__optional">${optionalText}</span>`;
  }
  const hintHtml = hint ? `<span class="theme-label__hint">${hint}</span>` : '';
  return `<label ${attrs}><span class="theme-label__text">${content}</span>${suffix}${hintHtml}</label>`;
}

function renderInput({ type = 'text', htmlId, value, placeholder, required, disabled, invalid, describedBy, autocomplete, inputmode }) {
  const attrs = [
    `class="theme-input"`,
    `type="${type}"`,
    `data-size="md"`,
    htmlId ? `id="${htmlId}"` : '',
    value != null ? `value="${value}"` : '',
    placeholder ? `placeholder="${placeholder}"` : '',
    required ? 'required aria-required="true"' : '',
    disabled ? 'disabled' : '',
    invalid ? 'aria-invalid="true"' : '',
    describedBy ? `aria-describedby="${describedBy}"` : '',
    autocomplete ? `autocomplete="${autocomplete}"` : '',
    inputmode ? `inputmode="${inputmode}"` : '',
  ].filter(Boolean).join(' ');
  return `<input ${attrs}>`;
}

function renderTextarea({ htmlId, value, placeholder, rows = 3, required, disabled, invalid, describedBy, autosize, minRows = 2, maxRows = 6 }) {
  const attrs = [
    `class="theme-textarea"`,
    `data-size="md"`,
    `rows="${rows}"`,
    autosize ? `data-controller="textarea-autosize"` : '',
    autosize ? `data-action="input->textarea-autosize#resize"` : '',
    autosize ? `data-textarea-autosize-min-rows-value="${minRows}"` : '',
    autosize ? `data-textarea-autosize-max-rows-value="${maxRows}"` : '',
    htmlId ? `id="${htmlId}"` : '',
    placeholder ? `placeholder="${placeholder}"` : '',
    required ? 'required aria-required="true"' : '',
    disabled ? 'disabled' : '',
    invalid ? 'aria-invalid="true"' : '',
    describedBy ? `aria-describedby="${describedBy}"` : '',
  ].filter(Boolean).join(' ');
  const safeValue = (value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<textarea ${attrs}>${safeValue}</textarea>`;
}

function renderNativeSelect({ htmlId, value, options, required, disabled, invalid, describedBy }) {
  const attrs = [
    `class="theme-native-select"`,
    `data-size="md"`,
    htmlId ? `id="${htmlId}"` : '',
    required ? 'required aria-required="true"' : '',
    disabled ? 'disabled' : '',
    invalid ? 'aria-invalid="true"' : '',
    describedBy ? `aria-describedby="${describedBy}"` : '',
  ].filter(Boolean).join(' ');
  const optsHtml = options.map((o) => {
    const sel = value != null && o.value === value ? ' selected' : '';
    return `<option value="${o.value}"${sel}>${o.label}</option>`;
  }).join('');
  const wrapClasses = ['theme-native-select-wrap'];
  if (disabled) wrapClasses.push('theme-native-select-wrap--disabled');
  return `
    <div class="${wrapClasses.join(' ')}" data-size="md">
      <select ${attrs}>${optsHtml}</select>
      <span class="theme-icon theme-native-select__chevron" data-icon="chevron-down" data-size="sm" aria-hidden="true" role="presentation">${ICONS['chevron-down'] ?? ''}</span>
    </div>
  `;
}

function renderInputGroup({ prefix, suffix, prefixIcon, control, disabled, invalid }) {
  const classes = ['theme-input-group'];
  if (disabled) classes.push('theme-input-group--disabled');
  if (invalid)  classes.push('theme-input-group--invalid');
  const prefixHtml = (prefix || prefixIcon)
    ? `<span class="theme-input-group__prefix" data-input-group-target="prefix">${prefixIcon ? renderIcon(prefixIcon) : ''}${prefix ? `<span>${prefix}</span>` : ''}</span>`
    : '';
  const suffixHtml = suffix
    ? `<span class="theme-input-group__suffix" data-input-group-target="suffix"><span>${suffix}</span></span>`
    : '';
  return `<div class="${classes.join(' ')}" data-size="md" data-controller="input-group" data-action="click->input-group#delegateClick">${prefixHtml}${control}${suffixHtml}</div>`;
}

// ---------------- helper: render a complete Field ----------------------

function renderField({
  label, htmlId, required, disabled, optionalText, hint, help, error,
  control,
}) {
  const hasError = error != null && error !== '';
  const helpId  = `${htmlId}-help`;
  const errorId = `${htmlId}-error`;
  const describedByList = [];
  if (help) describedByList.push(helpId);
  if (hasError) describedByList.push(errorId);
  const describedBy = describedByList.length ? describedByList.join(' ') : null;

  const fieldClasses = ['theme-field'];
  if (hasError) fieldClasses.push('theme-field--invalid');
  if (disabled) fieldClasses.push('theme-field--disabled');

  const labelHtml = renderLabel({
    content: label,
    htmlFor: htmlId,
    required,
    optionalText: required ? null : optionalText,
    hint,
    disabled,
  });
  const controlHtml = control({ htmlId, describedBy, invalid: hasError, required, disabled });
  const helpHtml  = help     ? `<p id="${helpId}"  class="theme-field__help">${help}</p>` : '';
  const errorHtml = hasError ? `<p id="${errorId}" class="theme-field__error" role="alert" aria-live="polite">${error}</p>` : '';

  return `<div class="${fieldClasses.join(' ')}">${labelHtml}${controlHtml}${helpHtml}${errorHtml}</div>`;
}

// ---------------- story content ---------------------------------------

const COUNTRIES = [
  { value: '',   label: t('theme.native-select.placeholder.choose-country') },
  { value: 'fr', label: t('theme.native-select.option.france') },
  { value: 'be', label: t('theme.native-select.option.belgium') },
  { value: 'de', label: t('theme.native-select.option.germany') },
];

const bodyHtml = `
  <section class="field-story" data-testid="field-root">
    <header class="field-story__header">
      <h1>${t('theme.field.story.title')}</h1>
      <p>${t('theme.field.story.subtitle')}</p>
    </header>

    <section class="field-story__section" aria-labelledby="field-section-default">
      <h2 id="field-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.field.story.section.default')}</h2>
      ${renderField({
        label: t('theme.field.label.email'),
        htmlId: 'field-email-default',
        control: ({ htmlId, describedBy, invalid, required, disabled }) =>
          renderInput({ type: 'email', htmlId, describedBy, invalid, required, disabled, placeholder: t('theme.field.placeholder.email'), autocomplete: 'email', inputmode: 'email' }),
      })}
    </section>

    <section class="field-story__section" aria-labelledby="field-section-required">
      <h2 id="field-section-required" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.field.story.section.required')}</h2>
      ${renderField({
        label: t('theme.field.label.password'),
        htmlId: 'field-password',
        required: true,
        help: t('theme.field.help.password-strength'),
        control: ({ htmlId, describedBy, invalid, required, disabled }) =>
          renderInput({ type: 'password', htmlId, describedBy, invalid, required, disabled, placeholder: t('theme.input.placeholder.password'), autocomplete: 'new-password' }),
      })}
    </section>

    <section class="field-story__section" aria-labelledby="field-section-with-error">
      <h2 id="field-section-with-error" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.field.story.section.with-error')}</h2>
      ${renderField({
        label: t('theme.field.label.email'),
        htmlId: 'field-email-error',
        required: true,
        error: t('theme.field.error.email-format'),
        control: ({ htmlId, describedBy, invalid, required, disabled }) =>
          renderInput({ type: 'email', htmlId, describedBy, invalid, required, disabled, value: 'pas-un-email', autocomplete: 'email' }),
      })}
    </section>

    <section class="field-story__section" aria-labelledby="field-section-help-and-error">
      <h2 id="field-section-help-and-error" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.field.story.section.help-and-error')}</h2>
      <p class="field-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.field.story.explainer.help-and-error')}</p>
      ${renderField({
        label: t('theme.field.label.email'),
        htmlId: 'field-email-both',
        required: true,
        help: t('theme.field.help.email-format'),
        error: t('theme.field.error.email-format'),
        control: ({ htmlId, describedBy, invalid, required, disabled }) =>
          renderInput({ type: 'email', htmlId, describedBy, invalid, required, disabled, value: 'pas-un-email', autocomplete: 'email' }),
      })}
    </section>

    <section class="field-story__section" aria-labelledby="field-section-disabled">
      <h2 id="field-section-disabled" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.field.story.section.disabled')}</h2>
      ${renderField({
        label: t('theme.field.label.email'),
        htmlId: 'field-email-disabled',
        disabled: true,
        help: t('theme.field.help.email-format'),
        control: ({ htmlId, describedBy, invalid, required, disabled }) =>
          renderInput({ type: 'email', htmlId, describedBy, invalid, required, disabled, value: 'alice@samurai.fr' }),
      })}
    </section>

    <section class="field-story__section" aria-labelledby="field-section-textarea">
      <h2 id="field-section-textarea" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.field.story.section.textarea')}</h2>
      ${renderField({
        label: t('theme.field.label.message'),
        htmlId: 'field-message',
        required: true,
        help: t('theme.field.help.message-tone'),
        control: ({ htmlId, describedBy, invalid, required, disabled }) =>
          renderTextarea({ htmlId, describedBy, invalid, required, disabled, placeholder: t('theme.field.placeholder.message'), autosize: true, minRows: 3, maxRows: 6 }),
      })}
    </section>

    <section class="field-story__section" aria-labelledby="field-section-native-select">
      <h2 id="field-section-native-select" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.field.story.section.native-select')}</h2>
      ${renderField({
        label: t('theme.field.label.country'),
        htmlId: 'field-country',
        required: true,
        control: ({ htmlId, describedBy, invalid, required, disabled }) =>
          renderNativeSelect({ htmlId, describedBy, invalid, required, disabled, options: COUNTRIES, value: 'fr' }),
      })}
    </section>

    <section class="field-story__section" aria-labelledby="field-section-input-group">
      <h2 id="field-section-input-group" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.field.story.section.input-group')}</h2>
      ${renderField({
        label: t('theme.field.label.amount'),
        htmlId: 'field-amount',
        required: true,
        help: t('theme.field.help.currency'),
        control: ({ htmlId, describedBy, invalid, required, disabled }) =>
          renderInputGroup({
            prefix: '€',
            suffix: 'EUR',
            invalid,
            disabled,
            control: renderInput({ htmlId, describedBy, invalid, required, disabled, type: 'number', inputmode: 'decimal', placeholder: t('theme.field.placeholder.amount') }),
          }),
      })}
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Field" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="field-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="field-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.field-story { display: grid; gap: var(--spacing-6); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.field-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.field-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.field-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); max-inline-size: 560px; }
.field-story__explainer { max-inline-size: 70ch; }
.field-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
