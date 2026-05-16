<!--
  Error-401 story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (2): default (icon=user + primary "Se connecter" + secondary
                          "Créer un compte")
              · primary-only (icon=user + primary "Se connecter" only).

  Composes _error-shell (default variant) + Empty (lg, h1) + Icon `user`
  (Lucide curated 30-set substitut per OQ-57b).

  See `docs/specs/ring3/Error-401.md` for the spec.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

const userIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cremona-icon cremona-empty__icon" data-size="xl"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

function renderError401({ htmlId, withSecondary = true }) {
  const titleId = `${htmlId}-title`;
  const primaryHtml = `<a class="cremona-button" data-variant="primary" data-size="md" href="/login"><span class="cremona-button__label">${t('theme.error.401.primary-cta')}</span></a>`;
  const secondaryHtml = withSecondary
    ? `<a class="cremona-button" data-variant="ghost" data-size="md" href="/register"><span class="cremona-button__label">${t('theme.error.401.secondary-cta')}</span></a>`
    : '';

  return `
    <main class="cremona-error-shell cremona-error-401" data-variant="default" id="${htmlId}">
      <section class="cremona-error-shell__panel">
        <div class="cremona-empty" data-size="lg" role="region" aria-labelledby="${titleId}">
          <div class="cremona-empty__illustration" aria-hidden="true">${userIconSvg}</div>
          <div class="cremona-empty__content">
            <h1 id="${titleId}" class="cremona-empty__title">${t('theme.error.401.title')}</h1>
            <div class="cremona-empty__body"><p>${t('theme.error.401.body')}</p></div>
            <div class="cremona-empty__actions">${primaryHtml}${secondaryHtml}</div>
          </div>
        </div>
      </section>
    </main>
  `;
}

const bodyHtml = `
  <section class="error-401-story" data-testid="error-401-root">
    <header class="error-401-story__header">
      <h1>${t('theme.error.401.story.title')}</h1>
      <p>${t('theme.error.401.story.subtitle')}</p>
    </header>

    <section class="error-401-story__section" aria-labelledby="error-401-section-default">
      <h2 id="error-401-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.error.401.story.section.default')}</h2>
      <p class="error-401-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.error.401.story.explainer.default')}</p>
      <div class="error-401-story__frame">${renderError401({ htmlId: 'story-error-401-default' })}</div>
    </section>

    <section class="error-401-story__section" aria-labelledby="error-401-section-primary-only">
      <h2 id="error-401-section-primary-only" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.error.401.story.section.primary-only')}</h2>
      <p class="error-401-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.error.401.story.explainer.primary-only')}</p>
      <div class="error-401-story__frame">${renderError401({ htmlId: 'story-error-401-primary', withSecondary: false })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Errors/401" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="error-401-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="error-401-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.error-401-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.error-401-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.error-401-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.error-401-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.error-401-story__explainer { max-inline-size: 70ch; }
.error-401-story__frame { min-block-size: 32rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.error-401-story__frame .cremona-error-shell { min-block-size: 100%; }
.error-401-dark-wrap { background: var(--color-bg-base); }
</style>
