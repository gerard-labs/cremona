<!--
  ToggleGroup story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6): single mode · multi mode · variants · sizes · orientation
  · disabled.

  Stimulus controllers (`toggle` per item + `toggle-group` per group) are
  booted via onMounted(boot). The group controller manages:
    - roving tabindex (one tabbable Toggle at a time)
    - arrow nav (Left/Right horizontal, Up/Down vertical)
    - mutex in single mode (auto-unpress others on press)

  Visual baselines capture the at-rest state of the segmented-control look.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import menuSvg     from '../../../assets/icons/menu.svg?raw';
import searchSvg   from '../../../assets/icons/search.svg?raw';
import settingsSvg from '../../../assets/icons/settings.svg?raw';
import bellSvg     from '../../../assets/icons/bell.svg?raw';
import eyeSvg      from '../../../assets/icons/eye.svg?raw';
import heartSvg    from '../../../assets/icons/heart.svg?raw';
import starSvg     from '../../../assets/icons/star.svg?raw';

const ICONS = {
  menu: menuSvg,
  search: searchSvg,
  settings: settingsSvg,
  bell: bellSvg,
  eye: eyeSvg,
  heart: heartSvg,
  star: starSvg,
};

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

function renderToggle(option, { size, variant }) {
  const iconHtml = option.iconLeading
    ? `<span class="cremona-icon cremona-toggle__icon" data-icon="${option.iconLeading}" data-size="${size === 'sm' ? 'sm' : 'md'}" aria-hidden="true" role="presentation">${ICONS[option.iconLeading] || ''}</span>`
    : '';
  const labelHtml = option.label ? `<span class="cremona-toggle__label">${option.label}</span>` : '';
  const attrs = [
    `type="button"`,
    `class="cremona-toggle cremona-toggle-group__item"`,
    `data-size="${size}"`,
    `data-variant="${variant}"`,
    `data-controller="toggle"`,
    `data-action="click->toggle#toggle"`,
    `aria-pressed="${option.pressed ? 'true' : 'false'}"`,
    option.disabled ? `disabled` : '',
    option.ariaLabel ? `aria-label="${option.ariaLabel}"` : '',
  ].filter(Boolean).join(' ');
  return `<button ${attrs}>${iconHtml}${labelHtml}</button>`;
}

function renderToggleGroup(props = {}) {
  const {
    label, htmlId, options = [], mode = 'single', orientation = 'horizontal',
    size = 'md', variant = 'default', disabled, hideLabel, className,
  } = props;
  const id = htmlId || ('tg-' + Math.random().toString(36).slice(2, 9));
  const labelId = id + '-label';
  const classes = ['cremona-toggle-group'];
  if (className) classes.push(className);
  const labelClasses = ['cremona-toggle-group__label'];
  if (hideLabel) labelClasses.push('cremona-sr-only');

  const items = options.map((opt) => renderToggle({
    ...opt,
    disabled: disabled || opt.disabled,
  }, { size, variant })).join('');

  return `
    <div class="cremona-toggle-group-wrap" data-orientation="${orientation}">
      <span id="${labelId}" class="${labelClasses.join(' ')}">${label}</span>
      <div class="${classes.join(' ')}"
        role="group"
        aria-labelledby="${labelId}"
        data-controller="toggle-group"
        data-action="keydown->toggle-group#keydown toggle->toggle-group#onToggle"
        data-toggle-group-mode-value="${mode}"
        data-toggle-group-orientation-value="${orientation}"
        data-orientation="${orientation}"
        data-size="${size}"
        data-variant="${variant}">${items}</div>
    </div>`;
}

function row(html, label) {
  return `
    <div class="togglegroup-story__row">
      ${label ? `<code class="togglegroup-story__rowlabel">${label}</code>` : ''}
      <div class="togglegroup-story__rowcontent">${html}</div>
    </div>
  `;
}

const VIEW_OPTIONS = [
  { value: 'grid',   iconLeading: 'menu',     ariaLabel: t('theme.toggle-group.aria.view-grid'), pressed: true },
  { value: 'list',   iconLeading: 'menu',     ariaLabel: t('theme.toggle-group.aria.view-list') },
  { value: 'kanban', iconLeading: 'settings', ariaLabel: t('theme.toggle-group.aria.view-kanban') },
];

const FORMAT_OPTIONS = [
  { value: 'bold',      iconLeading: 'menu', ariaLabel: t('theme.toggle-group.aria.format-bold'),      pressed: true },
  { value: 'italic',    iconLeading: 'eye',  ariaLabel: t('theme.toggle-group.aria.format-italic'),    pressed: true },
  { value: 'underline', iconLeading: 'star', ariaLabel: t('theme.toggle-group.aria.format-underline') },
];

const DENSITY_OPTIONS = [
  { value: 'comfortable', label: t('theme.toggle-group.option.density-comfortable') },
  { value: 'cozy',        label: t('theme.toggle-group.option.density-cozy'), pressed: true },
  { value: 'compact',     label: t('theme.toggle-group.option.density-compact') },
];

const VERTICAL_OPTIONS = [
  { value: 'inbox',    iconLeading: 'bell',   ariaLabel: t('theme.toggle-group.aria.tab-inbox') },
  { value: 'starred',  iconLeading: 'star',   ariaLabel: t('theme.toggle-group.aria.tab-starred'), pressed: true },
  { value: 'archive',  iconLeading: 'heart',  ariaLabel: t('theme.toggle-group.aria.tab-archive') },
];

const bodyHtml = `
  <section class="togglegroup-story" data-testid="togglegroup-root">
    <header class="togglegroup-story__header">
      <h1>${t('theme.toggle-group.story.title')}</h1>
      <p>${t('theme.toggle-group.story.subtitle')}</p>
    </header>

    <section class="togglegroup-story__section" aria-labelledby="tg-section-single">
      <h2 id="tg-section-single" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.toggle-group.story.section.single')}</h2>
      <p class="togglegroup-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.toggle-group.story.explainer.single')}</p>
      <div class="togglegroup-story__stack">
        ${row(renderToggleGroup({ label: t('theme.toggle-group.label.view'), htmlId: 'tg-view', options: VIEW_OPTIONS, mode: 'single', variant: 'accent' }), 'view switcher (icon-only, accent)')}
        ${row(renderToggleGroup({ label: t('theme.toggle-group.label.density'), htmlId: 'tg-density', options: DENSITY_OPTIONS, mode: 'single' }), 'density (text, default)')}
      </div>
    </section>

    <section class="togglegroup-story__section" aria-labelledby="tg-section-multi">
      <h2 id="tg-section-multi" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.toggle-group.story.section.multi')}</h2>
      <p class="togglegroup-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.toggle-group.story.explainer.multi')}</p>
      <div class="togglegroup-story__stack">
        ${row(renderToggleGroup({ label: t('theme.toggle-group.label.format'), htmlId: 'tg-format', options: FORMAT_OPTIONS, mode: 'multi' }), 'text format (bold + italic pressed, multi)')}
      </div>
    </section>

    <section class="togglegroup-story__section" aria-labelledby="tg-section-variants">
      <h2 id="tg-section-variants" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.toggle-group.story.section.variants')}</h2>
      <div class="togglegroup-story__stack">
        ${row(renderToggleGroup({ label: t('theme.toggle-group.label.density'), htmlId: 'tg-var-def', options: DENSITY_OPTIONS, mode: 'single', variant: 'default' }), 'default variant')}
        ${row(renderToggleGroup({ label: t('theme.toggle-group.label.density'), htmlId: 'tg-var-acc', options: DENSITY_OPTIONS, mode: 'single', variant: 'accent' }),  'accent variant')}
      </div>
    </section>

    <section class="togglegroup-story__section" aria-labelledby="tg-section-sizes">
      <h2 id="tg-section-sizes" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.toggle-group.story.section.sizes')}</h2>
      <div class="togglegroup-story__stack">
        ${row(renderToggleGroup({ label: t('theme.toggle-group.label.density'), htmlId: 'tg-sz-sm', options: DENSITY_OPTIONS, mode: 'single', size: 'sm' }), 'sm')}
        ${row(renderToggleGroup({ label: t('theme.toggle-group.label.density'), htmlId: 'tg-sz-md', options: DENSITY_OPTIONS, mode: 'single', size: 'md' }), 'md')}
        ${row(renderToggleGroup({ label: t('theme.toggle-group.label.density'), htmlId: 'tg-sz-lg', options: DENSITY_OPTIONS, mode: 'single', size: 'lg' }), 'lg')}
      </div>
    </section>

    <section class="togglegroup-story__section" aria-labelledby="tg-section-orientation">
      <h2 id="tg-section-orientation" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.toggle-group.story.section.orientation')}</h2>
      <p class="togglegroup-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.toggle-group.story.explainer.orientation')}</p>
      <div class="togglegroup-story__stack">
        ${row(renderToggleGroup({ label: t('theme.toggle-group.label.tabs'), htmlId: 'tg-vertical', options: VERTICAL_OPTIONS, mode: 'single', orientation: 'vertical', variant: 'accent' }), 'vertical (sidebar tabs)')}
      </div>
    </section>

    <section class="togglegroup-story__section" aria-labelledby="tg-section-disabled">
      <h2 id="tg-section-disabled" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.toggle-group.story.section.disabled')}</h2>
      <div class="togglegroup-story__stack">
        ${row(renderToggleGroup({ label: t('theme.toggle-group.label.density'), htmlId: 'tg-dis-all',  options: DENSITY_OPTIONS, mode: 'single', disabled: true }), 'all disabled')}
        ${row(renderToggleGroup({ label: t('theme.toggle-group.label.density'), htmlId: 'tg-dis-some', options: DENSITY_OPTIONS.map((o, i) => ({ ...o, disabled: i === 2 })), mode: 'single' }), 'compact disabled only')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Toggle Group" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="togglegroup-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="togglegroup-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.togglegroup-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.togglegroup-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.togglegroup-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.togglegroup-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.togglegroup-story__stack { display: grid; gap: var(--spacing-4); }
.togglegroup-story__row { display: grid; grid-template-columns: minmax(200px, 240px) 1fr; gap: var(--spacing-3); align-items: center; }
.togglegroup-story__rowlabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.togglegroup-story__rowcontent { min-inline-size: 0; }
.togglegroup-story__explainer { max-inline-size: 70ch; }
.togglegroup-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
