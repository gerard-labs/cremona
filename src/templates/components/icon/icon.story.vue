<!--
  Icon story — 4 viewport variants (Light/Dark × LTR/RTL).

  The 30 curated SVGs are inlined at build time via Vite `import.meta.glob`
  with `{ query: '?raw', import: 'default', eager: true }`. The story
  mirrors the Twig template's rendering logic (size scale, bidi whitelist,
  decorative vs labeled aria handling) so the visual matches what the
  Twig consumer would emit.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

// Glob all 30 SVGs as raw strings at build time.
const ICON_MODULES = import.meta.glob('../../../assets/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const ICONS = Object.fromEntries(
  Object.entries(ICON_MODULES).map(([path, raw]) => [
    path.match(/([^/]+)\.svg$/)[1],
    raw,
  ]),
);

const ICON_NAMES = Object.keys(ICONS).sort();
const BIDI_ICONS = ['arrow-left', 'arrow-right', 'chevron-left', 'chevron-right', 'corner-down-left'];
const NON_BIDI_DEMO = ['check', 'x', 'star', 'heart', 'bell'];
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];

function renderIcon({ name, label, size, decorative, className }) {
  const isBidi = BIDI_ICONS.includes(name);
  const classes = ['cremona-icon'];
  if (isBidi) classes.push('cremona-icon-bidi');
  if (className) classes.push(className);
  const effectivelyDecorative = decorative || !label;
  const ariaAttrs = effectivelyDecorative
    ? 'aria-hidden="true" role="presentation"'
    : `role="img" aria-label="${label}"`;
  const svg = ICONS[name] ?? '';
  return `<span class="${classes.join(' ')}" data-icon="${name}" data-size="${size || 'md'}" ${ariaAttrs}>${svg}</span>`;
}

function cell(name, decorative = true) {
  return `
    <div class="icon-story__cell">
      ${renderIcon({ name, decorative, size: 'lg' })}
      <code class="icon-story__cellname">${name}</code>
    </div>
  `;
}

const bodyHtml = `
  <section class="icon-story" data-testid="icon-root">
    <header class="icon-story__header">
      <h1>${t('theme.icon.story.title')}</h1>
      <p>${t('theme.icon.story.subtitle')}</p>
    </header>

    <section class="icon-story__section" aria-labelledby="icon-section-inventory">
      <h2 id="icon-section-inventory" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.icon.story.section.inventory')}</h2>
      <div class="icon-story__grid">
        ${ICON_NAMES.map((n) => cell(n)).join('')}
      </div>
    </section>

    <section class="icon-story__section" aria-labelledby="icon-section-sizes">
      <h2 id="icon-section-sizes" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.icon.story.section.sizes')}</h2>
      <div class="icon-story__row">
        ${SIZES.map((s) => `
          <div class="icon-story__cell">
            ${renderIcon({ name: 'user', decorative: true, size: s })}
            <code class="icon-story__cellname">${s}</code>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="icon-story__section" aria-labelledby="icon-section-labeled">
      <h2 id="icon-section-labeled" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.icon.story.section.labeled')}</h2>
      <div class="icon-story__row">
        ${renderIcon({ name: 'user', size: 'lg', label: t('theme.icon.story.label.profile') })}
        ${renderIcon({ name: 'search', size: 'lg', label: t('theme.icon.story.label.search') })}
        ${renderIcon({ name: 'bell', size: 'lg', label: t('theme.icon.story.label.notifications') })}
        ${renderIcon({ name: 'settings', size: 'lg', label: t('theme.icon.story.label.settings') })}
      </div>
    </section>

    <section class="icon-story__section" aria-labelledby="icon-section-decorative">
      <h2 id="icon-section-decorative" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.icon.story.section.decorative')}</h2>
      <p class="cremona-typography" data-variant="body">
        ${renderIcon({ name: 'check', decorative: true, size: 'sm', className: 'icon-story__inline' })}<span>${t('theme.icon.story.demo-decorative')}</span>
      </p>
    </section>

    <section class="icon-story__section" aria-labelledby="icon-section-rtl">
      <h2 id="icon-section-rtl" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.icon.story.section.rtl-flip')}</h2>
      <p class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.icon.story.rtl-explainer')}</p>
      <div class="icon-story__row">
        ${BIDI_ICONS.map((n) => cell(n)).join('')}
      </div>
      <p class="cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.icon.story.rtl-non-bidi')}</p>
      <div class="icon-story__row">
        ${NON_BIDI_DEMO.map((n) => cell(n)).join('')}
      </div>
    </section>

    <section class="icon-story__section" aria-labelledby="icon-section-color">
      <h2 id="icon-section-color" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.icon.story.section.color')}</h2>
      <div class="icon-story__row">
        <span class="icon-story__color-swatch" style="color: var(--color-primary);">${renderIcon({ name: 'heart', decorative: true, size: 'lg' })}</span>
        <span class="icon-story__color-swatch" style="color: var(--color-success);">${renderIcon({ name: 'check', decorative: true, size: 'lg' })}</span>
        <span class="icon-story__color-swatch" style="color: var(--color-warning);">${renderIcon({ name: 'alert-triangle', decorative: true, size: 'lg' })}</span>
        <span class="icon-story__color-swatch" style="color: var(--color-danger);">${renderIcon({ name: 'alert-circle', decorative: true, size: 'lg' })}</span>
        <span class="icon-story__color-swatch" style="color: var(--color-info);">${renderIcon({ name: 'info', decorative: true, size: 'lg' })}</span>
        <span class="icon-story__color-swatch" style="color: var(--color-text-tertiary);">${renderIcon({ name: 'eye', decorative: true, size: 'lg' })}</span>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Icon" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR">
      <div dir="ltr" v-html="bodyHtml"></div>
    </Variant>
    <Variant title="Light · RTL">
      <div dir="rtl" v-html="bodyHtml"></div>
    </Variant>
    <Variant title="Dark · LTR">
      <div data-theme="dark" class="icon-dark-wrap">
        <div dir="ltr" v-html="bodyHtml"></div>
      </div>
    </Variant>
    <Variant title="Dark · RTL">
      <div data-theme="dark" class="icon-dark-wrap">
        <div dir="rtl" v-html="bodyHtml"></div>
      </div>
    </Variant>
  </Story>
</template>

<style>
.icon-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.icon-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.icon-story__header p { font: var(--typography-body); color: var(--color-text-secondary); }
.icon-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.icon-story__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: var(--spacing-3); }
.icon-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-4); align-items: end; }
.icon-story__cell { display: grid; gap: var(--spacing-1); justify-items: center; padding: var(--spacing-2); background: var(--color-bg-sunken); border-radius: var(--radius-sm); }
.icon-story__cellname { font: var(--typography-code); color: var(--color-text-tertiary); }
.icon-story__cell--bidi { background: var(--color-primary-soft); color: var(--color-primary-soft-foreground); }
.icon-story__inline { vertical-align: -2px; margin-inline-end: var(--spacing-1); }
.icon-story__color-swatch { display: inline-flex; padding: var(--spacing-2); background: var(--color-bg-elevated); border-radius: var(--radius-sm); }
.icon-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
