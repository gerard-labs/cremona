<!--
  Auth-OTP story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (4): default · error-code-invalid · with-email-fallback · length-4

  No new Stimulus controller — InputOTP S2.7 (`input-otp`) is composed
  verbatim. The story renders the static markup ; the controller is
  registered via `import { register } from '@gerard/theme'` at boot
  time (Histoire wires Stimulus through histoire.setup.js).

  See `docs/specs/ring3/Auth-OTP.md` for the full state matrix.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import iconAlertCircleRaw from '../../../assets/icons/alert-circle.svg?raw';

setTranslations('fr', frDict);
setLocale('fr');

function renderAlert({ body = '', htmlId = '' }) {
  return `
    <div class="theme-alert" data-variant="danger" data-tone="soft" role="alert" id="${htmlId}">
      <span class="theme-alert__icon" aria-hidden="true">
        <span class="theme-icon" data-size="md">${iconAlertCircleRaw}</span>
      </span>
      <div class="theme-alert__content"><p class="theme-alert__body">${body}</p></div>
    </div>
  `;
}

function renderInputOtp({ htmlId, name, length = 6, label, value = '' }) {
  const legendId = `${htmlId}-legend`;
  let cellsHtml = '';
  for (let i = 0; i < length; i++) {
    const cellValue = value.length > i ? value[i] : '';
    const autocomplete = i === 0 ? 'one-time-code' : 'off';
    const ariaLabel = t('theme.input-otp.aria.digit')
      .replace('{position}', i + 1)
      .replace('{total}', length);
    cellsHtml += `
      <input
        type="text"
        class="theme-input theme-input-otp__cell"
        data-input-otp-target="input"
        data-input-otp-index="${i}"
        data-action="input->input-otp#onInput keydown->input-otp#onKeydown paste->input-otp#onPaste focus->input-otp#onFocus"
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength="1"
        aria-label="${ariaLabel}"
        aria-labelledby="${legendId}"
        autocomplete="${autocomplete}"
        value="${cellValue}"
      />`;
  }
  return `
    <fieldset class="theme-input-otp" id="${htmlId}" data-controller="input-otp" data-input-otp-length-value="${length}" ${value ? `data-input-otp-value-value="${value}"` : ''}>
      <legend class="theme-input-otp__legend" id="${legendId}">${label}</legend>
      <div class="theme-input-otp__cells">${cellsHtml}</div>
      <input type="hidden" name="${name}" data-input-otp-target="hiddenInput" value="${value}"/>
    </fieldset>
  `;
}

function renderButton({ label, variant = 'primary', href = null, type = null, fullWidth = false, loading = false, size = 'md' }) {
  const tag = href ? 'a' : 'button';
  const fullCls = fullWidth ? ' theme-button--full-width' : '';
  const hrefAttr = href ? `href="${href}"` : '';
  const typeAttr = !href && type ? `type="${type}"` : '';
  const busyAttr = loading ? 'aria-busy="true"' : '';
  const disabledAttr = loading && !href ? 'disabled' : (loading ? 'aria-disabled="true"' : '');
  const spinner = loading
    ? `<span class="theme-button__spinner"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9" opacity="0.25"/><path d="M21 12a9 9 0 0 1-9 9" stroke-linecap="round"/></svg></span>`
    : '';
  return `<${tag} class="theme-button${fullCls}" data-variant="${variant}" data-size="${size}" ${hrefAttr} ${typeAttr} ${busyAttr} ${disabledAttr}>${spinner}<span class="theme-button__label">${label}</span></${tag}>`;
}

function renderAuthOtp({
  htmlId = 'story-auth-otp',
  length = 6,
  otpValue = '',
  globalError = null,
  withEmailFallback = false,
  loading = false,
} = {}) {
  const state = loading ? 'loading' : (globalError ? 'error' : 'default');
  const titleId = `${htmlId}-title`;
  const inputOtpHtml = renderInputOtp({
    htmlId: `${htmlId}-cluster`,
    name: 'code',
    length,
    label: t('theme.auth.otp.label'),
    value: otpValue,
  });

  const resendRowHtml = `
    <div class="theme-auth-otp__resend-row">
      <span class="theme-auth-otp__resend-question">${t('theme.auth.otp.resend-question')}</span>
      ${renderButton({ label: t('theme.auth.otp.resend-cta'), variant: 'link', size: 'sm', href: '/auth/otp/resend' })}
      ${withEmailFallback ? renderButton({ label: t('theme.auth.otp.email-fallback-cta'), variant: 'link', size: 'sm', href: '/auth/otp/email-fallback' }) : ''}
    </div>
  `;

  const formHtml = `
    <form class="theme-auth-otp" action="/auth/otp/verify" method="post" novalidate data-state="${state}" ${loading ? 'data-loading="true"' : ''}>
      ${globalError ? renderAlert({ body: globalError, htmlId: `${htmlId}-global-error` }) : ''}
      <input type="hidden" name="_token" value="csrf-demo-otp-1234"/>
      ${inputOtpHtml}
      ${resendRowHtml}
      ${renderButton({ label: t('theme.auth.otp.submit'), variant: 'primary', type: 'submit', fullWidth: true, loading })}
    </form>
  `;

  return `
    <main class="theme-auth-shell" data-variant="default">
      <section class="theme-auth-shell__panel">
        <article class="theme-card theme-auth-shell__card" aria-labelledby="${titleId}">
          <header class="theme-card__header theme-auth-shell__card-header">
            <h1 id="${titleId}" class="theme-auth-shell__title">${t('theme.auth.otp.title')}</h1>
            <p class="theme-auth-shell__subtitle">${t('theme.auth.otp.subtitle')}</p>
          </header>
          <div class="theme-card__body theme-auth-shell__card-body">${formHtml}</div>
        </article>
      </section>
    </main>
  `;
}

const bodyHtml = `
  <section class="auth-otp-story" data-testid="auth-otp-root">
    <header class="auth-otp-story__header">
      <h1>${t('theme.auth.otp.story.title')}</h1>
      <p>${t('theme.auth.otp.story.subtitle')}</p>
    </header>

    <section class="auth-otp-story__section" aria-labelledby="auth-otp-section-default">
      <h2 id="auth-otp-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.otp.story.section.default')}</h2>
      <p class="auth-otp-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.otp.story.explainer.default')}</p>
      <div class="auth-otp-story__frame">${renderAuthOtp({ htmlId: 'story-auth-otp-default' })}</div>
    </section>

    <section class="auth-otp-story__section" aria-labelledby="auth-otp-section-error">
      <h2 id="auth-otp-section-error" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.otp.story.section.error')}</h2>
      <p class="auth-otp-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.otp.story.explainer.error')}</p>
      <div class="auth-otp-story__frame">${renderAuthOtp({
        htmlId: 'story-auth-otp-error',
        otpValue: '123456',
        globalError: t('theme.auth.otp.error.code-invalid'),
      })}</div>
    </section>

    <section class="auth-otp-story__section" aria-labelledby="auth-otp-section-email-fallback">
      <h2 id="auth-otp-section-email-fallback" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.otp.story.section.email-fallback')}</h2>
      <p class="auth-otp-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.otp.story.explainer.email-fallback')}</p>
      <div class="auth-otp-story__frame">${renderAuthOtp({
        htmlId: 'story-auth-otp-fallback',
        withEmailFallback: true,
      })}</div>
    </section>

    <section class="auth-otp-story__section" aria-labelledby="auth-otp-section-length-4">
      <h2 id="auth-otp-section-length-4" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.otp.story.section.length-4')}</h2>
      <p class="auth-otp-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.otp.story.explainer.length-4')}</p>
      <div class="auth-otp-story__frame">${renderAuthOtp({
        htmlId: 'story-auth-otp-length-4',
        length: 4,
      })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Auth-OTP" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="auth-otp-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="auth-otp-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.auth-otp-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.auth-otp-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.auth-otp-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.auth-otp-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-otp-story__explainer { max-inline-size: 70ch; }
.auth-otp-story__frame { min-block-size: 32rem; max-block-size: 48rem; overflow: hidden; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-otp-story__frame .theme-auth-shell { min-block-size: 100%; }
.auth-otp-dark-wrap { background: var(--color-bg-base); }
</style>
