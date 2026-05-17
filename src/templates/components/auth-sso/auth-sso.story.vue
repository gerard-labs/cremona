<!--
  Auth-SSO story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (4): default · server-flash-error · loading · with-prefill-and-password-fallback

  Zero Stimulus controller — Auth-SSO is a pure server-rendered form.
  Story manually mirrors the Twig template's output.

  See `docs/specs/ring3/Auth-SSO.md` for the full state matrix.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import iconAlertCircleRaw from '../../../assets/icons/alert-circle.svg?raw';

setTranslations('fr', frDict);
setLocale('fr');

function renderAlert({ body = '', htmlId = '' }) {
  return `
    <div class="cremona-alert" data-variant="danger" data-tone="soft" role="alert" id="${htmlId}">
      <span class="cremona-alert__icon" aria-hidden="true">
        <span class="cremona-icon" data-size="md">${iconAlertCircleRaw}</span>
      </span>
      <div class="cremona-alert__content"><p class="cremona-alert__body">${body}</p></div>
    </div>
  `;
}

function renderField({ label, htmlId, value = '', placeholder = '', error = null }) {
  const errorId = `${htmlId}-error`;
  const describedBy = error ? errorId : '';
  const isInvalid = !!error;
  const fieldClasses = ['cremona-field'];
  if (isInvalid) fieldClasses.push('cremona-field--invalid');

  return `
    <div class="${fieldClasses.join(' ')}">
      <label class="cremona-label" data-size="sm" for="${htmlId}">
        <span class="cremona-label__text">${label}</span>
        <span class="cremona-label__required" aria-hidden="true">*</span>
      </label>
      <input
        class="cremona-input"
        data-size="md"
        id="${htmlId}"
        type="email"
        name="email"
        value="${value}"
        ${placeholder ? `placeholder="${placeholder}"` : ''}
        autocomplete="email"
        inputmode="email"
        required
        aria-required="true"
        ${isInvalid ? 'aria-invalid="true"' : ''}
        ${describedBy ? `aria-describedby="${describedBy}"` : ''}
        spellcheck="false"
      />
      ${error ? `<p id="${errorId}" class="cremona-field__error" role="alert" aria-live="polite">${error}</p>` : ''}
    </div>
  `;
}

function renderSubmitButton({ label, loading = false }) {
  return `
    <button
      class="cremona-button cremona-button--full-width"
      data-variant="primary"
      data-size="md"
      type="submit"
      ${loading ? 'disabled aria-busy="true"' : ''}
    >
      ${loading ? `<span class="cremona-button__spinner"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9" opacity="0.25"/><path d="M21 12a9 9 0 0 1-9 9" stroke-linecap="round"/></svg></span>` : ''}
      <span class="cremona-button__label">${label}</span>
    </button>
  `;
}

function renderLink({ label, href = '#' }) {
  return `<a class="cremona-button" data-variant="link" data-size="md" href="${href}"><span class="cremona-button__label">${label}</span></a>`;
}

function renderSSO({
  htmlId = 'story-auth-sso',
  emailValue = '',
  emailError = null,
  globalError = null,
  loading = false,
  passwordLoginHref = null,
} = {}) {
  const state = loading ? 'loading'
              : (globalError || emailError) ? 'error'
              : 'default';

  const titleId = `${htmlId}-title`;

  const formHtml = `
    <form class="cremona-auth-sso" action="/auth/sso/start" method="post" novalidate data-state="${state}" ${loading ? 'data-loading="true"' : ''}>
      ${globalError ? renderAlert({ body: globalError, htmlId: `${htmlId}-global-error` }) : ''}
      <input type="hidden" name="_token" value="csrf-demo-token-sso-1234"/>
      ${renderField({
        label: t('theme.auth.sso.email'),
        htmlId: `${htmlId}-email`,
        value: emailValue,
        placeholder: t('theme.auth.sso.email-placeholder'),
        error: emailError,
      })}
      ${renderSubmitButton({
        label: t('theme.auth.sso.submit'),
        loading,
      })}
    </form>
  `;

  const footerHtml = passwordLoginHref
    ? `<span class="cremona-auth-sso__footer-question">${t('theme.auth.sso.password-login-question')}</span>${renderLink({ label: t('theme.auth.sso.password-login-cta'), href: passwordLoginHref })}`
    : '';

  return `
    <main class="cremona-auth-shell" data-variant="default">
      <section class="cremona-auth-shell__panel">
        <article class="cremona-card cremona-auth-shell__card" aria-labelledby="${titleId}">
          <header class="cremona-card__header cremona-auth-shell__card-header">
            <h1 id="${titleId}" class="cremona-auth-shell__title">${t('theme.auth.sso.title')}</h1>
            <p class="cremona-auth-shell__subtitle">${t('theme.auth.sso.subtitle')}</p>
          </header>
          <div class="cremona-card__body cremona-auth-shell__card-body">${formHtml}</div>
          ${footerHtml ? `<footer class="cremona-card__footer cremona-auth-shell__card-footer">${footerHtml}</footer>` : ''}
        </article>
      </section>
    </main>
  `;
}

const bodyHtml = `
  <section class="auth-sso-story" data-testid="auth-sso-root">
    <header class="auth-sso-story__header">
      <h1>${t('theme.auth.sso.story.title')}</h1>
      <p>${t('theme.auth.sso.story.subtitle')}</p>
    </header>

    <section class="auth-sso-story__section" aria-labelledby="auth-sso-section-default">
      <h2 id="auth-sso-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.sso.story.section.default')}</h2>
      <p class="auth-sso-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.sso.story.explainer.default')}</p>
      <div class="auth-sso-story__frame">${renderSSO({ htmlId: 'story-auth-sso-default' })}</div>
    </section>

    <section class="auth-sso-story__section" aria-labelledby="auth-sso-section-no-config">
      <h2 id="auth-sso-section-no-config" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.sso.story.section.no-config')}</h2>
      <p class="auth-sso-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.sso.story.explainer.no-config')}</p>
      <div class="auth-sso-story__frame">${renderSSO({
        htmlId: 'story-auth-sso-no-config',
        emailValue: 'jean.dupont@gmail.com',
        globalError: t('theme.auth.sso.error.no-config'),
      })}</div>
    </section>

    <section class="auth-sso-story__section" aria-labelledby="auth-sso-section-loading">
      <h2 id="auth-sso-section-loading" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.sso.story.section.loading')}</h2>
      <p class="auth-sso-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.sso.story.explainer.loading')}</p>
      <div class="auth-sso-story__frame">${renderSSO({
        htmlId: 'story-auth-sso-loading',
        emailValue: 'marie.martin@acme.example.com',
        loading: true,
      })}</div>
    </section>

    <section class="auth-sso-story__section" aria-labelledby="auth-sso-section-fallback">
      <h2 id="auth-sso-section-fallback" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.sso.story.section.fallback')}</h2>
      <p class="auth-sso-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.sso.story.explainer.fallback')}</p>
      <div class="auth-sso-story__frame">${renderSSO({
        htmlId: 'story-auth-sso-fallback',
        emailValue: 'alex.bernard@samurai.example.fr',
        passwordLoginHref: '/login',
      })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Auth/SSO" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="auth-sso-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="auth-sso-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.auth-sso-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.auth-sso-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.auth-sso-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.auth-sso-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-sso-story__explainer { max-inline-size: 70ch; }
.auth-sso-story__frame { min-block-size: 32rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-sso-story__frame .cremona-auth-shell { min-block-size: 100%; }
.auth-sso-dark-wrap { background: var(--color-bg-base); }
</style>
