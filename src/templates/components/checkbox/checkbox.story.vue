<!--
  Checkbox story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (7): default · states · sizes · indeterminate · bare · long-label · in-field.

  The `indeterminate` section needs Stimulus alive so the
  `checkbox-indeterminate` controller can flip `el.indeterminate = true` at
  connect(). We boot Stimulus on the documentElement in onMounted (idempotent
  per `boot()`'s root.__themeApp guard).

  The story DOES NOT synthesize :hover / :focus snapshots — Playwright bakes
  at-rest variants. axe-core verifies the wiring (aria-invalid, aria-required,
  aria-describedby, label association) at-rest.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

function renderCheckbox(props = {}) {
  const {
    name, htmlId, value, checked, indeterminate,
    label, description, size = 'sm',
    required, disabled, invalid, describedBy, ariaLabel, className,
  } = props;

  const rootClass = label ? 'theme-checkbox-row' : 'theme-checkbox-wrap';
  const stateClasses = [];
  if (disabled) stateClasses.push('theme-checkbox-row--disabled');
  if (invalid) stateClasses.push('theme-checkbox-row--invalid');
  if (className) stateClasses.push(className);
  const rootClasses = [rootClass, ...stateClasses].join(' ');
  const tag = label ? 'label' : 'span';

  const inputAttrs = [
    `type="checkbox"`,
    `class="theme-checkbox__input"`,
    htmlId ? `id="${htmlId}"` : '',
    name ? `name="${name}"` : '',
    value != null ? `value="${value}"` : '',
    checked ? `checked` : '',
    required ? `required aria-required="true"` : '',
    disabled ? `disabled` : '',
    invalid ? `aria-invalid="true"` : '',
    describedBy ? `aria-describedby="${describedBy}"` : '',
    ariaLabel ? `aria-label="${ariaLabel}"` : '',
    indeterminate ? `data-controller="checkbox-indeterminate" data-action="change->checkbox-indeterminate#clear" data-indeterminate="true"` : '',
  ].filter(Boolean).join(' ');

  const box = `
    <span class="theme-checkbox" data-size="${size}">
      <input ${inputAttrs}>
      <span class="theme-checkbox__box" aria-hidden="true">
        <svg class="theme-checkbox__glyph theme-checkbox__glyph--check" viewBox="0 0 16 16" fill="none">
          <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg class="theme-checkbox__glyph theme-checkbox__glyph--dash" viewBox="0 0 16 16" fill="none">
          <path d="M4 8L12 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </span>
    </span>`;

  if (!label) {
    return `<${tag} class="${rootClasses}" data-size="${size}"${disabled ? ' data-state="disabled"' : ''}>${box}</${tag}>`;
  }

  const labelInner = `
    <span class="theme-checkbox-row__text">
      <span class="theme-checkbox-row__label">${label}</span>
      ${required ? '<span class="theme-checkbox-row__required" aria-hidden="true">*</span>' : ''}
      ${description ? `<span class="theme-checkbox-row__description">${description}</span>` : ''}
    </span>`;

  return `<${tag} class="${rootClasses}" data-size="${size}"${disabled ? ' data-state="disabled"' : ''}>${box}${labelInner}</${tag}>`;
}

function row(html, label) {
  return `
    <div class="checkbox-story__row">
      ${label ? `<code class="checkbox-story__rowlabel">${label}</code>` : ''}
      <div class="checkbox-story__rowcontent">${html}</div>
    </div>
  `;
}

const SAMPLES = {
  terms:        t('theme.checkbox.sample.terms'),
  newsletter:   t('theme.checkbox.sample.newsletter'),
  rememberMe:   t('theme.checkbox.sample.remember-me'),
  marketing:    t('theme.checkbox.sample.marketing'),
  experimental: t('theme.checkbox.sample.experimental'),
  selectAll:    t('theme.checkbox.sample.select-all'),
  longLabel:    t('theme.checkbox.sample.long-label'),
};

const DESCS = {
  newsletter:   t('theme.checkbox.description.newsletter'),
  experimental: t('theme.checkbox.description.experimental'),
};

const ARIA = {
  rowSelect:    t('theme.checkbox.aria.row-select'),
  selectAll:    t('theme.checkbox.aria.select-all-bare'),
};

const bodyHtml = `
  <section class="checkbox-story" data-testid="checkbox-root">
    <header class="checkbox-story__header">
      <h1>${t('theme.checkbox.story.title')}</h1>
      <p>${t('theme.checkbox.story.subtitle')}</p>
    </header>

    <section class="checkbox-story__section" aria-labelledby="checkbox-section-default">
      <h2 id="checkbox-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.checkbox.story.section.default')}</h2>
      <div class="checkbox-story__stack">
        ${row(renderCheckbox({ htmlId: 'demo-default-terms', label: SAMPLES.terms }),               'unchecked')}
        ${row(renderCheckbox({ htmlId: 'demo-default-news',  label: SAMPLES.newsletter, checked: true }), 'checked')}
        ${row(renderCheckbox({ htmlId: 'demo-default-mkt',   label: SAMPLES.marketing }),            'unchecked + long label')}
      </div>
    </section>

    <section class="checkbox-story__section" aria-labelledby="checkbox-section-states">
      <h2 id="checkbox-section-states" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.checkbox.story.section.states')}</h2>
      <div class="checkbox-story__stack">
        ${row(renderCheckbox({ htmlId: 'demo-state-default',           label: SAMPLES.rememberMe }),                          'default unchecked')}
        ${row(renderCheckbox({ htmlId: 'demo-state-checked',           label: SAMPLES.rememberMe, checked: true }),           'checked')}
        ${row(renderCheckbox({ htmlId: 'demo-state-indet',             label: SAMPLES.selectAll, indeterminate: true }),      'indeterminate')}
        ${row(renderCheckbox({ htmlId: 'demo-state-disabled',          label: SAMPLES.rememberMe, disabled: true }),          'disabled')}
        ${row(renderCheckbox({ htmlId: 'demo-state-disabled-checked',  label: SAMPLES.rememberMe, disabled: true, checked: true }), 'disabled + checked')}
        ${row(renderCheckbox({ htmlId: 'demo-state-required',          label: SAMPLES.terms, required: true }),               'required')}
        ${row(renderCheckbox({ htmlId: 'demo-state-invalid',           label: SAMPLES.terms, invalid: true, required: true, describedBy: 'demo-state-invalid-error' }), 'invalid + required')}
      </div>
      <p class="checkbox-story__explainer theme-typography" data-variant="caption" data-color="tertiary" id="demo-state-invalid-error">${t('theme.checkbox.story.explainer.invalid')}</p>
    </section>

    <section class="checkbox-story__section" aria-labelledby="checkbox-section-sizes">
      <h2 id="checkbox-section-sizes" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.checkbox.story.section.sizes')}</h2>
      <div class="checkbox-story__stack">
        ${row(renderCheckbox({ htmlId: 'demo-size-sm-uncheck', label: SAMPLES.rememberMe, size: 'sm' }),                'sm (16 px) unchecked')}
        ${row(renderCheckbox({ htmlId: 'demo-size-sm-check',   label: SAMPLES.rememberMe, size: 'sm', checked: true }), 'sm (16 px) checked')}
        ${row(renderCheckbox({ htmlId: 'demo-size-md-uncheck', label: SAMPLES.rememberMe, size: 'md' }),                'md (20 px) unchecked')}
        ${row(renderCheckbox({ htmlId: 'demo-size-md-check',   label: SAMPLES.rememberMe, size: 'md', checked: true }), 'md (20 px) checked')}
      </div>
    </section>

    <section class="checkbox-story__section" aria-labelledby="checkbox-section-indeterminate">
      <h2 id="checkbox-section-indeterminate" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.checkbox.story.section.indeterminate')}</h2>
      <p class="checkbox-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.checkbox.story.explainer.indeterminate')}</p>
      <div class="checkbox-story__stack">
        ${row(renderCheckbox({ htmlId: 'demo-indet-all',     label: SAMPLES.selectAll, indeterminate: true }), 'select-all indeterminate')}
        ${row(renderCheckbox({ htmlId: 'demo-indet-disabled', label: SAMPLES.selectAll, indeterminate: true, disabled: true }), 'indeterminate + disabled')}
      </div>
    </section>

    <section class="checkbox-story__section" aria-labelledby="checkbox-section-bare">
      <h2 id="checkbox-section-bare" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.checkbox.story.section.bare')}</h2>
      <p class="checkbox-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.checkbox.story.explainer.bare')}</p>
      <div class="checkbox-story__stack">
        ${row(renderCheckbox({ htmlId: 'demo-bare-row',      ariaLabel: ARIA.rowSelect }),                                       'bare, unchecked, aria-label="Sélectionner la ligne"')}
        ${row(renderCheckbox({ htmlId: 'demo-bare-checked',  ariaLabel: ARIA.rowSelect, checked: true }),                        'bare, checked')}
        ${row(renderCheckbox({ htmlId: 'demo-bare-all',      ariaLabel: ARIA.selectAll, indeterminate: true }),                  'bare, indeterminate (DataTable header)')}
      </div>
    </section>

    <section class="checkbox-story__section" aria-labelledby="checkbox-section-long-label">
      <h2 id="checkbox-section-long-label" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.checkbox.story.section.long-label')}</h2>
      <div class="checkbox-story__stack">
        ${row(renderCheckbox({ htmlId: 'demo-long-label',  label: SAMPLES.longLabel, required: true }),                       'label long + required')}
        ${row(renderCheckbox({ htmlId: 'demo-newsletter',  label: SAMPLES.newsletter, description: DESCS.newsletter, checked: true }), 'with description (checked)')}
        ${row(renderCheckbox({ htmlId: 'demo-experiment', label: SAMPLES.experimental, description: DESCS.experimental }),    'with description (unchecked)')}
      </div>
    </section>

    <section class="checkbox-story__section" aria-labelledby="checkbox-section-in-field">
      <h2 id="checkbox-section-in-field" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.checkbox.story.section.in-field')}</h2>
      <div class="checkbox-story__stack">
        <div class="theme-field">
          <label class="theme-label" data-size="sm" for="demo-field-gdpr">
            <span class="theme-label__text">${t('theme.checkbox.field.label.gdpr')}</span>
            <span class="theme-label__required" aria-hidden="true">*</span>
            <span class="theme-sr-only">${t('theme.label.required-aria')}</span>
          </label>
          ${renderCheckbox({ htmlId: 'demo-field-gdpr', ariaLabel: t('theme.checkbox.field.label.gdpr'), required: true, describedBy: 'demo-field-gdpr-help' })}
          <p id="demo-field-gdpr-help" class="theme-field__help">${t('theme.checkbox.field.help.gdpr')}</p>
        </div>
        <div class="theme-field theme-field--invalid">
          <label class="theme-label" data-size="sm" for="demo-field-gdpr-err">
            <span class="theme-label__text">${t('theme.checkbox.field.label.gdpr')}</span>
            <span class="theme-label__required" aria-hidden="true">*</span>
            <span class="theme-sr-only">${t('theme.label.required-aria')}</span>
          </label>
          ${renderCheckbox({ htmlId: 'demo-field-gdpr-err', ariaLabel: t('theme.checkbox.field.label.gdpr'), required: true, invalid: true, describedBy: 'demo-field-gdpr-err-error' })}
          <p id="demo-field-gdpr-err-error" class="theme-field__error" role="alert" aria-live="polite">${t('theme.checkbox.field.error.gdpr')}</p>
        </div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Checkbox" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="checkbox-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="checkbox-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.checkbox-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.checkbox-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.checkbox-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.checkbox-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.checkbox-story__stack { display: grid; gap: var(--spacing-3); }
.checkbox-story__row { display: grid; grid-template-columns: minmax(180px, 220px) 1fr; gap: var(--spacing-3); align-items: start; }
.checkbox-story__rowlabel { font: var(--typography-code); color: var(--color-text-tertiary); padding-block-start: var(--spacing-1); }
.checkbox-story__rowcontent { min-inline-size: 0; }
.checkbox-story__explainer { max-inline-size: 70ch; }
.checkbox-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
