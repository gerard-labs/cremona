<!--
  RGPD-DataExport story — 4 viewport variants.
  Sections : state-idle · state-loading · state-success · state-error.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderDataExport({ id, state = 'idle', withMeta = true }) {
  const meta = withMeta ? `
    <ul class="theme-rgpd-data-export__meta" role="list">
      <li class="theme-rgpd-data-export__meta-item">
        <svg class="theme-icon" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-edit-3"/></svg>
        <span>${t('theme.rgpd-data-export.meta.format').replace('%format%', 'JSON')}</span>
      </li>
      <li class="theme-rgpd-data-export__meta-item">
        <span>${t('theme.rgpd-data-export.meta.size').replace('%size%', '~2,4 Mo')}</span>
      </li>
      <li class="theme-rgpd-data-export__meta-item">
        <span>${t('theme.rgpd-data-export.meta.time').replace('%time%', t('theme.rgpd-data-export.story.time-estimate'))}</span>
      </li>
    </ul>
  ` : '';

  const buttonIcon = state === 'success' ? `<svg class="theme-icon" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-arrow-right"/></svg>`
                   : state === 'loading' ? `<svg class="theme-icon" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-option"/></svg>`
                   : state === 'error'   ? `<svg class="theme-icon" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-alert-triangle"/></svg>`
                   : '';

  const isDisabled = state === 'loading' ? 'disabled aria-disabled="true"' : '';

  return `
    <article class="theme-card theme-rgpd-data-export"
             id="${id}"
             data-variant="elevated"
             data-rgpd-data-export-state="${state}"
             aria-labelledby="${id}-title">
      <header class="theme-card__header">
        <h2 id="${id}-title" class="theme-card__title">${t('theme.rgpd-data-export.title')}</h2>
        <p class="theme-card__description">${t('theme.rgpd-data-export.description')}</p>
      </header>
      <div class="theme-card__body">
        ${meta}
        <p class="theme-rgpd-data-export__legal-note">${t('theme.rgpd-data-export.legal-note')}</p>
      </div>
      <footer class="theme-card__footer">
        <button type="button" class="theme-button theme-rgpd-data-export__button-state" data-variant="primary" ${isDisabled}>
          ${buttonIcon}
          <span>${t('theme.rgpd-data-export.button.' + state)}</span>
        </button>
      </footer>
    </article>
  `;
}

const bodyHtml = `
  <section class="rgpd-data-export-story" aria-labelledby="rgpd-data-export-story-title">
    <header class="rgpd-data-export-story__header">
      <h1 id="rgpd-data-export-story-title">${t('theme.rgpd-data-export.story.title')}</h1>
      <p>${t('theme.rgpd-data-export.story.subtitle')}</p>
    </header>

    <section class="rgpd-data-export-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.rgpd-data-export.story.section.idle')}</h2>
      <p class="rgpd-data-export-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.rgpd-data-export.story.explainer.idle')}</p>
      <div class="rgpd-data-export-story__frame">${renderDataExport({ id: 'data-export-idle', state: 'idle' })}</div>
    </section>

    <section class="rgpd-data-export-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.rgpd-data-export.story.section.loading')}</h2>
      <p class="rgpd-data-export-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.rgpd-data-export.story.explainer.loading')}</p>
      <div class="rgpd-data-export-story__frame">${renderDataExport({ id: 'data-export-loading', state: 'loading' })}</div>
    </section>

    <section class="rgpd-data-export-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.rgpd-data-export.story.section.success')}</h2>
      <p class="rgpd-data-export-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.rgpd-data-export.story.explainer.success')}</p>
      <div class="rgpd-data-export-story__frame">${renderDataExport({ id: 'data-export-success', state: 'success' })}</div>
    </section>

    <section class="rgpd-data-export-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.rgpd-data-export.story.section.error')}</h2>
      <p class="rgpd-data-export-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.rgpd-data-export.story.explainer.error')}</p>
      <div class="rgpd-data-export-story__frame">${renderDataExport({ id: 'data-export-error', state: 'error' })}</div>
    </section>

  </section>
`;
</script>

<template>
  <Story title="Patterns/RGPD-DataExport" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="rgpd-data-export-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="rgpd-data-export-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.rgpd-data-export-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.rgpd-data-export-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.rgpd-data-export-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.rgpd-data-export-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.rgpd-data-export-story__explainer { max-inline-size: 70ch; }
.rgpd-data-export-story__frame { padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); background: var(--color-bg-base); max-inline-size: 560px; }
.rgpd-data-export-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
