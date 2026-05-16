<!--
  Auth-PasswordStrength story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5): default-empty · weak-password1! · medium · strong · with-server-error

  The story manually pre-fills the password input + statically renders the
  meter at the visual tier (data-variant + value attribute + hint text)
  bypassing the controller. The actual controller is exercised in the
  Vitest unit tests (`tests/unit/password_strength_controller.test.js`).

  Why bypass : the controller lazy-loads zxcvbn-ts on first keystroke ;
  visual baseline tests need deterministic per-section render without
  network / async dependencies. Tests cover the controller behaviour.

  See `docs/specs/ring3/Auth-PasswordStrength.md` for the full state matrix.
-->
<script setup>
import { onMounted } from 'vue';
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

function renderPasswordField({
  htmlId = 'story-pwd',
  value = '',
  error = null,
}) {
  const fieldClasses = ['cremona-field'];
  if (error) fieldClasses.push('cremona-field--invalid');
  const helpId = `${htmlId}-help`;
  const errorId = `${htmlId}-error`;
  const hintId = `${htmlId}-hint`;
  const describedBy = error ? `${helpId} ${errorId} ${hintId}` : `${helpId} ${hintId}`;

  return `
    <div class="${fieldClasses.join(' ')}">
      <label class="cremona-label" data-size="sm" for="${htmlId}">
        <span class="cremona-label__text">${t('theme.auth.password-strength.input-label')}</span>
        <span class="cremona-label__required" aria-hidden="true">*</span>
      </label>
      <input
        class="cremona-input"
        data-size="md"
        id="${htmlId}"
        type="password"
        name="password"
        data-password-strength-target="input"
        data-action="input->password-strength#evaluate"
        ${value ? `value="${value}"` : ''}
        placeholder="${t('theme.auth.password-strength.input-placeholder')}"
        autocomplete="new-password"
        required
        aria-required="true"
        ${error ? 'aria-invalid="true"' : ''}
        aria-describedby="${describedBy}"
      />
      <p class="cremona-field__help" id="${helpId}">${t('theme.auth.password-strength.help')}</p>
      ${error ? `<p class="cremona-field__error" id="${errorId}" role="alert" aria-live="polite">${error}</p>` : ''}
    </div>
  `;
}

function renderMeter({ variant = 'danger', value = 0, ariaLabel }) {
  return `<progress class="cremona-progress" data-size="sm" data-variant="${variant}" data-password-strength-target="meter" value="${value}" max="100" aria-label="${ariaLabel}"></progress>`;
}

function renderHint({ text, htmlId = 'story-pwd' }) {
  return `<p class="cremona-auth-password-strength__hint" id="${htmlId}-hint" aria-live="polite">${text}</p>`;
}

function renderPasswordStrength({
  htmlId = 'story-pwd',
  value = '',
  tier = 'empty', // 'empty' | '0' | '1' | '2' | '3' | '4'
  error = null,
}) {
  const variantMap = {
    empty: 'danger', 0: 'danger', 1: 'danger', 2: 'warning', 3: 'success', 4: 'success',
  };
  const valueMap = {
    empty: 20, 0: 20, 1: 40, 2: 60, 3: 80, 4: 100,
  };
  const hintMap = {
    empty: t('theme.auth.password-strength.tier.empty'),
    0: t('theme.auth.password-strength.tier.0'),
    1: t('theme.auth.password-strength.tier.1'),
    2: t('theme.auth.password-strength.tier.2'),
    3: t('theme.auth.password-strength.tier.3'),
    4: t('theme.auth.password-strength.tier.4'),
  };

  return `
    <div class="cremona-auth-password-strength" data-controller="password-strength" data-password-strength-min-score-value="2" data-password-strength-debounce-ms-value="150">
      ${renderPasswordField({ htmlId, value, error })}
      ${renderMeter({ variant: variantMap[tier], value: valueMap[tier], ariaLabel: t('theme.auth.password-strength.aria.meter') })}
      ${renderHint({ text: hintMap[tier], htmlId })}
    </div>
  `;
}

const bodyHtml = `
  <section class="auth-password-strength-story" data-testid="auth-password-strength-root">
    <header class="auth-password-strength-story__header">
      <h1>${t('theme.auth.password-strength.story.title')}</h1>
      <p>${t('theme.auth.password-strength.story.subtitle')}</p>
    </header>

    <section class="auth-password-strength-story__section" aria-labelledby="auth-pwd-section-empty">
      <h2 id="auth-pwd-section-empty" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.password-strength.story.section.empty')}</h2>
      <p class="auth-password-strength-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.password-strength.story.explainer.empty')}</p>
      <div class="auth-password-strength-story__frame">${renderPasswordStrength({ htmlId: 'story-pwd-empty', tier: 'empty' })}</div>
    </section>

    <section class="auth-password-strength-story__section" aria-labelledby="auth-pwd-section-weak">
      <h2 id="auth-pwd-section-weak" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.password-strength.story.section.weak')}</h2>
      <p class="auth-password-strength-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.password-strength.story.explainer.weak')}</p>
      <div class="auth-password-strength-story__frame">${renderPasswordStrength({ htmlId: 'story-pwd-weak', value: 'Password1!', tier: '1' })}</div>
    </section>

    <section class="auth-password-strength-story__section" aria-labelledby="auth-pwd-section-medium">
      <h2 id="auth-pwd-section-medium" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.password-strength.story.section.medium')}</h2>
      <p class="auth-password-strength-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.password-strength.story.explainer.medium')}</p>
      <div class="auth-password-strength-story__frame">${renderPasswordStrength({ htmlId: 'story-pwd-medium', value: 'Tr0ub4dor', tier: '2' })}</div>
    </section>

    <section class="auth-password-strength-story__section" aria-labelledby="auth-pwd-section-strong">
      <h2 id="auth-pwd-section-strong" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.password-strength.story.section.strong')}</h2>
      <p class="auth-password-strength-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.password-strength.story.explainer.strong')}</p>
      <div class="auth-password-strength-story__frame">${renderPasswordStrength({ htmlId: 'story-pwd-strong', value: 'correct horse battery staple', tier: '4' })}</div>
    </section>

    <section class="auth-password-strength-story__section" aria-labelledby="auth-pwd-section-error">
      <h2 id="auth-pwd-section-error" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.password-strength.story.section.error')}</h2>
      <p class="auth-password-strength-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.password-strength.story.explainer.error')}</p>
      <div class="auth-password-strength-story__frame">${renderPasswordStrength({
        htmlId: 'story-pwd-error',
        value: 'AnyPass1!',
        tier: '2',
        error: t('theme.auth.password-strength.story.sample.server-error'),
      })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Auth/Password Strength" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="auth-password-strength-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="auth-password-strength-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.auth-password-strength-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.auth-password-strength-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.auth-password-strength-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.auth-password-strength-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-password-strength-story__explainer { max-inline-size: 70ch; }
.auth-password-strength-story__frame { padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); max-inline-size: 26rem; }
.auth-password-strength-dark-wrap { background: var(--color-bg-base); }
</style>
