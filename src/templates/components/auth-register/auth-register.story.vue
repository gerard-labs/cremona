<!--
  Auth-Register story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5): default · error-email-taken · error-terms-required
                · loading-submit · success-email-sent.

  Same render-helper pattern as Auth-Login : a renderAuthRegister() function
  builds the HTML manually (the Twig template is the production rendering ;
  the story mirrors its output for visual demonstration).

  See `docs/specs/ring3/Auth-Register.md` for the state matrix.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderAlert({ variant = 'danger', body = '', tone = 'soft', htmlId = '' }) {
  const role = variant === 'danger' ? 'alert' : 'status';
  return `
    <div class="theme-alert" data-variant="${variant}" data-tone="${tone}" role="${role}" id="${htmlId}">
      <span class="theme-alert__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon" data-size="md">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </span>
      <div class="theme-alert__content"><p class="theme-alert__body">${body}</p></div>
    </div>
  `;
}

function renderField({ label, htmlId, type = 'text', name, value = '', placeholder = '', autocomplete = '', inputmode = '', help = null, error = null, minlength = null }) {
  const helpId = `${htmlId}-help`;
  const errorId = `${htmlId}-error`;
  const describedByList = [];
  if (help) describedByList.push(helpId);
  if (error) describedByList.push(errorId);
  const describedBy = describedByList.join(' ');
  const isInvalid = !!error;
  const fieldClasses = ['theme-field'];
  if (isInvalid) fieldClasses.push('theme-field--invalid');

  return `
    <div class="${fieldClasses.join(' ')}">
      <label class="theme-label" data-size="sm" for="${htmlId}">
        <span class="theme-label__text">${label}</span>
        <span class="theme-label__required" aria-hidden="true">*</span>
      </label>
      <input
        class="theme-input"
        data-size="md"
        id="${htmlId}"
        type="${type}"
        name="${name}"
        value="${value}"
        ${placeholder ? `placeholder="${placeholder}"` : ''}
        ${autocomplete ? `autocomplete="${autocomplete}"` : ''}
        ${inputmode ? `inputmode="${inputmode}"` : ''}
        ${minlength ? `minlength="${minlength}"` : ''}
        required
        aria-required="true"
        ${isInvalid ? 'aria-invalid="true"' : ''}
        ${describedBy ? `aria-describedby="${describedBy}"` : ''}
      />
      ${help ? `<p id="${helpId}" class="theme-field__help">${help}</p>` : ''}
      ${error ? `<p id="${errorId}" class="theme-field__error" role="alert" aria-live="polite">${error}</p>` : ''}
    </div>
  `;
}

function renderCheckbox({ htmlId, name, label, checked = false, invalid = false, describedBy = null }) {
  const classes = ['theme-checkbox-row'];
  if (invalid) classes.push('theme-checkbox-row--invalid');
  return `
    <label class="${classes.join(' ')}" data-size="sm">
      <span class="theme-checkbox" data-size="sm">
        <input
          type="checkbox"
          class="theme-checkbox__input"
          id="${htmlId}"
          name="${name}"
          value="1"
          required
          aria-required="true"
          ${checked ? 'checked' : ''}
          ${invalid ? 'aria-invalid="true"' : ''}
          ${describedBy ? `aria-describedby="${describedBy}"` : ''}
        />
        <span class="theme-checkbox__box" aria-hidden="true">
          <svg class="theme-checkbox__glyph theme-checkbox__glyph--check" viewBox="0 0 16 16" fill="none">
            <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </span>
      <span class="theme-checkbox-row__text">
        <span class="theme-checkbox-row__label">${label}</span>
        <span class="theme-checkbox-row__required" aria-hidden="true">*</span>
      </span>
    </label>
  `;
}

function renderLink({ label, href = '#', size = 'md' }) {
  return `
    <a class="theme-button" data-variant="link" data-size="${size}" href="${href}">
      <span class="theme-button__label">${label}</span>
    </a>
  `;
}

function renderSubmitButton({ label, loading = false }) {
  return `
    <button
      class="theme-button theme-button--full-width"
      data-variant="primary"
      data-size="md"
      type="submit"
      ${loading ? 'disabled aria-busy="true"' : ''}
    >
      ${loading ? `<span class="theme-button__spinner"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9" opacity="0.25"/><path d="M21 12a9 9 0 0 1-9 9" stroke-linecap="round"/></svg></span>` : ''}
      <span class="theme-button__label">${label}</span>
    </button>
  `;
}

function renderEmpty({ title, body, htmlId, resendHref = null, resendLabel = null }) {
  const titleId = `${htmlId}-title`;
  return `
    <div class="theme-empty" data-size="md" role="region" aria-labelledby="${titleId}">
      <div class="theme-empty__illustration" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-empty__icon theme-icon" data-size="xl">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      </div>
      <div class="theme-empty__content">
        <h2 id="${titleId}" class="theme-empty__title">${title}</h2>
        <div class="theme-empty__body"><p>${body}</p></div>
        ${resendHref ? `<div class="theme-empty__actions"><a class="theme-button" data-variant="secondary" data-size="md" href="${resendHref}"><span class="theme-button__label">${resendLabel}</span></a></div>` : ''}
      </div>
    </div>
  `;
}

function renderAuthRegister(opts = {}) {
  const {
    title = t('theme.auth.register.title'),
    subtitle = t('theme.auth.register.subtitle'),
    htmlId = 'story-auth-register',
    csrfToken = '<csrf-demo-token-1234>',
    nameValue = '',
    nameError = null,
    emailValue = '',
    emailError = null,
    passwordError = null,
    termsChecked = false,
    termsError = null,
    loading = false,
    loginHref = '/login',
    globalError = null,
    successState = false,
  } = opts;

  const state = successState ? 'success'
              : loading ? 'loading'
              : (globalError || nameError || emailError || passwordError || termsError) ? 'error'
              : 'default';

  const titleId = `${htmlId}-title`;

  const formContent = successState
    ? renderEmpty({
        title: t('theme.auth.register.success.title'),
        body: t('theme.auth.register.success.body'),
        htmlId: `${htmlId}-success`,
        resendHref: '/register/resend-confirmation',
        resendLabel: t('theme.auth.register.success.resend'),
      })
    : `
      <form
        class="theme-auth-register"
        action="/register"
        method="post"
        novalidate
        data-state="${state}"
        ${loading ? 'data-loading="true"' : ''}
      >
        ${globalError ? renderAlert({ variant: 'danger', body: globalError, htmlId: `${htmlId}-global-error` }) : ''}
        <input type="hidden" name="_token" value="${csrfToken}"/>
        ${renderField({
          label: t('theme.auth.register.name'),
          htmlId: `${htmlId}-name`,
          type: 'text',
          name: 'name',
          value: nameValue,
          placeholder: t('theme.auth.register.name-placeholder'),
          autocomplete: 'name',
          error: nameError,
        })}
        ${renderField({
          label: t('theme.auth.register.email'),
          htmlId: `${htmlId}-email`,
          type: 'email',
          name: 'email',
          value: emailValue,
          placeholder: t('theme.auth.register.email-placeholder'),
          autocomplete: 'email',
          inputmode: 'email',
          error: emailError,
        })}
        ${renderField({
          label: t('theme.auth.register.password'),
          htmlId: `${htmlId}-password`,
          type: 'password',
          name: 'password',
          placeholder: t('theme.auth.register.password-placeholder'),
          autocomplete: 'new-password',
          minlength: 8,
          help: t('theme.auth.register.password-help'),
          error: passwordError,
        })}
        <div class="theme-auth-register__terms">
          ${renderCheckbox({
            htmlId: `${htmlId}-terms`,
            name: 'terms',
            label: t('theme.auth.register.terms'),
            checked: termsChecked,
            invalid: !!termsError,
            describedBy: termsError ? `${htmlId}-terms-error` : null,
          })}
          ${termsError ? `<p id="${htmlId}-terms-error" class="theme-field__error" role="alert" aria-live="polite">${termsError}</p>` : ''}
        </div>
        ${renderSubmitButton({
          label: t('theme.auth.register.submit'),
          loading,
        })}
      </form>
    `;

  const footerContent = loginHref ? `
    <span class="theme-auth-register__footer-question">${t('theme.auth.register.has-account')}</span>
    ${renderLink({ label: t('theme.auth.register.login'), href: loginHref })}
  ` : '';

  return `
    <main class="theme-auth-shell" data-variant="default">
      <section class="theme-auth-shell__panel">
        <article class="theme-card theme-auth-shell__card" aria-labelledby="${titleId}">
          <header class="theme-card__header theme-auth-shell__card-header">
            <h1 id="${titleId}" class="theme-auth-shell__title">${title}</h1>
            <p class="theme-auth-shell__subtitle">${subtitle}</p>
          </header>
          <div class="theme-card__body theme-auth-shell__card-body">
            ${formContent}
          </div>
          ${footerContent ? `<footer class="theme-card__footer theme-auth-shell__card-footer">${footerContent}</footer>` : ''}
        </article>
      </section>
    </main>
  `;
}

const bodyHtml = `
  <section class="auth-register-story" data-testid="auth-register-root">
    <header class="auth-register-story__header">
      <h1>${t('theme.auth.register.story.title')}</h1>
      <p>${t('theme.auth.register.story.subtitle')}</p>
    </header>

    <section class="auth-register-story__section" aria-labelledby="auth-register-section-default">
      <h2 id="auth-register-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.register.story.section.default')}</h2>
      <p class="auth-register-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.register.story.explainer.default')}</p>
      <div class="auth-register-story__frame">${renderAuthRegister({ htmlId: 'story-auth-register-default' })}</div>
    </section>

    <section class="auth-register-story__section" aria-labelledby="auth-register-section-email-taken">
      <h2 id="auth-register-section-email-taken" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.register.story.section.email-taken')}</h2>
      <p class="auth-register-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.register.story.explainer.email-taken')}</p>
      <div class="auth-register-story__frame">${renderAuthRegister({
        htmlId: 'story-auth-register-email-taken',
        nameValue: 'Marie Dupont',
        emailValue: 'marie@samurai.example.fr',
        emailError: t('theme.auth.register.error.email-taken'),
      })}</div>
    </section>

    <section class="auth-register-story__section" aria-labelledby="auth-register-section-terms">
      <h2 id="auth-register-section-terms" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.register.story.section.terms')}</h2>
      <p class="auth-register-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.register.story.explainer.terms')}</p>
      <div class="auth-register-story__frame">${renderAuthRegister({
        htmlId: 'story-auth-register-terms',
        nameValue: 'Marie Dupont',
        emailValue: 'marie@samurai.example.fr',
        termsError: t('theme.auth.register.error.terms-required'),
      })}</div>
    </section>

    <section class="auth-register-story__section" aria-labelledby="auth-register-section-loading">
      <h2 id="auth-register-section-loading" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.register.story.section.loading')}</h2>
      <p class="auth-register-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.register.story.explainer.loading')}</p>
      <div class="auth-register-story__frame">${renderAuthRegister({
        htmlId: 'story-auth-register-loading',
        nameValue: 'Marie Dupont',
        emailValue: 'marie@samurai.example.fr',
        termsChecked: true,
        loading: true,
      })}</div>
    </section>

    <section class="auth-register-story__section" aria-labelledby="auth-register-section-success">
      <h2 id="auth-register-section-success" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.register.story.section.success')}</h2>
      <p class="auth-register-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.register.story.explainer.success')}</p>
      <div class="auth-register-story__frame">${renderAuthRegister({
        htmlId: 'story-auth-register-success',
        successState: true,
      })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Auth-Register" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="auth-register-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="auth-register-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.auth-register-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.auth-register-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.auth-register-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.auth-register-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-register-story__explainer { max-inline-size: 70ch; }
.auth-register-story__frame { min-block-size: 36rem; max-block-size: 56rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-register-story__frame .theme-auth-shell { min-block-size: 100%; }
.auth-register-dark-wrap { background: var(--color-bg-base); }
</style>
