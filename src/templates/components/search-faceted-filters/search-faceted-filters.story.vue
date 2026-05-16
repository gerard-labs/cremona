<!--
  Search-FacetedFilters story — 4 viewport variants.
  Sections : default-all-groups · pre-selected · range-only · events-log.
-->
<script setup>
import { onMounted } from 'vue';
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot();
  // Wire event log for the events-log section.
  document.addEventListener('faceted-filters:change', (event) => {
    const log = document.querySelector('#faceted-filters-events-log');
    if (!log) return;
    const line = document.createElement('div');
    line.textContent = `change → ${event.detail.changed.name} : ${JSON.stringify(event.detail.state)}`;
    log.prepend(line);
  });
  document.addEventListener('faceted-filters:cleared', (event) => {
    const log = document.querySelector('#faceted-filters-events-log');
    if (!log) return;
    const line = document.createElement('div');
    line.textContent = `cleared → ${JSON.stringify(event.detail.state)}`;
    line.style.color = 'var(--color-text-tertiary)';
    log.prepend(line);
  });
});

function renderCheckbox({ id, name, value, label, checked = false }) {
  return `
    <label class="cremona-checkbox-row" for="${id}">
      <span class="cremona-checkbox-wrap">
        <input type="checkbox" id="${id}" name="${name}" value="${value}" class="cremona-checkbox" ${checked ? 'checked' : ''} />
        <span class="cremona-checkbox__box" aria-hidden="true">
          <svg class="cremona-checkbox__check cremona-icon" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-check"/></svg>
        </span>
      </span>
      <span class="cremona-checkbox__label">${label}</span>
    </label>
  `;
}

function renderFacetedFilters({ id, sections, withEventsLog = false }) {
  const groups = sections.map((section) => {
    if (section.kind === 'checkbox') {
      const options = section.options.map((opt) => `
        <li class="cremona-search-faceted-filters__option">
          ${renderCheckbox({
            id: `${id}-${section.key}-${opt.value}`,
            name: section.key,
            value: opt.value,
            label: opt.label,
            checked: opt.checked,
          })}
          ${opt.count !== undefined ? `<span class="cremona-search-faceted-filters__option-count" aria-hidden="true">${opt.count}</span>` : ''}
        </li>
      `).join('');
      return `
        <fieldset class="cremona-search-faceted-filters__group" data-group-key="${section.key}">
          <legend class="cremona-search-faceted-filters__group-title">${section.label}</legend>
          <ul class="cremona-search-faceted-filters__options" role="list">${options}</ul>
        </fieldset>
      `;
    }
    if (section.kind === 'range') {
      return `
        <fieldset class="cremona-search-faceted-filters__group" data-group-key="${section.key}">
          <legend class="cremona-search-faceted-filters__group-title">${section.label}</legend>
          <div class="cremona-search-faceted-filters__range">
            <input type="range" name="${section.key}" min="${section.min}" max="${section.max}" step="${section.step || 1}" value="${section.value}" class="cremona-slider" aria-label="${section.label}" />
            <div class="cremona-search-faceted-filters__range-values">
              <span>${section.min}</span>
              <span>${section.max}</span>
            </div>
          </div>
        </fieldset>
      `;
    }
    return '';
  }).join('');

  return `
    <aside class="cremona-search-faceted-filters"
           id="${id}"
           data-controller="faceted-filters"
           data-faceted-filters-mode-value="multi"
           aria-labelledby="${id}-title">
      <header class="cremona-search-faceted-filters__header">
        <h2 id="${id}-title" class="cremona-search-faceted-filters__title">${t('theme.search-faceted-filters.title')}</h2>
        <button type="button" class="cremona-button cremona-search-faceted-filters__clear" data-variant="ghost" data-size="sm" data-action="click->faceted-filters#clear">
          ${t('theme.search-faceted-filters.clear')}
        </button>
      </header>
      ${groups}
    </aside>
  `;
}

const defaultSections = [
  {
    key: 'categories',
    label: t('theme.search-faceted-filters.story.group.categories'),
    kind: 'checkbox',
    options: [
      { value: 'electronics', label: t('theme.search-faceted-filters.story.option.electronics'), count: 42 },
      { value: 'books', label: t('theme.search-faceted-filters.story.option.books'), count: 128 },
      { value: 'clothing', label: t('theme.search-faceted-filters.story.option.clothing'), count: 87 },
      { value: 'home', label: t('theme.search-faceted-filters.story.option.home'), count: 56 },
    ],
  },
  {
    key: 'brand',
    label: t('theme.search-faceted-filters.story.group.brand'),
    kind: 'checkbox',
    options: [
      { value: 'apple', label: 'Apple', count: 23 },
      { value: 'samsung', label: 'Samsung', count: 31 },
      { value: 'sony', label: 'Sony', count: 14 },
    ],
  },
  {
    key: 'priceMax',
    label: t('theme.search-faceted-filters.story.group.price-max'),
    kind: 'range',
    min: 0,
    max: 1000,
    step: 10,
    value: 500,
  },
];

const preSelectedSections = JSON.parse(JSON.stringify(defaultSections));
preSelectedSections[0].options[0].checked = true;
preSelectedSections[0].options[2].checked = true;
preSelectedSections[1].options[1].checked = true;
preSelectedSections[2].value = 250;

const bodyHtml = `
  <section class="search-faceted-filters-story" aria-labelledby="search-faceted-filters-story-title">
    <header class="search-faceted-filters-story__header">
      <h1 id="search-faceted-filters-story-title">${t('theme.search-faceted-filters.story.title')}</h1>
      <p>${t('theme.search-faceted-filters.story.subtitle')}</p>
    </header>

    <section class="search-faceted-filters-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.search-faceted-filters.story.section.default')}</h2>
      <p class="search-faceted-filters-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.search-faceted-filters.story.explainer.default')}</p>
      <div class="search-faceted-filters-story__frame">${renderFacetedFilters({ id: 'faceted-default', sections: defaultSections })}</div>
    </section>

    <section class="search-faceted-filters-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.search-faceted-filters.story.section.pre-selected')}</h2>
      <p class="search-faceted-filters-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.search-faceted-filters.story.explainer.pre-selected')}</p>
      <div class="search-faceted-filters-story__frame">${renderFacetedFilters({ id: 'faceted-pre-selected', sections: preSelectedSections })}</div>
    </section>

    <section class="search-faceted-filters-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.search-faceted-filters.story.section.events-log')}</h2>
      <p class="search-faceted-filters-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.search-faceted-filters.story.explainer.events-log')}</p>
      <div class="search-faceted-filters-story__frame">${renderFacetedFilters({ id: 'faceted-events', sections: defaultSections, withEventsLog: true })}</div>
      <div id="faceted-filters-events-log" class="search-faceted-filters-story__events-log" aria-live="polite"></div>
    </section>

  </section>
`;
</script>

<template>
  <Story title="Patterns/Search-FacetedFilters" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="search-faceted-filters-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="search-faceted-filters-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.search-faceted-filters-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.search-faceted-filters-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.search-faceted-filters-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.search-faceted-filters-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.search-faceted-filters-story__explainer { max-inline-size: 70ch; }
.search-faceted-filters-story__frame { padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); background: var(--color-bg-base); max-inline-size: 320px; }
.search-faceted-filters-story__events-log { display: flex; flex-direction: column-reverse; gap: var(--spacing-1); padding: var(--spacing-3); margin-block-start: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--color-text-secondary); max-block-size: 200px; overflow: auto; }
.search-faceted-filters-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
