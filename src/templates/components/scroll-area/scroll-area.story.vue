<!--
  ScrollArea story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5):
    1. Vertical scroll — orientation=vertical, maxBlockSize=240px,
       Lorem-ipsum content overflowing.
    2. Horizontal scroll — orientation=horizontal, content with explicit
       inline-size > parent.
    3. Both axes — orientation=both, maxBlockSize + maxInlineSize bounded,
       wide + tall content.
    4. Scrollbar sizes — sm / md / lg side-by-side.
    5. Composed inside a Card — ScrollArea wrapping a long list of Items.

  Per OQ-34 "natif d'abord" + pure-CSS design: 0 Stimulus, 0 ResizeObserver
  at primitive layer. Custom-scrollbar visuals via ::-webkit-scrollbar +
  Firefox-native scrollbar-* properties.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function S(key) { return t('theme.scroll-area.story.' + key); }

function loremLong() {
  return [
    S('lorem.1'), S('lorem.2'), S('lorem.3'), S('lorem.4'), S('lorem.5'),
    S('lorem.6'), S('lorem.7'), S('lorem.8'),
  ].map((p) => `<p class="theme-typography" data-variant="body">${p}</p>`).join('');
}

function wideContent() {
  // 8 columns of 200 px = 1600 px content, will overflow inline.
  const cols = Array.from({ length: 8 }, (_, i) =>
    `<div class="sa-story__col">
      <h3 class="theme-typography" data-variant="overline" data-color="tertiary">${S('col.label')} ${i + 1}</h3>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${S('lorem.short')}</p>
    </div>`
  );
  return `<div class="sa-story__wide">${cols.join('')}</div>`;
}

function scrollArea({ orientation = 'both', size = 'md', maxBlockSize = null, maxInlineSize = null, content = '', className = '' }) {
  const style = [];
  if (maxBlockSize) style.push(`max-block-size:${maxBlockSize}`);
  if (maxInlineSize) style.push(`max-inline-size:${maxInlineSize}`);
  const styleAttr = style.length ? ` style="${style.join(';')}"` : '';
  return `<div class="theme-scroll-area ${className}" data-orientation="${orientation}" data-size="${size}"${styleAttr}>${content}</div>`;
}

function itemList() {
  const items = [];
  for (let i = 1; i <= 25; i++) {
    items.push(`<div class="theme-item">
      <div class="theme-item__text"><span class="theme-item__label">${S('item.label')} #${i}</span></div>
    </div>`);
  }
  return items.join('');
}

const bodyHtml = `
  <section class="sa-story" data-testid="scroll-area-root">
    <header class="sa-story__header">
      <h1>${t('theme.scroll-area.story.title')}</h1>
      <p>${t('theme.scroll-area.story.subtitle')}</p>
    </header>

    <section class="sa-story__section" aria-labelledby="sa-section-vertical">
      <h2 id="sa-section-vertical" class="theme-typography" data-variant="overline" data-color="tertiary">${S('section.vertical')}</h2>
      <p class="sa-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${S('explainer.vertical')}</p>
      ${scrollArea({
        orientation: 'vertical',
        maxBlockSize: '240px',
        content: loremLong(),
      })}
    </section>

    <section class="sa-story__section" aria-labelledby="sa-section-horizontal">
      <h2 id="sa-section-horizontal" class="theme-typography" data-variant="overline" data-color="tertiary">${S('section.horizontal')}</h2>
      <p class="sa-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${S('explainer.horizontal')}</p>
      ${scrollArea({
        orientation: 'horizontal',
        content: wideContent(),
      })}
    </section>

    <section class="sa-story__section" aria-labelledby="sa-section-both">
      <h2 id="sa-section-both" class="theme-typography" data-variant="overline" data-color="tertiary">${S('section.both')}</h2>
      <p class="sa-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${S('explainer.both')}</p>
      ${scrollArea({
        orientation: 'both',
        maxBlockSize: '200px',
        maxInlineSize: '480px',
        content: `<div class="sa-story__big">${loremLong()}${wideContent()}</div>`,
      })}
    </section>

    <section class="sa-story__section" aria-labelledby="sa-section-sizes">
      <h2 id="sa-section-sizes" class="theme-typography" data-variant="overline" data-color="tertiary">${S('section.sizes')}</h2>
      <p class="sa-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${S('explainer.sizes')}</p>
      <div class="sa-story__sizes">
        <div>
          <p class="theme-typography" data-variant="caption" data-color="tertiary">${S('size.sm')}</p>
          ${scrollArea({ orientation: 'vertical', size: 'sm', maxBlockSize: '180px', content: loremLong() })}
        </div>
        <div>
          <p class="theme-typography" data-variant="caption" data-color="tertiary">${S('size.md')}</p>
          ${scrollArea({ orientation: 'vertical', size: 'md', maxBlockSize: '180px', content: loremLong() })}
        </div>
        <div>
          <p class="theme-typography" data-variant="caption" data-color="tertiary">${S('size.lg')}</p>
          ${scrollArea({ orientation: 'vertical', size: 'lg', maxBlockSize: '180px', content: loremLong() })}
        </div>
      </div>
    </section>

    <section class="sa-story__section" aria-labelledby="sa-section-in-card">
      <h2 id="sa-section-in-card" class="theme-typography" data-variant="overline" data-color="tertiary">${S('section.in-card')}</h2>
      <p class="sa-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${S('explainer.in-card')}</p>
      <article class="theme-card">
        <header class="theme-card__header"><h3 class="theme-typography" data-variant="h3">${S('card.title')}</h3></header>
        <div class="theme-card__body" style="padding:0;">
          ${scrollArea({ orientation: 'vertical', maxBlockSize: '280px', content: itemList() })}
        </div>
      </article>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/ScrollArea" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="sa-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="sa-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.sa-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.sa-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.sa-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.sa-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.sa-story__explainer { max-inline-size: 70ch; }
.sa-story__wide { display: flex; gap: var(--spacing-3); inline-size: 1600px; padding: var(--spacing-3); }
.sa-story__col { flex: 0 0 200px; padding: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); }
.sa-story__big { inline-size: 1200px; }
.sa-story__sizes { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-4); }
.sa-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
.theme-scroll-area p { padding-inline: var(--spacing-3); padding-block: var(--spacing-1); margin: 0; }
</style>
