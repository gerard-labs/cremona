<!--
  Pagination story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6):
    1. Default — page 1, pageSize 25, totalItems 142. Standard footer.
    2. Mid-pagination — page 3 / 6 (all buttons enabled).
    3. Page sizes — interactive page-size swap (events log shows reset to page 1).
    4. Empty — totalItems = 0 (all buttons disabled, range "0-0 sur 0").
    5. Single page — totalItems < pageSize (single page, all nav disabled).
    6. Events log — wired to pagination:change demonstration.

  Stimulus controller `pagination` mounted on the <nav>. The `change` action
  bubbles from the inner <select> (NativeSelect) to the <nav> root via
  `data-action="change->pagination#changePageSize"`.

  Helpers (per S2.3a story doctrine — nested template literal avoidance):
    - pagination({ id, page, pageSize, totalItems, pageSizes, label, ... })
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import chevronDownSvg from '../../../assets/icons/chevron-down.svg?raw';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot(document.documentElement);
  // Wire the events log demos.
  for (const log of document.querySelectorAll('[data-events-log]')) {
    const navId = log.getAttribute('data-events-log');
    const nav = document.getElementById(navId);
    if (!nav) continue;
    const out = log.querySelector('[data-events-out]');
    nav.addEventListener('pagination:change', (e) => {
      const d = e.detail;
      const line = document.createElement('div');
      line.textContent = `pagination:change → page=${d.page}, pageSize=${d.pageSize}, range=${d.from}-${d.to}/${d.total}`;
      if (out) out.appendChild(line);
    });
  }
});

let _pgCounter = 0;
function nextId(prefix = 'pg') { return `${prefix}-${++_pgCounter}`; }

function S(key) { return t('theme.pagination.story.' + key); }

function nativeSelect({ htmlId, value, options, size = 'sm' }) {
  const optsHtml = options.map((o) => {
    const sel = String(o.value) === String(value) ? ' selected' : '';
    return `<option value="${o.value}"${sel}>${o.label}</option>`;
  }).join('');
  return `<div class="cremona-native-select-wrap" data-size="${size}">
    <select class="cremona-native-select" data-size="${size}" id="${htmlId}">${optsHtml}</select>
    <span class="cremona-icon cremona-native-select__chevron" data-icon="chevron-down" data-size="sm" aria-hidden="true" role="presentation">${chevronDownSvg}</span>
  </div>`;
}

function pagination({ id, page = 1, pageSize = 25, totalItems = 142, pageSizes = [10, 25, 50, 100] }) {
  const navId = id || nextId('pg');
  const selectOptions = pageSizes.map((s) => ({ value: String(s), label: String(s) }));
  return `
    <nav
      id="${navId}"
      class="cremona-pagination"
      role="navigation"
      aria-label="${S('aria.label')}"
      data-controller="pagination"
      data-action="change->pagination#changePageSize"
      data-pagination-page-value="${page}"
      data-pagination-page-size-value="${pageSize}"
      data-pagination-total-items-value="${totalItems}"
    >
      <span
        class="cremona-pagination__range"
        data-pagination-target="rangeLabel"
        aria-live="polite"
        aria-atomic="true"
      ></span>
      <span class="cremona-pagination__page-size">
        <label class="cremona-pagination__page-size-label" for="${navId}-size">${S('page-size-label')}</label>
        ${nativeSelect({ htmlId: `${navId}-size`, value: pageSize, options: selectOptions, size: 'sm' })}
      </span>
      <span class="cremona-pagination__nav" role="group">
        <button type="button" class="cremona-button cremona-pagination__btn" data-variant="ghost" data-size="sm"
          data-pagination-target="firstButton"
          data-action="click->pagination#first"
          aria-label="${S('aria.first')}"><span class="cremona-pagination__icon cremona-pagination__icon--first" aria-hidden="true"></span></button>
        <button type="button" class="cremona-button cremona-pagination__btn" data-variant="ghost" data-size="sm"
          data-pagination-target="prevButton"
          data-action="click->pagination#prev"
          aria-label="${S('aria.prev')}"><span class="cremona-pagination__icon cremona-pagination__icon--prev" aria-hidden="true"></span></button>
        <button type="button" class="cremona-button cremona-pagination__btn" data-variant="ghost" data-size="sm"
          data-pagination-target="nextButton"
          data-action="click->pagination#next"
          aria-label="${S('aria.next')}"><span class="cremona-pagination__icon cremona-pagination__icon--next" aria-hidden="true"></span></button>
        <button type="button" class="cremona-button cremona-pagination__btn" data-variant="ghost" data-size="sm"
          data-pagination-target="lastButton"
          data-action="click->pagination#last"
          aria-label="${S('aria.last')}"><span class="cremona-pagination__icon cremona-pagination__icon--last" aria-hidden="true"></span></button>
      </span>
    </nav>
  `;
}

const bodyHtml = `
  <section class="pg-story" data-testid="pagination-root">
    <header class="pg-story__header">
      <h1>${t('theme.pagination.story.title')}</h1>
      <p>${t('theme.pagination.story.subtitle')}</p>
    </header>

    <section class="pg-story__section" aria-labelledby="pg-section-default">
      <h2 id="pg-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.default')}</h2>
      <p class="pg-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.default')}</p>
      ${pagination({ page: 1, pageSize: 25, totalItems: 142 })}
    </section>

    <section class="pg-story__section" aria-labelledby="pg-section-mid">
      <h2 id="pg-section-mid" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.mid')}</h2>
      <p class="pg-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.mid')}</p>
      ${pagination({ page: 3, pageSize: 25, totalItems: 142 })}
    </section>

    <section class="pg-story__section" aria-labelledby="pg-section-page-sizes">
      <h2 id="pg-section-page-sizes" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.page-sizes')}</h2>
      <p class="pg-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.page-sizes')}</p>
      ${pagination({ page: 2, pageSize: 10, totalItems: 142, pageSizes: [10, 25, 50, 100] })}
    </section>

    <section class="pg-story__section" aria-labelledby="pg-section-empty">
      <h2 id="pg-section-empty" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.empty')}</h2>
      <p class="pg-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.empty')}</p>
      ${pagination({ page: 1, pageSize: 25, totalItems: 0 })}
    </section>

    <section class="pg-story__section" aria-labelledby="pg-section-single">
      <h2 id="pg-section-single" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.single')}</h2>
      <p class="pg-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.single')}</p>
      ${pagination({ page: 1, pageSize: 25, totalItems: 8 })}
    </section>

    <section class="pg-story__section" aria-labelledby="pg-section-events">
      <h2 id="pg-section-events" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.events')}</h2>
      <p class="pg-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.events')}</p>
      ${pagination({ id: 'pg-events-demo', page: 1, pageSize: 25, totalItems: 87 })}
      <div class="pg-story__log" data-events-log="pg-events-demo">
        <div class="cremona-typography" data-variant="overline" data-color="tertiary">${S('events.log')}</div>
        <div data-events-out class="pg-story__log-out"></div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/Pagination" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="pg-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="pg-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.pg-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.pg-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.pg-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.pg-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.pg-story__explainer { max-inline-size: 70ch; }
.pg-story__log { display: grid; gap: var(--spacing-2); padding: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); font: var(--typography-code); font-size: var(--font-size-xs); }
.pg-story__log-out { display: grid; gap: var(--spacing-1); color: var(--color-text-secondary); min-block-size: var(--spacing-8); }
.pg-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
