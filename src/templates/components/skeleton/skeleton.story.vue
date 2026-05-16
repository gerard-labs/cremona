<!--
  Skeleton story — 4 viewport variants. Shapes (rect/circle/text), sizes,
  multi-line text group, and a "real-card-shaped" composite demo.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderSkeleton({ shape = 'rect', width, height, count = 1, className }) {
  const classes = ['theme-skeleton', `theme-skeleton--${shape}`];
  if (className) classes.push(className);
  const style = [];
  if (width) style.push(`inline-size: ${width}`);
  if (height) style.push(`block-size: ${height}`);
  const styleAttr = style.length ? ` style="${style.join('; ')}"` : '';
  if (shape === 'text' && count > 1) {
    const lines = Array.from({ length: count }, () =>
      `<div class="${classes.join(' ')}" data-shape="${shape}"${styleAttr}></div>`,
    ).join('');
    return `<div class="theme-skeleton-group" aria-hidden="true">${lines}</div>`;
  }
  return `<div class="${classes.join(' ')}" data-shape="${shape}"${styleAttr} aria-hidden="true"></div>`;
}

const bodyHtml = `
  <section class="skeleton-story" data-testid="skeleton-root">
    <header class="skeleton-story__header">
      <h1>${t('theme.skeleton.story.title')}</h1>
      <p>${t('theme.skeleton.story.subtitle')}</p>
    </header>

    <section class="skeleton-story__section" aria-labelledby="skeleton-section-shapes">
      <h2 id="skeleton-section-shapes" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.skeleton.story.section.shapes')}</h2>
      <div class="skeleton-story__row">
        <div class="skeleton-story__demo">
          <span class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.skeleton.story.label.rect')}</span>
          ${renderSkeleton({ shape: 'rect', width: '160px', height: '40px' })}
        </div>
        <div class="skeleton-story__demo">
          <span class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.skeleton.story.label.circle')}</span>
          ${renderSkeleton({ shape: 'circle', width: '48px' })}
        </div>
        <div class="skeleton-story__demo">
          <span class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.skeleton.story.label.text')}</span>
          ${renderSkeleton({ shape: 'text', width: '160px' })}
        </div>
      </div>
    </section>

    <section class="skeleton-story__section" aria-labelledby="skeleton-section-sizes">
      <h2 id="skeleton-section-sizes" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.skeleton.story.section.sizes')}</h2>
      <div class="skeleton-story__stack">
        <div class="skeleton-story__demo">
          <span class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.skeleton.story.label.tiny')}</span>
          ${renderSkeleton({ shape: 'rect', width: '60px', height: '12px' })}
        </div>
        <div class="skeleton-story__demo">
          <span class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.skeleton.story.label.medium')}</span>
          ${renderSkeleton({ shape: 'rect', width: '240px', height: '20px' })}
        </div>
        <div class="skeleton-story__demo">
          <span class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.skeleton.story.label.large')}</span>
          ${renderSkeleton({ shape: 'rect', width: '360px', height: '48px' })}
        </div>
      </div>
    </section>

    <section class="skeleton-story__section" aria-labelledby="skeleton-section-paragraph">
      <h2 id="skeleton-section-paragraph" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.skeleton.story.section.paragraph')}</h2>
      <div class="skeleton-story__paragraph">
        ${renderSkeleton({ shape: 'text', count: 4 })}
      </div>
    </section>

    <section class="skeleton-story__section" aria-labelledby="skeleton-section-composite">
      <h2 id="skeleton-section-composite" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.skeleton.story.section.composite')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.skeleton.story.composite-explainer')}</p>
      <div class="skeleton-story__card" role="status" aria-busy="true">
        <div class="skeleton-story__card-head">
          ${renderSkeleton({ shape: 'circle', width: '40px' })}
          <div class="skeleton-story__card-titles">
            ${renderSkeleton({ shape: 'text', width: '120px' })}
            ${renderSkeleton({ shape: 'text', width: '80px' })}
          </div>
        </div>
        ${renderSkeleton({ shape: 'rect', height: '120px' })}
        ${renderSkeleton({ shape: 'text', count: 3 })}
        <span class="theme-sr-only">${t('theme.skeleton.story.aria-busy-message')}</span>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Skeleton" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="skeleton-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="skeleton-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.skeleton-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.skeleton-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.skeleton-story__header p { font: var(--typography-body); color: var(--color-text-secondary); }
.skeleton-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.skeleton-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-4); align-items: end; }
.skeleton-story__stack { display: grid; gap: var(--spacing-3); }
.skeleton-story__demo { display: grid; gap: var(--spacing-1); }
.skeleton-story__paragraph { max-inline-size: 480px; }
.skeleton-story__card { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-sunken); border-radius: var(--radius-md); max-inline-size: 360px; }
.skeleton-story__card-head { display: flex; gap: var(--spacing-3); align-items: center; }
.skeleton-story__card-titles { display: grid; gap: var(--spacing-1); flex: 1; }
.skeleton-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
