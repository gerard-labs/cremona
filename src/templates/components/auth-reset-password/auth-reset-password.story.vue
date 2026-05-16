<!--
  Auth-ResetPassword story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5): default · error-mismatch · error-weak · token-expired · token-used.

  See `docs/specs/ring3/Auth-ResetPassword.md` for the state matrix.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderAlert({ variant = 'danger', body = '', tone = 'soft', htmlId = '' }) {
  const role = variant === 'danger' ? 'alert' : 'status';
  return `
    <div class="cremona-alert" data-variant="${variant}" data-tone="${tone}" role="${role}" id="${htmlId}">
      <span class="cremona-alert__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cremona-icon" data-size="md">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </span>
      <div class="cremona-alert__content"><p class="cremona-alert__body">${body}</p></div>
    </div>
  `;
}

function renderField({ label, htmlId, name, placeholder = '', help = null, error = null }) {
  const helpId = `${htmlId}-help`;
  const errorId = `${htmlId}-error`;
  const describedByList = [];
  if (help) describedByList.push(helpId);
  if (error) describedByList.push(errorId);
  const describedBy = describedByList.join(' ');
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
        type="password"
        name="${name}"
        ${placeholder ? `placeholder="${placeholder}"` : ''}
        autocomplete="new-password"
        minlength="8"
        required
        aria-required="true"
        ${isInvalid ? 'aria-invalid="true"' : ''}
        ${describedBy ? `aria-describedby="${describedBy}"` : ''}
      />
      ${help ? `<p id="${helpId}" class="cremona-field__help">${help}</p>` : ''}
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

function renderEmpty({ title, body, htmlId, iconShape, ctaLabel, ctaHref }) {
  const titleId = `${htmlId}-title`;
  return `
    <div class="cremona-empty" data-size="md" role="region" aria-labelledby="${titleId}">
      <div class="cremona-empty__illustration" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cremona-empty__icon cremona-icon" data-size="xl">${iconShape}</svg>
      </div>
      <div class="cremona-empty__content">
        <h2 id="${titleId}" class="cremona-empty__title">${title}</h2>
        <div class="cremona-empty__body"><p>${body}</p></div>
        <div class="cremona-empty__actions"><a class="cremona-button" data-variant="primary" data-size="md" href="${ctaHref}"><span class="cremona-button__label">${ctaLabel}</span></a></div>
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

function renderAuthResetPassword(opts = {}) {
  const {
    title = t('theme.auth.reset-password.title'),
    subtitle = t('theme.auth.reset-password.subtitle'),
    htmlId = 'story-auth-reset',
    csrfToken = '<csrf-demo-token-1234>',
    resetToken = '<reset-token-demo>',
    passwordError = null,
    confirmError = null,
    loading = false,
    backToLoginHref = '/login',
    globalError = null,
    tokenExpired = false,
    tokenUsed = false,
  } = opts;

  const state = tokenExpired ? 'error-token-expired'
              : tokenUsed ? 'error-token-used'
              : loading ? 'loading'
              : (globalError || passwordError || confirmError) ? 'error'
              : 'default';

  const titleId = `${htmlId}-title`;

  let formContent;
  if (tokenExpired) {
    formContent = renderEmpty({
      title: t('theme.auth.reset-password.token-expired.title'),
      body: t('theme.auth.reset-password.token-expired.body'),
      htmlId: `${htmlId}-expired`,
      iconShape: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
      ctaLabel: t('theme.auth.reset-password.token-expired.cta'),
      ctaHref: '/password/forgot',
    });
  } else if (tokenUsed) {
    formContent = renderEmpty({
      title: t('theme.auth.reset-password.token-used.title'),
      body: t('theme.auth.reset-password.token-used.body'),
      htmlId: `${htmlId}-used`,
      iconShape: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
      ctaLabel: t('theme.auth.reset-password.token-used.cta'),
      ctaHref: '/login',
    });
  } else {
    formContent = `
      <form
        class="cremona-auth-reset-password"
        action="/password/reset/token"
        method="post"
        novalidate
        data-state="${state}"
        ${loading ? 'data-loading="true"' : ''}
      >
        ${globalError ? renderAlert({ variant: 'danger', body: globalError, htmlId: `${htmlId}-global-error` }) : ''}
        <input type="hidden" name="_token" value="${csrfToken}"/>
        <input type="hidden" name="reset_token" value="${resetToken}"/>
        ${renderField({
          label: t('theme.auth.reset-password.password'),
          htmlId: `${htmlId}-password`,
          name: 'password',
          placeholder: t('theme.auth.reset-password.password-placeholder'),
          help: t('theme.auth.reset-password.password-help'),
          error: passwordError,
        })}
        ${renderField({
          label: t('theme.auth.reset-password.confirm'),
          htmlId: `${htmlId}-confirm`,
          name: 'confirm',
          error: confirmError,
        })}
        ${renderSubmitButton({
          label: t('theme.auth.reset-password.submit'),
          loading,
        })}
      </form>
    `;
  }

  const showFooter = backToLoginHref && !tokenExpired && !tokenUsed;
  const footerContent = showFooter ? renderBackButton({
    label: t('theme.auth.reset-password.back-to-login'),
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
  <section class="auth-reset-story" data-testid="auth-reset-root">
    <header class="auth-reset-story__header">
      <h1>${t('theme.auth.reset-password.story.title')}</h1>
      <p>${t('theme.auth.reset-password.story.subtitle')}</p>
    </header>

    <section class="auth-reset-story__section" aria-labelledby="auth-reset-section-default">
      <h2 id="auth-reset-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.reset-password.story.section.default')}</h2>
      <p class="auth-reset-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.reset-password.story.explainer.default')}</p>
      <div class="auth-reset-story__frame">${renderAuthResetPassword({ htmlId: 'story-auth-reset-default' })}</div>
    </section>

    <section class="auth-reset-story__section" aria-labelledby="auth-reset-section-mismatch">
      <h2 id="auth-reset-section-mismatch" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.reset-password.story.section.mismatch')}</h2>
      <p class="auth-reset-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.reset-password.story.explainer.mismatch')}</p>
      <div class="auth-reset-story__frame">${renderAuthResetPassword({
        htmlId: 'story-auth-reset-mismatch',
        confirmError: t('theme.auth.reset-password.error.mismatch'),
      })}</div>
    </section>

    <section class="auth-reset-story__section" aria-labelledby="auth-reset-section-weak">
      <h2 id="auth-reset-section-weak" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.reset-password.story.section.weak')}</h2>
      <p class="auth-reset-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.reset-password.story.explainer.weak')}</p>
      <div class="auth-reset-story__frame">${renderAuthResetPassword({
        htmlId: 'story-auth-reset-weak',
        passwordError: t('theme.auth.reset-password.error.password-weak'),
      })}</div>
    </section>

    <section class="auth-reset-story__section" aria-labelledby="auth-reset-section-token-expired">
      <h2 id="auth-reset-section-token-expired" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.reset-password.story.section.token-expired')}</h2>
      <p class="auth-reset-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.reset-password.story.explainer.token-expired')}</p>
      <div class="auth-reset-story__frame">${renderAuthResetPassword({
        htmlId: 'story-auth-reset-expired',
        tokenExpired: true,
      })}</div>
    </section>

    <section class="auth-reset-story__section" aria-labelledby="auth-reset-section-token-used">
      <h2 id="auth-reset-section-token-used" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.reset-password.story.section.token-used')}</h2>
      <p class="auth-reset-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.reset-password.story.explainer.token-used')}</p>
      <div class="auth-reset-story__frame">${renderAuthResetPassword({
        htmlId: 'story-auth-reset-used',
        tokenUsed: true,
      })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Auth-ResetPassword" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="auth-reset-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="auth-reset-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.auth-reset-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.auth-reset-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.auth-reset-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.auth-reset-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-reset-story__explainer { max-inline-size: 70ch; }
.auth-reset-story__frame { min-block-size: 32rem; max-block-size: 52rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-reset-story__frame .cremona-auth-shell { min-block-size: 100%; }
.auth-reset-dark-wrap { background: var(--color-bg-base); }
</style>
