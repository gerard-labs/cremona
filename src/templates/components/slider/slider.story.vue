<!--
  Slider story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (7): default · with-value · states · sizes · range · bare · long-label.

  Zero Stimulus controller — Arrow / Home / End / PageUp / PageDown native.
  The valueDisplay <output> shows the initial value (server-rendered); live
  update on input is the consumer's job (out of scope at primitive level —
  future Ring 2 SliderField will compose it).

  Visual baselines capture the at-rest thumb position (a fraction of the
  track based on value / (max - min)). The drag interaction is not part
  of the snapshot.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderSlider(props = {}) {
  const {
    name, htmlId, value, min = 0, max = 100, step = 1,
    label, valueDisplay, valueSuffix = '', size = 'sm',
    required, disabled, invalid, describedBy, ariaLabel, className,
  } = props;

  const rootClass = label ? 'theme-slider-row' : 'theme-slider-wrap';
  const stateClasses = [];
  if (disabled) stateClasses.push('theme-slider-row--disabled');
  if (invalid) stateClasses.push('theme-slider-row--invalid');
  if (className) stateClasses.push(className);
  const rootClasses = [rootClass, ...stateClasses].join(' ');
  const tag = label ? 'label' : 'span';

  const inputAttrs = [
    `type="range"`,
    `class="theme-slider"`,
    `data-size="${size}"`,
    `min="${min}"`,
    `max="${max}"`,
    `step="${step}"`,
    htmlId ? `id="${htmlId}"` : '',
    name ? `name="${name}"` : '',
    value != null ? `value="${value}"` : '',
    required ? `required aria-required="true"` : '',
    disabled ? `disabled` : '',
    invalid ? `aria-invalid="true"` : '',
    describedBy ? `aria-describedby="${describedBy}"` : '',
    ariaLabel ? `aria-label="${ariaLabel}"` : '',
  ].filter(Boolean).join(' ');

  const initial = value != null ? value : Math.round((Number(min) + Number(max)) / 2);

  if (!label) {
    return `<${tag} class="${rootClasses}" data-size="${size}"${disabled ? ' data-state="disabled"' : ''}><input ${inputAttrs}></${tag}>`;
  }

  const header = `
    <span class="theme-slider-row__header">
      <span class="theme-slider-row__label">${label}</span>
      ${required ? '<span class="theme-slider-row__required" aria-hidden="true">*</span>' : ''}
      ${valueDisplay ? `<output class="theme-slider-row__value"${htmlId ? ` for="${htmlId}"` : ''}>${initial}${valueSuffix}</output>` : ''}
    </span>`;

  return `<${tag} class="${rootClasses}" data-size="${size}"${disabled ? ' data-state="disabled"' : ''}>${header}<input ${inputAttrs}></${tag}>`;
}

function row(html, label) {
  return `
    <div class="slider-story__row">
      ${label ? `<code class="slider-story__rowlabel">${label}</code>` : ''}
      <div class="slider-story__rowcontent">${html}</div>
    </div>
  `;
}

const bodyHtml = `
  <section class="slider-story" data-testid="slider-root">
    <header class="slider-story__header">
      <h1>${t('theme.slider.story.title')}</h1>
      <p>${t('theme.slider.story.subtitle')}</p>
    </header>

    <section class="slider-story__section" aria-labelledby="slider-section-default">
      <h2 id="slider-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.slider.story.section.default')}</h2>
      <div class="slider-story__stack">
        ${row(renderSlider({ htmlId: 'demo-default', label: t('theme.slider.label.volume'), value: 50 }), '0 → 100, value=50')}
      </div>
    </section>

    <section class="slider-story__section" aria-labelledby="slider-section-with-value">
      <h2 id="slider-section-with-value" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.slider.story.section.with-value')}</h2>
      <p class="slider-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.slider.story.explainer.value-display')}</p>
      <div class="slider-story__stack">
        ${row(renderSlider({ htmlId: 'demo-value-pct',  label: t('theme.slider.label.opacity'),      value: 80,  valueDisplay: true, valueSuffix: ' %' }), 'percent')}
        ${row(renderSlider({ htmlId: 'demo-value-px',   label: t('theme.slider.label.font-size'),    value: 14, min: 10, max: 32, valueDisplay: true, valueSuffix: ' px' }), 'px')}
        ${row(renderSlider({ htmlId: 'demo-value-money', label: t('theme.slider.label.budget'),       value: 250, min: 0, max: 1000, step: 50, valueDisplay: true, valueSuffix: ' €' }), 'currency, step=50')}
      </div>
    </section>

    <section class="slider-story__section" aria-labelledby="slider-section-states">
      <h2 id="slider-section-states" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.slider.story.section.states')}</h2>
      <div class="slider-story__stack">
        ${row(renderSlider({ htmlId: 'demo-state-default',  label: t('theme.slider.label.volume'), value: 50, valueDisplay: true, valueSuffix: ' %' }),                                                              'default')}
        ${row(renderSlider({ htmlId: 'demo-state-disabled', label: t('theme.slider.label.volume'), value: 30, valueDisplay: true, valueSuffix: ' %', disabled: true }),                                              'disabled')}
        ${row(renderSlider({ htmlId: 'demo-state-required', label: t('theme.slider.label.volume'), value: 50, valueDisplay: true, valueSuffix: ' %', required: true }),                                              'required')}
        ${row(renderSlider({ htmlId: 'demo-state-invalid',  label: t('theme.slider.label.volume'), value: 95, valueDisplay: true, valueSuffix: ' %', invalid: true, describedBy: 'demo-state-invalid-error' }),      'invalid')}
      </div>
      <p class="slider-story__explainer theme-typography" data-variant="caption" data-color="tertiary" id="demo-state-invalid-error">${t('theme.slider.story.explainer.invalid')}</p>
    </section>

    <section class="slider-story__section" aria-labelledby="slider-section-sizes">
      <h2 id="slider-section-sizes" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.slider.story.section.sizes')}</h2>
      <p class="slider-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.slider.story.explainer.sizes')}</p>
      <div class="slider-story__stack">
        ${row(renderSlider({ htmlId: 'demo-sz-sm', label: t('theme.slider.label.volume'), value: 50, valueDisplay: true, valueSuffix: ' %', size: 'sm' }), 'sm (4 / 14)')}
        ${row(renderSlider({ htmlId: 'demo-sz-md', label: t('theme.slider.label.volume'), value: 50, valueDisplay: true, valueSuffix: ' %', size: 'md' }), 'md (6 / 18)')}
        ${row(renderSlider({ htmlId: 'demo-sz-lg', label: t('theme.slider.label.volume'), value: 50, valueDisplay: true, valueSuffix: ' %', size: 'lg' }), 'lg (8 / 22)')}
      </div>
    </section>

    <section class="slider-story__section" aria-labelledby="slider-section-range">
      <h2 id="slider-section-range" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.slider.story.section.range')}</h2>
      <p class="slider-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.slider.story.explainer.range')}</p>
      <div class="slider-story__stack">
        ${row(renderSlider({ htmlId: 'demo-rg-min',  label: t('theme.slider.label.volume'), value: 0,   min: 0, max: 100, valueDisplay: true, valueSuffix: ' %' }), 'at min (thumb left)')}
        ${row(renderSlider({ htmlId: 'demo-rg-mid',  label: t('theme.slider.label.volume'), value: 50,  min: 0, max: 100, valueDisplay: true, valueSuffix: ' %' }), 'at mid')}
        ${row(renderSlider({ htmlId: 'demo-rg-max',  label: t('theme.slider.label.volume'), value: 100, min: 0, max: 100, valueDisplay: true, valueSuffix: ' %' }), 'at max (thumb right)')}
        ${row(renderSlider({ htmlId: 'demo-rg-neg',  label: t('theme.slider.label.temperature'), value: -2, min: -10, max: 30, step: 1, valueDisplay: true, valueSuffix: ' °C' }), 'negative range')}
      </div>
    </section>

    <section class="slider-story__section" aria-labelledby="slider-section-bare">
      <h2 id="slider-section-bare" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.slider.story.section.bare')}</h2>
      <p class="slider-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.slider.story.explainer.bare')}</p>
      <div class="slider-story__stack">
        ${row(renderSlider({ htmlId: 'demo-bare',   value: 50, ariaLabel: t('theme.slider.aria.bare-volume') }), 'bare with aria-label')}
      </div>
    </section>

    <section class="slider-story__section" aria-labelledby="slider-section-long-label">
      <h2 id="slider-section-long-label" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.slider.story.section.long-label')}</h2>
      <div class="slider-story__stack">
        ${row(renderSlider({ htmlId: 'demo-long', label: t('theme.slider.label.long'), value: 65, valueDisplay: true, valueSuffix: ' %' }), '+30 % FR expansion')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Slider" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="slider-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="slider-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.slider-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.slider-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.slider-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.slider-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.slider-story__stack { display: grid; gap: var(--spacing-4); }
.slider-story__row { display: grid; grid-template-columns: minmax(180px, 220px) 1fr; gap: var(--spacing-3); align-items: center; }
.slider-story__rowlabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.slider-story__rowcontent { min-inline-size: 0; }
.slider-story__explainer { max-inline-size: 70ch; }
.slider-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
