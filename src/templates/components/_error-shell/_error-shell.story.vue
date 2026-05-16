<!--
  _error-shell story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (3): default-error-feel (icon Lucide sm/md size, error-feel)
              · hero-brand-feel (custom inline SVG illustration lg, brand-feel)
              · with-footer (secondary navigation link below the Empty).

  Zero Stimulus controller — the shell is layout-only. The sample inner
  content is the Empty primitive (Ring 1) demonstrating the shell's
  composition surface; the 10 Error patterns supply their own Empty body via
  the `content` block of the {% embed %} composition.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderShell({
  variant = 'default',
  htmlId = 'story-error-shell',
  footer = '',
}, content) {
  const classes = ['cremona-error-shell'];
  if (variant === 'hero') classes.push('cremona-error-shell--hero');

  const footerHtml = footer
    ? `<footer class="cremona-error-shell__footer">${footer}</footer>`
    : '';

  return `
    <main class="${classes.join(' ')}" data-variant="${variant}" id="${htmlId}">
      <section class="cremona-error-shell__panel">
        ${content}
        ${footerHtml}
      </section>
    </main>
  `;
}

function renderEmpty({
  size = 'md',
  icon = null,
  illustration = '',
  title,
  bodyHtml = '',
  actionsHtml = '',
  htmlId = 'story-error-empty',
}) {
  const titleId = `${htmlId}-title`;
  const titleTag = size === 'lg' ? 'h1' : (size === 'sm' ? 'h3' : 'h2');
  const iconSize = size === 'sm' ? 'lg' : 'xl';

  let illustrationBlock = '';
  if (illustration) {
    illustrationBlock = `<div class="cremona-empty__illustration" aria-hidden="true">${illustration}</div>`;
  } else if (icon) {
    illustrationBlock = `<div class="cremona-empty__illustration" aria-hidden="true"><span class="cremona-icon cremona-empty__icon" data-icon="${icon}" data-size="${iconSize}" aria-hidden="true" role="presentation"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg></span></div>`;
  }

  return `
    <div class="cremona-empty" data-size="${size}" role="region" aria-labelledby="${titleId}">
      ${illustrationBlock}
      <div class="cremona-empty__content">
        <${titleTag} id="${titleId}" class="cremona-empty__title">${title}</${titleTag}>
        ${bodyHtml ? `<div class="cremona-empty__body">${bodyHtml}</div>` : ''}
        ${actionsHtml ? `<div class="cremona-empty__actions">${actionsHtml}</div>` : ''}
      </div>
    </div>
  `;
}

const sampleHeroSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 200" width="200" height="160" aria-hidden="true">
    <defs>
      <linearGradient id="error-shell-illu-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="var(--color-primary)" stop-opacity="0.75"/>
        <stop offset="1" stop-color="var(--color-accent)" stop-opacity="0.55"/>
      </linearGradient>
    </defs>
    <rect x="60" y="60" rx="14" ry="14" width="120" height="100" fill="var(--color-bg-elevated)" stroke="var(--color-border-default)" stroke-width="2"/>
    <circle cx="120" cy="110" r="32" fill="url(#error-shell-illu-grad)" opacity="0.8"/>
    <rect x="76" y="78" width="36" height="6" rx="3" fill="var(--color-border-subtle)"/>
    <rect x="76" y="92" width="56" height="4" rx="2" fill="var(--color-border-subtle)"/>
  </svg>
`;

const sampleActions = `
  <a href="#" class="cremona-button" data-variant="primary" data-size="md"><span class="cremona-button__label">${t('theme.error-shell.story.sample.primary-cta')}</span></a>
  <a href="#" class="cremona-button" data-variant="ghost" data-size="md"><span class="cremona-button__label">${t('theme.error-shell.story.sample.secondary-cta')}</span></a>
`;

const sampleFooterLink = `<a href="#" class="cremona-button" data-variant="link" data-size="sm"><span class="cremona-button__label">${t('theme.error-shell.story.sample.footer-link')}</span></a>`;

const bodyHtml = `
  <section class="error-shell-story" data-testid="error-shell-root">
    <header class="error-shell-story__header">
      <h1>${t('theme.error-shell.story.title')}</h1>
      <p>${t('theme.error-shell.story.subtitle')}</p>
    </header>

    <section class="error-shell-story__section" aria-labelledby="error-shell-section-default">
      <h2 id="error-shell-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.error-shell.story.section.default')}</h2>
      <p class="error-shell-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.error-shell.story.explainer.default')}</p>
      <div class="error-shell-story__frame">
        ${renderShell({
          variant: 'default',
          htmlId: 'story-error-shell-default',
        }, renderEmpty({
          size: 'lg',
          icon: 'search',
          title: t('theme.error-shell.story.sample.error-feel-title'),
          bodyHtml: `<p>${t('theme.error-shell.story.sample.error-feel-body')}</p>`,
          actionsHtml: sampleActions,
          htmlId: 'story-error-empty-default',
        }))}
      </div>
    </section>

    <section class="error-shell-story__section" aria-labelledby="error-shell-section-hero">
      <h2 id="error-shell-section-hero" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.error-shell.story.section.hero')}</h2>
      <p class="error-shell-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.error-shell.story.explainer.hero')}</p>
      <div class="error-shell-story__frame">
        ${renderShell({
          variant: 'hero',
          htmlId: 'story-error-shell-hero',
        }, renderEmpty({
          size: 'lg',
          illustration: sampleHeroSvg,
          title: t('theme.error-shell.story.sample.brand-feel-title'),
          bodyHtml: `<p>${t('theme.error-shell.story.sample.brand-feel-body')}</p>`,
          actionsHtml: sampleActions,
          htmlId: 'story-error-empty-hero',
        }))}
      </div>
    </section>

    <section class="error-shell-story__section" aria-labelledby="error-shell-section-with-footer">
      <h2 id="error-shell-section-with-footer" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.error-shell.story.section.with-footer')}</h2>
      <p class="error-shell-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.error-shell.story.explainer.with-footer')}</p>
      <div class="error-shell-story__frame">
        ${renderShell({
          variant: 'default',
          htmlId: 'story-error-shell-with-footer',
          footer: sampleFooterLink,
        }, renderEmpty({
          size: 'lg',
          icon: 'alert-triangle',
          title: t('theme.error-shell.story.sample.with-footer-title'),
          bodyHtml: `<p>${t('theme.error-shell.story.sample.with-footer-body')}</p>`,
          actionsHtml: sampleActions,
          htmlId: 'story-error-empty-with-footer',
        }))}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Errors/_Shell" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="error-shell-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="error-shell-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.error-shell-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.error-shell-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.error-shell-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.error-shell-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.error-shell-story__explainer { max-inline-size: 70ch; }
/* Frame the shell preview so each section caps at a reasonable height and
   we don't get 100vh-per-section pushing the page to 3×100vh tall. */
.error-shell-story__frame { min-block-size: 32rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.error-shell-story__frame .cremona-error-shell { min-block-size: 100%; }
.error-shell-dark-wrap { background: var(--color-bg-base); }
</style>
