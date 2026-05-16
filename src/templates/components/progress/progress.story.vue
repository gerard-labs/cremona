<!--
  Progress story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (7): determinate · value-display · variants · sizes
                · indeterminate · with-row-header · long-label.

  Zero Stimulus controller — determinate uses native <progress value max>,
  indeterminate is a CSS-only animated stripe. Reduced-motion freezes the
  stripe (still indicative).

  Visual baselines capture the at-rest bar position. The indeterminate
  stripe animation is in motion when sampled; Playwright's `disableAnimations`
  option will freeze it for stable baselines.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderProgress(props = {}) {
  const {
    value, max = 100, label, valueDisplay, valueSuffix = '',
    variant = 'primary', size = 'md',
  } = props;
  const isIndeterminate = value == null;
  const classes = ['theme-progress'];
  if (isIndeterminate) classes.push('theme-progress--indeterminate');

  const wantsRow = label || (valueDisplay && !isIndeterminate);

  const bar = isIndeterminate
    ? `<div class="${classes.join(' ')}" data-size="${size}" data-variant="${variant}" role="progressbar"${label ? ` aria-label="${label}"` : ''}></div>`
    : `<progress class="${classes.join(' ')}" data-size="${size}" data-variant="${variant}" value="${value}" max="${max}"${label ? ` aria-label="${label}"` : ''}></progress>`;

  if (!wantsRow) return bar;

  const header = `
    <div class="theme-progress-row__header">
      ${label ? `<span class="theme-progress-row__label">${label}</span>` : ''}
      ${valueDisplay && !isIndeterminate ? `<output class="theme-progress-row__value">${value}${valueSuffix}</output>` : ''}
    </div>`;

  return `<div class="theme-progress-row" data-size="${size}" data-variant="${variant}">${header}${bar}</div>`;
}

function row(html, label) {
  return `
    <div class="progress-story__row">
      ${label ? `<code class="progress-story__rowlabel">${label}</code>` : ''}
      <div class="progress-story__rowcontent">${html}</div>
    </div>
  `;
}

const SAMPLES = {
  uploadLabel: t('theme.progress.story.label.upload'),
  syncLabel: t('theme.progress.story.label.sync'),
  exportLabel: t('theme.progress.story.label.export'),
  diskUsage: t('theme.progress.story.label.disk-usage'),
  longLabel: t('theme.progress.story.label.long'),
  loadingLabel: t('theme.progress.story.label.loading'),
};

const bodyHtml = `
  <section class="progress-story" data-testid="progress-root">
    <header class="progress-story__header">
      <h1>${t('theme.progress.story.title')}</h1>
      <p>${t('theme.progress.story.subtitle')}</p>
    </header>

    <section class="progress-story__section" aria-labelledby="prog-section-determinate">
      <h2 id="prog-section-determinate" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.progress.story.section.determinate')}</h2>
      <div class="progress-story__stack">
        ${row(renderProgress({ value: 0, label: SAMPLES.uploadLabel }),    'value=0')}
        ${row(renderProgress({ value: 25, label: SAMPLES.uploadLabel }),   'value=25')}
        ${row(renderProgress({ value: 50, label: SAMPLES.uploadLabel }),   'value=50')}
        ${row(renderProgress({ value: 75, label: SAMPLES.uploadLabel }),   'value=75')}
        ${row(renderProgress({ value: 100, label: SAMPLES.uploadLabel, variant: 'success' }),  'value=100 (complete)')}
      </div>
    </section>

    <section class="progress-story__section" aria-labelledby="prog-section-value-display">
      <h2 id="prog-section-value-display" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.progress.story.section.value-display')}</h2>
      <p class="progress-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.progress.story.explainer.value-display')}</p>
      <div class="progress-story__stack">
        ${row(renderProgress({ value: 42, label: SAMPLES.uploadLabel, valueDisplay: true, valueSuffix: ' %' }),                    'percent (default)')}
        ${row(renderProgress({ value: 128, max: 512, label: SAMPLES.syncLabel, valueDisplay: true, valueSuffix: ' MB / 512 MB' }), 'fraction (sync)')}
        ${row(renderProgress({ value: 7, max: 12, label: SAMPLES.exportLabel, valueDisplay: true, valueSuffix: ' / 12 fichiers' }),  'X of N')}
      </div>
    </section>

    <section class="progress-story__section" aria-labelledby="prog-section-variants">
      <h2 id="prog-section-variants" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.progress.story.section.variants')}</h2>
      <p class="progress-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.progress.story.explainer.variants')}</p>
      <div class="progress-story__stack">
        ${row(renderProgress({ value: 60, variant: 'primary',   label: SAMPLES.diskUsage, valueDisplay: true, valueSuffix: ' %' }), 'primary')}
        ${row(renderProgress({ value: 60, variant: 'success',   label: SAMPLES.diskUsage, valueDisplay: true, valueSuffix: ' %' }), 'success')}
        ${row(renderProgress({ value: 80, variant: 'warning',   label: SAMPLES.diskUsage, valueDisplay: true, valueSuffix: ' %' }), 'warning (80 % seuil)')}
        ${row(renderProgress({ value: 92, variant: 'danger',    label: SAMPLES.diskUsage, valueDisplay: true, valueSuffix: ' %' }), 'danger (92 % critique)')}
      </div>
    </section>

    <section class="progress-story__section" aria-labelledby="prog-section-sizes">
      <h2 id="prog-section-sizes" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.progress.story.section.sizes')}</h2>
      <div class="progress-story__stack">
        ${row(renderProgress({ value: 50, size: 'sm', label: SAMPLES.uploadLabel }), 'sm (4 px)')}
        ${row(renderProgress({ value: 50, size: 'md', label: SAMPLES.uploadLabel }), 'md (6 px — défaut)')}
        ${row(renderProgress({ value: 50, size: 'lg', label: SAMPLES.uploadLabel }), 'lg (8 px)')}
      </div>
    </section>

    <section class="progress-story__section" aria-labelledby="prog-section-indeterminate">
      <h2 id="prog-section-indeterminate" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.progress.story.section.indeterminate')}</h2>
      <p class="progress-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.progress.story.explainer.indeterminate')}</p>
      <div class="progress-story__stack">
        ${row(renderProgress({ label: SAMPLES.loadingLabel }),                            'indeterminate primary')}
        ${row(renderProgress({ label: SAMPLES.loadingLabel, variant: 'success' }),        'indeterminate success')}
        ${row(renderProgress({ label: SAMPLES.loadingLabel, size: 'lg' }),                'indeterminate lg')}
      </div>
    </section>

    <section class="progress-story__section" aria-labelledby="prog-section-bare">
      <h2 id="prog-section-bare" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.progress.story.section.bare')}</h2>
      <p class="progress-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.progress.story.explainer.bare')}</p>
      <div class="progress-story__stack">
        ${row(renderProgress({ value: 65, label: SAMPLES.uploadLabel }), 'bar nu avec aria-label')}
      </div>
    </section>

    <section class="progress-story__section" aria-labelledby="prog-section-long-label">
      <h2 id="prog-section-long-label" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.progress.story.section.long-label')}</h2>
      <div class="progress-story__stack">
        ${row(renderProgress({ value: 73, label: SAMPLES.longLabel, valueDisplay: true, valueSuffix: ' %' }), '+30 % FR expansion')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Progress" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="progress-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="progress-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.progress-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.progress-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.progress-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.progress-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.progress-story__stack { display: grid; gap: var(--spacing-4); }
.progress-story__row { display: grid; grid-template-columns: minmax(180px, 220px) 1fr; gap: var(--spacing-3); align-items: center; }
.progress-story__rowlabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.progress-story__rowcontent { min-inline-size: 0; max-inline-size: 360px; }
.progress-story__explainer { max-inline-size: 70ch; }
.progress-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
