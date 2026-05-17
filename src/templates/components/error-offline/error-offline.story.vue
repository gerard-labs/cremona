<!--
  Error-Offline story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (2): default (hero wifi-off + primary "Réessayer")
              · with-cached-link (+ secondary "Voir les pages en cache").

  Brand-feel pattern. Hero SVG inline (wifi-off motif).
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160" aria-hidden="true" class="cremona-error-offline__hero"><defs><linearGradient id="s-eo-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--color-bg-sunken)"/><stop offset="1" stop-color="var(--color-border-subtle)"/></linearGradient></defs><rect x="20" y="30" rx="14" ry="14" width="160" height="100" fill="url(#s-eo-grad)" stroke="var(--color-border-default)" stroke-width="2"/><g transform="translate(100 95)" stroke="var(--color-text-tertiary)" stroke-width="3" stroke-linecap="round" fill="none"><path d="M -30 -10 Q 0 -36 30 -10" opacity="0.45"/><path d="M -20 -2 Q 0 -22 20 -2" opacity="0.65"/><path d="M -10 6 Q 0 -6 10 6" opacity="0.85"/><circle cx="0" cy="14" r="3" fill="var(--color-text-tertiary)"/><line x1="-32" y1="-18" x2="32" y2="22" stroke="var(--color-danger)" stroke-width="4"/></g></svg>`;

function renderErrorOffline({ htmlId, withCached = false }) {
  const titleId = `${htmlId}-title`;
  const secondaryHtml = withCached
    ? `<a class="cremona-button" data-variant="ghost" data-size="md" href="#cached"><span class="cremona-button__label">${t('theme.error.offline.secondary-cta')}</span></a>`
    : '';
  return `
    <main class="cremona-error-shell cremona-error-shell--hero cremona-error-offline" data-variant="hero" id="${htmlId}">
      <section class="cremona-error-shell__panel">
        <div class="cremona-empty" data-size="lg" role="region" aria-labelledby="${titleId}">
          <div class="cremona-empty__illustration" aria-hidden="true">${heroSvg}</div>
          <div class="cremona-empty__content">
            <h1 id="${titleId}" class="cremona-empty__title">${t('theme.error.offline.title')}</h1>
            <div class="cremona-empty__body"><p>${t('theme.error.offline.body')}</p></div>
            <div class="cremona-empty__actions">
              <a class="cremona-button" data-variant="primary" data-size="md" href="javascript:location.reload();"><span class="cremona-button__label">${t('theme.error.offline.primary-cta')}</span></a>
              ${secondaryHtml}
            </div>
          </div>
        </div>
      </section>
    </main>
  `;
}

const bodyHtml = `
  <section class="error-offline-story" data-testid="error-offline-root">
    <header class="error-offline-story__header">
      <h1>${t('theme.error.offline.story.title')}</h1>
      <p>${t('theme.error.offline.story.subtitle')}</p>
    </header>

    <section class="error-offline-story__section" aria-labelledby="error-offline-section-default">
      <h2 id="error-offline-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.error.offline.story.section.default')}</h2>
      <p class="error-offline-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.error.offline.story.explainer.default')}</p>
      <div class="error-offline-story__frame">${renderErrorOffline({ htmlId: 'story-error-offline-default' })}</div>
    </section>

    <section class="error-offline-story__section" aria-labelledby="error-offline-section-cached">
      <h2 id="error-offline-section-cached" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.error.offline.story.section.cached')}</h2>
      <p class="error-offline-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.error.offline.story.explainer.cached')}</p>
      <div class="error-offline-story__frame">${renderErrorOffline({ htmlId: 'story-error-offline-cached', withCached: true })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Errors/Offline" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="error-offline-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="error-offline-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.error-offline-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.error-offline-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.error-offline-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.error-offline-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.error-offline-story__explainer { max-inline-size: 70ch; }
.error-offline-story__frame { min-block-size: 32rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.error-offline-story__frame .cremona-error-shell { min-block-size: 100%; }
.error-offline-dark-wrap { background: var(--color-bg-base); }
</style>
