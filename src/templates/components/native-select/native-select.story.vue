<!--
  NativeSelect story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5): default · states · sizes · optgroups · invalid.

  No Stimulus — the <select> behavior is 100% OS-native. The chevron is
  a curated Lucide chevron-down rendered via the Icon primitive's raw-svg
  glob (same pattern as Avatar's story).
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

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

function renderChevron() {
  return `<span class="theme-icon theme-native-select__chevron" data-icon="chevron-down" data-size="sm" aria-hidden="true" role="presentation">${ICONS['chevron-down'] ?? ''}</span>`;
}

function renderOption(opt, value) {
  const sel = value != null && opt.value === value ? ' selected' : '';
  const dis = opt.disabled ? ' disabled' : '';
  return `<option value="${opt.value}"${sel}${dis}>${opt.label}</option>`;
}

function renderOptgroup(group, value) {
  const opts = group.children.map((c) => renderOption(c, value)).join('');
  return `<optgroup label="${group.label}">${opts}</optgroup>`;
}

function renderNativeSelect(props = {}) {
  const {
    name, htmlId, value, options = [], size = 'md',
    required, disabled, invalid, describedBy, autocomplete, className,
  } = props;

  const wrapClasses = ['theme-native-select-wrap'];
  if (disabled) wrapClasses.push('theme-native-select-wrap--disabled');
  if (className) wrapClasses.push(className);

  const attrs = [
    `class="theme-native-select"`,
    `data-size="${size}"`,
    name ? `name="${name}"` : '',
    htmlId ? `id="${htmlId}"` : '',
    required ? `required aria-required="true"` : '',
    disabled ? `disabled` : '',
    invalid ? `aria-invalid="true"` : '',
    describedBy ? `aria-describedby="${describedBy}"` : '',
    autocomplete ? `autocomplete="${autocomplete}"` : '',
  ].filter(Boolean).join(' ');

  const optsHtml = options.map((opt) =>
    opt.children ? renderOptgroup(opt, value) : renderOption(opt, value),
  ).join('');

  return `
    <div class="${wrapClasses.join(' ')}" data-size="${size}">
      <select ${attrs}>${optsHtml}</select>
      ${renderChevron()}
    </div>
  `;
}

function row(html, label) {
  return `
    <div class="ns-story__row">
      ${label ? `<code class="ns-story__rowlabel">${label}</code>` : ''}
      <div class="ns-story__rowcontent">${html}</div>
    </div>
  `;
}

const COUNTRIES = [
  { value: '',    label: t('theme.native-select.placeholder.choose-country') },
  { value: 'fr',  label: t('theme.native-select.option.france') },
  { value: 'be',  label: t('theme.native-select.option.belgium') },
  { value: 'de',  label: t('theme.native-select.option.germany') },
  { value: 'es',  label: t('theme.native-select.option.spain') },
  { value: 'it',  label: t('theme.native-select.option.italy') },
  { value: 'nl',  label: t('theme.native-select.option.netherlands') },
];

const COUNTRIES_GROUPED = [
  { value: '', label: t('theme.native-select.placeholder.choose-country') },
  {
    label: t('theme.native-select.optgroup.europe-west'),
    children: [
      { value: 'fr', label: t('theme.native-select.option.france') },
      { value: 'be', label: t('theme.native-select.option.belgium') },
      { value: 'de', label: t('theme.native-select.option.germany') },
      { value: 'nl', label: t('theme.native-select.option.netherlands') },
    ],
  },
  {
    label: t('theme.native-select.optgroup.europe-north'),
    children: [
      { value: 'no', label: t('theme.native-select.option.norway') },
      { value: 'se', label: t('theme.native-select.option.sweden') },
    ],
  },
];

const bodyHtml = `
  <section class="ns-story" data-testid="native-select-root">
    <header class="ns-story__header">
      <h1>${t('theme.native-select.story.title')}</h1>
      <p>${t('theme.native-select.story.subtitle')}</p>
    </header>

    <section class="ns-story__section" aria-labelledby="ns-section-default">
      <h2 id="ns-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.native-select.story.section.default')}</h2>
      <div class="ns-story__stack">
        ${row(renderNativeSelect({ htmlId: 'demo-default',  options: COUNTRIES }),                 'empty')}
        ${row(renderNativeSelect({ htmlId: 'demo-selected', options: COUNTRIES, value: 'fr' }),    'selected: France')}
      </div>
    </section>

    <section class="ns-story__section" aria-labelledby="ns-section-states">
      <h2 id="ns-section-states" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.native-select.story.section.states')}</h2>
      <div class="ns-story__stack">
        ${row(renderNativeSelect({ htmlId: 'demo-state-default',  options: COUNTRIES }),                                   'default')}
        ${row(renderNativeSelect({ htmlId: 'demo-state-value',    options: COUNTRIES, value: 'de' }),                      'with value')}
        ${row(renderNativeSelect({ htmlId: 'demo-state-disabled', options: COUNTRIES, value: 'be', disabled: true }),      'disabled')}
        ${row(renderNativeSelect({ htmlId: 'demo-state-required', options: COUNTRIES, required: true }),                   'required')}
        ${row(renderNativeSelect({ htmlId: 'demo-state-invalid',  options: COUNTRIES, invalid: true, describedBy: 'demo-state-invalid-error' }), 'invalid')}
      </div>
      <p class="ns-story__explainer theme-typography" data-variant="caption" data-color="tertiary" id="demo-state-invalid-error">${t('theme.native-select.story.explainer.invalid')}</p>
    </section>

    <section class="ns-story__section" aria-labelledby="ns-section-sizes">
      <h2 id="ns-section-sizes" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.native-select.story.section.sizes')}</h2>
      <div class="ns-story__stack">
        ${row(renderNativeSelect({ htmlId: 'demo-size-sm', options: COUNTRIES, value: 'fr', size: 'sm' }), 'sm')}
        ${row(renderNativeSelect({ htmlId: 'demo-size-md', options: COUNTRIES, value: 'fr', size: 'md' }), 'md')}
        ${row(renderNativeSelect({ htmlId: 'demo-size-lg', options: COUNTRIES, value: 'fr', size: 'lg' }), 'lg')}
      </div>
    </section>

    <section class="ns-story__section" aria-labelledby="ns-section-optgroups">
      <h2 id="ns-section-optgroups" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.native-select.story.section.optgroups')}</h2>
      <p class="ns-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.native-select.story.explainer.optgroups')}</p>
      <div class="ns-story__stack">
        ${row(renderNativeSelect({ htmlId: 'demo-optgroups', options: COUNTRIES_GROUPED, value: 'fr' }), 'grouped')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/NativeSelect" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="ns-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="ns-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.ns-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.ns-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.ns-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.ns-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.ns-story__stack { display: grid; gap: var(--spacing-3); }
.ns-story__row { display: grid; grid-template-columns: minmax(140px, 180px) 1fr; gap: var(--spacing-3); align-items: center; }
.ns-story__rowlabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.ns-story__rowcontent { min-inline-size: 0; }
.ns-story__explainer { max-inline-size: 70ch; }
.ns-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
