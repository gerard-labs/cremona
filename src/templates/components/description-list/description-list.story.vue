<!--
  DescriptionList story — 4 viewport variants (Light/Dark × LTR/RTL).
  Pure-semantic <dl><dt><dd> primitive ; 0 controller.

  Sections:
   1. Stacked layout (default) — profile data
   2. Side-by-side layout — same data, single grid row per pair
   3. Rich content — definitions embed a Badge inline (raw HTML)
   4. Long terms wrapping — exercises text expansion
   5. Combined inside a Card — typical settings panel layout
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderDL({ items, layout = 'stacked', className }) {
  const classes = ['theme-description-list'];
  if (className) classes.push(className);
  const rows = items
    .map(
      (item) =>
        `<dt class="theme-description-list__term">${item.term}</dt>` +
        `<dd class="theme-description-list__definition">${item.definition}</dd>`,
    )
    .join('');
  return `<dl class="${classes.join(' ')}" data-layout="${layout}">${rows}</dl>`;
}

function renderBadge({ variant, label, soft = false }) {
  const softAttr = soft ? ' data-soft="true"' : '';
  return `<span class="theme-badge" data-variant="${variant}" data-size="sm"${softAttr}><span>${label}</span></span>`;
}

const PROFILE_ITEMS = [
  { term: t('theme.description-list.story.profile.term.email'),    definition: 'marie.dupont@samurai.fr' },
  { term: t('theme.description-list.story.profile.term.plan'),     definition: t('theme.description-list.story.profile.def.plan') },
  { term: t('theme.description-list.story.profile.term.members'),  definition: '12' },
  { term: t('theme.description-list.story.profile.term.joined'),   definition: '12 mai 2026' },
];

const RICH_ITEMS = [
  { term: t('theme.description-list.story.rich.term.status'),  definition: renderBadge({ variant: 'success', label: t('theme.description-list.story.rich.def.active'), soft: true }) },
  { term: t('theme.description-list.story.rich.term.role'),    definition: renderBadge({ variant: 'primary', label: t('theme.description-list.story.rich.def.admin') }) },
  { term: t('theme.description-list.story.rich.term.email'),   definition: 'admin@samurai.fr' },
  { term: t('theme.description-list.story.rich.term.team'),    definition: t('theme.description-list.story.rich.def.engineering') },
];

const LONG_TERMS = [
  { term: t('theme.description-list.story.long.term.full-legal'),       definition: 'Marie Camille Antoinette Dupont' },
  { term: t('theme.description-list.story.long.term.acceptance-date'),  definition: t('theme.description-list.story.long.def.never') },
  { term: t('theme.description-list.story.long.term.preferred-locale'), definition: 'fr-FR' },
];

const bodyHtml = `
  <section class="dl-story" data-testid="description-list-root">
    <header class="dl-story__header">
      <h1>${t('theme.description-list.story.title')}</h1>
      <p>${t('theme.description-list.story.subtitle')}</p>
    </header>

    <section class="dl-story__section" aria-labelledby="dl-section-stacked">
      <h2 id="dl-section-stacked" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.description-list.story.section.stacked')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.description-list.story.section.stacked-explainer')}</p>
      <div class="dl-story__panel">
        ${renderDL({ items: PROFILE_ITEMS, layout: 'stacked' })}
      </div>
    </section>

    <section class="dl-story__section" aria-labelledby="dl-section-side-by-side">
      <h2 id="dl-section-side-by-side" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.description-list.story.section.side-by-side')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.description-list.story.section.side-by-side-explainer')}</p>
      <div class="dl-story__panel">
        ${renderDL({ items: PROFILE_ITEMS, layout: 'side-by-side' })}
      </div>
    </section>

    <section class="dl-story__section" aria-labelledby="dl-section-rich">
      <h2 id="dl-section-rich" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.description-list.story.section.rich')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.description-list.story.section.rich-explainer')}</p>
      <div class="dl-story__panel">
        ${renderDL({ items: RICH_ITEMS, layout: 'side-by-side' })}
      </div>
    </section>

    <section class="dl-story__section" aria-labelledby="dl-section-long-terms">
      <h2 id="dl-section-long-terms" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.description-list.story.section.long-terms')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.description-list.story.section.long-terms-explainer')}</p>
      <div class="dl-story__panel dl-story__panel--narrow">
        ${renderDL({ items: LONG_TERMS, layout: 'side-by-side' })}
      </div>
    </section>

    <section class="dl-story__section" aria-labelledby="dl-section-card">
      <h2 id="dl-section-card" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.description-list.story.section.card')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.description-list.story.section.card-explainer')}</p>
      <article class="theme-card">
        <header class="theme-card__header">
          <h3 class="theme-typography" data-variant="h3">${t('theme.description-list.story.card.title')}</h3>
        </header>
        <div class="theme-card__body">
          ${renderDL({ items: PROFILE_ITEMS, layout: 'side-by-side' })}
        </div>
      </article>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/DescriptionList" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="dl-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="dl-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.dl-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.dl-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.dl-story__header p { font: var(--typography-body); color: var(--color-text-secondary); }
.dl-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.dl-story__panel { padding: var(--spacing-4); background: var(--color-bg-sunken); border-radius: var(--radius-sm); }
.dl-story__panel--narrow { max-inline-size: 320px; }
.dl-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
