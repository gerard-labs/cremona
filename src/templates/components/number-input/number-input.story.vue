<!--
  NumberInput story — 4 viewport variants (Light/Dark × LTR/RTL).
  Composes Input visual envelope + 2 stepper buttons + number-input controller.

  Sections:
   1. Default (no min/max)
   2. With min / max boundaries (+/- disabled at edges)
   3. With step (custom increment, decimal step)
   4. Sizes (sm / md / lg)
   5. Disabled / readonly
   6. With Field composition (label + help + error)
-->
<script setup>
import { onMounted } from 'vue';
import { Application } from '@hotwired/stimulus';
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import NumberInputController from '../../../js/controllers/number-input_controller.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderNumberInput({
  name = '',
  htmlId = '',
  value = '',
  min = null,
  max = null,
  step = null,
  placeholder = '',
  size = 'md',
  required = false,
  disabled = false,
  readonly = false,
  invalid = false,
  describedBy = null,
}) {
  const decAria = t('theme.number-input.aria.decrement');
  const incAria = t('theme.number-input.aria.increment');
  const minAttr = min !== null ? ` min="${min}"` : '';
  const maxAttr = max !== null ? ` max="${max}"` : '';
  const stepAttr = step !== null ? ` step="${step}"` : '';
  const placeholderAttr = placeholder ? ` placeholder="${placeholder}"` : '';
  const valueAttr = value !== '' ? ` value="${value}"` : '';
  const nameAttr = name ? ` name="${name}"` : '';
  const idAttr = htmlId ? ` id="${htmlId}"` : '';
  const requiredAttr = required ? ' required aria-required="true"' : '';
  const disabledAttr = disabled ? ' disabled' : '';
  const readonlyAttr = readonly ? ' readonly' : '';
  const invalidAttr = invalid ? ' aria-invalid="true"' : '';
  const describedByAttr = describedBy ? ` aria-describedby="${describedBy}"` : '';

  return `
    <div class="theme-number-input" data-controller="number-input" data-size="${size}">
      <button type="button" class="theme-number-input__btn theme-number-input__btn--decrement"
              aria-label="${decAria}"
              data-number-input-target="decrement"
              data-action="click->number-input#decrement"${disabledAttr}><span aria-hidden="true">−</span></button>
      <input class="theme-input theme-number-input__input" type="number" inputmode="numeric"
             data-size="${size}"
             data-number-input-target="input"${nameAttr}${idAttr}${valueAttr}${minAttr}${maxAttr}${stepAttr}${placeholderAttr}${requiredAttr}${disabledAttr}${readonlyAttr}${invalidAttr}${describedByAttr}>
      <button type="button" class="theme-number-input__btn theme-number-input__btn--increment"
              aria-label="${incAria}"
              data-number-input-target="increment"
              data-action="click->number-input#increment"${disabledAttr}><span aria-hidden="true">+</span></button>
    </div>
  `;
}

onMounted(() => {
  if (!document.body.dataset.numberInputStoryBooted) {
    const app = Application.start();
    app.register('number-input', NumberInputController);
    document.body.dataset.numberInputStoryBooted = '1';
  }
});

const bodyHtml = `
  <section class="ni-story" data-testid="number-input-root">
    <header class="ni-story__header">
      <h1>${t('theme.number-input.story.title')}</h1>
      <p>${t('theme.number-input.story.subtitle')}</p>
    </header>

    <section class="ni-story__section" aria-labelledby="ni-section-default">
      <h2 id="ni-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.number-input.story.section.default')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.number-input.story.section.default-explainer')}</p>
      <div class="ni-story__row">
        ${renderNumberInput({ name: 'qty-1', value: 1, htmlId: 'qty-1' })}
        ${renderNumberInput({ name: 'qty-empty', placeholder: t('theme.number-input.story.placeholder.empty'), htmlId: 'qty-empty' })}
      </div>
    </section>

    <section class="ni-story__section" aria-labelledby="ni-section-min-max">
      <h2 id="ni-section-min-max" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.number-input.story.section.min-max')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.number-input.story.section.min-max-explainer')}</p>
      <div class="ni-story__row">
        <div>
          <p class="theme-typography" data-variant="caption" data-color="secondary">${t('theme.number-input.story.label.qty-bounded')}</p>
          ${renderNumberInput({ name: 'qty-bounded', value: 5, min: 1, max: 10, htmlId: 'qty-bounded' })}
        </div>
        <div>
          <p class="theme-typography" data-variant="caption" data-color="secondary">${t('theme.number-input.story.label.qty-at-min')}</p>
          ${renderNumberInput({ name: 'qty-at-min', value: 1, min: 1, max: 10, htmlId: 'qty-at-min' })}
        </div>
        <div>
          <p class="theme-typography" data-variant="caption" data-color="secondary">${t('theme.number-input.story.label.qty-at-max')}</p>
          ${renderNumberInput({ name: 'qty-at-max', value: 10, min: 1, max: 10, htmlId: 'qty-at-max' })}
        </div>
      </div>
    </section>

    <section class="ni-story__section" aria-labelledby="ni-section-step">
      <h2 id="ni-section-step" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.number-input.story.section.step')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.number-input.story.section.step-explainer')}</p>
      <div class="ni-story__row">
        <div>
          <p class="theme-typography" data-variant="caption" data-color="secondary">${t('theme.number-input.story.label.step-5')}</p>
          ${renderNumberInput({ name: 'step5', value: 25, min: 0, max: 100, step: 5, htmlId: 'step5' })}
        </div>
        <div>
          <p class="theme-typography" data-variant="caption" data-color="secondary">${t('theme.number-input.story.label.step-decimal')}</p>
          ${renderNumberInput({ name: 'price', value: 9.99, min: 0, step: 0.01, htmlId: 'price' })}
        </div>
      </div>
    </section>

    <section class="ni-story__section" aria-labelledby="ni-section-sizes">
      <h2 id="ni-section-sizes" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.number-input.story.section.sizes')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.number-input.story.section.sizes-explainer')}</p>
      <div class="ni-story__row">
        ${renderNumberInput({ name: 'sz-sm', value: 1, size: 'sm', htmlId: 'sz-sm' })}
        ${renderNumberInput({ name: 'sz-md', value: 1, size: 'md', htmlId: 'sz-md' })}
        ${renderNumberInput({ name: 'sz-lg', value: 1, size: 'lg', htmlId: 'sz-lg' })}
      </div>
    </section>

    <section class="ni-story__section" aria-labelledby="ni-section-states">
      <h2 id="ni-section-states" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.number-input.story.section.states')}</h2>
      <div class="ni-story__row">
        <div>
          <p class="theme-typography" data-variant="caption" data-color="secondary">${t('theme.number-input.story.label.disabled')}</p>
          ${renderNumberInput({ name: 'disabled', value: 5, disabled: true, htmlId: 'disabled' })}
        </div>
        <div>
          <p class="theme-typography" data-variant="caption" data-color="secondary">${t('theme.number-input.story.label.readonly')}</p>
          ${renderNumberInput({ name: 'readonly', value: 7, readonly: true, htmlId: 'readonly' })}
        </div>
      </div>
    </section>

    <section class="ni-story__section" aria-labelledby="ni-section-field">
      <h2 id="ni-section-field" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.number-input.story.section.field')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.number-input.story.section.field-explainer')}</p>
      <div class="theme-field" style="max-inline-size: 320px;">
        <label class="theme-label" for="field-qty">
          ${t('theme.number-input.story.field.label')}
          <span class="theme-label__required" aria-hidden="true">*</span>
          <span class="sr-only">${t('theme.number-input.story.field.required')}</span>
        </label>
        ${renderNumberInput({ name: 'field-qty', value: 1, min: 1, max: 99, htmlId: 'field-qty', required: true, describedBy: 'field-qty-help' })}
        <p class="theme-field__help" id="field-qty-help">${t('theme.number-input.story.field.help')}</p>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/NumberInput" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="ni-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="ni-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.ni-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.ni-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.ni-story__header p { font: var(--typography-body); color: var(--color-text-secondary); }
.ni-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.ni-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-4); align-items: flex-end; }
.ni-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
