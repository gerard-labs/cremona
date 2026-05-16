<!--
  Spinner story — 4 viewport variants. Sizes, default vs inverted (on a
  primary surface), label customization, inline-in-button placement.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderSpinner({ size = 'md', label, inverted = false, className }) {
  const classes = ['cremona-spinner'];
  if (inverted) classes.push('cremona-spinner--inverted');
  if (className) classes.push(className);
  const text = label ?? t('theme.common.states.loading');
  return `
    <span class="${classes.join(' ')}" data-size="${size}" role="status" aria-live="polite">
      <svg viewBox="0 0 50 50" aria-hidden="true" focusable="false">
        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" pathLength="100" stroke-dasharray="25 75"></circle>
      </svg>
      <span class="cremona-sr-only">${text}</span>
    </span>
  `;
}

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];

const bodyHtml = `
  <section class="spinner-story" data-testid="spinner-root">
    <header class="spinner-story__header">
      <h1>${t('theme.spinner.story.title')}</h1>
      <p>${t('theme.spinner.story.subtitle')}</p>
    </header>

    <section class="spinner-story__section" aria-labelledby="spinner-section-sizes">
      <h2 id="spinner-section-sizes" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.spinner.story.section.sizes')}</h2>
      <div class="spinner-story__row">
        ${SIZES.map((s) => `
          <div class="spinner-story__cell">
            ${renderSpinner({ size: s })}
            <code class="spinner-story__cellname">${s}</code>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="spinner-story__section" aria-labelledby="spinner-section-default">
      <h2 id="spinner-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.spinner.story.section.default')}</h2>
      <div class="spinner-story__row">
        ${renderSpinner({ size: 'lg' })}
      </div>
    </section>

    <section class="spinner-story__section" aria-labelledby="spinner-section-inverted">
      <h2 id="spinner-section-inverted" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.spinner.story.section.inverted')}</h2>
      <div class="spinner-story__primary-surface">
        ${renderSpinner({ size: 'lg', inverted: true })}
      </div>
    </section>

    <section class="spinner-story__section" aria-labelledby="spinner-section-inline">
      <h2 id="spinner-section-inline" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.spinner.story.section.inline')}</h2>
      <p class="cremona-typography" data-variant="body">
        ${renderSpinner({ size: 'sm', className: 'spinner-story__inline-spinner' })}
        <span>${t('theme.spinner.story.inline-text')}</span>
      </p>
      <button type="button" class="spinner-story__button-primary" aria-busy="true" disabled>
        ${renderSpinner({ size: 'sm', inverted: true, className: 'spinner-story__inline-spinner' })}
        <span>${t('theme.common.states.saving')}</span>
      </button>
    </section>

    <section class="spinner-story__section" aria-labelledby="spinner-section-custom">
      <h2 id="spinner-section-custom" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.spinner.story.section.custom-label')}</h2>
      <p class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.spinner.story.custom-label-explainer')}</p>
      <div class="spinner-story__row">
        ${renderSpinner({ size: 'lg', label: t('theme.spinner.story.label.exporting') })}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Spinner" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="spinner-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="spinner-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.spinner-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.spinner-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.spinner-story__header p { font: var(--typography-body); color: var(--color-text-secondary); }
.spinner-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.spinner-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-6); align-items: center; }
.spinner-story__cell { display: grid; gap: var(--spacing-1); justify-items: center; }
.spinner-story__cellname { font: var(--typography-code); color: var(--color-text-tertiary); }
.spinner-story__primary-surface { padding: var(--spacing-4); background: var(--color-primary); border-radius: var(--radius-md); display: inline-flex; align-items: center; gap: var(--spacing-3); color: var(--color-primary-foreground); }
.spinner-story__inline-spinner { vertical-align: -2px; margin-inline-end: var(--spacing-1); }
.spinner-story__button-primary { display: inline-flex; align-items: center; gap: var(--spacing-2); padding: var(--spacing-2) var(--spacing-4); background: var(--color-primary); color: var(--color-primary-foreground); border-radius: var(--radius-button); border: 0; font: var(--typography-label); cursor: not-allowed; opacity: 0.85; }
.spinner-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
