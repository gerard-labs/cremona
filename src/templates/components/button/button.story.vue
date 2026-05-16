<!--
  Button story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (8): default · variants · sizes · states · with-icon · loading
                · full-width · as-link.

  Zero Stimulus controller — native <button> handles Enter / Space and
  the focus ring; the kit's :where(:focus-visible) reset paints it. The
  loading state uses the Spinner primitive inline (the kit already booted
  it visually — no separate JS needed).

  Visual baselines capture the at-rest state of every variant. The
  scale(0.97) press feedback fires only during user mousedown and isn't
  part of the snapshot.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

import arrowLeftSvg   from '../../../assets/icons/arrow-left.svg?raw';
import arrowRightSvg  from '../../../assets/icons/arrow-right.svg?raw';
import chevronDownSvg from '../../../assets/icons/chevron-down.svg?raw';
import plusSvg        from '../../../assets/icons/plus.svg?raw';
import trashSvg       from '../../../assets/icons/trash-2.svg?raw';
import checkSvg       from '../../../assets/icons/check.svg?raw';
import searchSvg      from '../../../assets/icons/search.svg?raw';
import xSvg           from '../../../assets/icons/x.svg?raw';

const ICONS = {
  'arrow-left': arrowLeftSvg,
  'arrow-right': arrowRightSvg,
  'chevron-down': chevronDownSvg,
  plus: plusSvg,
  'trash-2': trashSvg,
  check: checkSvg,
  search: searchSvg,
  x: xSvg,
};

setTranslations('fr', frDict);
setLocale('fr');

function spinner(spinnerSize, inverted) {
  return `<span class="theme-spinner${inverted ? ' theme-spinner--inverted' : ''} theme-button__spinner" data-size="${spinnerSize}" role="status" aria-live="polite"><svg viewBox="0 0 50 50" aria-hidden="true" focusable="false"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" pathLength="100" stroke-dasharray="25 75"></circle></svg><span class="theme-sr-only"></span></span>`;
}

function icon(name, size, modifier) {
  const sz = size === 'sm' ? 'sm' : 'md';
  return `<span class="theme-icon theme-button__icon theme-button__icon--${modifier}" data-icon="${name}" data-size="${sz}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function renderButton(props = {}) {
  const {
    label, variant = 'primary', size = 'md', type = 'button', href,
    iconLeading, iconTrailing, loading, disabled, fullWidth,
    ariaLabel, name, value, className,
  } = props;

  const classes = ['theme-button'];
  if (fullWidth) classes.push('theme-button--full-width');
  if (className) classes.push(className);

  const spinnerSize = size === 'lg' ? 'md' : 'sm';
  const inverted = variant === 'primary' || variant === 'destructive';

  let leadingHtml = '';
  if (loading) leadingHtml = spinner(spinnerSize, inverted);
  else if (iconLeading) leadingHtml = icon(iconLeading, size, 'leading');
  const trailingHtml = iconTrailing ? icon(iconTrailing, size, 'trailing') : '';
  const labelHtml = label ? `<span class="theme-button__label">${label}</span>` : '';

  const tag = href ? 'a' : 'button';
  const attrs = [
    `class="${classes.join(' ')}"`,
    `data-variant="${variant}"`,
    `data-size="${size}"`,
    href ? `href="${href}"` : `type="${type}"`,
    !href && name ? `name="${name}"` : '',
    !href && value != null ? `value="${value}"` : '',
    disabled || loading ? (href ? 'aria-disabled="true"' : 'disabled') : '',
    loading ? `aria-busy="true"` : '',
    ariaLabel ? `aria-label="${ariaLabel}"` : '',
  ].filter(Boolean).join(' ');

  return `<${tag} ${attrs}>${leadingHtml}${labelHtml}${trailingHtml}</${tag}>`;
}

function row(html, label) {
  return `
    <div class="button-story__row">
      ${label ? `<code class="button-story__rowlabel">${label}</code>` : ''}
      <div class="button-story__rowcontent">${html}</div>
    </div>
  `;
}

const SAMPLES = {
  save: t('theme.common.actions.save'),
  cancel: t('theme.common.actions.cancel'),
  delete: t('theme.common.actions.delete'),
  confirm: t('theme.common.actions.confirm'),
  continue: t('theme.common.actions.continue'),
  back: t('theme.common.actions.back'),
  tryAgain: t('theme.common.actions.try-again'),
  createAccount: t('theme.button.sample.create-account'),
  signIn: t('theme.button.sample.sign-in'),
  newProject: t('theme.button.sample.new-project'),
  filters: t('theme.button.sample.filters'),
  seeAll: t('theme.button.sample.see-all'),
  exporting: t('theme.button.sample.exporting'),
  search: t('theme.button.sample.search'),
  learnMore: t('theme.button.sample.learn-more'),
};

const ARIA = {
  closeDialog: t('theme.button.aria.close-dialog'),
  addItem: t('theme.button.aria.add-item'),
};

const bodyHtml = `
  <section class="button-story" data-testid="button-root">
    <header class="button-story__header">
      <h1>${t('theme.button.story.title')}</h1>
      <p>${t('theme.button.story.subtitle')}</p>
    </header>

    <section class="button-story__section" aria-labelledby="button-section-default">
      <h2 id="button-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.button.story.section.default')}</h2>
      <div class="button-story__stack">
        ${row(renderButton({ label: SAMPLES.save }), 'primary md')}
        ${row(renderButton({ label: SAMPLES.cancel, variant: 'secondary' }), 'secondary md')}
      </div>
    </section>

    <section class="button-story__section" aria-labelledby="button-section-variants">
      <h2 id="button-section-variants" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.button.story.section.variants')}</h2>
      <p class="button-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.button.story.explainer.variants')}</p>
      <div class="button-story__stack">
        ${row(renderButton({ label: SAMPLES.confirm, variant: 'primary' }),     'primary')}
        ${row(renderButton({ label: SAMPLES.cancel,  variant: 'secondary' }),   'secondary')}
        ${row(renderButton({ label: SAMPLES.cancel,  variant: 'ghost' }),       'ghost')}
        ${row(renderButton({ label: SAMPLES.delete,  variant: 'destructive', iconLeading: 'trash-2' }), 'destructive (avec icône)')}
        ${row(renderButton({ label: SAMPLES.learnMore, variant: 'link' }),      'link (texte avec underline-on-hover)')}
      </div>
    </section>

    <section class="button-story__section" aria-labelledby="button-section-sizes">
      <h2 id="button-section-sizes" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.button.story.section.sizes')}</h2>
      <p class="button-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.button.story.explainer.sizes')}</p>
      <div class="button-story__stack">
        ${row(renderButton({ label: SAMPLES.save, size: 'sm' }), 'sm (32 px)')}
        ${row(renderButton({ label: SAMPLES.save, size: 'md' }), 'md (40 px — défaut)')}
        ${row(renderButton({ label: SAMPLES.save, size: 'lg' }), 'lg (48 px)')}
      </div>
    </section>

    <section class="button-story__section" aria-labelledby="button-section-states">
      <h2 id="button-section-states" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.button.story.section.states')}</h2>
      <div class="button-story__stack">
        ${row(renderButton({ label: SAMPLES.save }),                                              'default')}
        ${row(renderButton({ label: SAMPLES.save, disabled: true }),                              'disabled')}
        ${row(renderButton({ label: SAMPLES.save, variant: 'secondary', disabled: true }),        'disabled secondary')}
        ${row(renderButton({ label: SAMPLES.delete, variant: 'destructive', disabled: true }),    'disabled destructive')}
      </div>
    </section>

    <section class="button-story__section" aria-labelledby="button-section-with-icon">
      <h2 id="button-section-with-icon" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.button.story.section.with-icon')}</h2>
      <div class="button-story__stack">
        ${row(renderButton({ label: SAMPLES.newProject, iconLeading: 'plus' }),                       'leading plus')}
        ${row(renderButton({ label: SAMPLES.back, iconLeading: 'arrow-left', variant: 'secondary' }), 'leading arrow-left (RTL flip)')}
        ${row(renderButton({ label: SAMPLES.continue, iconTrailing: 'arrow-right' }),                 'trailing arrow-right (RTL flip)')}
        ${row(renderButton({ label: SAMPLES.filters, iconTrailing: 'chevron-down', variant: 'secondary' }), 'trailing chevron-down')}
        ${row(renderButton({ variant: 'ghost', iconLeading: 'x', ariaLabel: ARIA.closeDialog }), 'icon-only ghost (aria-label)')}
        ${row(renderButton({ variant: 'primary', size: 'sm', iconLeading: 'plus', ariaLabel: ARIA.addItem }), 'icon-only sm primary (aria-label)')}
      </div>
    </section>

    <section class="button-story__section" aria-labelledby="button-section-loading">
      <h2 id="button-section-loading" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.button.story.section.loading')}</h2>
      <p class="button-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.button.story.explainer.loading')}</p>
      <div class="button-story__stack">
        ${row(renderButton({ label: SAMPLES.exporting, iconLeading: 'plus', loading: true }), 'primary loading (remplace iconLeading)')}
        ${row(renderButton({ label: SAMPLES.save, loading: true }),                            'primary loading (sans iconLeading — prepend)')}
        ${row(renderButton({ label: SAMPLES.cancel, variant: 'secondary', loading: true }),    'secondary loading')}
        ${row(renderButton({ label: SAMPLES.continue, iconTrailing: 'arrow-right', loading: true }), 'iconTrailing kept during loading')}
      </div>
    </section>

    <section class="button-story__section" aria-labelledby="button-section-full-width">
      <h2 id="button-section-full-width" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.button.story.section.full-width')}</h2>
      <p class="button-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.button.story.explainer.full-width')}</p>
      <div class="button-story__stack">
        ${row(renderButton({ label: SAMPLES.createAccount, fullWidth: true }),                       'primary fullWidth')}
        ${row(renderButton({ label: SAMPLES.signIn, fullWidth: true, variant: 'secondary' }),         'secondary fullWidth')}
      </div>
    </section>

    <section class="button-story__section" aria-labelledby="button-section-as-link">
      <h2 id="button-section-as-link" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.button.story.section.as-link')}</h2>
      <p class="button-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.button.story.explainer.as-link')}</p>
      <div class="button-story__stack">
        ${row(renderButton({ label: SAMPLES.seeAll, href: '#all', iconTrailing: 'arrow-right' }), '<a> stylé comme button (primary)')}
        ${row(renderButton({ label: SAMPLES.seeAll, href: '#all', variant: 'secondary', iconTrailing: 'arrow-right' }), '<a> stylé comme secondary')}
        ${row(renderButton({ label: SAMPLES.seeAll, href: '#all', variant: 'link' }), 'variant link (texte underline)')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Button" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="button-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="button-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.button-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.button-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.button-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.button-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.button-story__stack { display: grid; gap: var(--spacing-3); }
.button-story__row { display: grid; grid-template-columns: minmax(200px, 240px) 1fr; gap: var(--spacing-3); align-items: center; }
.button-story__rowlabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.button-story__rowcontent { min-inline-size: 0; }
.button-story__explainer { max-inline-size: 70ch; }
.button-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
