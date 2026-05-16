<!--
  Select story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5):
    1. Default (placeholder) — no SSR value, label shows placeholder.
    2. With SSR value — pre-selected option visible on open.
    3. With disabled option — ArrowDown skips it.
    4. Sizes (sm / md / lg).
    5. In a Field (with label + help).

  Stimulus controllers `popover` + `select` co-mounted on each wrap.
  Per OQ-28 doctrine: vanilla implementation, no Tom Select adapter.
  WAI-ARIA APG "Listbox (Collapsible)" — aria-activedescendant pattern.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import checkSvg from '../../../assets/icons/check.svg?raw';
import chevronDownSvg from '../../../assets/icons/chevron-down.svg?raw';

const ICONS = { check: checkSvg, 'chevron-down': chevronDownSvg };

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

let _selCounter = 0;
function nextId() { return `sel-${++_selCounter}`; }

function icon(name, size = 'sm') {
  return `<span class="cremona-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function renderOption({ id, value, label, selected = false, disabled = false }) {
  const dis = disabled ? ' aria-disabled="true" data-state="disabled"' : '';
  const checkHtml = selected
    ? `<span class="cremona-item__icon cremona-item__icon--trailing cremona-select__option-check" aria-hidden="true">${icon('check')}</span>`
    : '';
  return `<div class="cremona-item cremona-select__option"
    id="${id}"
    data-select-target="option"
    data-value="${value}"
    role="option"
    aria-selected="${selected ? 'true' : 'false'}"${dis}>
    <span class="cremona-item__text"><span class="cremona-item__label">${label}</span></span>
    ${checkHtml}
  </div>`;
}

function renderSelect({ name, value = '', placeholder = 'Choisir…', size = 'md', disabled = false, invalid = false, options, labelledBy = null, describedBy = null }) {
  const id = nextId();
  const selectedOpt = options.find((o) => o.value === value && value !== '');
  const labelText = selectedOpt ? selectedOpt.label : placeholder;
  const isPlaceholder = !selectedOpt;
  const optionsHtml = options.map((o, i) => renderOption({
    id: `${id}-opt-${i + 1}`,
    value: o.value,
    label: o.label,
    selected: o.value === value && value !== '',
    disabled: !!o.disabled,
  })).join('');
  return `
    <div class="cremona-popover cremona-select"
      data-controller="popover select"
      data-action="click->popover#toggle keydown.esc@window->popover#close keydown->select#keydown click->select#onOptionClick"
      data-popover-placement-value="bottom-start"
      data-popover-offset-value="4"
      data-popover-open-value="false"
      data-select-value-value="${value}"
      data-select-placeholder-value="${placeholder}">
      <button type="button" class="cremona-select__trigger"
        data-popover-target="trigger"
        data-select-target="button"
        data-size="${size}"
        ${disabled ? 'disabled' : ''}
        ${invalid ? 'aria-invalid="true"' : ''}
        aria-haspopup="listbox" aria-expanded="false" aria-controls="${id}-listbox"
        ${labelledBy ? `aria-labelledby="${labelledBy}"` : ''}
        ${describedBy ? `aria-describedby="${describedBy}"` : ''}>
        <span class="cremona-select__label" data-select-target="label" data-placeholder="${isPlaceholder}">${labelText}</span>
        <span class="cremona-select__chevron" aria-hidden="true">${icon('chevron-down', 'sm')}</span>
      </button>
      <input type="hidden" name="${name}" value="${value}" data-select-target="hiddenInput">
      <div id="${id}-listbox"
        class="cremona-popover__content cremona-select__listbox"
        data-popover-target="content"
        data-state="closed"
        data-placement="bottom-start"
        role="listbox"
        ${labelledBy ? `aria-labelledby="${labelledBy}"` : ''}
        hidden>${optionsHtml}</div>
    </div>
  `;
}

function S(key) { return t('theme.select.story.' + key); }

const langOptions = [
  { value: 'fr', label: S('sample.lang-fr') },
  { value: 'en', label: S('sample.lang-en') },
  { value: 'de', label: S('sample.lang-de') },
  { value: 'es', label: S('sample.lang-es') },
];

const statusOptions = [
  { value: 'active', label: S('sample.status-active') },
  { value: 'pending', label: S('sample.status-pending') },
  { value: 'archived', label: S('sample.status-archived'), disabled: true },
  { value: 'deleted', label: S('sample.status-deleted') },
];

const bodyHtml = `
  <section class="select-story" data-testid="select-root">
    <header class="select-story__header">
      <h1>${t('theme.select.story.title')}</h1>
      <p>${t('theme.select.story.subtitle')}</p>
    </header>

    <section class="select-story__section" aria-labelledby="sel-section-default">
      <h2 id="sel-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.select.story.section.default')}</h2>
      <p class="select-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.select.story.explainer.default')}</p>
      <div class="select-story__row">
        ${renderSelect({ name: 'lang-default', placeholder: S('sample.lang-placeholder'), options: langOptions })}
      </div>
    </section>

    <section class="select-story__section" aria-labelledby="sel-section-ssr">
      <h2 id="sel-section-ssr" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.select.story.section.ssr')}</h2>
      <p class="select-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.select.story.explainer.ssr')}</p>
      <div class="select-story__row">
        ${renderSelect({ name: 'lang-ssr', value: 'en', placeholder: S('sample.lang-placeholder'), options: langOptions })}
      </div>
    </section>

    <section class="select-story__section" aria-labelledby="sel-section-disabled">
      <h2 id="sel-section-disabled" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.select.story.section.disabled')}</h2>
      <p class="select-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.select.story.explainer.disabled')}</p>
      <div class="select-story__row">
        ${renderSelect({ name: 'status', value: 'active', placeholder: S('sample.status-placeholder'), options: statusOptions })}
      </div>
    </section>

    <section class="select-story__section" aria-labelledby="sel-section-sizes">
      <h2 id="sel-section-sizes" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.select.story.section.sizes')}</h2>
      <p class="select-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.select.story.explainer.sizes')}</p>
      <div class="select-story__row select-story__row--gap">
        ${renderSelect({ name: 'sz-sm', size: 'sm', placeholder: S('sample.sz-sm'), options: langOptions })}
        ${renderSelect({ name: 'sz-md', size: 'md', placeholder: S('sample.sz-md'), options: langOptions })}
        ${renderSelect({ name: 'sz-lg', size: 'lg', placeholder: S('sample.sz-lg'), options: langOptions })}
      </div>
    </section>

    <section class="select-story__section" aria-labelledby="sel-section-field">
      <h2 id="sel-section-field" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.select.story.section.field')}</h2>
      <p class="select-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.select.story.explainer.field')}</p>
      <div class="select-story__row select-story__row--field">
        <label id="field-lang-label" class="cremona-label" for="field-lang-trigger">
          ${S('sample.field-label')}
          <span class="cremona-label__required" aria-hidden="true">*</span>
          <span class="sr-only">(${S('sample.field-required')})</span>
        </label>
        ${renderSelect({
          name: 'field-lang',
          placeholder: S('sample.field-placeholder'),
          options: langOptions,
          labelledBy: 'field-lang-label',
          describedBy: 'field-lang-help',
        })}
        <span id="field-lang-help" class="select-story__help cremona-typography" data-variant="caption" data-color="tertiary">${S('sample.field-help')}</span>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/Select" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="select-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="select-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.select-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.select-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.select-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.select-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.select-story__row { display: flex; padding-block: var(--spacing-2); align-items: flex-start; max-inline-size: 320px; }
.select-story__row--gap { gap: var(--spacing-3); align-items: flex-end; max-inline-size: none; }
.select-story__row--field { display: grid; gap: var(--spacing-2); max-inline-size: 320px; }
.select-story__explainer { max-inline-size: 70ch; }
.select-story__help { display: block; }
.select-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
