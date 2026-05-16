<!--
  Form-WithSteps story — 4 viewport variants.
  Sections : default-3-steps · step-2-of-3 (middle) · step-3-of-3-submit ·
             with-skip-cta · with-validation-error · vertical-stepper.

  Foundation pattern for the Forms family (S3.3a-1) — the 7 sibling Form
  specs reference Form-WithSteps.md §1 verbatim for shared family doctrine.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderStepperItem({ idx, currentStep, label, description }) {
  const state = idx < currentStep ? 'completed' : (idx === currentStep ? 'current' : 'upcoming');
  return `
    <li class="cremona-stepper__step" data-stepper-target="step" data-step-index="${idx + 1}" data-state="${state}"${idx === currentStep ? ' aria-current="step"' : ''}>
      <span class="cremona-stepper__indicator" aria-hidden="true">
        <span class="cremona-stepper__indicator-number">${idx + 1}</span>
        <span class="cremona-stepper__indicator-check"></span>
      </span>
      <div class="cremona-stepper__text">
        <span class="cremona-stepper__label">${label}</span>
        ${description ? `<span class="cremona-stepper__description">${description}</span>` : ''}
      </div>
    </li>
  `;
}

function renderField({ id, label, type = 'text', autocomplete, required = false, invalid = false, errorText, helpText, value = '' }) {
  const fieldClasses = ['cremona-field'];
  if (invalid) fieldClasses.push('cremona-field--invalid');
  const describedByIds = [];
  if (helpText) describedByIds.push(`${id}-help`);
  if (errorText) describedByIds.push(`${id}-error`);
  const describedBy = describedByIds.length ? ` aria-describedby="${describedByIds.join(' ')}"` : '';
  return `
    <div class="${fieldClasses.join(' ')}">
      <label class="cremona-label" for="${id}">${label}${required ? ' <span aria-hidden="true">*</span><span class="sr-only">obligatoire</span>' : ''}</label>
      <input type="${type}" id="${id}" name="${id}" class="cremona-input" data-size="md"${autocomplete ? ` autocomplete="${autocomplete}"` : ''}${required ? ' required aria-required="true"' : ''}${invalid ? ' aria-invalid="true"' : ''}${describedBy} value="${value}">
      ${helpText ? `<p class="cremona-field__help" id="${id}-help">${helpText}</p>` : ''}
      ${errorText ? `<p class="cremona-field__error" id="${id}-error">${errorText}</p>` : ''}
    </div>
  `;
}

function renderWithSteps({ id = 'story-form', title, steps, currentStep = 1, allowSkip = false, validationError = false, orientation = 'horizontal' }) {
  const totalSteps = steps.length;
  const isLast = currentStep === totalSteps;
  const isFirst = currentStep === 1;
  const stepperHtml = steps.map((s, idx) => renderStepperItem({ idx, currentStep: currentStep - 1, label: s.label, description: s.description })).join('');

  // Per-step body fields (story demo content)
  function stepBody(idx) {
    if (idx === 1) {
      return `
        ${renderField({ id: `${id}-email`, label: 'Email', type: 'email', autocomplete: 'email', required: true, invalid: validationError, errorText: validationError ? "L'email doit contenir un @." : null, helpText: "On t'enverra un lien de confirmation." })}
        ${renderField({ id: `${id}-password`, label: 'Mot de passe', type: 'password', autocomplete: 'new-password', required: true, helpText: '8 caractères minimum, dont 1 chiffre et 1 majuscule.' })}
      `;
    }
    if (idx === 2) {
      return `
        ${renderField({ id: `${id}-name`, label: 'Nom complet', autocomplete: 'name', required: true })}
        ${renderField({ id: `${id}-company`, label: 'Entreprise (facultatif)', autocomplete: 'organization' })}
      `;
    }
    if (idx === 3) {
      return `
        <p style="font: var(--typography-body); color: var(--color-text-secondary); margin-block-end: var(--spacing-4);">${t('theme.form.with-steps.story.step-3.confirm-summary')}</p>
        <dl class="cremona-description-list" data-layout="side-by-side">
          <dt>${t('theme.form.with-steps.story.field.email-label')}</dt><dd>${t('theme.form.with-steps.story.demo-data.email', { id })}</dd>
          <dt>${t('theme.form.with-steps.story.field.name-label')}</dt><dd>${t('theme.form.with-steps.story.demo-data.name')}</dd>
          <dt>${t('theme.form.with-steps.story.field.org-label')}</dt><dd>${t('theme.form.with-steps.story.demo-data.org')}</dd>
        </dl>
      `;
    }
    return '';
  }

  return `
    <form action="/register" method="post" class="form-with-steps-story__form">
      <div class="cremona-form-with-steps" id="${id}" data-controller="stepper form-with-steps" data-stepper-current-step-value="${currentStep}" data-stepper-total-steps-value="${totalSteps}" data-form-with-steps-current-step-value="${currentStep}" data-form-with-steps-total-steps-value="${totalSteps}" data-form-with-steps-allow-skip-value="${allowSkip}" aria-labelledby="${id}-title">
        <h2 id="${id}-title" class="cremona-typography cremona-form-with-steps__title" data-variant="h2">${title}</h2>
        <ol class="cremona-stepper cremona-form-with-steps__indicator" data-orientation="${orientation}" data-size="md" aria-label="${t('theme.form.with-steps.aria.indicator', { currentStep, totalSteps })}">
          ${stepperHtml}
        </ol>
        <div class="cremona-form-with-steps__steps">
          ${steps.map((s, idx) => {
            const stepIdx = idx + 1;
            const hidden = stepIdx !== currentStep;
            return `
              <fieldset class="cremona-form-with-steps__step" data-form-with-steps-target="step" data-step-index="${stepIdx}"${hidden ? ' hidden' : ''} aria-labelledby="${id}-legend-${stepIdx}">
                <legend id="${id}-legend-${stepIdx}" class="sr-only">${t('theme.form.with-steps.aria.fieldset-label', { n: stepIdx, label: s.label })}</legend>
                ${stepBody(stepIdx)}
              </fieldset>
            `;
          }).join('')}
        </div>
        <div class="cremona-form-with-steps__announcer" data-form-with-steps-target="announcer" aria-live="polite" aria-atomic="true">
          ${t('theme.form.with-steps.aria.step-of', { currentStep, totalSteps })}
        </div>
        <div class="cremona-form-with-steps__footer">
          <button type="button" class="cremona-button cremona-button--ghost cremona-form-with-steps__skip" data-form-with-steps-target="skipBtn" data-action="click->form-with-steps#skip"${allowSkip ? '' : ' hidden'}>${t('theme.form.with-steps.actions.skip')}</button>
          <div class="cremona-form-with-steps__nav">
            <button type="button" class="cremona-button cremona-button--outline" data-form-with-steps-target="prevBtn" data-action="click->form-with-steps#previous"${isFirst ? ' hidden' : ''}>${t('theme.form.with-steps.actions.previous')}</button>
            <button type="button" class="cremona-button cremona-button--primary" data-form-with-steps-target="nextBtn" data-action="click->form-with-steps#next"${isLast ? ' hidden' : ''}>${t('theme.form.with-steps.actions.next')}</button>
            <button type="submit" class="cremona-button cremona-button--primary" data-form-with-steps-target="submitBtn"${isLast ? '' : ' hidden'}>${t('theme.form.with-steps.actions.submit')}</button>
          </div>
        </div>
      </div>
    </form>
  `;
}

const title = t('theme.form.with-steps.story.title');
const steps = [
  { label: t('theme.form.with-steps.story.step.1.label'), description: t('theme.form.with-steps.story.step.1.description') },
  { label: t('theme.form.with-steps.story.step.2.label'), description: t('theme.form.with-steps.story.step.2.description') },
  { label: t('theme.form.with-steps.story.step.3.label') },
];

const bodyHtml = `
  <section class="form-with-steps-story" aria-labelledby="form-with-steps-story-title">
    <header class="form-with-steps-story__header">
      <h1 id="form-with-steps-story-title">${t('theme.form.with-steps.story.title')}</h1>
      <p>${t('theme.form.with-steps.story.subtitle')}</p>
    </header>

    <section class="form-with-steps-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.with-steps.story.section.default-step-1')}</h2>
      <div class="form-with-steps-story__frame">${renderWithSteps({ id: 'story-step-1', title, steps, currentStep: 1 })}</div>
    </section>

    <section class="form-with-steps-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.with-steps.story.section.step-2-middle')}</h2>
      <div class="form-with-steps-story__frame">${renderWithSteps({ id: 'story-step-2', title, steps, currentStep: 2 })}</div>
    </section>

    <section class="form-with-steps-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.with-steps.story.section.step-3-submit')}</h2>
      <div class="form-with-steps-story__frame">${renderWithSteps({ id: 'story-step-3', title, steps, currentStep: 3 })}</div>
    </section>

    <section class="form-with-steps-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.with-steps.story.section.with-skip')}</h2>
      <div class="form-with-steps-story__frame">${renderWithSteps({ id: 'story-skip', title, steps, currentStep: 1, allowSkip: true })}</div>
    </section>

    <section class="form-with-steps-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.with-steps.story.section.with-validation-error')}</h2>
      <div class="form-with-steps-story__frame">${renderWithSteps({ id: 'story-error', title, steps, currentStep: 1, validationError: true })}</div>
    </section>

    <section class="form-with-steps-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.form.with-steps.story.section.vertical-stepper')}</h2>
      <div class="form-with-steps-story__frame">${renderWithSteps({ id: 'story-vertical', title, steps, currentStep: 2, orientation: 'vertical' })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Form-WithSteps" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="form-with-steps-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="form-with-steps-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.form-with-steps-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.form-with-steps-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.form-with-steps-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.form-with-steps-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.form-with-steps-story__frame { min-block-size: 28rem; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); overflow: hidden; padding: var(--spacing-4); }
.form-with-steps-story__form { display: contents; }
.form-with-steps-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
