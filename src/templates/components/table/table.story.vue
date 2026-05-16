<!--
  Table story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6):
    1. Default — basic <table> with 4 columns, 5 rows, caption sr-only.
    2. Sortable headers — aria-sort ascending/descending/none + chevron icons.
    3. Numeric cells — tabular-nums + text-align: end (RTL: visually start).
    4. Selected rows — bulk-select state via data-selected="true".
    5. Striped variant — zebra rows via :nth-child(2n).
    6. Sizes — sm / md / lg side-by-side, density-driven.

  No Stimulus controller — Table is pure CSS. The story renders the Twig
  template's HTML structure directly (via helpers that mirror the template's
  param-driven mode).

  Helpers (per S2.3a story doctrine — nested template literal avoidance):
    - th({ label, sortable, sortDir, numeric, align })
    - td({ content, numeric, align, header })
    - row({ cells, selected })
    - table({ caption, captionSrOnly, size, variant, columns, rows, className })
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function S(key) { return t('theme.table.story.' + key); }

function thCell({ label, sortable = false, sortDir = 'none', numeric = false, align = null }) {
  const alignAttr = (numeric ? 'end' : align);
  const sortableAttrs = sortable ? ` data-sortable="true" aria-sort="${sortDir}"` : '';
  const numericAttr = numeric ? ' data-numeric="true"' : '';
  const alignAttrStr = alignAttr ? ` data-align="${alignAttr}"` : '';
  if (sortable) {
    return `<th scope="col"${alignAttrStr}${numericAttr}${sortableAttrs}>
      <button type="button" class="cremona-table__sort" data-sort-dir="${sortDir}">
        <span class="cremona-table__sort-label">${label}</span>
        <span class="cremona-table__sort-icon" aria-hidden="true"></span>
      </button>
    </th>`;
  }
  return `<th scope="col"${alignAttrStr}${numericAttr}>${label}</th>`;
}

function tdCell({ content, numeric = false, align = null, header = false }) {
  const alignAttr = (numeric ? 'end' : align);
  const numericAttr = numeric ? ' data-numeric="true"' : '';
  const alignAttrStr = alignAttr ? ` data-align="${alignAttr}"` : '';
  const tag = header ? 'th scope="row"' : 'td';
  const closeTag = header ? 'th' : 'td';
  return `<${tag}${alignAttrStr}${numericAttr}>${content}</${closeTag}>`;
}

function row({ cells, selected = false }) {
  const selAttr = selected ? ' data-selected="true" aria-selected="true"' : '';
  return `<tr${selAttr}>${cells.map(tdCell).join('')}</tr>`;
}

function table({ caption = null, captionSrOnly = false, size = 'md', variant = 'default', columns = [], rows = [], className = '' }) {
  const captionHtml = caption
    ? `<caption class="cremona-table__caption${captionSrOnly ? ' sr-only' : ''}">${caption}</caption>`
    : '';
  const theadHtml = columns.length > 0
    ? `<thead class="cremona-table__thead"><tr>${columns.map(thCell).join('')}</tr></thead>`
    : '';
  const tbodyHtml = rows.length > 0
    ? `<tbody class="cremona-table__tbody">${rows.map(row).join('')}</tbody>`
    : '';
  const classes = ['cremona-table', className].filter(Boolean).join(' ');
  return `<table class="${classes}" data-size="${size}" data-variant="${variant}">${captionHtml}${theadHtml}${tbodyHtml}</table>`;
}

// Sample data — re-used across sections, keys via t() for FR/EN parity.
const COLUMNS_BASIC = () => [
  { label: S('column.name') },
  { label: S('column.email') },
  { label: S('column.role') },
  { label: S('column.joined') },
];

const COLUMNS_SORTABLE = () => [
  { label: S('column.name'), sortable: true, sortDir: 'ascending' },
  { label: S('column.email'), sortable: true, sortDir: 'none' },
  { label: S('column.role'), sortable: true, sortDir: 'none' },
  { label: S('column.joined'), sortable: true, sortDir: 'descending' },
];

const COLUMNS_NUMERIC = () => [
  { label: S('column.name') },
  { label: S('column.score'), numeric: true, sortable: true, sortDir: 'descending' },
  { label: S('column.tasks'), numeric: true },
  { label: S('column.budget'), numeric: true },
];

function memberRows({ selectedIndices = [] } = {}) {
  return [
    { name: 'Marie Curie',     email: 'marie@example.fr',     role: S('role.admin'),  joined: '2024-01-12' },
    { name: 'Pierre Bayard',   email: 'pierre@example.fr',    role: S('role.editor'), joined: '2024-03-08' },
    { name: 'Léa Seydoux',     email: 'lea@example.fr',       role: S('role.editor'), joined: '2024-05-22' },
    { name: 'Karim Benzema',   email: 'karim@example.fr',     role: S('role.viewer'), joined: '2024-07-19' },
    { name: 'Olympe de Gouges', email: 'olympe@example.fr',   role: S('role.viewer'), joined: '2024-09-30' },
  ].map((m, i) => ({
    selected: selectedIndices.includes(i),
    cells: [
      { content: m.name },
      { content: m.email },
      { content: m.role },
      { content: m.joined },
    ],
  }));
}

function numericRows() {
  return [
    { name: 'Marie Curie',     score: '142',  tasks: '38',  budget: '12 480 €' },
    { name: 'Pierre Bayard',   score: '98',   tasks: '22',  budget: '7 920 €' },
    { name: 'Léa Seydoux',     score: '203',  tasks: '51',  budget: '18 640 €' },
    { name: 'Karim Benzema',   score: '67',   tasks: '12',  budget: '4 200 €' },
    { name: 'Olympe de Gouges', score: '178', tasks: '44',  budget: '15 050 €' },
  ].map((m) => ({
    cells: [
      { content: m.name },
      { content: m.score, numeric: true },
      { content: m.tasks, numeric: true },
      { content: m.budget, numeric: true },
    ],
  }));
}

const bodyHtml = `
  <section class="tb-story" data-testid="table-root">
    <header class="tb-story__header">
      <h1>${t('theme.table.story.title')}</h1>
      <p>${t('theme.table.story.subtitle')}</p>
    </header>

    <section class="tb-story__section" aria-labelledby="tb-section-default">
      <h2 id="tb-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.default')}</h2>
      <p class="tb-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.default')}</p>
      ${table({
        caption: S('caption.team'),
        captionSrOnly: true,
        columns: COLUMNS_BASIC(),
        rows: memberRows(),
      })}
    </section>

    <section class="tb-story__section" aria-labelledby="tb-section-sortable">
      <h2 id="tb-section-sortable" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.sortable')}</h2>
      <p class="tb-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.sortable')}</p>
      ${table({
        caption: S('caption.sortable'),
        captionSrOnly: true,
        columns: COLUMNS_SORTABLE(),
        rows: memberRows(),
      })}
    </section>

    <section class="tb-story__section" aria-labelledby="tb-section-numeric">
      <h2 id="tb-section-numeric" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.numeric')}</h2>
      <p class="tb-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.numeric')}</p>
      ${table({
        caption: S('caption.numeric'),
        captionSrOnly: true,
        columns: COLUMNS_NUMERIC(),
        rows: numericRows(),
      })}
    </section>

    <section class="tb-story__section" aria-labelledby="tb-section-selected">
      <h2 id="tb-section-selected" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.selected')}</h2>
      <p class="tb-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.selected')}</p>
      ${table({
        caption: S('caption.selected'),
        captionSrOnly: true,
        columns: COLUMNS_BASIC(),
        rows: memberRows({ selectedIndices: [0, 2] }),
      })}
    </section>

    <section class="tb-story__section" aria-labelledby="tb-section-striped">
      <h2 id="tb-section-striped" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.striped')}</h2>
      <p class="tb-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.striped')}</p>
      ${table({
        caption: S('caption.striped'),
        captionSrOnly: true,
        variant: 'striped',
        columns: COLUMNS_BASIC(),
        rows: memberRows(),
      })}
    </section>

    <section class="tb-story__section" aria-labelledby="tb-section-sizes">
      <h2 id="tb-section-sizes" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.sizes')}</h2>
      <p class="tb-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.sizes')}</p>
      <div class="tb-story__sizes">
        <div>
          <p class="cremona-typography" data-variant="caption" data-color="tertiary">${S('size.sm')}</p>
          ${table({
            captionSrOnly: true,
            size: 'sm',
            columns: COLUMNS_BASIC().slice(0, 3),
            rows: memberRows().slice(0, 3),
          })}
        </div>
        <div>
          <p class="cremona-typography" data-variant="caption" data-color="tertiary">${S('size.md')}</p>
          ${table({
            captionSrOnly: true,
            size: 'md',
            columns: COLUMNS_BASIC().slice(0, 3),
            rows: memberRows().slice(0, 3),
          })}
        </div>
        <div>
          <p class="cremona-typography" data-variant="caption" data-color="tertiary">${S('size.lg')}</p>
          ${table({
            captionSrOnly: true,
            size: 'lg',
            columns: COLUMNS_BASIC().slice(0, 3),
            rows: memberRows().slice(0, 3),
          })}
        </div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/Table" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="tb-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="tb-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.tb-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.tb-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.tb-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.tb-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.tb-story__explainer { max-inline-size: 70ch; }
.tb-story__sizes { display: grid; gap: var(--spacing-6); }
.tb-story__sizes > div { display: grid; gap: var(--spacing-2); }
.tb-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
