<!--
  Auth-ForgotPassword story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (4): default · loading · rate-limited · success-email-sent.

  Anti-enumeration : the success body never confirms email existence.
  See `docs/specs/ring3/Auth-ForgotPassword.md` for the security doctrine.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderAlert({ variant = 'danger', body = '', tone = 'soft', htmlId = '' }) {
  const role = variant === 'danger' ? 'alert' : 'status';
  const iconPath = variant === 'warning'
    ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
    : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
  return `
    <div class="cremona-alert" data-variant="${variant}" data-tone="${tone}" role="${role}" id="${htmlId}">
      <span class="cremona-alert__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cremona-icon" data-size="md">${iconPath}</svg>
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
        spellcheck="false"
        required
        aria-required="true"
        ${isInvalid ? 'aria-invalid="true"' : ''}
        ${describedBy ? `aria-describedby="${describedBy}"` : ''}
      />
      ${error ? `<p id="${errorId}" class="cremona-field__error" role="alert" aria-live="polite">${error}</p>` : ''}
    </div>
  `;
}

function renderSubmitButton({ label, loading = false, disabled = false }) {
  return `
    <button
      class="cremona-button cremona-button--full-width"
      data-variant="primary"
      data-size="md"
      type="submit"
      ${disabled || loading ? 'disabled' : ''}
      ${loading ? 'aria-busy="true"' : ''}
    >
      ${loading ? `<span class="cremona-button__spinner"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9" opacity="0.25"/><path d="M21 12a9 9 0 0 1-9 9" stroke-linecap="round"/></svg></span>` : ''}
      <span class="cremona-button__label">${label}</span>
    </button>
  `;
}

function renderEmpty({ title, body, htmlId, resendHref = null, resendLabel = null }) {
  const titleId = `${htmlId}-title`;
  return `
    <div class="cremona-empty" data-size="md" role="region" aria-labelledby="${titleId}">
      <div class="cremona-empty__illustration" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cremona-empty__icon cremona-icon" data-size="xl">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      </div>
      <div class="cremona-empty__content">
        <h2 id="${titleId}" class="cremona-empty__title">${title}</h2>
        <div class="cremona-empty__body"><p>${body}</p></div>
        ${resendHref ? `<div class="cremona-empty__actions"><a class="cremona-button" data-variant="secondary" data-size="md" href="${resendHref}"><span class="cremona-button__label">${resendLabel}</span></a></div>` : ''}
      </div>
    </div>
  `;
}

function renderBackButton({ label, href }) {
  return `
    <a class="cremona-button" data-variant="link" data-size="md" href="${href}">
      <span class="cremona-button__icon cremona-button__icon--leading" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cremona-icon" data-size="sm">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12,19 5,12 12,5"/>
        </svg>
      </span>
      <span class="cremona-button__label">${label}</span>
    </a>
  `;
}

function renderAuthForgotPassword(opts = {}) {
  const {
    title = t('theme.auth.forgot-password.title'),
    subtitle = t('theme.auth.forgot-password.subtitle'),
    htmlId = 'story-auth-forgot',
    csrfToken = '<csrf-demo-token-1234>',
    emailValue = '',
    emailError = null,
    loading = false,
    backToLoginHref = '/login',
    globalError = null,
    rateLimitedNotice = null,
    successState = false,
  } = opts;

  const state = successState ? 'success'
              : loading ? 'loading'
              : rateLimitedNotice ? 'error-rate-limited'
              : (globalError || emailError) ? 'error'
              : 'default';

  const titleId = `${htmlId}-title`;

  const formContent = successState
    ? renderEmpty({
        title: t('theme.auth.forgot-password.success.title'),
        body: t('theme.auth.forgot-password.success.body'),
        htmlId: `${htmlId}-success`,
        resendHref: '/password/forgot',
        resendLabel: t('theme.auth.forgot-password.success.resend'),
      })
    : `
      <form
        class="cremona-auth-forgot-password"
        action="/password/forgot"
        method="post"
        novalidate
        data-state="${state}"
        ${loading ? 'data-loading="true"' : ''}
      >
        ${globalError ? renderAlert({ variant: 'danger', body: globalError, htmlId: `${htmlId}-global-error` }) : ''}
        ${rateLimitedNotice ? renderAlert({ variant: 'warning', body: rateLimitedNotice, htmlId: `${htmlId}-rate-limited` }) : ''}
        <input type="hidden" name="_token" value="${csrfToken}"/>
        ${renderField({
          label: t('theme.auth.forgot-password.email'),
          htmlId: `${htmlId}-email`,
          value: emailValue,
          placeholder: t('theme.auth.forgot-password.email-placeholder'),
          error: emailError,
        })}
        ${renderSubmitButton({
          label: t('theme.auth.forgot-password.submit'),
          loading,
          disabled: !!rateLimitedNotice,
        })}
      </form>
    `;

  const footerContent = backToLoginHref ? renderBackButton({
    label: t('theme.auth.forgot-password.back-to-login'),
    href: backToLoginHref,
  }) : '';

  return `
    <main class="cremona-auth-shell" data-variant="default">
      <section class="cremona-auth-shell__panel">
        <article class="cremona-card cremona-auth-shell__card" aria-labelledby="${titleId}">
          <header class="cremona-card__header cremona-auth-shell__card-header">
            <h1 id="${titleId}" class="cremona-auth-shell__title">${title}</h1>
            <p class="cremona-auth-shell__subtitle">${subtitle}</p>
          </header>
          <div class="cremona-card__body cremona-auth-shell__card-body">
            ${formContent}
          </div>
          ${footerContent ? `<footer class="cremona-card__footer cremona-auth-shell__card-footer">${footerContent}</footer>` : ''}
        </article>
      </section>
    </main>
  `;
}

const bodyHtml = `
  <section class="auth-forgot-story" data-testid="auth-forgot-root">
    <header class="auth-forgot-story__header">
      <h1>${t('theme.auth.forgot-password.story.title')}</h1>
      <p>${t('theme.auth.forgot-password.story.subtitle')}</p>
    </header>

    <section class="auth-forgot-story__section" aria-labelledby="auth-forgot-section-default">
      <h2 id="auth-forgot-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.forgot-password.story.section.default')}</h2>
      <p class="auth-forgot-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.forgot-password.story.explainer.default')}</p>
      <div class="auth-forgot-story__frame">${renderAuthForgotPassword({ htmlId: 'story-auth-forgot-default' })}</div>
    </section>

    <section class="auth-forgot-story__section" aria-labelledby="auth-forgot-section-loading">
      <h2 id="auth-forgot-section-loading" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.forgot-password.story.section.loading')}</h2>
      <p class="auth-forgot-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.forgot-password.story.explainer.loading')}</p>
      <div class="auth-forgot-story__frame">${renderAuthForgotPassword({
        htmlId: 'story-auth-forgot-loading',
        emailValue: 'marie@samurai.example.fr',
        loading: true,
      })}</div>
    </section>

    <section class="auth-forgot-story__section" aria-labelledby="auth-forgot-section-rate-limited">
      <h2 id="auth-forgot-section-rate-limited" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.forgot-password.story.section.rate-limited')}</h2>
      <p class="auth-forgot-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.forgot-password.story.explainer.rate-limited')}</p>
      <div class="auth-forgot-story__frame">${renderAuthForgotPassword({
        htmlId: 'story-auth-forgot-rate',
        emailValue: 'marie@samurai.example.fr',
        rateLimitedNotice: t('theme.auth.forgot-password.error.rate-limited').replace('{minutes}', '5'),
      })}</div>
    </section>

    <section class="auth-forgot-story__section" aria-labelledby="auth-forgot-section-success">
      <h2 id="auth-forgot-section-success" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.forgot-password.story.section.success')}</h2>
      <p class="auth-forgot-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.forgot-password.story.explainer.success')}</p>
      <div class="auth-forgot-story__frame">${renderAuthForgotPassword({
        htmlId: 'story-auth-forgot-success',
        successState: true,
      })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Auth/Forgot Password" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="auth-forgot-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="auth-forgot-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.auth-forgot-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.auth-forgot-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.auth-forgot-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.auth-forgot-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-forgot-story__explainer { max-inline-size: 70ch; }
.auth-forgot-story__frame { min-block-size: 30rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-forgot-story__frame .cremona-auth-shell { min-block-size: 100%; }
.auth-forgot-dark-wrap { background: var(--color-bg-base); }
</style>
