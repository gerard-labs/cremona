<!--
  Auth-MagicLink story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (2): default · with-back-and-custom-expiration

  Zero Stimulus controller — Auth-MagicLink is a pure server-rendered
  terminal page (OQ-55). Mirrors Auth-EmailVerification structure.

  Icon : `check` curated-set substitut. Tinted via the `.cremona-auth-magic-link`
  marker class to `--color-primary` (vs success for EmailVerification).

  See `docs/specs/ring3/Auth-MagicLink.md` for the full state matrix.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import iconCheckRaw from '../../../assets/icons/check.svg?raw';
import iconArrowLeftRaw from '../../../assets/icons/arrow-left.svg?raw';

setTranslations('fr', frDict);
setLocale('fr');

function renderEmpty({ title, body, htmlId, actionsHtml = '' }) {
  const titleId = `${htmlId}-title`;
  return `
    <div class="cremona-empty" data-size="lg" role="region" aria-labelledby="${titleId}">
      <div class="cremona-empty__illustration" aria-hidden="true">
        <span class="cremona-icon" data-size="xl">${iconCheckRaw}</span>
      </div>
      <div class="cremona-empty__content">
        <h1 id="${titleId}" class="cremona-empty__title">${title}</h1>
        <div class="cremona-empty__body"><p>${body}</p></div>
        ${actionsHtml ? `<div class="cremona-empty__actions">${actionsHtml}</div>` : ''}
      </div>
    </div>
  `;
}

function renderButton({ label, variant = 'secondary', href = '#', iconLeading = null }) {
  const iconHtml = iconLeading
    ? `<span class="cremona-button__icon cremona-button__icon--leading">${iconLeading}</span>`
    : '';
  return `
    <a class="cremona-button" data-variant="${variant}" data-size="md" href="${href}">
      ${iconHtml}
      <span class="cremona-button__label">${label}</span>
    </a>
  `;
}

function renderMagicLink({
  htmlId = 'story-magic-link',
  expirationMinutes = 15,
  withBackToLogin = false,
} = {}) {
  const body = t('theme.auth.magic-link.body').replace('{expirationMinutes}', expirationMinutes);
  const resendButton = renderButton({
    label: t('theme.auth.magic-link.resend-cta'),
    variant: 'secondary',
    href: '/auth/magic-link/resend',
  });
  const backToLoginButton = withBackToLogin
    ? renderButton({
        label: t('theme.auth.magic-link.back-to-login-cta'),
        variant: 'ghost',
        href: '/login',
        iconLeading: iconArrowLeftRaw,
      })
    : '';

  const actionsHtml = resendButton + backToLoginButton;
  const emptyHtml = renderEmpty({
    title: t('theme.auth.magic-link.title'),
    body,
    htmlId: `${htmlId}-empty`,
    actionsHtml,
  });

  return `
    <main class="cremona-auth-shell cremona-auth-magic-link" data-variant="default" data-testid="${htmlId}">
      <section class="cremona-auth-shell__panel">
        <article class="cremona-card cremona-auth-shell__card">
          <div class="cremona-card__body cremona-auth-shell__card-body">
            ${emptyHtml}
          </div>
        </article>
      </section>
    </main>
  `;
}

const bodyHtml = `
  <section class="auth-magic-link-story" data-testid="auth-magic-link-root">
    <header class="auth-magic-link-story__header">
      <h1>${t('theme.auth.magic-link.story.title')}</h1>
      <p>${t('theme.auth.magic-link.story.subtitle')}</p>
    </header>

    <section class="auth-magic-link-story__section" aria-labelledby="auth-magic-link-section-default">
      <h2 id="auth-magic-link-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.magic-link.story.section.default')}</h2>
      <p class="auth-magic-link-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.magic-link.story.explainer.default')}</p>
      <div class="auth-magic-link-story__frame">${renderMagicLink({ htmlId: 'story-magic-link-default' })}</div>
    </section>

    <section class="auth-magic-link-story__section" aria-labelledby="auth-magic-link-section-with-back">
      <h2 id="auth-magic-link-section-with-back" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.magic-link.story.section.with-back')}</h2>
      <p class="auth-magic-link-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.magic-link.story.explainer.with-back')}</p>
      <div class="auth-magic-link-story__frame">${renderMagicLink({
        htmlId: 'story-magic-link-back',
        expirationMinutes: 30,
        withBackToLogin: true,
      })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Auth-MagicLink" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="auth-magic-link-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="auth-magic-link-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.auth-magic-link-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.auth-magic-link-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.auth-magic-link-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.auth-magic-link-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-magic-link-story__explainer { max-inline-size: 70ch; }
.auth-magic-link-story__frame { min-block-size: 32rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-magic-link-story__frame .cremona-auth-shell { min-block-size: 100%; }
.auth-magic-link-dark-wrap { background: var(--color-bg-base); }
</style>
