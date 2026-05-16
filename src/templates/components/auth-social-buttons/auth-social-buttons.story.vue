<!--
  Auth-SocialButtons story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6): default-vertical · horizontal · single-provider
              · without-heading · composed-with-login · long-labels-rtl

  Zero Stimulus controller — Auth-SocialButtons is a pure server-rendered
  block (OQ-55 doctrine). The story manually mirrors the Twig template's
  output via the renderSocialButtons() helper below.

  Sample SVGs : illustrative geometric placeholders, NOT brand-accurate.
  Real consumer integration ships their own brand SVG via the
  `socialProviders[].icon` prop (Simple Icons / brand assets). The kit's
  Lucide curated 30-set does NOT include brand marks per OQ-52.

  See `docs/specs/ring3/Auth-SocialButtons.md` for the full state matrix.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

// Illustrative SVG placeholders — distinctly geometric so consumers
// understand they're sample shapes, not brand-accurate marks. Real
// integration ships consumer's own brand SVG.
const SAMPLE_SVG = {
  github: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="12" r="10"/></svg>`,
  google: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
  apple: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12,3 22,21 2,21"/></svg>`,
  microsoft: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>`,
};

function renderSocialButtons({
  heading = t('theme.auth.social-buttons.heading-or'),
  socialProviders = [],
  orientation = 'vertical',
  buttonVariant = 'secondary',
  size = 'md',
  htmlId = 'story-auth-social',
} = {}) {
  const headingId = `${htmlId}-heading`;
  const headingHtml = heading
    ? `<p class="cremona-auth-social-buttons__heading" id="${headingId}">${heading}</p>`
    : '';
  const listAriaLabelledBy = heading ? ` aria-labelledby="${headingId}"` : '';

  const buttonsHtml = socialProviders.map((p) => `
    <a
      class="cremona-button cremona-auth-social-button"
      data-variant="${buttonVariant}"
      data-size="${size}"
      data-social-provider="${p.name}"
      href="${p.action}"
    >
      <span class="cremona-auth-social-button__icon" aria-hidden="true">${p.icon}</span>
      <span class="cremona-button__label">${p.label}</span>
    </a>
  `).join('');

  return `
    <div class="cremona-auth-social-buttons" data-orientation="${orientation}" id="${htmlId}">
      ${headingHtml}
      <div class="cremona-auth-social-buttons__list"${listAriaLabelledBy}>
        ${buttonsHtml}
      </div>
    </div>
  `;
}

// Standard 4-provider list used by multiple sections. Labels in FR via t().
const STANDARD_PROVIDERS = [
  {
    name: 'github',
    label: t('theme.auth.social-buttons.story.sample.github'),
    icon: SAMPLE_SVG.github,
    action: '/auth/github',
  },
  {
    name: 'google',
    label: t('theme.auth.social-buttons.story.sample.google'),
    icon: SAMPLE_SVG.google,
    action: '/auth/google',
  },
  {
    name: 'apple',
    label: t('theme.auth.social-buttons.story.sample.apple'),
    icon: SAMPLE_SVG.apple,
    action: '/auth/apple',
  },
  {
    name: 'microsoft',
    label: t('theme.auth.social-buttons.story.sample.microsoft'),
    icon: SAMPLE_SVG.microsoft,
    action: '/auth/microsoft',
  },
];

const LONG_PROVIDERS = [
  {
    name: 'microsoft',
    label: t('theme.auth.social-buttons.story.sample.long-microsoft'),
    icon: SAMPLE_SVG.microsoft,
    action: '/auth/microsoft',
  },
  {
    name: 'github',
    label: t('theme.auth.social-buttons.story.sample.long-github'),
    icon: SAMPLE_SVG.github,
    action: '/auth/github',
  },
];

function renderInlineWithLogin() {
  // Auth-Login skeleton minimally inlined for composition demo (the
  // canonical Auth-Login story owns the full pattern ; here we just need
  // to demonstrate where SocialButtons drops in below the password form).
  return `
    <main class="cremona-auth-shell" data-variant="default">
      <section class="cremona-auth-shell__panel">
        <article class="cremona-card cremona-auth-shell__card" aria-labelledby="story-social-login-title">
          <header class="cremona-card__header cremona-auth-shell__card-header">
            <h1 id="story-social-login-title" class="cremona-auth-shell__title">${t('theme.auth.login.title')}</h1>
            <p class="cremona-auth-shell__subtitle">${t('theme.auth.login.subtitle')}</p>
          </header>
          <div class="cremona-card__body cremona-auth-shell__card-body">
            <form class="cremona-auth-login" data-state="default">
              <div class="cremona-field">
                <label class="cremona-label" data-size="sm" for="story-social-login-email">
                  <span class="cremona-label__text">${t('theme.auth.login.email')}</span>
                </label>
                <input class="cremona-input" data-size="md" id="story-social-login-email" type="email" autocomplete="email" placeholder="${t('theme.auth.login.email-placeholder')}"/>
              </div>
              <div class="cremona-field">
                <label class="cremona-label" data-size="sm" for="story-social-login-password">
                  <span class="cremona-label__text">${t('theme.auth.login.password')}</span>
                </label>
                <input class="cremona-input" data-size="md" id="story-social-login-password" type="password" autocomplete="current-password"/>
              </div>
              <button class="cremona-button cremona-button--full-width" data-variant="primary" data-size="md" type="submit">
                <span class="cremona-button__label">${t('theme.auth.login.submit')}</span>
              </button>
              ${renderSocialButtons({
                socialProviders: STANDARD_PROVIDERS,
                orientation: 'vertical',
                htmlId: 'story-social-login-block',
              })}
            </form>
          </div>
        </article>
      </section>
    </main>
  `;
}

const bodyHtml = `
  <section class="auth-social-buttons-story" data-testid="auth-social-buttons-root">
    <header class="auth-social-buttons-story__header">
      <h1>${t('theme.auth.social-buttons.story.title')}</h1>
      <p>${t('theme.auth.social-buttons.story.subtitle')}</p>
    </header>

    <section class="auth-social-buttons-story__section" aria-labelledby="auth-social-section-default">
      <h2 id="auth-social-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.social-buttons.story.section.default')}</h2>
      <p class="auth-social-buttons-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.social-buttons.story.explainer.default')}</p>
      <div class="auth-social-buttons-story__frame">${renderSocialButtons({
        socialProviders: STANDARD_PROVIDERS,
        htmlId: 'story-social-vertical',
      })}</div>
    </section>

    <section class="auth-social-buttons-story__section" aria-labelledby="auth-social-section-horizontal">
      <h2 id="auth-social-section-horizontal" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.social-buttons.story.section.horizontal')}</h2>
      <p class="auth-social-buttons-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.social-buttons.story.explainer.horizontal')}</p>
      <div class="auth-social-buttons-story__frame">${renderSocialButtons({
        socialProviders: STANDARD_PROVIDERS,
        orientation: 'horizontal',
        htmlId: 'story-social-horizontal',
      })}</div>
    </section>

    <section class="auth-social-buttons-story__section" aria-labelledby="auth-social-section-single">
      <h2 id="auth-social-section-single" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.social-buttons.story.section.single')}</h2>
      <p class="auth-social-buttons-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.social-buttons.story.explainer.single')}</p>
      <div class="auth-social-buttons-story__frame">${renderSocialButtons({
        socialProviders: [STANDARD_PROVIDERS[0]],
        heading: null,
        htmlId: 'story-social-single',
      })}</div>
    </section>

    <section class="auth-social-buttons-story__section" aria-labelledby="auth-social-section-no-heading">
      <h2 id="auth-social-section-no-heading" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.social-buttons.story.section.no-heading')}</h2>
      <p class="auth-social-buttons-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.social-buttons.story.explainer.no-heading')}</p>
      <div class="auth-social-buttons-story__frame">${renderSocialButtons({
        socialProviders: STANDARD_PROVIDERS.slice(0, 2),
        heading: null,
        htmlId: 'story-social-no-heading',
      })}</div>
    </section>

    <section class="auth-social-buttons-story__section" aria-labelledby="auth-social-section-composed">
      <h2 id="auth-social-section-composed" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.social-buttons.story.section.composed')}</h2>
      <p class="auth-social-buttons-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.social-buttons.story.explainer.composed')}</p>
      <div class="auth-social-buttons-story__frame auth-social-buttons-story__frame--tall">${renderInlineWithLogin()}</div>
    </section>

    <section class="auth-social-buttons-story__section" aria-labelledby="auth-social-section-long">
      <h2 id="auth-social-section-long" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.social-buttons.story.section.long')}</h2>
      <p class="auth-social-buttons-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.social-buttons.story.explainer.long')}</p>
      <div class="auth-social-buttons-story__frame">${renderSocialButtons({
        socialProviders: LONG_PROVIDERS,
        htmlId: 'story-social-long',
      })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Auth-SocialButtons" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="auth-social-buttons-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="auth-social-buttons-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.auth-social-buttons-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.auth-social-buttons-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.auth-social-buttons-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.auth-social-buttons-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-social-buttons-story__explainer { max-inline-size: 70ch; }
.auth-social-buttons-story__frame { padding: var(--spacing-6); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); max-inline-size: 26rem; }
.auth-social-buttons-story__frame--tall { max-inline-size: 26rem; min-block-size: 36rem; }
.auth-social-buttons-dark-wrap { background: var(--color-bg-base); }
</style>
