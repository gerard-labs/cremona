<!--
  AspectRatio story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5): common ratios · object-fit modifiers · with picture/srcset
                · with iframe (video embed) · skeleton fallback (no content).

  Pure-CSS via native aspect-ratio property. Zero Stimulus. Zero polyfill.

  Visual baselines bake the box dimensions + content fitting. Inline
  images use 1x1 transparent SVGs sized via the AspectRatio (so the
  baseline doesn't depend on network fetches).
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

// 1x1 transparent SVG — sized by the wrapper, validates the box's
// inline-size / block-size relationship without a network round-trip.
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="ar-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="var(--color-primary)" stop-opacity="0.4"/>
      <stop offset="1" stop-color="var(--color-accent)" stop-opacity="0.4"/>
    </linearGradient>
    <pattern id="ar-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="1.5" fill="var(--color-primary)" fill-opacity="0.3"/>
    </pattern>
  </defs>
  <rect x="0" y="0" width="200" height="100" fill="url(#ar-grad)"/>
  <rect x="0" y="0" width="200" height="100" fill="url(#ar-pattern)"/>
</svg>`;

function renderAspectRatio(props = {}, innerHtml = '') {
  const { ratio = '16/9', fit = 'cover', className = '' } = props;
  const classes = ['cremona-aspect-ratio'];
  if (fit !== 'cover') classes.push(`cremona-aspect-ratio--fit-${fit}`);
  if (className) classes.push(className);
  return `<div class="${classes.join(' ')}" style="--cremona-aspect-ratio: ${ratio};">${innerHtml}</div>`;
}

function block(html, label) {
  return `
    <div class="aspect-story__block">
      ${label ? `<code class="aspect-story__blocklabel">${label}</code>` : ''}
      <div class="aspect-story__blockcontent">${html}</div>
    </div>
  `;
}

const COMMON_RATIOS = [
  { ratio: '16/9',   label: '16/9 (vidéo HD)' },
  { ratio: '4/3',    label: '4/3 (vidéo SD / photo classique)' },
  { ratio: '1/1',    label: '1/1 (carré — Instagram, avatar)' },
  { ratio: '3/2',    label: '3/2 (35 mm photo)' },
  { ratio: '1.91/1', label: '1.91/1 (Open Graph link preview)' },
  { ratio: '9/16',   label: '9/16 (portrait — Stories)' },
  { ratio: '21/9',   label: '21/9 (cinemascope)' },
];

const bodyHtml = `
  <section class="aspect-story" data-testid="aspect-ratio-root">
    <header class="aspect-story__header">
      <h1>${t('theme.aspect-ratio.story.title')}</h1>
      <p>${t('theme.aspect-ratio.story.subtitle')}</p>
    </header>

    <section class="aspect-story__section" aria-labelledby="ar-section-common">
      <h2 id="ar-section-common" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.aspect-ratio.story.section.common')}</h2>
      <p class="aspect-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.aspect-ratio.story.explainer.common')}</p>
      <div class="aspect-story__grid">
        ${COMMON_RATIOS.map(({ ratio, label }) => block(renderAspectRatio({ ratio }, PLACEHOLDER_SVG), label)).join('')}
      </div>
    </section>

    <section class="aspect-story__section" aria-labelledby="ar-section-fit">
      <h2 id="ar-section-fit" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.aspect-ratio.story.section.fit')}</h2>
      <p class="aspect-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.aspect-ratio.story.explainer.fit')}</p>
      <div class="aspect-story__grid">
        ${block(renderAspectRatio({ ratio: '16/9', fit: 'cover'   }, PLACEHOLDER_SVG), 'cover (défaut)')}
        ${block(renderAspectRatio({ ratio: '16/9', fit: 'contain' }, PLACEHOLDER_SVG), 'contain')}
        ${block(renderAspectRatio({ ratio: '16/9', fit: 'fill'    }, PLACEHOLDER_SVG), 'fill')}
        ${block(renderAspectRatio({ ratio: '16/9', fit: 'scale-down' }, PLACEHOLDER_SVG), 'scale-down')}
      </div>
    </section>

    <section class="aspect-story__section" aria-labelledby="ar-section-iframe">
      <h2 id="ar-section-iframe" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.aspect-ratio.story.section.iframe')}</h2>
      <p class="aspect-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.aspect-ratio.story.explainer.iframe')}</p>
      <div class="aspect-story__grid">
        ${block(renderAspectRatio({ ratio: '16/9' }, `<div role="img" aria-label="${t('theme.aspect-ratio.story.iframe-placeholder')}" style="background: linear-gradient(135deg, var(--color-bg-sunken), var(--color-bg-elevated)); display: flex; align-items: center; justify-content: center; color: var(--color-text-tertiary); font-family: var(--font-mono); font-size: var(--font-size-sm);">&lt;iframe&gt;</div>`), 'iframe embed 16/9')}
      </div>
    </section>

    <section class="aspect-story__section" aria-labelledby="ar-section-empty">
      <h2 id="ar-section-empty" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.aspect-ratio.story.section.empty')}</h2>
      <p class="aspect-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.aspect-ratio.story.explainer.empty')}</p>
      <div class="aspect-story__grid">
        ${block(renderAspectRatio({ ratio: '1/1' }, `<span class="cremona-skeleton cremona-skeleton--rect" data-shape="rect" aria-hidden="true"></span>`), 'avatar 1/1 (skeleton)')}
        ${block(renderAspectRatio({ ratio: '4/3' }, `<span class="cremona-skeleton cremona-skeleton--rect" data-shape="rect" aria-hidden="true"></span>`), 'cover 4/3 (skeleton)')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/AspectRatio" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="aspect-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="aspect-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.aspect-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.aspect-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.aspect-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.aspect-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.aspect-story__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--spacing-4); }
.aspect-story__block { display: grid; gap: var(--spacing-2); }
.aspect-story__blocklabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.aspect-story__blockcontent { min-inline-size: 0; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm); }
.aspect-story__explainer { max-inline-size: 70ch; }
.aspect-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
