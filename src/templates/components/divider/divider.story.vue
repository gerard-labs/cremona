<!--
  Divider story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5): plain (no content) · with-label · with-icon · with-both
                · vertical · variants (solid/dashed/dotted) · semantic.

  Zero Stimulus controller. Pure CSS layout via flexbox: two flex-grow
  line segments framing the center content. Logical CSS so RTL works
  without any direction-specific rule.

  Visual baselines capture the at-rest line + content composition.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

import optionSvg  from '../../../assets/icons/option.svg?raw';
import starSvg    from '../../../assets/icons/star.svg?raw';

const ICONS = { option: optionSvg, star: starSvg };

setTranslations('fr', frDict);
setLocale('fr');

function icon(name) {
  return `<span class="cremona-icon cremona-divider__icon" data-icon="${name}" data-size="sm" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function renderDivider(props = {}) {
  const { label, icon: iconName, orientation = 'horizontal', variant = 'solid', decorative = true } = props;
  const hasCenter = label || iconName;
  const classes = ['cremona-divider'];
  if (hasCenter) classes.push('cremona-divider--with-content');
  if (variant === 'dashed') classes.push('cremona-divider--dashed');
  if (variant === 'dotted') classes.push('cremona-divider--dotted');

  const ariaAttrs = decorative
    ? 'role="presentation" aria-hidden="true"'
    : `role="separator" aria-orientation="${orientation}"`;

  const contentHtml = hasCenter ? `
    <span class="cremona-divider__line" aria-hidden="true"></span>
    <span class="cremona-divider__content">
      ${iconName ? icon(iconName) : ''}
      ${label ? `<span class="cremona-divider__label">${label}</span>` : ''}
    </span>
    <span class="cremona-divider__line" aria-hidden="true"></span>
  ` : '';

  return `<div class="${classes.join(' ')}" data-orientation="${orientation}" ${ariaAttrs}>${contentHtml}</div>`;
}

function block(html, label) {
  return `
    <div class="divider-story__block">
      ${label ? `<code class="divider-story__blocklabel">${label}</code>` : ''}
      <div class="divider-story__blockcontent">${html}</div>
    </div>
  `;
}

const SAMPLES = {
  or: t('theme.divider.story.label.or'),
  recentArticles: t('theme.divider.story.label.recent-articles'),
  options: t('theme.divider.story.label.options'),
  favorite: t('theme.divider.story.label.favorite'),
};

const bodyHtml = `
  <section class="divider-story" data-testid="divider-root">
    <header class="divider-story__header">
      <h1>${t('theme.divider.story.title')}</h1>
      <p>${t('theme.divider.story.subtitle')}</p>
    </header>

    <section class="divider-story__section" aria-labelledby="div-section-plain">
      <h2 id="div-section-plain" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.divider.story.section.plain')}</h2>
      <div class="divider-story__stack">
        ${block(renderDivider(), 'horizontal solid (no content)')}
        ${block(renderDivider({ variant: 'dashed' }), 'horizontal dashed')}
        ${block(renderDivider({ variant: 'dotted' }), 'horizontal dotted')}
      </div>
    </section>

    <section class="divider-story__section" aria-labelledby="div-section-with-label">
      <h2 id="div-section-with-label" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.divider.story.section.with-label')}</h2>
      <p class="divider-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.divider.story.explainer.with-label')}</p>
      <div class="divider-story__stack">
        ${block(renderDivider({ label: SAMPLES.or }), '"ou" (auth pattern)')}
        ${block(renderDivider({ label: SAMPLES.recentArticles }), 'section header')}
      </div>
    </section>

    <section class="divider-story__section" aria-labelledby="div-section-with-icon">
      <h2 id="div-section-with-icon" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.divider.story.section.with-icon')}</h2>
      <div class="divider-story__stack">
        ${block(renderDivider({ icon: 'star' }), 'icon only (star)')}
        ${block(renderDivider({ icon: 'option', label: SAMPLES.options }), 'icon + label')}
      </div>
    </section>

    <section class="divider-story__section" aria-labelledby="div-section-vertical">
      <h2 id="div-section-vertical" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.divider.story.section.vertical')}</h2>
      <p class="divider-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.divider.story.explainer.vertical')}</p>
      <div class="divider-story__stack divider-story__row-stretch">
        <div class="divider-story__inline-row">
          <span>${t('theme.divider.story.inline.first')}</span>
          ${renderDivider({ orientation: 'vertical' })}
          <span>${t('theme.divider.story.inline.second')}</span>
          ${renderDivider({ orientation: 'vertical' })}
          <span>${t('theme.divider.story.inline.third')}</span>
        </div>
        <div class="divider-story__inline-row">
          <span>FR</span>
          ${renderDivider({ orientation: 'vertical', label: SAMPLES.or })}
          <span>EN</span>
        </div>
      </div>
    </section>

    <section class="divider-story__section" aria-labelledby="div-section-semantic">
      <h2 id="div-section-semantic" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.divider.story.section.semantic')}</h2>
      <p class="divider-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.divider.story.explainer.semantic')}</p>
      <div class="divider-story__stack">
        ${block(renderDivider({ decorative: false, label: SAMPLES.favorite }), 'role=separator (announced to SR)')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Divider" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="divider-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="divider-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.divider-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.divider-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.divider-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.divider-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.divider-story__stack { display: grid; gap: var(--spacing-5); }
.divider-story__block { display: grid; gap: var(--spacing-2); }
.divider-story__blocklabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.divider-story__blockcontent { min-inline-size: 0; }
.divider-story__explainer { max-inline-size: 70ch; }
.divider-story__inline-row { display: inline-flex; align-items: center; gap: var(--spacing-3); padding: var(--spacing-3) var(--spacing-4); background: var(--color-bg-base); border-radius: var(--radius-sm); }
.divider-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
