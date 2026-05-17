<!--
  Auth-AccountLocked story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (2): default · with-back-to-login

  Zero Stimulus controller — Auth-AccountLocked is a pure server-rendered
  terminal page. The story manually mirrors the Twig
  template's output via the renderAccountLocked() helper below.

  See `docs/specs/ring3/Auth-AccountLocked.md` for the full state matrix.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import iconAlertTriangleRaw from '../../../assets/icons/alert-triangle.svg?raw';
import iconArrowLeftRaw from '../../../assets/icons/arrow-left.svg?raw';

setTranslations('fr', frDict);
setLocale('fr');

function renderEmpty({ title, body, htmlId, actionsHtml = '' }) {
  const titleId = `${htmlId}-title`;
  return `
    <div class="cremona-empty" data-size="lg" role="region" aria-labelledby="${titleId}">
      <div class="cremona-empty__illustration" aria-hidden="true">
        <span class="cremona-icon" data-size="xl">${iconAlertTriangleRaw}</span>
      </div>
      <div class="cremona-empty__content">
        <h1 id="${titleId}" class="cremona-empty__title">${title}</h1>
        <div class="cremona-empty__body"><p>${body}</p></div>
        ${actionsHtml ? `<div class="cremona-empty__actions">${actionsHtml}</div>` : ''}
      </div>
    </div>
  `;
}

function renderButton({ label, variant = 'primary', href = '#', iconLeading = null }) {
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

function renderAccountLocked({
  htmlId = 'story-account-locked',
  withBackToLogin = false,
} = {}) {
  const supportButton = renderButton({
    label: t('theme.auth.account-locked.support-cta'),
    variant: 'primary',
    href: 'mailto:support@example.com',
  });
  const backToLoginButton = withBackToLogin
    ? renderButton({
        label: t('theme.auth.account-locked.back-to-login-cta'),
        variant: 'ghost',
        href: '/login',
        iconLeading: iconArrowLeftRaw,
      })
    : '';

  const actionsHtml = supportButton + backToLoginButton;
  const emptyHtml = renderEmpty({
    title: t('theme.auth.account-locked.title'),
    body: t('theme.auth.account-locked.body'),
    htmlId: `${htmlId}-empty`,
    actionsHtml,
  });

  return `
    <main class="cremona-auth-shell cremona-auth-account-locked" data-variant="default" data-testid="${htmlId}">
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
  <section class="auth-account-locked-story" data-testid="auth-account-locked-root">
    <header class="auth-account-locked-story__header">
      <h1>${t('theme.auth.account-locked.story.title')}</h1>
      <p>${t('theme.auth.account-locked.story.subtitle')}</p>
    </header>

    <section class="auth-account-locked-story__section" aria-labelledby="auth-account-locked-section-default">
      <h2 id="auth-account-locked-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.account-locked.story.section.default')}</h2>
      <p class="auth-account-locked-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.account-locked.story.explainer.default')}</p>
      <div class="auth-account-locked-story__frame">${renderAccountLocked({ htmlId: 'story-account-locked-default' })}</div>
    </section>

    <section class="auth-account-locked-story__section" aria-labelledby="auth-account-locked-section-with-back">
      <h2 id="auth-account-locked-section-with-back" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.account-locked.story.section.with-back')}</h2>
      <p class="auth-account-locked-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.account-locked.story.explainer.with-back')}</p>
      <div class="auth-account-locked-story__frame">${renderAccountLocked({
        htmlId: 'story-account-locked-back',
        withBackToLogin: true,
      })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Auth/Account Locked" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="auth-account-locked-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="auth-account-locked-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.auth-account-locked-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.auth-account-locked-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.auth-account-locked-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.auth-account-locked-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-account-locked-story__explainer { max-inline-size: 70ch; }
.auth-account-locked-story__frame { min-block-size: 32rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-account-locked-story__frame .cremona-auth-shell { min-block-size: 100%; }
.auth-account-locked-dark-wrap { background: var(--color-bg-base); }
</style>
