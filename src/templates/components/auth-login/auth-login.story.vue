<!--
  Auth-Login story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (6): default · with-server-flash · error-inline · rate-limited
                · loading-submit · pre-fill + +30% FR + RTL.

  Zero Stimulus controller — Auth-Login is a pure server-rendered form
  (OQ-55 doctrine). The story manually mirrors the Twig template's output
  via the renderAuthLogin() helper below (consistent with the Card / Empty
  / Dialog story precedent).

  See `docs/specs/ring3/Auth-Login.md` for the full state matrix.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderAlert({ variant = 'danger', body = '', tone = 'soft', htmlId = '' }) {
  const role = variant === 'danger' ? 'alert' : 'status';
  const iconName = variant === 'warning' ? 'alert-triangle' : (variant === 'danger' ? 'alert-circle' : 'info');
  return `
    <div class="cremona-alert" data-variant="${variant}" data-tone="${tone}" role="${role}" id="${htmlId}">
      <span class="cremona-alert__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cremona-icon" data-size="md">
          ${iconName === 'alert-circle' ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' : ''}
          ${iconName === 'alert-triangle' ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' : ''}
        </svg>
      </span>
      <div class="cremona-alert__content"><p class="cremona-alert__body">${body}</p></div>
    </div>
  `;
}

function renderField({ label, htmlId, type = 'email', name, value = '', placeholder = '', autocomplete = '', inputmode = '', error = null }) {
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
        type="${type}"
        name="${name}"
        value="${value}"
        ${placeholder ? `placeholder="${placeholder}"` : ''}
        ${autocomplete ? `autocomplete="${autocomplete}"` : ''}
        ${inputmode ? `inputmode="${inputmode}"` : ''}
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

function renderCheckbox({ htmlId, name, label, checked = false }) {
  return `
    <label class="cremona-checkbox-row" data-size="sm">
      <span class="cremona-checkbox" data-size="sm">
        <input
          type="checkbox"
          class="cremona-checkbox__input"
          id="${htmlId}"
          name="${name}"
          value="1"
          ${checked ? 'checked' : ''}
        />
        <span class="cremona-checkbox__box" aria-hidden="true">
          <svg class="cremona-checkbox__glyph cremona-checkbox__glyph--check" viewBox="0 0 16 16" fill="none">
            <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </span>
      <span class="cremona-checkbox-row__text">
        <span class="cremona-checkbox-row__label">${label}</span>
      </span>
    </label>
  `;
}

function renderLink({ label, href = '#', size = 'md', className = '' }) {
  return `
    <a class="cremona-button ${className}" data-variant="link" data-size="${size}" href="${href}">
      <span class="cremona-button__label">${label}</span>
    </a>
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

function renderAuthLogin(opts = {}) {
  const {
    title = t('theme.auth.login.title'),
    subtitle = t('theme.auth.login.subtitle'),
    htmlId = 'story-auth-login',
    csrfToken = '<csrf-demo-token-1234>',
    emailValue = '',
    emailError = null,
    passwordError = null,
    rememberChecked = false,
    loading = false,
    forgotHref = '/password/forgot',
    registerHref = '/register',
    globalError = null,
    rateLimitedNotice = null,
  } = opts;

  const state = loading ? 'loading'
              : rateLimitedNotice ? 'error-rate-limited'
              : (globalError || emailError || passwordError) ? 'error'
              : 'default';

  const titleId = `${htmlId}-title`;
  const formContent = `
    <form
      class="cremona-auth-login"
      action="/login"
      method="post"
      novalidate
      data-state="${state}"
      ${loading ? 'data-loading="true"' : ''}
    >
      ${globalError ? renderAlert({ variant: 'danger', body: globalError, htmlId: `${htmlId}-global-error` }) : ''}
      ${rateLimitedNotice ? renderAlert({ variant: 'warning', body: rateLimitedNotice, htmlId: `${htmlId}-rate-limited` }) : ''}
      <input type="hidden" name="_token" value="${csrfToken}"/>
      ${renderField({
        label: t('theme.auth.login.email'),
        htmlId: `${htmlId}-email`,
        type: 'email',
        name: 'email',
        value: emailValue,
        placeholder: t('theme.auth.login.email-placeholder'),
        autocomplete: 'email',
        inputmode: 'email',
        error: emailError,
      })}
      ${renderField({
        label: t('theme.auth.login.password'),
        htmlId: `${htmlId}-password`,
        type: 'password',
        name: 'password',
        autocomplete: 'current-password',
        error: passwordError,
      })}
      <div class="cremona-auth-login__row">
        ${renderCheckbox({
          htmlId: `${htmlId}-remember`,
          name: 'remember_me',
          label: t('theme.auth.login.remember'),
          checked: rememberChecked,
        })}
        ${renderLink({
          label: t('theme.auth.login.forgot'),
          href: forgotHref,
          size: 'sm',
          className: 'cremona-auth-login__forgot',
        })}
      </div>
      ${renderSubmitButton({
        label: t('theme.auth.login.submit'),
        loading,
        disabled: !!rateLimitedNotice,
      })}
    </form>
  `;

  const footerContent = registerHref ? `
    <span class="cremona-auth-login__footer-question">${t('theme.auth.login.no-account')}</span>
    ${renderLink({ label: t('theme.auth.login.register'), href: registerHref })}
  ` : '';

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
  <section class="auth-login-story" data-testid="auth-login-root">
    <header class="auth-login-story__header">
      <h1>${t('theme.auth.login.story.title')}</h1>
      <p>${t('theme.auth.login.story.subtitle')}</p>
    </header>

    <section class="auth-login-story__section" aria-labelledby="auth-login-section-default">
      <h2 id="auth-login-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.login.story.section.default')}</h2>
      <p class="auth-login-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.login.story.explainer.default')}</p>
      <div class="auth-login-story__frame">${renderAuthLogin({ htmlId: 'story-auth-login-default' })}</div>
    </section>

    <section class="auth-login-story__section" aria-labelledby="auth-login-section-server-flash">
      <h2 id="auth-login-section-server-flash" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.login.story.section.server-flash')}</h2>
      <p class="auth-login-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.login.story.explainer.server-flash')}</p>
      <div class="auth-login-story__frame">${renderAuthLogin({
        htmlId: 'story-auth-login-flash',
        emailValue: 'alice@example.com',
        globalError: t('theme.auth.login.error.credentials'),
      })}</div>
    </section>

    <section class="auth-login-story__section" aria-labelledby="auth-login-section-error-inline">
      <h2 id="auth-login-section-error-inline" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.login.story.section.error-inline')}</h2>
      <p class="auth-login-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.login.story.explainer.error-inline')}</p>
      <div class="auth-login-story__frame">${renderAuthLogin({
        htmlId: 'story-auth-login-inline',
        emailValue: 'pas-un-email',
        emailError: t('theme.auth.login.error.email-format'),
      })}</div>
    </section>

    <section class="auth-login-story__section" aria-labelledby="auth-login-section-rate-limited">
      <h2 id="auth-login-section-rate-limited" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.login.story.section.rate-limited')}</h2>
      <p class="auth-login-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.login.story.explainer.rate-limited')}</p>
      <div class="auth-login-story__frame">${renderAuthLogin({
        htmlId: 'story-auth-login-rate',
        rateLimitedNotice: t('theme.auth.login.error.rate-limited').replace('{minutes}', '5'),
      })}</div>
    </section>

    <section class="auth-login-story__section" aria-labelledby="auth-login-section-loading">
      <h2 id="auth-login-section-loading" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.login.story.section.loading')}</h2>
      <p class="auth-login-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.login.story.explainer.loading')}</p>
      <div class="auth-login-story__frame">${renderAuthLogin({
        htmlId: 'story-auth-login-loading',
        loading: true,
      })}</div>
    </section>

    <section class="auth-login-story__section" aria-labelledby="auth-login-section-prefill">
      <h2 id="auth-login-section-prefill" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.login.story.section.prefill')}</h2>
      <p class="auth-login-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.login.story.explainer.prefill')}</p>
      <div class="auth-login-story__frame">${renderAuthLogin({
        htmlId: 'story-auth-login-prefill',
        emailValue: 'marie.dupont@samurai.example.fr',
        rememberChecked: true,
      })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Auth-Login" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="auth-login-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="auth-login-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.auth-login-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.auth-login-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.auth-login-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.auth-login-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-login-story__explainer { max-inline-size: 70ch; }
.auth-login-story__frame { min-block-size: 32rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-login-story__frame .cremona-auth-shell { min-block-size: 100%; }
.auth-login-dark-wrap { background: var(--color-bg-base); }
</style>
