<!--
  Form-Signature story — 4 viewport variants.
  Sections : default-empty · signed · cleared · with-fallback.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderFormSignature({ id, label, help, error, fallback = false, width = 400, height = 160 }) {
  const invalid = error ? ' cremona-form-signature--invalid' : '';
  return `
    <div class="cremona-form-signature${invalid}" data-controller="signature-pad" data-signature-pad-pen-color-value="#000000" data-signature-pad-min-width-value="0.5" data-signature-pad-max-width-value="2.5">
      <span class="cremona-form-signature__label" id="${id}-label">${label}</span>
      <article class="cremona-card cremona-form-signature__surface" data-variant="elevated">
        <div class="cremona-card__body cremona-form-signature__body">
          <canvas class="cremona-form-signature__canvas" data-signature-pad-target="canvas" role="img" aria-labelledby="${id}-label" aria-label="${t('theme.form.signature.aria.label')}" width="${width}" height="${height}"></canvas>
        </div>
        <footer class="cremona-card__footer cremona-form-signature__footer">
          <button type="button" class="cremona-button" data-variant="secondary" data-size="sm" data-signature-pad-target="clearBtn" data-action="click->signature-pad#clear">${t('theme.form.signature.actions.clear')}</button>
        </footer>
      </article>
      <input type="hidden" name="${id}" data-signature-pad-target="hiddenInput" />
      ${fallback ? `<details class="cremona-form-signature__fallback"><summary>${t('theme.form.signature.fallback.summary')}</summary><input type="text" class="cremona-input" name="${id}_typed" placeholder="${t('theme.form.signature.placeholder.fallback')}" autocomplete="name" /></details>` : ''}
      ${help ? `<p class="cremona-field__help" id="${id}-help">${help}</p>` : ''}
      ${error ? `<p class="cremona-field__error" id="${id}-error">${error}</p>` : ''}
    </div>
  `;
}

const bodyHtml = `
  <section class="form-signature-story" aria-labelledby="form-signature-story-title">
    <header class="form-signature-story__header">
      <h1 id="form-signature-story-title">${t('theme.form.signature.story.title')}</h1>
      <p>${t('theme.form.signature.story.subtitle')}</p>
    </header>

    <section class="form-signature-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.signature.story.section.default')}</h2>
      <div class="form-signature-story__frame">${renderFormSignature({ id: 'story-default', label: t('theme.form.signature.label.contract'), help: t('theme.form.signature.help.format') })}</div>
    </section>

    <section class="form-signature-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.signature.story.section.with-help')}</h2>
      <div class="form-signature-story__frame">${renderFormSignature({ id: 'story-help', label: t('theme.form.signature.label.delivery'), help: t('theme.form.signature.help.format') })}</div>
    </section>

    <section class="form-signature-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.signature.story.section.with-fallback')}</h2>
      <div class="form-signature-story__frame">${renderFormSignature({ id: 'story-fallback', label: t('theme.form.signature.label.contract'), help: t('theme.form.signature.help.fallback'), fallback: true })}</div>
    </section>

    <section class="form-signature-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.signature.story.section.validation-error')}</h2>
      <div class="form-signature-story__frame">${renderFormSignature({ id: 'story-error', label: t('theme.form.signature.label.contract'), error: t('theme.form.signature.error.required') })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Form-Signature" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="form-signature-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="form-signature-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.form-signature-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.form-signature-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.form-signature-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.form-signature-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.form-signature-story__frame { min-block-size: 14rem; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); padding: var(--spacing-4); }
.form-signature-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
