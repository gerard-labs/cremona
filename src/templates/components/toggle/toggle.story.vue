<!--
  Toggle story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6): default · variants · states · sizes · icon-only · with-icon.

  Stimulus `toggle` controller is booted via onMounted(boot) so click flips
  aria-pressed + dispatches `toggle` custom event.

  Visual baselines capture the at-rest state (pressed / unpressed); the
  scale-down active feedback fires only during user mousedown and isn't
  part of the snapshot.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import boldSvg          from '../../../assets/icons/menu.svg?raw';
import italicSvg        from '../../../assets/icons/edit-3.svg?raw';
import searchSvg        from '../../../assets/icons/search.svg?raw';
import heartSvg         from '../../../assets/icons/heart.svg?raw';
import starSvg          from '../../../assets/icons/star.svg?raw';
import bellSvg          from '../../../assets/icons/bell.svg?raw';
import eyeSvg           from '../../../assets/icons/eye.svg?raw';
import settingsSvg      from '../../../assets/icons/settings.svg?raw';

const ICONS = {
  menu: boldSvg,
  'edit-3': italicSvg,
  search: searchSvg,
  heart: heartSvg,
  star: starSvg,
  bell: bellSvg,
  eye: eyeSvg,
  settings: settingsSvg,
};

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

function renderToggle(props = {}) {
  const {
    label, iconLeading, pressed, size = 'md', variant = 'default',
    disabled, ariaLabel, name, value, className,
  } = props;

  const classes = ['theme-toggle'];
  if (className) classes.push(className);

  const iconHtml = iconLeading
    ? `<span class="theme-icon theme-toggle__icon" data-icon="${iconLeading}" data-size="${size === 'sm' ? 'sm' : 'md'}" aria-hidden="true" role="presentation">${ICONS[iconLeading] || ''}</span>`
    : '';
  const labelHtml = label ? `<span class="theme-toggle__label">${label}</span>` : '';

  const attrs = [
    `type="button"`,
    `class="${classes.join(' ')}"`,
    `data-size="${size}"`,
    `data-variant="${variant}"`,
    `data-controller="toggle"`,
    `data-action="click->toggle#toggle"`,
    `aria-pressed="${pressed ? 'true' : 'false'}"`,
    disabled ? `disabled` : '',
    name ? `name="${name}"` : '',
    value != null ? `value="${value}"` : '',
    ariaLabel ? `aria-label="${ariaLabel}"` : '',
  ].filter(Boolean).join(' ');

  return `<button ${attrs}>${iconHtml}${labelHtml}</button>`;
}

function row(html, label) {
  return `
    <div class="toggle-story__row">
      ${label ? `<code class="toggle-story__rowlabel">${label}</code>` : ''}
      <div class="toggle-story__rowcontent">${html}</div>
    </div>
  `;
}

const SAMPLES = {
  bold:      t('theme.toggle.sample.bold'),
  italic:    t('theme.toggle.sample.italic'),
  notify:    t('theme.toggle.sample.notify'),
  favorite:  t('theme.toggle.sample.favorite'),
  preview:   t('theme.toggle.sample.preview'),
  settings:  t('theme.toggle.sample.settings'),
};

const ARIA = {
  iconBold:  t('theme.toggle.aria.bold'),
  iconStar:  t('theme.toggle.aria.favorite'),
  iconBell:  t('theme.toggle.aria.notify'),
};

const bodyHtml = `
  <section class="toggle-story" data-testid="toggle-root">
    <header class="toggle-story__header">
      <h1>${t('theme.toggle.story.title')}</h1>
      <p>${t('theme.toggle.story.subtitle')}</p>
    </header>

    <section class="toggle-story__section" aria-labelledby="toggle-section-default">
      <h2 id="toggle-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.toggle.story.section.default')}</h2>
      <div class="toggle-story__stack">
        ${row(renderToggle({ label: SAMPLES.preview }),                  'unpressed')}
        ${row(renderToggle({ label: SAMPLES.preview, pressed: true }),   'pressed')}
      </div>
    </section>

    <section class="toggle-story__section" aria-labelledby="toggle-section-variants">
      <h2 id="toggle-section-variants" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.toggle.story.section.variants')}</h2>
      <p class="toggle-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.toggle.story.explainer.variants')}</p>
      <div class="toggle-story__stack">
        ${row(renderToggle({ label: SAMPLES.notify, variant: 'default', pressed: true }), 'default pressed')}
        ${row(renderToggle({ label: SAMPLES.notify, variant: 'accent',  pressed: true }), 'accent pressed')}
      </div>
    </section>

    <section class="toggle-story__section" aria-labelledby="toggle-section-states">
      <h2 id="toggle-section-states" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.toggle.story.section.states')}</h2>
      <div class="toggle-story__stack">
        ${row(renderToggle({ label: SAMPLES.favorite }),                                          'unpressed')}
        ${row(renderToggle({ label: SAMPLES.favorite, pressed: true }),                           'pressed')}
        ${row(renderToggle({ label: SAMPLES.favorite, disabled: true }),                          'disabled off')}
        ${row(renderToggle({ label: SAMPLES.favorite, disabled: true, pressed: true }),           'disabled on')}
      </div>
    </section>

    <section class="toggle-story__section" aria-labelledby="toggle-section-sizes">
      <h2 id="toggle-section-sizes" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.toggle.story.section.sizes')}</h2>
      <div class="toggle-story__stack">
        ${row(renderToggle({ label: SAMPLES.preview, size: 'sm' }),                  'sm (28 px)')}
        ${row(renderToggle({ label: SAMPLES.preview, size: 'md', pressed: true }),   'md (36 px) pressed')}
        ${row(renderToggle({ label: SAMPLES.preview, size: 'lg' }),                  'lg (44 px)')}
      </div>
    </section>

    <section class="toggle-story__section" aria-labelledby="toggle-section-icon-only">
      <h2 id="toggle-section-icon-only" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.toggle.story.section.icon-only')}</h2>
      <p class="toggle-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.toggle.story.explainer.icon-only')}</p>
      <div class="toggle-story__stack">
        ${row(renderToggle({ iconLeading: 'menu',  ariaLabel: ARIA.iconBold }),                        'menu (default)')}
        ${row(renderToggle({ iconLeading: 'star',  ariaLabel: ARIA.iconStar, pressed: true }),          'star pressed (default)')}
        ${row(renderToggle({ iconLeading: 'bell',  ariaLabel: ARIA.iconBell, variant: 'accent', pressed: true }), 'bell pressed (accent)')}
      </div>
    </section>

    <section class="toggle-story__section" aria-labelledby="toggle-section-with-icon">
      <h2 id="toggle-section-with-icon" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.toggle.story.section.with-icon')}</h2>
      <div class="toggle-story__stack">
        ${row(renderToggle({ iconLeading: 'eye',      label: SAMPLES.preview, pressed: true }),     'preview pressed')}
        ${row(renderToggle({ iconLeading: 'star',     label: SAMPLES.favorite }),                    'favorite (off)')}
        ${row(renderToggle({ iconLeading: 'settings', label: SAMPLES.settings, variant: 'accent' }), 'settings (accent off)')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Toggle" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="toggle-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="toggle-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.toggle-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.toggle-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.toggle-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.toggle-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.toggle-story__stack { display: grid; gap: var(--spacing-3); }
.toggle-story__row { display: grid; grid-template-columns: minmax(180px, 220px) 1fr; gap: var(--spacing-3); align-items: center; }
.toggle-story__rowlabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.toggle-story__rowcontent { min-inline-size: 0; }
.toggle-story__explainer { max-inline-size: 70ch; }
.toggle-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
