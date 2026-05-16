<!--
  BackToTop story — 4 viewport variants.
  Sections : default-hidden · default-visible · custom-threshold-200.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderBackToTop({ id = 'story-back-to-top', threshold = 400, visible = false }) {
  return `
    <button type="button" class="theme-button theme-button--primary theme-back-to-top"
            id="${id}"
            data-back-to-top-threshold-value="${threshold}"
            data-visible="${visible}"
            aria-label="${t('theme.back-to-top.aria.label')}">
      <svg class="theme-icon" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-arrow-up"/></svg>
    </button>
  `;
}

const bodyHtml = `
  <section class="back-to-top-story" aria-labelledby="back-to-top-story-title">
    <header class="back-to-top-story__header">
      <h1 id="back-to-top-story-title">${t('theme.back-to-top.story.title')}</h1>
      <p>${t('theme.back-to-top.story.subtitle')}</p>
    </header>

    <section class="back-to-top-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.back-to-top.story.section.visible')}</h2>
      <p class="back-to-top-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.back-to-top.story.explainer.visible')}</p>
      <div class="back-to-top-story__frame">${renderBackToTop({ id: 'story-visible', visible: true })}</div>
    </section>

    <section class="back-to-top-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.back-to-top.story.section.hidden')}</h2>
      <p class="back-to-top-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.back-to-top.story.explainer.hidden')}</p>
      <div class="back-to-top-story__frame">${renderBackToTop({ id: 'story-hidden', visible: false })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/BackToTop" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="back-to-top-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="back-to-top-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.back-to-top-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.back-to-top-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.back-to-top-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.back-to-top-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.back-to-top-story__explainer { max-inline-size: 70ch; }
.back-to-top-story__frame { position: relative; min-block-size: 200px; padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.back-to-top-story__frame .theme-back-to-top { position: absolute; }
.back-to-top-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
