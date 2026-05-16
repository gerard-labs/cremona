<!--
  Tabs story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6):
    1. Underline default (automatic activation) — 4 tabs, first active.
    2. Pill variant — segmented look with active fill.
    3. Sizes (sm / md / lg) — 3 horizontal Tabs side-by-side.
    4. Vertical orientation — list stacks block, indicator on inline-end.
    5. Manual activation — Arrow keys focus only, Enter / Space activates.
    6. Events log — wired to tabs:change demonstration.

  Helpers (per S2.3a story doctrine — nested template literal avoidance):
    - tabs({ id, value, variant, orientation, activation, size, items, label })
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot(document.documentElement);
  // Wire the events log demo.
  for (const log of document.querySelectorAll('[data-events-log]')) {
    const id = log.getAttribute('data-events-log');
    const wrap = document.getElementById(id);
    if (!wrap) continue;
    const out = log.querySelector('[data-events-out]');
    wrap.addEventListener('tabs:change', (e) => {
      const d = e.detail;
      const line = document.createElement('div');
      line.textContent = `tabs:change → value=${d.value}, previous=${d.previousValue}`;
      if (out) out.appendChild(line);
    });
  }
});

let _tCounter = 0;
function nextId(prefix = 'tabs') { return `${prefix}-${++_tCounter}`; }

function S(key) { return t('theme.tabs.story.' + key); }

function panel(content) {
  return `<div class="tabs-story__panel-body">${content}</div>`;
}

function tabs({
  id,
  value = null,
  variant = 'underline',
  orientation = 'horizontal',
  activation = 'automatic',
  size = 'md',
  label = null,
  items = [],
}) {
  const wrapId = id || nextId('tabs');
  // Default value to first non-disabled if not provided.
  let effectiveValue = value;
  if (!effectiveValue) {
    const firstEnabled = items.find((it) => !it.disabled);
    if (firstEnabled) effectiveValue = firstEnabled.id;
  }
  const triggers = items.map((it) => {
    const isActive = it.id === effectiveValue;
    const disAttr = it.disabled ? ' disabled aria-disabled="true"' : '';
    return `<button id="${wrapId}-trig-${it.id}" type="button" role="tab"
      class="cremona-tabs__trigger"
      data-tabs-target="trigger"
      data-tab-id="${it.id}"
      data-action="click->tabs#activate keydown->tabs#onKeydown"
      aria-controls="${wrapId}-panel-${it.id}"
      aria-selected="${isActive ? 'true' : 'false'}"
      tabindex="${isActive ? '0' : '-1'}"
      data-state="${isActive ? 'active' : 'inactive'}"${disAttr}><span class="cremona-tabs__trigger-label">${it.label}</span></button>`;
  }).join('');
  const panels = items.map((it) => {
    const isActive = it.id === effectiveValue;
    return `<div id="${wrapId}-panel-${it.id}" role="tabpanel"
      class="cremona-tabs__panel"
      data-tabs-target="panel"
      data-tab-id="${it.id}"
      aria-labelledby="${wrapId}-trig-${it.id}"
      tabindex="0"
      data-state="${isActive ? 'active' : 'inactive'}"${isActive ? '' : ' hidden'}>${panel(it.content || '')}</div>`;
  }).join('');
  const ariaLabel = label || S('default-label');
  const ariaOrient = orientation === 'vertical' ? ' aria-orientation="vertical"' : '';
  return `
    <div id="${wrapId}" class="cremona-tabs"
      data-controller="tabs"
      data-tabs-value-value="${effectiveValue || ''}"
      data-tabs-orientation-value="${orientation}"
      data-tabs-activation-value="${activation}"
      data-variant="${variant}"
      data-orientation="${orientation}"
      data-size="${size}">
      <div role="tablist" class="cremona-tabs__list" data-tabs-target="list"
        aria-label="${ariaLabel}"${ariaOrient}>${triggers}</div>
      ${panels}
    </div>
  `;
}

const accountItems = [
  { id: 'profile',   label: S('item.profile'),   content: `<p>${S('panel.profile')}</p>` },
  { id: 'pref',      label: S('item.pref'),      content: `<p>${S('panel.pref')}</p>` },
  { id: 'security',  label: S('item.security'),  content: `<p>${S('panel.security')}</p>` },
  { id: 'billing',   label: S('item.billing'),   content: `<p>${S('panel.billing')}</p>`, disabled: true },
];

const sizesItems = [
  { id: 'one', label: S('item.one'), content: `<p>${S('panel.size')}</p>` },
  { id: 'two', label: S('item.two'), content: `<p>${S('panel.size')}</p>` },
];

const verticalItems = [
  { id: 'general',  label: S('item.general'),  content: `<p>${S('panel.vertical-general')}</p>` },
  { id: 'notif',    label: S('item.notif'),    content: `<p>${S('panel.vertical-notif')}</p>` },
  { id: 'lang',     label: S('item.lang'),     content: `<p>${S('panel.vertical-lang')}</p>` },
  { id: 'advanced', label: S('item.advanced'), content: `<p>${S('panel.vertical-advanced')}</p>` },
];

const manualItems = [
  { id: 'overview', label: S('item.overview'), content: `<p>${S('panel.manual-overview')}</p>` },
  { id: 'reports',  label: S('item.reports'),  content: `<p>${S('panel.manual-reports')}</p>` },
  { id: 'export',   label: S('item.export'),   content: `<p>${S('panel.manual-export')}</p>` },
];

const eventsItems = [
  { id: 'a', label: S('item.a'), content: `<p>${S('panel.events')}</p>` },
  { id: 'b', label: S('item.b'), content: `<p>${S('panel.events')}</p>` },
  { id: 'c', label: S('item.c'), content: `<p>${S('panel.events')}</p>` },
];

const bodyHtml = `
  <section class="tabs-story" data-testid="tabs-root">
    <header class="tabs-story__header">
      <h1>${t('theme.tabs.story.title')}</h1>
      <p>${t('theme.tabs.story.subtitle')}</p>
    </header>

    <section class="tabs-story__section" aria-labelledby="tabs-section-default">
      <h2 id="tabs-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.default')}</h2>
      <p class="tabs-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.default')}</p>
      ${tabs({ items: accountItems, label: S('aria.account') })}
    </section>

    <section class="tabs-story__section" aria-labelledby="tabs-section-pill">
      <h2 id="tabs-section-pill" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.pill')}</h2>
      <p class="tabs-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.pill')}</p>
      ${tabs({ items: accountItems.slice(0, 3), variant: 'pill', label: S('aria.account') })}
    </section>

    <section class="tabs-story__section" aria-labelledby="tabs-section-sizes">
      <h2 id="tabs-section-sizes" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.sizes')}</h2>
      <p class="tabs-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.sizes')}</p>
      <div class="tabs-story__row">
        <div>
          <div class="tabs-story__size-label">${S('size.sm')}</div>
          ${tabs({ items: sizesItems, size: 'sm', label: S('aria.sm') })}
        </div>
        <div>
          <div class="tabs-story__size-label">${S('size.md')}</div>
          ${tabs({ items: sizesItems, size: 'md', label: S('aria.md') })}
        </div>
        <div>
          <div class="tabs-story__size-label">${S('size.lg')}</div>
          ${tabs({ items: sizesItems, size: 'lg', label: S('aria.lg') })}
        </div>
      </div>
    </section>

    <section class="tabs-story__section" aria-labelledby="tabs-section-vertical">
      <h2 id="tabs-section-vertical" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.vertical')}</h2>
      <p class="tabs-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.vertical')}</p>
      ${tabs({ items: verticalItems, orientation: 'vertical', label: S('aria.vertical') })}
    </section>

    <section class="tabs-story__section" aria-labelledby="tabs-section-manual">
      <h2 id="tabs-section-manual" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.manual')}</h2>
      <p class="tabs-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.manual')}</p>
      ${tabs({ items: manualItems, activation: 'manual', label: S('aria.manual') })}
    </section>

    <section class="tabs-story__section" aria-labelledby="tabs-section-events">
      <h2 id="tabs-section-events" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.events')}</h2>
      <p class="tabs-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.events')}</p>
      ${tabs({ id: 'tabs-events-demo', items: eventsItems, label: S('aria.events') })}
      <div class="tabs-story__log" data-events-log="tabs-events-demo">
        <div class="cremona-typography" data-variant="overline" data-color="tertiary">${S('events.log')}</div>
        <div data-events-out class="tabs-story__log-out"></div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/Tabs" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="tabs-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="tabs-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.tabs-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.tabs-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.tabs-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.tabs-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.tabs-story__explainer { max-inline-size: 70ch; }
.tabs-story__row { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: var(--spacing-4); }
.tabs-story__size-label { font: var(--typography-caption); color: var(--color-text-tertiary); margin-block-end: var(--spacing-2); }
.tabs-story__panel-body { padding-block: var(--spacing-3); color: var(--color-text-secondary); font: var(--typography-body); }
.tabs-story__log { display: grid; gap: var(--spacing-2); padding: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); font: var(--typography-code); font-size: var(--font-size-xs); }
.tabs-story__log-out { display: grid; gap: var(--spacing-1); color: var(--color-text-secondary); min-block-size: var(--spacing-8); }
.tabs-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
