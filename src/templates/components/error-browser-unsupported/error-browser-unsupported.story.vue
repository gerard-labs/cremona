<!--
  Error-BrowserUnsupported story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (2): default (icon=info + primary "Mettre à jour mon navigateur")
              · with-continue (+ secondary "Continuer quand même").

  Icon `info` substitut per OQ-57b — visual: informational guidance.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

const infoIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cremona-icon cremona-empty__icon" data-size="xl"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;

function renderErrorBu({ htmlId, withSecondary = false }) {
  const titleId = `${htmlId}-title`;
  const primaryHtml = `<a class="cremona-button" data-variant="primary" data-size="md" href="https://browsehappy.com/"><span class="cremona-button__label">${t('theme.error.browser-unsupported.primary-cta')}</span></a>`;
  const secondaryHtml = withSecondary
    ? `<a class="cremona-button" data-variant="ghost" data-size="md" href="/"><span class="cremona-button__label">${t('theme.error.browser-unsupported.secondary-cta')}</span></a>`
    : '';
  return `
    <main class="cremona-error-shell cremona-error-browser-unsupported" data-variant="default" id="${htmlId}">
      <section class="cremona-error-shell__panel">
        <div class="cremona-empty" data-size="lg" role="region" aria-labelledby="${titleId}">
          <div class="cremona-empty__illustration" aria-hidden="true">${infoIconSvg}</div>
          <div class="cremona-empty__content">
            <h1 id="${titleId}" class="cremona-empty__title">${t('theme.error.browser-unsupported.title')}</h1>
            <div class="cremona-empty__body"><p>${t('theme.error.browser-unsupported.body')}</p></div>
            <div class="cremona-empty__actions">${primaryHtml}${secondaryHtml}</div>
          </div>
        </div>
      </section>
    </main>
  `;
}

const bodyHtml = `
  <section class="error-bu-story" data-testid="error-bu-root">
    <header class="error-bu-story__header">
      <h1>${t('theme.error.browser-unsupported.story.title')}</h1>
      <p>${t('theme.error.browser-unsupported.story.subtitle')}</p>
    </header>

    <section class="error-bu-story__section" aria-labelledby="error-bu-section-default">
      <h2 id="error-bu-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.error.browser-unsupported.story.section.default')}</h2>
      <p class="error-bu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.error.browser-unsupported.story.explainer.default')}</p>
      <div class="error-bu-story__frame">${renderErrorBu({ htmlId: 'story-error-bu-default' })}</div>
    </section>

    <section class="error-bu-story__section" aria-labelledby="error-bu-section-with-continue">
      <h2 id="error-bu-section-with-continue" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.error.browser-unsupported.story.section.with-continue')}</h2>
      <p class="error-bu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.error.browser-unsupported.story.explainer.with-continue')}</p>
      <div class="error-bu-story__frame">${renderErrorBu({ htmlId: 'story-error-bu-continue', withSecondary: true })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Error-BrowserUnsupported" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="error-bu-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="error-bu-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.error-bu-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.error-bu-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.error-bu-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.error-bu-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.error-bu-story__explainer { max-inline-size: 70ch; }
.error-bu-story__frame { min-block-size: 32rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.error-bu-story__frame .cremona-error-shell { min-block-size: 100%; }
.error-bu-dark-wrap { background: var(--color-bg-base); }
</style>
