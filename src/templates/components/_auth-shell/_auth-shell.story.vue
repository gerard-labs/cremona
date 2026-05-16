<!--
  _auth-shell story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (3): default (single-column centered + brand + footer link)
              · with-brand-only (no footer link)
              · split (illustration aside + panel ≥ 1024 px).

  Zero Stimulus controller — the shell is layout-only. The sample form body
  is mock HTML (Field + Input + Button primitives) demonstrating the shell's
  composition surface; the 4 Auth core patterns supply their own form body
  via the `content` block of the {% embed %} composition.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderShell({
  variant = 'default',
  brand = '',
  illustration = '',
  footer = '',
  htmlId = 'story-shell',
}, content) {
  const titleId = `${htmlId}-title`;
  const classes = ['cremona-auth-shell'];
  if (variant === 'split') classes.push('cremona-auth-shell--split');

  const illustrationHtml = (variant === 'split' && illustration)
    ? `<aside class="cremona-auth-shell__illustration" aria-hidden="true">${illustration}</aside>`
    : '';
  const brandHtml = brand
    ? `<header class="cremona-auth-shell__brand">${brand}</header>`
    : '';
  const footerHtml = footer
    ? `<footer class="cremona-card__footer cremona-auth-shell__card-footer">${footer}</footer>`
    : '';

  const title = t('theme.auth-shell.story.sample.title');
  const subtitle = t('theme.auth-shell.story.sample.subtitle');

  return `
    <main class="${classes.join(' ')}" data-variant="${variant}">
      ${illustrationHtml}
      <section class="cremona-auth-shell__panel">
        ${brandHtml}
        <article class="cremona-card cremona-auth-shell__card" aria-labelledby="${titleId}">
          <header class="cremona-card__header cremona-auth-shell__card-header">
            <h1 id="${titleId}" class="cremona-auth-shell__title">${title}</h1>
            <p class="cremona-auth-shell__subtitle">${subtitle}</p>
          </header>
          <div class="cremona-card__body cremona-auth-shell__card-body">
            ${content}
          </div>
          ${footerHtml}
        </article>
      </section>
    </main>
  `;
}

const sampleBrandHtml = `<strong class="auth-shell-story__brand-text">${t('theme.auth-shell.story.sample.brand')}</strong>`;

const sampleFooterHtml = `<span>${t('theme.auth-shell.story.sample.footer-question')}</span> <a href="#" class="cremona-button" data-variant="link" data-size="md"><span class="cremona-button__label">${t('theme.auth-shell.story.sample.footer-link')}</span></a>`;

const sampleFormHtml = `
  <div class="cremona-field">
    <label class="cremona-label" for="shell-story-email">${t('theme.auth-shell.story.sample.email-label')}</label>
    <input class="cremona-input" id="shell-story-email" type="email" autocomplete="email" />
  </div>
  <div class="cremona-field">
    <label class="cremona-label" for="shell-story-password">${t('theme.auth-shell.story.sample.password-label')}</label>
    <input class="cremona-input" id="shell-story-password" type="password" autocomplete="current-password" />
  </div>
  <button class="cremona-button" data-variant="primary" data-size="md" type="submit"><span class="cremona-button__label">${t('theme.auth-shell.story.sample.submit')}</span></button>
`;

const sampleIllustrationHtml = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240" aria-hidden="true">
    <defs>
      <linearGradient id="shell-illu-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="var(--color-primary)" stop-opacity="0.85"/>
        <stop offset="1" stop-color="var(--color-accent)" stop-opacity="0.65"/>
      </linearGradient>
    </defs>
    <circle cx="120" cy="120" r="92" fill="url(#shell-illu-grad)"/>
    <circle cx="120" cy="120" r="48" fill="var(--color-bg-elevated)" opacity="0.85"/>
  </svg>
`;

const bodyHtml = `
  <section class="auth-shell-story" data-testid="auth-shell-root">
    <header class="auth-shell-story__header">
      <h1>${t('theme.auth-shell.story.title')}</h1>
      <p>${t('theme.auth-shell.story.subtitle')}</p>
    </header>

    <section class="auth-shell-story__section" aria-labelledby="auth-shell-section-default">
      <h2 id="auth-shell-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth-shell.story.section.default')}</h2>
      <p class="auth-shell-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth-shell.story.explainer.default')}</p>
      <div class="auth-shell-story__frame">
        ${renderShell({
          variant: 'default',
          brand: sampleBrandHtml,
          footer: sampleFooterHtml,
          htmlId: 'story-shell-default',
        }, sampleFormHtml)}
      </div>
    </section>

    <section class="auth-shell-story__section" aria-labelledby="auth-shell-section-with-brand-only">
      <h2 id="auth-shell-section-with-brand-only" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth-shell.story.section.with-brand-only')}</h2>
      <p class="auth-shell-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth-shell.story.explainer.with-brand-only')}</p>
      <div class="auth-shell-story__frame">
        ${renderShell({
          variant: 'default',
          brand: sampleBrandHtml,
          htmlId: 'story-shell-brand-only',
        }, sampleFormHtml)}
      </div>
    </section>

    <section class="auth-shell-story__section" aria-labelledby="auth-shell-section-split">
      <h2 id="auth-shell-section-split" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth-shell.story.section.split')}</h2>
      <p class="auth-shell-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth-shell.story.explainer.split')}</p>
      <div class="auth-shell-story__frame">
        ${renderShell({
          variant: 'split',
          brand: sampleBrandHtml,
          illustration: sampleIllustrationHtml,
          footer: sampleFooterHtml,
          htmlId: 'story-shell-split',
        }, sampleFormHtml)}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/_auth-shell" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="auth-shell-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="auth-shell-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.auth-shell-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.auth-shell-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.auth-shell-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.auth-shell-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-shell-story__explainer { max-inline-size: 70ch; }
/* Frame the shell preview so each section caps at a reasonable height and
   we don't get 100vh-per-section pushing the page to 4×100vh tall. */
.auth-shell-story__frame { min-block-size: 32rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-shell-story__frame .cremona-auth-shell { min-block-size: 100%; }
.auth-shell-story__brand { display: flex; align-items: center; gap: var(--spacing-2); }
.auth-shell-dark-wrap { background: var(--color-bg-base); }
</style>
