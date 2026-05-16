<!--
  Combobox story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5):
    1. Default (empty input) — placeholder visible, focus opens the listbox.
    2. With SSR value — pre-selected option's label appears in the input.
    3. Filter live — type to filter; results count announced via #cremona-announcer.
    4. Empty state — type a query that matches no option to reveal "Aucun résultat pour « X »".
    5. In a Field with label + help.

  Stimulus controllers `popover` + `combobox` co-mounted (combobox extends
  select per OQ-32). Per OQ-31: shared #cremona-announcer (declared in
  base/reset.css). Per OQ-28: vanilla implementation, no Tom Select adapter.

  Helpers used (per S2.3a story doctrine — nested template literal
  avoidance to satisfy check-i18n H3 brace-balanced masker):
    - icon(name, size)
    - renderOption({ id, value, label, selected, disabled })
    - renderCombobox({ name, value, placeholder, options, ... })
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

let _cbxCounter = 0;
function nextId() { return `cbx-${++_cbxCounter}`; }

function icon(name, size = 'sm') {
  return `<span class="cremona-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function renderOption({ id, value, label, selected = false, disabled = false }) {
  const dis = disabled ? ' aria-disabled="true" data-state="disabled"' : '';
  const checkHtml = selected
    ? `<span class="cremona-item__icon cremona-item__icon--trailing cremona-combobox__option-check" aria-hidden="true">${icon('check')}</span>`
    : '';
  return `<div class="cremona-item cremona-combobox__option"
    id="${id}"
    data-combobox-target="option"
    data-value="${value}"
    data-hidden="false"
    role="option"
    aria-selected="${selected ? 'true' : 'false'}"${dis}>
    <span class="cremona-item__text"><span class="cremona-item__label">${label}</span></span>
    ${checkHtml}
  </div>`;
}

function renderEmpty({ headText, tailText }) {
  return `<div class="cremona-combobox__empty" data-combobox-target="empty" hidden>${headText}<strong data-combobox-target="emptyQuery"></strong>${tailText}</div>`;
}

function renderCombobox({ name, value = '', placeholder = '', size = 'md', disabled = false, invalid = false, options, labelledBy = null, describedBy = null, emptyHead, emptyTail }) {
  const id = nextId();
  const selectedOpt = options.find((o) => o.value === value && value !== '');
  const initialInputValue = selectedOpt ? selectedOpt.label : '';
  const optionsHtml = options.map((o, i) => renderOption({
    id: `${id}-opt-${i + 1}`,
    value: o.value,
    label: o.label,
    selected: o.value === value && value !== '',
    disabled: !!o.disabled,
  })).join('');
  return `
    <div class="cremona-popover cremona-combobox"
      data-controller="popover combobox"
      data-action="keydown.esc@window->popover#close keydown->combobox#keydown input->combobox#filter focus->combobox#openOnFocus click->combobox#onOptionClick"
      data-popover-placement-value="bottom-start"
      data-popover-offset-value="4"
      data-popover-open-value="false"
      data-combobox-value-value="${value}"
      data-combobox-placeholder-value="${placeholder}"
      data-combobox-query-value="">
      <div class="cremona-combobox__wrap">
        <input type="text" class="cremona-combobox__input"
          data-popover-target="trigger"
          data-combobox-target="input"
          data-size="${size}"
          role="combobox"
          autocomplete="off"
          spellcheck="false"
          value="${initialInputValue}"
          placeholder="${placeholder}"
          ${disabled ? 'disabled' : ''}
          ${invalid ? 'aria-invalid="true"' : ''}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-controls="${id}-listbox"
          ${labelledBy ? `aria-labelledby="${labelledBy}"` : ''}
          ${describedBy ? `aria-describedby="${describedBy}"` : ''}>
        <span class="cremona-combobox__chevron" aria-hidden="true">${icon('chevron-down', 'sm')}</span>
      </div>
      <input type="hidden" name="${name}" value="${value}" data-combobox-target="hiddenInput">
      <div id="${id}-listbox"
        class="cremona-popover__content cremona-combobox__listbox"
        data-popover-target="content"
        data-state="closed"
        data-placement="bottom-start"
        role="listbox"
        ${labelledBy ? `aria-labelledby="${labelledBy}"` : ''}
        hidden>
        <div class="cremona-combobox__options" data-combobox-target="optionsContainer">${optionsHtml}</div>
        ${renderEmpty({ headText: emptyHead, tailText: emptyTail })}
      </div>
    </div>
  `;
}

function S(key) { return t('theme.combobox.story.' + key); }

const langOptions = [
  { value: 'fr', label: S('sample.lang-fr') },
  { value: 'en', label: S('sample.lang-en') },
  { value: 'de', label: S('sample.lang-de') },
  { value: 'es', label: S('sample.lang-es') },
  { value: 'it', label: S('sample.lang-it') },
  { value: 'pt', label: S('sample.lang-pt') },
  { value: 'nl', label: S('sample.lang-nl') },
  { value: 'ja', label: S('sample.lang-ja') },
  { value: 'ko', label: S('sample.lang-ko') },
  { value: 'zh', label: S('sample.lang-zh') },
  { value: 'ar', label: S('sample.lang-ar'), disabled: true },
  { value: 'he', label: S('sample.lang-he') },
];

const emptyHead = S('empty.head');
const emptyTail = S('empty.tail');

const bodyHtml = `
  <section class="cbx-story" data-testid="combobox-root">
    <header class="cbx-story__header">
      <h1>${t('theme.combobox.story.title')}</h1>
      <p>${t('theme.combobox.story.subtitle')}</p>
    </header>

    <section class="cbx-story__section" aria-labelledby="cbx-section-default">
      <h2 id="cbx-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.combobox.story.section.default')}</h2>
      <p class="cbx-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.combobox.story.explainer.default')}</p>
      <div class="cbx-story__row">
        ${renderCombobox({ name: 'lang-default', placeholder: S('sample.placeholder'), options: langOptions, emptyHead, emptyTail })}
      </div>
    </section>

    <section class="cbx-story__section" aria-labelledby="cbx-section-ssr">
      <h2 id="cbx-section-ssr" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.combobox.story.section.ssr')}</h2>
      <p class="cbx-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.combobox.story.explainer.ssr')}</p>
      <div class="cbx-story__row">
        ${renderCombobox({ name: 'lang-ssr', value: 'en', placeholder: S('sample.placeholder'), options: langOptions, emptyHead, emptyTail })}
      </div>
    </section>

    <section class="cbx-story__section" aria-labelledby="cbx-section-filter">
      <h2 id="cbx-section-filter" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.combobox.story.section.filter')}</h2>
      <p class="cbx-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.combobox.story.explainer.filter')}</p>
      <div class="cbx-story__row">
        ${renderCombobox({ name: 'lang-filter', placeholder: S('sample.placeholder-filter'), options: langOptions, emptyHead, emptyTail })}
      </div>
    </section>

    <section class="cbx-story__section" aria-labelledby="cbx-section-sizes">
      <h2 id="cbx-section-sizes" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.combobox.story.section.sizes')}</h2>
      <p class="cbx-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.combobox.story.explainer.sizes')}</p>
      <div class="cbx-story__row cbx-story__row--gap">
        ${renderCombobox({ name: 'sz-sm', size: 'sm', placeholder: S('sample.sz-sm'), options: langOptions, emptyHead, emptyTail })}
        ${renderCombobox({ name: 'sz-md', size: 'md', placeholder: S('sample.sz-md'), options: langOptions, emptyHead, emptyTail })}
        ${renderCombobox({ name: 'sz-lg', size: 'lg', placeholder: S('sample.sz-lg'), options: langOptions, emptyHead, emptyTail })}
      </div>
    </section>

    <section class="cbx-story__section" aria-labelledby="cbx-section-field">
      <h2 id="cbx-section-field" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.combobox.story.section.field')}</h2>
      <p class="cbx-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.combobox.story.explainer.field')}</p>
      <div class="cbx-story__row cbx-story__row--field">
        <label id="field-cbx-label" class="cremona-label" for="field-cbx-trigger">
          ${S('sample.field-label')}
          <span class="cremona-label__required" aria-hidden="true">*</span>
          <span class="sr-only">(${S('sample.field-required')})</span>
        </label>
        ${renderCombobox({
          name: 'field-lang',
          placeholder: S('sample.field-placeholder'),
          options: langOptions,
          labelledBy: 'field-cbx-label',
          describedBy: 'field-cbx-help',
          emptyHead,
          emptyTail,
        })}
        <span id="field-cbx-help" class="cbx-story__help cremona-typography" data-variant="caption" data-color="tertiary">${S('sample.field-help')}</span>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Combobox" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="cbx-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="cbx-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.cbx-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.cbx-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.cbx-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.cbx-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.cbx-story__row { display: flex; padding-block: var(--spacing-2); align-items: flex-start; max-inline-size: 320px; }
.cbx-story__row--gap { gap: var(--spacing-3); align-items: flex-end; max-inline-size: none; }
.cbx-story__row--field { display: grid; gap: var(--spacing-2); max-inline-size: 320px; }
.cbx-story__explainer { max-inline-size: 70ch; }
.cbx-story__help { display: block; }
.cbx-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
