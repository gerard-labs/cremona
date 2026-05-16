<!--
  Auth-SessionTimeoutModal story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (3): default-1min-polite · urgent-20s-assertive · long-fr-rtl

  Cross-controller compose : `dialog session-timeout-countdown`. The
  story renders an OPEN modal (the visual baseline ; Histoire users
  don't trigger it via JS). The countdown text is statically stamped
  via the Twig-side fallback ; the controller takes over at runtime
  (which Vitest unit tests exercise).

  See `docs/specs/ring3/Auth-SessionTimeoutModal.md` for the full state matrix.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function pluralCategory(n) {
  try {
    return new Intl.PluralRules('fr').select(n);
  } catch (_) {
    return n === 1 ? 'one' : 'other';
  }
}

function formatCountdown(seconds) {
  if (seconds < 60) {
    const cat = pluralCategory(seconds);
    return t(`theme.auth.session-timeout-modal.countdown.seconds-${cat}`).replace('{count}', seconds);
  }
  const minutes = Math.ceil(seconds / 60);
  const cat = pluralCategory(minutes);
  return t(`theme.auth.session-timeout-modal.countdown.minutes-${cat}`).replace('{count}', minutes);
}

function renderButton({ label, variant = 'primary' }) {
  return `<button class="theme-button" data-variant="${variant}" data-size="md" type="button"><span class="theme-button__label">${label}</span></button>`;
}

function renderSessionTimeoutModal({
  htmlId = 'story-session-timeout',
  remainingSeconds = 60,
  ariaLive = 'polite',
} = {}) {
  const titleId = `${htmlId}-title`;
  const countdown = formatCountdown(remainingSeconds);
  return `
    <div class="theme-dialog-wrap theme-auth-session-timeout-modal"
         data-controller="dialog session-timeout-countdown"
         data-dialog-open-value="true"
         data-dialog-close-on-escape-value="false"
         data-dialog-close-on-backdrop-click-value="false"
         data-session-timeout-countdown-remaining-seconds-value="${remainingSeconds}"
         data-session-timeout-countdown-warning-threshold-seconds-value="30"
         id="${htmlId}">
      <dialog id="${htmlId}-dialog" class="theme-dialog" data-dialog-target="dialog" data-size="md" aria-labelledby="${titleId}" open>
        <header class="theme-dialog__header">
          <h2 id="${titleId}" class="theme-dialog__title">${t('theme.auth.session-timeout-modal.title')}</h2>
        </header>
        <div class="theme-dialog__body">
          <p class="theme-auth-session-timeout-modal__body">
            ${t('theme.auth.session-timeout-modal.body-before')}<span class="theme-auth-session-timeout-modal__countdown" aria-live="${ariaLive}">${countdown}</span>${t('theme.auth.session-timeout-modal.body-after')}
          </p>
        </div>
        <footer class="theme-dialog__footer">
          ${renderButton({ label: t('theme.auth.session-timeout-modal.extend-cta'), variant: 'primary' })}
          ${renderButton({ label: t('theme.auth.session-timeout-modal.logout-cta'), variant: 'destructive' })}
        </footer>
      </dialog>
    </div>
  `;
}

const bodyHtml = `
  <section class="auth-session-timeout-modal-story" data-testid="auth-session-timeout-modal-root">
    <header class="auth-session-timeout-modal-story__header">
      <h1>${t('theme.auth.session-timeout-modal.story.title')}</h1>
      <p>${t('theme.auth.session-timeout-modal.story.subtitle')}</p>
    </header>

    <section class="auth-session-timeout-modal-story__section" aria-labelledby="auth-session-timeout-section-default">
      <h2 id="auth-session-timeout-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.session-timeout-modal.story.section.default')}</h2>
      <p class="auth-session-timeout-modal-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.session-timeout-modal.story.explainer.default')}</p>
      <div class="auth-session-timeout-modal-story__frame">${renderSessionTimeoutModal({ htmlId: 'story-stm-default', remainingSeconds: 60, ariaLive: 'polite' })}</div>
    </section>

    <section class="auth-session-timeout-modal-story__section" aria-labelledby="auth-session-timeout-section-urgent">
      <h2 id="auth-session-timeout-section-urgent" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.session-timeout-modal.story.section.urgent')}</h2>
      <p class="auth-session-timeout-modal-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.session-timeout-modal.story.explainer.urgent')}</p>
      <div class="auth-session-timeout-modal-story__frame">${renderSessionTimeoutModal({ htmlId: 'story-stm-urgent', remainingSeconds: 20, ariaLive: 'assertive' })}</div>
    </section>

    <section class="auth-session-timeout-modal-story__section" aria-labelledby="auth-session-timeout-section-long">
      <h2 id="auth-session-timeout-section-long" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.auth.session-timeout-modal.story.section.long')}</h2>
      <p class="auth-session-timeout-modal-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.auth.session-timeout-modal.story.explainer.long')}</p>
      <div class="auth-session-timeout-modal-story__frame">${renderSessionTimeoutModal({ htmlId: 'story-stm-long', remainingSeconds: 180, ariaLive: 'polite' })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Auth-SessionTimeoutModal" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="auth-session-timeout-modal-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="auth-session-timeout-modal-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.auth-session-timeout-modal-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.auth-session-timeout-modal-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.auth-session-timeout-modal-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.auth-session-timeout-modal-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.auth-session-timeout-modal-story__explainer { max-inline-size: 70ch; }
.auth-session-timeout-modal-story__frame { padding: var(--spacing-6); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); min-block-size: 16rem; position: relative; }
/* In stories, render the dialog inline (rather than top-layer) so the
   visual baseline captures it. The [open] attribute on <dialog> renders
   it as a regular block-flow element ; the controller's showModal() is
   bypassed at story time. */
.auth-session-timeout-modal-story__frame .theme-dialog[open] { position: relative; max-inline-size: 32rem; margin: 0 auto; }
.auth-session-timeout-modal-dark-wrap { background: var(--color-bg-base); }
</style>
