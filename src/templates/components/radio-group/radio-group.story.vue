<!--
  RadioGroup story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (7): default · states · sizes · orientation · with-description
  · hidden-legend · long-labels.

  Zero Stimulus controller — native radio behaviors (Arrow nav, Tab cycle)
  are 100 % browser-managed. No `onMounted(boot)` needed.

  The story DOES NOT synthesize :hover / :focus snapshots — Playwright bakes
  at-rest variants. axe-core verifies the fieldset + legend + radiogroup
  association at-rest.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderRadioGroup(props = {}) {
  const {
    name, legend, options = [], size = 'sm', orientation = 'vertical',
    required, disabled, invalid, describedBy, hideLegend, className,
  } = props;

  const classes = ['cremona-radiogroup'];
  if (invalid) classes.push('cremona-radiogroup--invalid');
  if (disabled) classes.push('cremona-radiogroup--disabled');
  if (className) classes.push(className);
  const legendClasses = ['cremona-radiogroup__legend'];
  if (hideLegend) legendClasses.push('cremona-sr-only');

  const items = options.map((opt, i) => {
    const checked = opt.checked ? ' checked' : '';
    const optDisabled = (opt.disabled || disabled) ? ' disabled' : '';
    const desc = opt.description
      ? `<span class="cremona-radio-row__description">${opt.description}</span>`
      : '';
    const inputAttrs = [
      `type="radio"`,
      `class="cremona-radio__input"`,
      `id="${name}-${i + 1}"`,
      `name="${name}"`,
      `value="${opt.value}"`,
      checked.trim(),
      required ? `required aria-required="true"` : '',
      optDisabled.trim(),
      invalid ? `aria-invalid="true"` : '',
      describedBy ? `aria-describedby="${describedBy}"` : '',
    ].filter(Boolean).join(' ');
    const dataState = (opt.disabled || disabled) ? ' data-state="disabled"' : '';
    return `
      <label class="cremona-radio-row" data-size="${size}"${dataState}>
        <span class="cremona-radio" data-size="${size}">
          <input ${inputAttrs}>
          <span class="cremona-radio__box" aria-hidden="true"></span>
        </span>
        <span class="cremona-radio-row__text">
          <span class="cremona-radio-row__label">${opt.label}</span>
          ${desc}
        </span>
      </label>`;
  }).join('');

  const requiredMarker = (required && !hideLegend)
    ? `<span class="cremona-radiogroup__required" aria-hidden="true">*</span><span class="cremona-sr-only">${t('theme.label.required-aria')}</span>`
    : '';

  return `
    <fieldset
      class="${classes.join(' ')}"
      data-size="${size}"
      data-orientation="${orientation}"
      ${disabled ? 'disabled' : ''}
    >
      <legend class="${legendClasses.join(' ')}">${legend}${requiredMarker}</legend>
      <div class="cremona-radiogroup__items" role="presentation">${items}</div>
    </fieldset>`;
}

function row(html, label) {
  return `
    <div class="radiogroup-story__row">
      ${label ? `<code class="radiogroup-story__rowlabel">${label}</code>` : ''}
      <div class="radiogroup-story__rowcontent">${html}</div>
    </div>
  `;
}

const COUNTRY_OPTIONS = [
  { value: 'fr', label: t('theme.radio-group.option.france'), checked: true },
  { value: 'be', label: t('theme.radio-group.option.belgium') },
  { value: 'ch', label: t('theme.radio-group.option.switzerland') },
  { value: 'lu', label: t('theme.radio-group.option.luxembourg') },
];

const PLAN_OPTIONS = [
  { value: 'starter', label: t('theme.radio-group.option.plan-starter'),    description: t('theme.radio-group.description.plan-starter') },
  { value: 'pro',     label: t('theme.radio-group.option.plan-pro'),        description: t('theme.radio-group.description.plan-pro'), checked: true },
  { value: 'team',    label: t('theme.radio-group.option.plan-team'),       description: t('theme.radio-group.description.plan-team') },
  { value: 'ent',     label: t('theme.radio-group.option.plan-enterprise'), description: t('theme.radio-group.description.plan-enterprise'), disabled: true },
];

const SHIPPING_OPTIONS = [
  { value: 'std', label: t('theme.radio-group.option.shipping-standard'), checked: true },
  { value: 'exp', label: t('theme.radio-group.option.shipping-express') },
  { value: 'pck', label: t('theme.radio-group.option.shipping-pickup') },
];

const LONG_OPTIONS = [
  { value: 'a', label: t('theme.radio-group.option.long-a'), checked: true },
  { value: 'b', label: t('theme.radio-group.option.long-b') },
];

const bodyHtml = `
  <section class="radiogroup-story" data-testid="radiogroup-root">
    <header class="radiogroup-story__header">
      <h1>${t('theme.radio-group.story.title')}</h1>
      <p>${t('theme.radio-group.story.subtitle')}</p>
    </header>

    <section class="radiogroup-story__section" aria-labelledby="radiogroup-section-default">
      <h2 id="radiogroup-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.radio-group.story.section.default')}</h2>
      <div class="radiogroup-story__stack">
        ${row(renderRadioGroup({ name: 'demo-country', legend: t('theme.radio-group.legend.country'), options: COUNTRY_OPTIONS }), 'country (vertical)')}
      </div>
    </section>

    <section class="radiogroup-story__section" aria-labelledby="radiogroup-section-states">
      <h2 id="radiogroup-section-states" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.radio-group.story.section.states')}</h2>
      <div class="radiogroup-story__stack">
        ${row(renderRadioGroup({ name: 'demo-state-default', legend: t('theme.radio-group.legend.country'), options: COUNTRY_OPTIONS }),               'default + selection')}
        ${row(renderRadioGroup({ name: 'demo-state-disabled', legend: t('theme.radio-group.legend.country'), options: COUNTRY_OPTIONS, disabled: true }), 'disabled (whole group)')}
        ${row(renderRadioGroup({ name: 'demo-state-required', legend: t('theme.radio-group.legend.country'), options: COUNTRY_OPTIONS.map(o => ({...o, checked: false})), required: true }), 'required (no selection)')}
        ${row(renderRadioGroup({ name: 'demo-state-invalid',  legend: t('theme.radio-group.legend.country'), options: COUNTRY_OPTIONS.map(o => ({...o, checked: false})), required: true, invalid: true, describedBy: 'demo-state-invalid-error' }), 'invalid + required')}
      </div>
      <p class="radiogroup-story__explainer cremona-typography" data-variant="caption" data-color="tertiary" id="demo-state-invalid-error">${t('theme.radio-group.story.explainer.invalid')}</p>
    </section>

    <section class="radiogroup-story__section" aria-labelledby="radiogroup-section-sizes">
      <h2 id="radiogroup-section-sizes" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.radio-group.story.section.sizes')}</h2>
      <div class="radiogroup-story__stack">
        ${row(renderRadioGroup({ name: 'demo-size-sm', legend: t('theme.radio-group.legend.shipping'), options: SHIPPING_OPTIONS, size: 'sm' }), 'sm (16 px discs)')}
        ${row(renderRadioGroup({ name: 'demo-size-md', legend: t('theme.radio-group.legend.shipping'), options: SHIPPING_OPTIONS, size: 'md' }), 'md (20 px discs)')}
      </div>
    </section>

    <section class="radiogroup-story__section" aria-labelledby="radiogroup-section-orientation">
      <h2 id="radiogroup-section-orientation" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.radio-group.story.section.orientation')}</h2>
      <p class="radiogroup-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.radio-group.story.explainer.orientation')}</p>
      <div class="radiogroup-story__stack">
        ${row(renderRadioGroup({ name: 'demo-orient-h', legend: t('theme.radio-group.legend.shipping'), options: SHIPPING_OPTIONS, orientation: 'horizontal' }), 'horizontal')}
        ${row(renderRadioGroup({ name: 'demo-orient-v', legend: t('theme.radio-group.legend.shipping'), options: SHIPPING_OPTIONS, orientation: 'vertical' }), 'vertical (default)')}
      </div>
    </section>

    <section class="radiogroup-story__section" aria-labelledby="radiogroup-section-description">
      <h2 id="radiogroup-section-description" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.radio-group.story.section.description')}</h2>
      <p class="radiogroup-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.radio-group.story.explainer.description')}</p>
      <div class="radiogroup-story__stack">
        ${row(renderRadioGroup({ name: 'demo-plan', legend: t('theme.radio-group.legend.plan'), options: PLAN_OPTIONS }), 'plan tier (with description per option)')}
      </div>
    </section>

    <section class="radiogroup-story__section" aria-labelledby="radiogroup-section-hidden-legend">
      <h2 id="radiogroup-section-hidden-legend" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.radio-group.story.section.hidden-legend')}</h2>
      <p class="radiogroup-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.radio-group.story.explainer.hidden-legend')}</p>
      <div class="radiogroup-story__stack">
        ${row(renderRadioGroup({ name: 'demo-hidden', legend: t('theme.radio-group.legend.shipping'), options: SHIPPING_OPTIONS, hideLegend: true }), 'legend sr-only')}
      </div>
    </section>

    <section class="radiogroup-story__section" aria-labelledby="radiogroup-section-long-labels">
      <h2 id="radiogroup-section-long-labels" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.radio-group.story.section.long-labels')}</h2>
      <div class="radiogroup-story__stack">
        ${row(renderRadioGroup({ name: 'demo-long', legend: t('theme.radio-group.legend.long'), options: LONG_OPTIONS }), 'labels longs (+30 % FR)')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Radio Group" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="radiogroup-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="radiogroup-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.radiogroup-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.radiogroup-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.radiogroup-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.radiogroup-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.radiogroup-story__stack { display: grid; gap: var(--spacing-4); }
.radiogroup-story__row { display: grid; grid-template-columns: minmax(180px, 220px) 1fr; gap: var(--spacing-3); align-items: start; }
.radiogroup-story__rowlabel { font: var(--typography-code); color: var(--color-text-tertiary); padding-block-start: var(--spacing-1); }
.radiogroup-story__rowcontent { min-inline-size: 0; }
.radiogroup-story__explainer { max-inline-size: 70ch; }
.radiogroup-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
