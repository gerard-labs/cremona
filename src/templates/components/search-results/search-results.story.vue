<!--
  Search-Results story — 4 viewport variants.
  Sections : default-with-results · with-descriptions · empty-state · mixed-element-forms.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

/**
 * Render a single Item Ring 1 row, with optional `as` element + href +
 * description + iconLeading + chevron trailing. Mirrors the Item primitive
 * in the curated icon set.
 */
function renderItem({ label, description = null, iconLeading = null, href = null, as = 'a' }) {
  const ariaLabel = label;
  const tag = as === 'a' ? 'a' : 'button';
  const attrs = as === 'a'
    ? `href="${href || '#'}"`
    : `type="button"`;
  const iconL = iconLeading
    ? `<svg class="cremona-icon cremona-item__icon--leading" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-${iconLeading}"/></svg>`
    : '';
  const desc = description
    ? `<span class="cremona-item__description">${description}</span>`
    : '';
  return `
    <${tag} class="cremona-item" ${attrs} aria-label="${ariaLabel}">
      ${iconL}
      <div class="cremona-item__text">
        <span class="cremona-item__label">${label}</span>
        ${desc}
      </div>
      <svg class="cremona-icon cremona-item__icon--trailing" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-chevron-right"/></svg>
    </${tag}>
  `;
}

function renderSearchResults({ query, results, countLabel, showCount = true, empty = false }) {
  const header = showCount
    ? `<header class="cremona-search-results__header">
         <h2 class="cremona-search-results__count">${countLabel}</h2>
       </header>`
    : '';
  const body = empty
    ? `<div class="cremona-search-results__empty">
         <div class="cremona-empty" data-size="md" role="region">
           <div class="cremona-empty__illustration" aria-hidden="true">
             <svg class="cremona-icon cremona-empty__icon" data-size="xl" aria-hidden="true" focusable="false"><use href="#icon-search"/></svg>
           </div>
           <div class="cremona-empty__content">
             <h2 class="cremona-empty__title">${t('theme.search-results.empty.title')}</h2>
             <div class="cremona-empty__body"><p>${t('theme.search-results.empty.body').replace('%s', query)}</p></div>
           </div>
         </div>
       </div>`
    : `<ul class="cremona-search-results__list" role="list">
         ${results.map((r) => `<li class="cremona-search-results__item">${renderItem(r)}</li>`).join('')}
       </ul>`;
  return `
    <section class="cremona-search-results" aria-labelledby="story-search-results-title" data-query="${query}">
      ${header}
      ${body}
    </section>
  `;
}

const defaultResults = [
  { label: t('theme.search-results.story.sample.design-tokens'), iconLeading: 'star', href: '#design-tokens' },
  { label: t('theme.search-results.story.sample.color-system'), iconLeading: 'eye', href: '#color-system' },
  { label: t('theme.search-results.story.sample.typography-scale'), iconLeading: 'edit-3', href: '#typography-scale' },
  { label: t('theme.search-results.story.sample.motion-tokens'), iconLeading: 'option', href: '#motion-tokens' },
];

const resultsWithDescriptions = [
  {
    label: t('theme.search-results.story.sample.dashboard-page'),
    description: t('theme.search-results.story.sample.dashboard-desc'),
    iconLeading: 'menu',
    href: '#dashboard',
  },
  {
    label: t('theme.search-results.story.sample.settings-profile'),
    description: t('theme.search-results.story.sample.settings-profile-desc'),
    iconLeading: 'settings',
    href: '#settings/profile',
  },
  {
    label: t('theme.search-results.story.sample.user-marie'),
    description: t('theme.search-results.story.sample.user-marie-desc'),
    iconLeading: 'user',
    href: '#users/marie-dupont',
  },
];

const mixedResults = [
  { label: t('theme.search-results.story.sample.link-result'), iconLeading: 'arrow-right', href: '#link-target' },
  { label: t('theme.search-results.story.sample.button-result'), iconLeading: 'plus', as: 'button' },
  { label: t('theme.search-results.story.sample.link-with-desc'), description: t('theme.search-results.story.sample.link-with-desc-text'), iconLeading: 'eye', href: '#link-2' },
];

const bodyHtml = `
  <section class="search-results-story" aria-labelledby="search-results-story-title">
    <header class="search-results-story__header">
      <h1 id="search-results-story-title">${t('theme.search-results.story.title')}</h1>
      <p>${t('theme.search-results.story.subtitle')}</p>
    </header>

    <section class="search-results-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.search-results.story.section.default')}</h2>
      <p class="search-results-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.search-results.story.explainer.default')}</p>
      <div class="search-results-story__frame">
        ${renderSearchResults({
          query: 'design',
          results: defaultResults,
          countLabel: t('theme.search-results.story.count.4-results').replace('%s', 'design'),
        })}
      </div>
    </section>

    <section class="search-results-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.search-results.story.section.with-descriptions')}</h2>
      <p class="search-results-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.search-results.story.explainer.with-descriptions')}</p>
      <div class="search-results-story__frame">
        ${renderSearchResults({
          query: 'utilisateur',
          results: resultsWithDescriptions,
          countLabel: t('theme.search-results.story.count.3-results').replace('%s', 'utilisateur'),
        })}
      </div>
    </section>

    <section class="search-results-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.search-results.story.section.mixed-elements')}</h2>
      <p class="search-results-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.search-results.story.explainer.mixed-elements')}</p>
      <div class="search-results-story__frame">
        ${renderSearchResults({
          query: 'mixed',
          results: mixedResults,
          countLabel: t('theme.search-results.story.count.3-results').replace('%s', 'mixed'),
        })}
      </div>
    </section>

    <section class="search-results-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.search-results.story.section.empty')}</h2>
      <p class="search-results-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.search-results.story.explainer.empty')}</p>
      <div class="search-results-story__frame">
        ${renderSearchResults({
          query: 'xyznonexistent',
          results: [],
          countLabel: t('theme.search-results.story.count.zero-results').replace('%s', 'xyznonexistent'),
          empty: true,
        })}
      </div>
    </section>

  </section>
`;
</script>

<template>
  <Story title="Patterns/Search-Results" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="search-results-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="search-results-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.search-results-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.search-results-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.search-results-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.search-results-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.search-results-story__explainer { max-inline-size: 70ch; }
.search-results-story__frame { padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); background: var(--color-bg-base); }
.search-results-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
