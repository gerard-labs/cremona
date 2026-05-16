<!--
  Input story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (10): default · states · sizes · types · with-value · invalid
  · long-value · densities · autocomplete · all-types.

  No Stimulus on Input itself — the field is keyboard-complete natively.
  The story DOES NOT synthesize :hover / :focus snapshots; the at-rest
  variants are what Playwright bakes, and axe verifies the wiring (aria-
  invalid, aria-required, aria-describedby) at-rest.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderInput(props = {}) {
  const {
    type = 'text', name, htmlId, value, placeholder, size = 'md',
    required, disabled, readonly, invalid, describedBy,
    autocomplete, maxlength, inputmode, spellcheck, className,
  } = props;

  const classes = ['theme-input'];
  if (className) classes.push(className);

  const attrs = [
    `class="${classes.join(' ')}"`,
    `type="${type}"`,
    `data-size="${size}"`,
    name ? `name="${name}"` : '',
    htmlId ? `id="${htmlId}"` : '',
    value != null ? `value="${value}"` : '',
    placeholder ? `placeholder="${placeholder}"` : '',
    required ? `required aria-required="true"` : '',
    disabled ? `disabled` : '',
    readonly ? `readonly` : '',
    invalid ? `aria-invalid="true"` : '',
    describedBy ? `aria-describedby="${describedBy}"` : '',
    autocomplete ? `autocomplete="${autocomplete}"` : '',
    maxlength ? `maxlength="${maxlength}"` : '',
    inputmode ? `inputmode="${inputmode}"` : '',
    spellcheck ? `spellcheck="${spellcheck}"` : '',
  ].filter(Boolean).join(' ');

  return `<input ${attrs}>`;
}

function row(html, label) {
  return `
    <div class="input-story__row">
      ${label ? `<code class="input-story__rowlabel">${label}</code>` : ''}
      <div class="input-story__rowcontent">${html}</div>
    </div>
  `;
}

const DENSITIES = [
  ['comfortable', '40'],
  ['cozy',        '36'],
  ['compact',     '28'],
];

const PH = {
  email:    t('theme.input.placeholder.email'),
  password: t('theme.input.placeholder.password'),
  name:     t('theme.input.placeholder.full-name'),
  phone:    t('theme.input.placeholder.phone'),
  search:   t('theme.input.placeholder.search'),
  url:      t('theme.input.placeholder.url'),
  amount:   t('theme.input.placeholder.amount'),
};

const bodyHtml = `
  <section class="input-story" data-testid="input-root">
    <header class="input-story__header">
      <h1>${t('theme.input.story.title')}</h1>
      <p>${t('theme.input.story.subtitle')}</p>
    </header>

    <section class="input-story__section" aria-labelledby="input-section-default">
      <h2 id="input-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.input.story.section.default')}</h2>
      <div class="input-story__stack">
        ${row(renderInput({ type: 'email', htmlId: 'demo-default-email', placeholder: PH.email }), 'email')}
        ${row(renderInput({ type: 'text',  htmlId: 'demo-default-name',  placeholder: PH.name }),  'name')}
      </div>
    </section>

    <section class="input-story__section" aria-labelledby="input-section-states">
      <h2 id="input-section-states" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.input.story.section.states')}</h2>
      <div class="input-story__stack">
        ${row(renderInput({ htmlId: 'demo-state-default',  placeholder: PH.name }),                          'default')}
        ${row(renderInput({ htmlId: 'demo-state-value',    value: 'Marie Dupont' }),                         'with value')}
        ${row(renderInput({ htmlId: 'demo-state-disabled', placeholder: PH.name, disabled: true }),          'disabled')}
        ${row(renderInput({ htmlId: 'demo-state-readonly', value: 'alice.martin@samurai.fr', readonly: true }), 'readonly')}
        ${row(renderInput({ htmlId: 'demo-state-required', placeholder: PH.email, required: true }),         'required')}
        ${row(renderInput({ htmlId: 'demo-state-invalid',  value: 'pas-un-email', invalid: true, describedBy: 'demo-state-invalid-error' }), 'invalid')}
      </div>
      <p class="input-story__explainer theme-typography" data-variant="caption" data-color="tertiary" id="demo-state-invalid-error">${t('theme.input.story.explainer.invalid')}</p>
    </section>

    <section class="input-story__section" aria-labelledby="input-section-sizes">
      <h2 id="input-section-sizes" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.input.story.section.sizes')}</h2>
      <div class="input-story__stack">
        ${row(renderInput({ htmlId: 'demo-size-sm', size: 'sm', placeholder: PH.name }), 'sm (32 px)')}
        ${row(renderInput({ htmlId: 'demo-size-md', size: 'md', placeholder: PH.name }), 'md (40 px)')}
        ${row(renderInput({ htmlId: 'demo-size-lg', size: 'lg', placeholder: PH.name }), 'lg (48 px)')}
      </div>
    </section>

    <section class="input-story__section" aria-labelledby="input-section-types">
      <h2 id="input-section-types" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.input.story.section.types')}</h2>
      <div class="input-story__stack">
        ${row(renderInput({ type: 'text',     htmlId: 'demo-type-text',     placeholder: PH.name }),    'text')}
        ${row(renderInput({ type: 'email',    htmlId: 'demo-type-email',    placeholder: PH.email }),   'email')}
        ${row(renderInput({ type: 'password', htmlId: 'demo-type-password', placeholder: PH.password }), 'password')}
        ${row(renderInput({ type: 'tel',      htmlId: 'demo-type-tel',      placeholder: PH.phone }),   'tel')}
        ${row(renderInput({ type: 'url',      htmlId: 'demo-type-url',      placeholder: PH.url }),     'url')}
        ${row(renderInput({ type: 'search',   htmlId: 'demo-type-search',   placeholder: PH.search }),  'search')}
        ${row(renderInput({ type: 'number',   htmlId: 'demo-type-number',   placeholder: PH.amount, inputmode: 'decimal' }), 'number')}
        ${row(renderInput({ type: 'date',     htmlId: 'demo-type-date' }),                              'date')}
      </div>
    </section>

    <section class="input-story__section" aria-labelledby="input-section-long-value">
      <h2 id="input-section-long-value" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.input.story.section.long-value')}</h2>
      <div class="input-story__stack">
        ${row(renderInput({ htmlId: 'demo-long', value: t('theme.input.sample.value-long') }), 'long')}
      </div>
    </section>

    <section class="input-story__section" aria-labelledby="input-section-autocomplete">
      <h2 id="input-section-autocomplete" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.input.story.section.autocomplete')}</h2>
      <p class="input-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.input.story.explainer.autocomplete')}</p>
      <div class="input-story__stack">
        ${row(renderInput({ type: 'email',    htmlId: 'demo-ac-email',    placeholder: PH.email,    autocomplete: 'email',            inputmode: 'email' }),    'email + autocomplete')}
        ${row(renderInput({ type: 'tel',      htmlId: 'demo-ac-tel',      placeholder: PH.phone,    autocomplete: 'tel',              inputmode: 'tel' }),      'tel + autocomplete')}
        ${row(renderInput({ type: 'password', htmlId: 'demo-ac-password', placeholder: PH.password, autocomplete: 'current-password' }),                        'current-password')}
      </div>
    </section>

    <section class="input-story__section" aria-labelledby="input-section-densities">
      <h2 id="input-section-densities" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.input.story.section.densities')}</h2>
      <p class="input-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.input.story.explainer.densities')}</p>
      <div class="input-story__stack">
        ${DENSITIES.map(([d, h]) => `
          <div data-density="${d}" class="input-story__density">
            <code class="input-story__rowlabel">${d} (${h} px)</code>
            ${renderInput({ htmlId: 'demo-density-' + d, placeholder: PH.name })}
          </div>
        `).join('')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Input" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="input-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="input-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.input-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.input-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.input-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.input-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.input-story__stack { display: grid; gap: var(--spacing-3); }
.input-story__row { display: grid; grid-template-columns: minmax(120px, 160px) 1fr; gap: var(--spacing-3); align-items: center; }
.input-story__rowlabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.input-story__rowcontent { min-inline-size: 0; }
.input-story__explainer { max-inline-size: 70ch; }
.input-story__density { display: grid; gap: var(--spacing-2); padding: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); }
.input-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
