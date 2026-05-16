<!--
  InputOTP story — 4 viewport variants (Light/Dark × LTR/RTL).
  N atomic <input>s with auto-tab + paste-distribute + Intl-interpolated
  aria labels per cell.

  Sections:
   1. Default (6 digits)
   2. Length 4 (PIN-style)
   3. Length 8 (recovery code)
   4. Paste auto-distribute demo
   5. States (disabled, invalid)
   6. With Field composition
   7. Events log
-->
<script setup>
import { onMounted } from 'vue';
import { Application } from '@hotwired/stimulus';
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import InputOtpController from '../../../js/controllers/input-otp_controller.js';

setTranslations('fr', frDict);
setLocale('fr');

const sectionTitle = (id, key) => `<h2 id="${id}" class="cremona-typography" data-variant="overline" data-color="tertiary">${t(key)}</h2>`;
const sectionExplainer = (key) => `<p class="cremona-typography" data-variant="caption" data-color="tertiary">${t(key)}</p>`;

function renderInputOtp({
  id = 'otp',
  name = '',
  length = 6,
  value = '',
  describedBy = null,
  invalid = false,
  disabled = false,
} = {}) {
  const legendId = `${id}-legend`;
  const label = t('theme.input-otp.aria.fieldset-label', { count: length });
  const cells = [];
  for (let i = 0; i < length; i++) {
    const v = value[i] || '';
    const valueAttr = v ? ` value="${v}"` : '';
    const ariaLabel = t('theme.input-otp.aria.digit', { position: i + 1, total: length });
    cells.push(
      `<input id="${id}-${i}" type="text" class="cremona-input cremona-input-otp__cell"
        data-input-otp-target="input"
        data-input-otp-index="${i}"
        data-action="input->input-otp#onInput keydown->input-otp#onKeydown paste->input-otp#onPaste focus->input-otp#onFocus"
        inputmode="numeric" pattern="[0-9]*" maxlength="1"
        aria-label="${ariaLabel}"
        ${i === 0 ? 'autocomplete="one-time-code"' : 'autocomplete="off"'}${valueAttr}${disabled ? ' disabled' : ''}${describedBy ? ` aria-describedby="${describedBy}"` : ''}>`,
    );
  }
  return `
    <fieldset id="${id}" class="cremona-input-otp"
      data-controller="input-otp"
      data-input-otp-length-value="${length}"
      ${value ? `data-input-otp-value-value="${value}"` : ''}
      ${invalid ? 'aria-invalid="true"' : ''}
      ${disabled ? 'disabled' : ''}
    >
      <legend class="cremona-input-otp__legend" id="${legendId}">${label}</legend>
      <div class="cremona-input-otp__cells">${cells.join('')}</div>
      ${name ? `<input type="hidden" name="${name}" data-input-otp-target="hiddenInput">` : ''}
    </fieldset>
  `;
}

const eventsLogId = 'otp-events-log';

onMounted(() => {
  if (!document.body.dataset.inputOtpStoryBooted) {
    const app = Application.start();
    app.register('input-otp', InputOtpController);
    document.body.dataset.inputOtpStoryBooted = '1';

    const log = document.getElementById(eventsLogId);
    if (log) {
      const append = (text) => {
        const entry = document.createElement('li');
        entry.textContent = text;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
      };
      document.addEventListener('input-otp:change', (e) => {
        append(`input-otp:change → code="${e.detail.code}" complete=${e.detail.complete}`);
      });
      document.addEventListener('input-otp:complete', (e) => {
        append(`input-otp:complete → code="${e.detail.code}"`);
      });
    }
  }
});

const bodyHtml = `
  <section class="otp-story" data-testid="input-otp-root">
    <header class="otp-story__header">
      <h1>${t('theme.input-otp.story.title')}</h1>
      <p>${t('theme.input-otp.story.subtitle')}</p>
    </header>

    <section class="otp-story__section" aria-labelledby="otp-section-default">
      ${sectionTitle('otp-section-default', 'theme.input-otp.story.section.default')}
      ${sectionExplainer('theme.input-otp.story.section.default-explainer')}
      <div class="otp-story__row">
        ${renderInputOtp({ id: 'otp-default', name: 'code-6' })}
      </div>
    </section>

    <section class="otp-story__section" aria-labelledby="otp-section-length-4">
      ${sectionTitle('otp-section-length-4', 'theme.input-otp.story.section.length-4')}
      ${sectionExplainer('theme.input-otp.story.section.length-4-explainer')}
      <div class="otp-story__row">
        ${renderInputOtp({ id: 'otp-4', name: 'code-4', length: 4 })}
      </div>
    </section>

    <section class="otp-story__section" aria-labelledby="otp-section-length-8">
      ${sectionTitle('otp-section-length-8', 'theme.input-otp.story.section.length-8')}
      ${sectionExplainer('theme.input-otp.story.section.length-8-explainer')}
      <div class="otp-story__row">
        ${renderInputOtp({ id: 'otp-8', name: 'code-8', length: 8 })}
      </div>
    </section>

    <section class="otp-story__section" aria-labelledby="otp-section-paste">
      ${sectionTitle('otp-section-paste', 'theme.input-otp.story.section.paste')}
      ${sectionExplainer('theme.input-otp.story.section.paste-explainer')}
      <div class="otp-story__row">
        ${renderInputOtp({ id: 'otp-paste', name: 'code-paste' })}
      </div>
    </section>

    <section class="otp-story__section" aria-labelledby="otp-section-states">
      ${sectionTitle('otp-section-states', 'theme.input-otp.story.section.states')}
      ${sectionExplainer('theme.input-otp.story.section.states-explainer')}
      <div class="otp-story__row">
        ${renderInputOtp({ id: 'otp-disabled', name: 'code-disabled', value: '12', disabled: true })}
        ${renderInputOtp({ id: 'otp-invalid', name: 'code-invalid', value: '123', invalid: true })}
      </div>
    </section>

    <section class="otp-story__section" aria-labelledby="otp-section-field">
      ${sectionTitle('otp-section-field', 'theme.input-otp.story.section.field')}
      ${sectionExplainer('theme.input-otp.story.section.field-explainer')}
      <div class="cremona-field" style="max-inline-size: 360px;">
        <label class="cremona-label">${t('theme.input-otp.story.field.label')}</label>
        ${renderInputOtp({ id: 'otp-field', name: 'verification-code', describedBy: 'otp-field-help' })}
        <p class="cremona-field__help" id="otp-field-help">${t('theme.input-otp.story.field.help')}</p>
      </div>
    </section>

    <section class="otp-story__section" aria-labelledby="otp-section-events">
      ${sectionTitle('otp-section-events', 'theme.input-otp.story.section.events')}
      ${sectionExplainer('theme.input-otp.story.section.events-explainer')}
      <div class="otp-story__events">
        <p class="cremona-typography" data-variant="caption" data-color="secondary">${t('theme.input-otp.story.sample.events-log-label')}</p>
        <ol id="${eventsLogId}" class="otp-story__log" aria-live="polite"></ol>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Input OTP" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="otp-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="otp-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.otp-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.otp-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.otp-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.otp-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.otp-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-6); align-items: flex-start; }
.otp-story__events { display: grid; gap: var(--spacing-2); }
.otp-story__log { list-style: none; padding: var(--spacing-3); margin: 0; background: var(--color-bg-base); border-radius: var(--radius-sm); border: 1px solid var(--color-border-subtle); max-block-size: 200px; overflow-y: auto; font-family: var(--font-mono); font-size: var(--font-size-xs); }
.otp-story__log:empty::before { content: 'No events yet.'; color: var(--color-text-tertiary); font-family: var(--font-sans); }
.otp-story__log li { padding-block: var(--spacing-1); border-block-end: 1px dashed var(--color-border-subtle); }
.otp-story__log li:last-child { border-block-end: 0; }
.otp-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
