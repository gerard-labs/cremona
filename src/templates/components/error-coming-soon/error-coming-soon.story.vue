<!--
  Error-ComingSoon story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (2): default (hero sparkles + primary "M'avertir")
              · with-back (+ secondary "Retour à l'accueil").

  Brand-feel marketing pattern. Hero SVG inline (sparkles motif).
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160" aria-hidden="true" class="cremona-error-coming-soon__hero"><defs><linearGradient id="s-ecs-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--color-primary-soft)" stop-opacity="0.95"/><stop offset="1" stop-color="var(--color-accent-soft)" stop-opacity="0.85"/></linearGradient></defs><rect x="20" y="30" rx="14" ry="14" width="160" height="100" fill="url(#s-ecs-grad)" stroke="var(--color-border-default)" stroke-width="2"/><g transform="translate(100 80)" fill="var(--color-primary)" stroke="var(--color-primary-foreground)" stroke-width="1.5" stroke-linejoin="round"><polygon points="0,-24 7,-7 24,-7 10,4 16,21 0,11 -16,21 -10,4 -24,-7 -7,-7"/></g><g transform="translate(150 55)" fill="var(--color-accent)" opacity="0.85"><polygon points="0,-10 3,-3 10,-3 4,2 6,9 0,5 -6,9 -4,2 -10,-3 -3,-3"/></g><g transform="translate(55 115)" fill="var(--color-accent)" opacity="0.7"><polygon points="0,-7 2,-2 7,-2 3,1 4,6 0,3 -4,6 -3,1 -7,-2 -2,-2"/></g></svg>`;

function renderErrorComingSoon({ htmlId, withBack = false }) {
  const titleId = `${htmlId}-title`;
  const secondaryHtml = withBack
    ? `<a class="cremona-button" data-variant="ghost" data-size="md" href="/"><span class="cremona-button__label">${t('theme.error.coming-soon.secondary-cta')}</span></a>`
    : '';
  return `
    <main class="cremona-error-shell cremona-error-shell--hero cremona-error-coming-soon" data-variant="hero" id="${htmlId}">
      <section class="cremona-error-shell__panel">
        <div class="cremona-empty" data-size="lg" role="region" aria-labelledby="${titleId}">
          <div class="cremona-empty__illustration" aria-hidden="true">${heroSvg}</div>
          <div class="cremona-empty__content">
            <h1 id="${titleId}" class="cremona-empty__title">${t('theme.error.coming-soon.title')}</h1>
            <div class="cremona-empty__body"><p>${t('theme.error.coming-soon.body')}</p></div>
            <div class="cremona-empty__actions">
              <a class="cremona-button" data-variant="primary" data-size="md" href="#subscribe"><span class="cremona-button__label">${t('theme.error.coming-soon.primary-cta')}</span></a>
              ${secondaryHtml}
            </div>
          </div>
        </div>
      </section>
    </main>
  `;
}

const bodyHtml = `
  <section class="error-cs-story" data-testid="error-cs-root">
    <header class="error-cs-story__header">
      <h1>${t('theme.error.coming-soon.story.title')}</h1>
      <p>${t('theme.error.coming-soon.story.subtitle')}</p>
    </header>

    <section class="error-cs-story__section" aria-labelledby="error-cs-section-default">
      <h2 id="error-cs-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.error.coming-soon.story.section.default')}</h2>
      <p class="error-cs-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.error.coming-soon.story.explainer.default')}</p>
      <div class="error-cs-story__frame">${renderErrorComingSoon({ htmlId: 'story-error-cs-default' })}</div>
    </section>

    <section class="error-cs-story__section" aria-labelledby="error-cs-section-with-back">
      <h2 id="error-cs-section-with-back" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.error.coming-soon.story.section.with-back')}</h2>
      <p class="error-cs-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.error.coming-soon.story.explainer.with-back')}</p>
      <div class="error-cs-story__frame">${renderErrorComingSoon({ htmlId: 'story-error-cs-back', withBack: true })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Errors/Coming Soon" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="error-cs-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="error-cs-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.error-cs-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.error-cs-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.error-cs-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.error-cs-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.error-cs-story__explainer { max-inline-size: 70ch; }
.error-cs-story__frame { min-block-size: 32rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.error-cs-story__frame .cremona-error-shell { min-block-size: 100%; }
.error-cs-dark-wrap { background: var(--color-bg-base); }
</style>
