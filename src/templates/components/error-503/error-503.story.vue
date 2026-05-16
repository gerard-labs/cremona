<!--
  Error-503 story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (2): default (icon=alert-triangle + primary "Réessayer")
              · with-status-link (+ secondary "Voir le statut").
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

const alertTriangleIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cremona-icon cremona-empty__icon" data-size="xl"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;

function renderError503({ htmlId, withSecondary = false }) {
  const titleId = `${htmlId}-title`;
  const primaryHtml = `<a class="cremona-button" data-variant="primary" data-size="md" href="javascript:location.reload();"><span class="cremona-button__label">${t('theme.error.503.primary-cta')}</span></a>`;
  const secondaryHtml = withSecondary
    ? `<a class="cremona-button" data-variant="ghost" data-size="md" href="/status"><span class="cremona-button__label">${t('theme.error.503.secondary-cta')}</span></a>`
    : '';
  return `
    <main class="cremona-error-shell cremona-error-503" data-variant="default" id="${htmlId}">
      <section class="cremona-error-shell__panel">
        <div class="cremona-empty" data-size="lg" role="region" aria-labelledby="${titleId}">
          <div class="cremona-empty__illustration" aria-hidden="true">${alertTriangleIconSvg}</div>
          <div class="cremona-empty__content">
            <h1 id="${titleId}" class="cremona-empty__title">${t('theme.error.503.title')}</h1>
            <div class="cremona-empty__body"><p>${t('theme.error.503.body')}</p></div>
            <div class="cremona-empty__actions">${primaryHtml}${secondaryHtml}</div>
          </div>
        </div>
      </section>
    </main>
  `;
}

const bodyHtml = `
  <section class="error-503-story" data-testid="error-503-root">
    <header class="error-503-story__header">
      <h1>${t('theme.error.503.story.title')}</h1>
      <p>${t('theme.error.503.story.subtitle')}</p>
    </header>

    <section class="error-503-story__section" aria-labelledby="error-503-section-default">
      <h2 id="error-503-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.error.503.story.section.default')}</h2>
      <p class="error-503-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.error.503.story.explainer.default')}</p>
      <div class="error-503-story__frame">${renderError503({ htmlId: 'story-error-503-default' })}</div>
    </section>

    <section class="error-503-story__section" aria-labelledby="error-503-section-with-status">
      <h2 id="error-503-section-with-status" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.error.503.story.section.with-status')}</h2>
      <p class="error-503-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.error.503.story.explainer.with-status')}</p>
      <div class="error-503-story__frame">${renderError503({ htmlId: 'story-error-503-status', withSecondary: true })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Error-503" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="error-503-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="error-503-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.error-503-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.error-503-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.error-503-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.error-503-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.error-503-story__explainer { max-inline-size: 70ch; }
.error-503-story__frame { min-block-size: 32rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.error-503-story__frame .cremona-error-shell { min-block-size: 100%; }
.error-503-dark-wrap { background: var(--color-bg-base); }
</style>
