<!--
  Error-Maintenance story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (2): default (hero gears + primary "Voir le statut")
              · with-eta (+ body addendum with ETA + secondary "M'avertir").

  Brand-feel pattern per OQ-57. Hero SVG inline (gears motif) — consumer-
  overridable via {% block illustration %} when embedding.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160" aria-hidden="true" class="cremona-error-maintenance__hero"><defs><linearGradient id="s-em-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--color-warning-soft)" stop-opacity="0.95"/><stop offset="1" stop-color="var(--color-primary-soft)" stop-opacity="0.7"/></linearGradient></defs><rect x="20" y="30" rx="14" ry="14" width="160" height="100" fill="url(#s-em-grad)" stroke="var(--color-border-default)" stroke-width="2"/><g transform="translate(75 80)" stroke="var(--color-warning-soft-foreground)" stroke-width="3" stroke-linejoin="round" fill="none"><circle r="22"/><circle r="8"/><line x1="0" y1="-30" x2="0" y2="-22"/><line x1="0" y1="22" x2="0" y2="30"/><line x1="-30" y1="0" x2="-22" y2="0"/><line x1="22" y1="0" x2="30" y2="0"/><line x1="-21" y1="-21" x2="-16" y2="-16"/><line x1="16" y1="16" x2="21" y2="21"/><line x1="21" y1="-21" x2="16" y2="-16"/><line x1="-16" y1="16" x2="-21" y2="21"/></g><g transform="translate(135 60)" stroke="var(--color-primary-soft-foreground)" stroke-width="2" stroke-linejoin="round" fill="none"><circle r="14"/><circle r="5"/><line x1="0" y1="-18" x2="0" y2="-14"/><line x1="0" y1="14" x2="0" y2="18"/><line x1="-18" y1="0" x2="-14" y2="0"/><line x1="14" y1="0" x2="18" y2="0"/></g></svg>`;

function renderErrorMaintenance({ htmlId, withEta = false }) {
  const titleId = `${htmlId}-title`;
  const bodyText = withEta
    ? `${t('theme.error.maintenance.body')} ${t('theme.error.maintenance.body-eta')}`
    : t('theme.error.maintenance.body');
  const secondaryHtml = withEta
    ? `<a class="cremona-button" data-variant="ghost" data-size="md" href="#notify"><span class="cremona-button__label">${t('theme.error.maintenance.secondary-cta')}</span></a>`
    : '';
  return `
    <main class="cremona-error-shell cremona-error-shell--hero cremona-error-maintenance" data-variant="hero" id="${htmlId}">
      <section class="cremona-error-shell__panel">
        <div class="cremona-empty" data-size="lg" role="region" aria-labelledby="${titleId}">
          <div class="cremona-empty__illustration" aria-hidden="true">${heroSvg}</div>
          <div class="cremona-empty__content">
            <h1 id="${titleId}" class="cremona-empty__title">${t('theme.error.maintenance.title')}</h1>
            <div class="cremona-empty__body"><p>${bodyText}</p></div>
            <div class="cremona-empty__actions">
              <a class="cremona-button" data-variant="primary" data-size="md" href="/status"><span class="cremona-button__label">${t('theme.error.maintenance.primary-cta')}</span></a>
              ${secondaryHtml}
            </div>
          </div>
        </div>
      </section>
    </main>
  `;
}

const bodyHtml = `
  <section class="error-maintenance-story" data-testid="error-maintenance-root">
    <header class="error-maintenance-story__header">
      <h1>${t('theme.error.maintenance.story.title')}</h1>
      <p>${t('theme.error.maintenance.story.subtitle')}</p>
    </header>

    <section class="error-maintenance-story__section" aria-labelledby="error-maintenance-section-default">
      <h2 id="error-maintenance-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.error.maintenance.story.section.default')}</h2>
      <p class="error-maintenance-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.error.maintenance.story.explainer.default')}</p>
      <div class="error-maintenance-story__frame">${renderErrorMaintenance({ htmlId: 'story-error-maintenance-default' })}</div>
    </section>

    <section class="error-maintenance-story__section" aria-labelledby="error-maintenance-section-with-eta">
      <h2 id="error-maintenance-section-with-eta" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.error.maintenance.story.section.with-eta')}</h2>
      <p class="error-maintenance-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.error.maintenance.story.explainer.with-eta')}</p>
      <div class="error-maintenance-story__frame">${renderErrorMaintenance({ htmlId: 'story-error-maintenance-eta', withEta: true })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Errors/Maintenance" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="error-maintenance-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="error-maintenance-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.error-maintenance-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.error-maintenance-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.error-maintenance-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.error-maintenance-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.error-maintenance-story__explainer { max-inline-size: 70ch; }
.error-maintenance-story__frame { min-block-size: 32rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.error-maintenance-story__frame .cremona-error-shell { min-block-size: 100%; }
.error-maintenance-dark-wrap { background: var(--color-bg-base); }
</style>
