<!--
  Error-404 story — 4 viewport variants (Light/Dark × LTR/RTL).

  Foundation pattern story — see `docs/specs/ring3/Error-404.md` for the
  shared Errors family doctrine.

  Sections (2): default (icon=search + primary "Retour à l'accueil")
              · with-back-link (+ secondary "Page précédente").

  Icon `search` substitut per OQ-57b — visual: couldn't-find. Microcopy
  verbatim from [12-microcopy-tone.md §"Pages" §404].
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

const searchIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon theme-empty__icon" data-size="xl"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`;

function renderError404({ htmlId, withSecondary = false }) {
  const titleId = `${htmlId}-title`;
  const primaryHtml = `<a class="theme-button" data-variant="primary" data-size="md" href="/"><span class="theme-button__label">${t('theme.error.404.primary-cta')}</span></a>`;
  const secondaryHtml = withSecondary
    ? `<a class="theme-button" data-variant="ghost" data-size="md" href="javascript:history.back();"><span class="theme-button__label">${t('theme.error.404.secondary-cta')}</span></a>`
    : '';
  return `
    <main class="theme-error-shell theme-error-404" data-variant="default" id="${htmlId}">
      <section class="theme-error-shell__panel">
        <div class="theme-empty" data-size="lg" role="region" aria-labelledby="${titleId}">
          <div class="theme-empty__illustration" aria-hidden="true">${searchIconSvg}</div>
          <div class="theme-empty__content">
            <h1 id="${titleId}" class="theme-empty__title">${t('theme.error.404.title')}</h1>
            <div class="theme-empty__body"><p>${t('theme.error.404.body')}</p></div>
            <div class="theme-empty__actions">${primaryHtml}${secondaryHtml}</div>
          </div>
        </div>
      </section>
    </main>
  `;
}

const bodyHtml = `
  <section class="error-404-story" data-testid="error-404-root">
    <header class="error-404-story__header">
      <h1>${t('theme.error.404.story.title')}</h1>
      <p>${t('theme.error.404.story.subtitle')}</p>
    </header>

    <section class="error-404-story__section" aria-labelledby="error-404-section-default">
      <h2 id="error-404-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.error.404.story.section.default')}</h2>
      <p class="error-404-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.error.404.story.explainer.default')}</p>
      <div class="error-404-story__frame">${renderError404({ htmlId: 'story-error-404-default' })}</div>
    </section>

    <section class="error-404-story__section" aria-labelledby="error-404-section-with-back">
      <h2 id="error-404-section-with-back" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.error.404.story.section.with-back')}</h2>
      <p class="error-404-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.error.404.story.explainer.with-back')}</p>
      <div class="error-404-story__frame">${renderError404({ htmlId: 'story-error-404-back', withSecondary: true })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Error-404" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="error-404-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="error-404-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.error-404-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.error-404-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.error-404-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.error-404-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.error-404-story__explainer { max-inline-size: 70ch; }
.error-404-story__frame { min-block-size: 32rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.error-404-story__frame .theme-error-shell { min-block-size: 100%; }
.error-404-dark-wrap { background: var(--color-bg-base); }
</style>
