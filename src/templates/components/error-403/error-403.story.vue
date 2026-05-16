<!--
  Error-403 story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (2): default (icon=eye + primary "Retour au tableau de bord")
              · with-request-access (+ secondary "Demander l'accès").

  Icon `eye` substitut per OQ-57b — visual: restricted/hidden view.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

const eyeIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon theme-empty__icon" data-size="xl"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;

function renderError403({ htmlId, withSecondary = false }) {
  const titleId = `${htmlId}-title`;
  const primaryHtml = `<a class="theme-button" data-variant="primary" data-size="md" href="/"><span class="theme-button__label">${t('theme.error.403.primary-cta')}</span></a>`;
  const secondaryHtml = withSecondary
    ? `<a class="theme-button" data-variant="ghost" data-size="md" href="mailto:admin@example.com"><span class="theme-button__label">${t('theme.error.403.secondary-cta')}</span></a>`
    : '';
  return `
    <main class="theme-error-shell theme-error-403" data-variant="default" id="${htmlId}">
      <section class="theme-error-shell__panel">
        <div class="theme-empty" data-size="lg" role="region" aria-labelledby="${titleId}">
          <div class="theme-empty__illustration" aria-hidden="true">${eyeIconSvg}</div>
          <div class="theme-empty__content">
            <h1 id="${titleId}" class="theme-empty__title">${t('theme.error.403.title')}</h1>
            <div class="theme-empty__body"><p>${t('theme.error.403.body')}</p></div>
            <div class="theme-empty__actions">${primaryHtml}${secondaryHtml}</div>
          </div>
        </div>
      </section>
    </main>
  `;
}

const bodyHtml = `
  <section class="error-403-story" data-testid="error-403-root">
    <header class="error-403-story__header">
      <h1>${t('theme.error.403.story.title')}</h1>
      <p>${t('theme.error.403.story.subtitle')}</p>
    </header>

    <section class="error-403-story__section" aria-labelledby="error-403-section-default">
      <h2 id="error-403-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.error.403.story.section.default')}</h2>
      <p class="error-403-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.error.403.story.explainer.default')}</p>
      <div class="error-403-story__frame">${renderError403({ htmlId: 'story-error-403-default' })}</div>
    </section>

    <section class="error-403-story__section" aria-labelledby="error-403-section-request-access">
      <h2 id="error-403-section-request-access" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.error.403.story.section.request-access')}</h2>
      <p class="error-403-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.error.403.story.explainer.request-access')}</p>
      <div class="error-403-story__frame">${renderError403({ htmlId: 'story-error-403-request', withSecondary: true })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Error-403" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="error-403-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="error-403-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.error-403-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.error-403-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.error-403-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.error-403-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.error-403-story__explainer { max-inline-size: 70ch; }
.error-403-story__frame { min-block-size: 32rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.error-403-story__frame .theme-error-shell { min-block-size: 100%; }
.error-403-dark-wrap { background: var(--color-bg-base); }
</style>
