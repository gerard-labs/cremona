<!--
  Error-500 story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (2): default (icon=alert-circle + primary "Réessayer" + secondary
                          "Retour à l'accueil")
              · primary-only (without secondary).

  Microcopy verbatim from [12-microcopy-tone.md §"Messages d'erreur" §500].
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

const alertCircleIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon theme-empty__icon" data-size="xl"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;

function renderError500({ htmlId, withSecondary = true }) {
  const titleId = `${htmlId}-title`;
  const primaryHtml = `<a class="theme-button" data-variant="primary" data-size="md" href="javascript:location.reload();"><span class="theme-button__label">${t('theme.error.500.primary-cta')}</span></a>`;
  const secondaryHtml = withSecondary
    ? `<a class="theme-button" data-variant="ghost" data-size="md" href="/"><span class="theme-button__label">${t('theme.error.500.secondary-cta')}</span></a>`
    : '';
  return `
    <main class="theme-error-shell theme-error-500" data-variant="default" id="${htmlId}">
      <section class="theme-error-shell__panel">
        <div class="theme-empty" data-size="lg" role="region" aria-labelledby="${titleId}">
          <div class="theme-empty__illustration" aria-hidden="true">${alertCircleIconSvg}</div>
          <div class="theme-empty__content">
            <h1 id="${titleId}" class="theme-empty__title">${t('theme.error.500.title')}</h1>
            <div class="theme-empty__body"><p>${t('theme.error.500.body')}</p></div>
            <div class="theme-empty__actions">${primaryHtml}${secondaryHtml}</div>
          </div>
        </div>
      </section>
    </main>
  `;
}

const bodyHtml = `
  <section class="error-500-story" data-testid="error-500-root">
    <header class="error-500-story__header">
      <h1>${t('theme.error.500.story.title')}</h1>
      <p>${t('theme.error.500.story.subtitle')}</p>
    </header>

    <section class="error-500-story__section" aria-labelledby="error-500-section-default">
      <h2 id="error-500-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.error.500.story.section.default')}</h2>
      <p class="error-500-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.error.500.story.explainer.default')}</p>
      <div class="error-500-story__frame">${renderError500({ htmlId: 'story-error-500-default' })}</div>
    </section>

    <section class="error-500-story__section" aria-labelledby="error-500-section-primary-only">
      <h2 id="error-500-section-primary-only" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.error.500.story.section.primary-only')}</h2>
      <p class="error-500-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.error.500.story.explainer.primary-only')}</p>
      <div class="error-500-story__frame">${renderError500({ htmlId: 'story-error-500-primary', withSecondary: false })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Error-500" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="error-500-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="error-500-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.error-500-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.error-500-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.error-500-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.error-500-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.error-500-story__explainer { max-inline-size: 70ch; }
.error-500-story__frame { min-block-size: 32rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.error-500-story__frame .theme-error-shell { min-block-size: 100%; }
.error-500-dark-wrap { background: var(--color-bg-base); }
</style>
