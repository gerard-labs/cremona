<!--
  Card story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (7): default · with-slots · variants · hoverable · with-divider
                · composition (Card + AspectRatio / Card + Badge) · long content.

  Zero Stimulus controller. The hoverable affordance is pure CSS.
  Composition examples demonstrate the kit's compounding doctrine — Card
  works seamlessly with AspectRatio (for cover-image cards), Badge
  (for status cards), and other Ring 1 primitives.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderCard({ variant = 'surface', hoverable = false, divider = false }, slots = {}) {
  const { header = '', body = '', footer = '' } = slots;
  const classes = ['cremona-card'];
  if (variant === 'elevated') classes.push('cremona-card--elevated');
  if (variant === 'subtle') classes.push('cremona-card--subtle');
  if (hoverable) classes.push('cremona-card--hoverable');

  const styleAttr = divider ? `style="--cremona-card-divider: 1px;"` : '';
  const headerHtml = header ? `<header class="cremona-card__header">${header}</header>` : '';
  const bodyHtml = body ? `<div class="cremona-card__body">${body}</div>` : '';
  const footerHtml = footer ? `<footer class="cremona-card__footer">${footer}</footer>` : '';

  return `<article class="${classes.join(' ')}" data-variant="${variant}" ${styleAttr}>${headerHtml}${bodyHtml}${footerHtml}</article>`;
}

function block(html, label) {
  return `
    <div class="card-story__block">
      ${label ? `<code class="card-story__blocklabel">${label}</code>` : ''}
      <div class="card-story__blockcontent">${html}</div>
    </div>
  `;
}

const SAMPLES = {
  kpiTitle: t('theme.card.story.sample.kpi-title'),
  kpiValue: t('theme.card.story.sample.kpi-value'),
  kpiTrend: t('theme.card.story.sample.kpi-trend'),
  articleTitle: t('theme.card.story.sample.article-title'),
  articleBody: t('theme.card.story.sample.article-body'),
  articleReadMore: t('theme.card.story.sample.article-read-more'),
  settingTitle: t('theme.card.story.sample.setting-title'),
  settingBody: t('theme.card.story.sample.setting-body'),
  hoverableTitle: t('theme.card.story.sample.hoverable-title'),
  hoverableBody: t('theme.card.story.sample.hoverable-body'),
  longTitle: t('theme.card.story.sample.long-title'),
  longBody: t('theme.card.story.sample.long-body'),
  statusActive: t('theme.badge.story.label.success'),
  statusNew: t('theme.badge.story.label.primary'),
  coverArticleTitle: t('theme.card.story.sample.cover-title'),
  coverArticleBody: t('theme.card.story.sample.cover-body'),
};

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="card-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="var(--color-primary)" stop-opacity="0.5"/>
      <stop offset="1" stop-color="var(--color-accent)" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="200" height="100" fill="url(#card-grad)"/>
</svg>`;

const bodyHtml = `
  <section class="card-story" data-testid="card-root">
    <header class="card-story__header">
      <h1>${t('theme.card.story.title')}</h1>
      <p>${t('theme.card.story.subtitle')}</p>
    </header>

    <section class="card-story__section" aria-labelledby="card-section-default">
      <h2 id="card-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.card.story.section.default')}</h2>
      <div class="card-story__grid">
        ${block(renderCard({}, { body: `<p>${SAMPLES.articleBody}</p>` }), 'body-only')}
      </div>
    </section>

    <section class="card-story__section" aria-labelledby="card-section-with-slots">
      <h2 id="card-section-with-slots" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.card.story.section.with-slots')}</h2>
      <div class="card-story__grid">
        ${block(renderCard({}, {
          header: `<h3 class="cremona-typography" data-variant="overline" data-color="tertiary">${SAMPLES.kpiTitle}</h3>`,
          body: `<p class="cremona-typography" data-variant="display">${SAMPLES.kpiValue}</p><p class="cremona-typography" data-variant="caption" data-color="tertiary">${SAMPLES.kpiTrend}</p>`,
        }), 'header + body (KPI)')}
        ${block(renderCard({}, {
          header: `<h3 class="cremona-typography" data-variant="h3">${SAMPLES.articleTitle}</h3>`,
          body: `<p>${SAMPLES.articleBody}</p>`,
          footer: `<a href="#" class="cremona-button" data-variant="link" data-size="md"><span class="cremona-button__label">${SAMPLES.articleReadMore}</span></a>`,
        }), 'header + body + footer (article)')}
      </div>
    </section>

    <section class="card-story__section" aria-labelledby="card-section-variants">
      <h2 id="card-section-variants" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.card.story.section.variants')}</h2>
      <p class="card-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.card.story.explainer.variants')}</p>
      <div class="card-story__grid">
        ${block(renderCard({ variant: 'surface' }, { header: `<h3 class="cremona-typography" data-variant="h3">surface</h3>`, body: `<p>${SAMPLES.articleBody}</p>` }), 'surface (défaut)')}
        ${block(renderCard({ variant: 'elevated' }, { header: `<h3 class="cremona-typography" data-variant="h3">elevated</h3>`, body: `<p>${SAMPLES.articleBody}</p>` }), 'elevated')}
        ${block(renderCard({ variant: 'subtle' }, { header: `<h3 class="cremona-typography" data-variant="h3">subtle</h3>`, body: `<p>${SAMPLES.settingBody}</p>` }), 'subtle')}
      </div>
    </section>

    <section class="card-story__section" aria-labelledby="card-section-hoverable">
      <h2 id="card-section-hoverable" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.card.story.section.hoverable')}</h2>
      <p class="card-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.card.story.explainer.hoverable')}</p>
      <div class="card-story__grid">
        ${block(renderCard({ hoverable: true }, {
          header: `<h3 class="cremona-typography" data-variant="h3">${SAMPLES.hoverableTitle}</h3>`,
          body: `<p>${SAMPLES.hoverableBody}</p>`,
        }), 'hoverable surface (passe la souris)')}
      </div>
    </section>

    <section class="card-story__section" aria-labelledby="card-section-divider">
      <h2 id="card-section-divider" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.card.story.section.divider')}</h2>
      <p class="card-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.card.story.explainer.divider')}</p>
      <div class="card-story__grid">
        ${block(renderCard({ divider: true }, {
          header: `<h3 class="cremona-typography" data-variant="h3">${SAMPLES.settingTitle}</h3>`,
          body: `<p>${SAMPLES.settingBody}</p>`,
          footer: `<button class="cremona-button" data-variant="secondary" data-size="sm" type="button"><span class="cremona-button__label">${t('theme.common.actions.save')}</span></button>`,
        }), 'avec divider (--cremona-card-divider: 1px)')}
      </div>
    </section>

    <section class="card-story__section" aria-labelledby="card-section-composition">
      <h2 id="card-section-composition" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.card.story.section.composition')}</h2>
      <p class="card-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.card.story.explainer.composition')}</p>
      <div class="card-story__grid">
        ${block(renderCard({}, {
          body: `<div class="cremona-aspect-ratio" style="--cremona-aspect-ratio: 16/9;">${PLACEHOLDER_SVG}</div><h3 class="cremona-typography" data-variant="h3">${SAMPLES.coverArticleTitle}</h3><p>${SAMPLES.coverArticleBody}</p>`,
        }), 'Card + AspectRatio (cover-image card)')}
        ${block(renderCard({}, {
          header: `<div class="card-story__header-row"><h3 class="cremona-typography" data-variant="h3">${SAMPLES.kpiTitle}</h3><span class="cremona-badge" data-variant="success" data-size="sm"><span>${SAMPLES.statusActive}</span></span></div>`,
          body: `<p class="cremona-typography" data-variant="display">${SAMPLES.kpiValue}</p>`,
        }), 'Card + Badge (status card)')}
      </div>
    </section>

    <section class="card-story__section" aria-labelledby="card-section-long-content">
      <h2 id="card-section-long-content" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.card.story.section.long-content')}</h2>
      <div class="card-story__grid">
        ${block(renderCard({}, {
          header: `<h3 class="cremona-typography" data-variant="h3">${SAMPLES.longTitle}</h3>`,
          body: `<p>${SAMPLES.longBody}</p>`,
        }), 'long title + long body (test +30% FR)')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Card" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="card-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="card-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.card-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.card-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.card-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.card-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.card-story__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--spacing-4); }
.card-story__block { display: grid; gap: var(--spacing-2); }
.card-story__blocklabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.card-story__blockcontent { min-inline-size: 0; }
.card-story__explainer { max-inline-size: 70ch; }
.card-story__header-row { display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-3); }
.card-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
