<!--
  Textarea story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (8): default · states · sizes · autosize · fixed · invalid
  · long-value · with-spellcheck-off.

  The autosize sections wire the `textarea-autosize` Stimulus controller
  via data-controller + data-action; the controller is registered in
  src/js/index.js so Histoire boots it when the story loads.

  As with Input, the story does NOT synthesize :hover / :focus snapshots;
  Playwright bakes at-rest variants. The autosize behavior is visually
  validated by the pre-filled long-value section (the controller grows
  the textarea on mount via `connect()`).
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

setTranslations('fr', frDict);
setLocale('fr');

// Boot Stimulus inside the story so `textarea-autosize` connects on mount.
// `boot()` is idempotent on the same root, so reloading the story is safe.
onMounted(() => boot(document.documentElement));

function renderTextarea(props = {}) {
  const {
    name, htmlId, value, placeholder, rows = 3, autosize, minRows = 2, maxRows = 8,
    size = 'md', required, disabled, readonly, invalid, describedBy,
    maxlength, spellcheck, className,
  } = props;

  const classes = ['cremona-textarea'];
  if (className) classes.push(className);

  const attrs = [
    `class="${classes.join(' ')}"`,
    `data-size="${size}"`,
    `rows="${rows}"`,
    autosize ? `data-controller="textarea-autosize"` : '',
    autosize ? `data-action="input->textarea-autosize#resize"` : '',
    autosize ? `data-textarea-autosize-min-rows-value="${minRows}"` : '',
    autosize ? `data-textarea-autosize-max-rows-value="${maxRows}"` : '',
    name ? `name="${name}"` : '',
    htmlId ? `id="${htmlId}"` : '',
    placeholder ? `placeholder="${placeholder}"` : '',
    required ? `required aria-required="true"` : '',
    disabled ? `disabled` : '',
    readonly ? `readonly` : '',
    invalid ? `aria-invalid="true"` : '',
    describedBy ? `aria-describedby="${describedBy}"` : '',
    maxlength ? `maxlength="${maxlength}"` : '',
    spellcheck ? `spellcheck="${spellcheck}"` : '',
  ].filter(Boolean).join(' ');

  // Escape the value so naïve HTML interpolation doesn't break.
  const safeValue = (value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<textarea ${attrs}>${safeValue}</textarea>`;
}

function row(html, label) {
  return `
    <div class="textarea-story__row">
      ${label ? `<code class="textarea-story__rowlabel">${label}</code>` : ''}
      <div class="textarea-story__rowcontent">${html}</div>
    </div>
  `;
}

const PH = {
  message:     t('theme.textarea.placeholder.message'),
  description: t('theme.textarea.placeholder.description'),
  notes:       t('theme.textarea.placeholder.notes'),
};

const SAMPLES = {
  short:  t('theme.textarea.sample.short'),
  medium: t('theme.textarea.sample.medium'),
  long:   t('theme.textarea.sample.long-paragraph'),
};

const bodyHtml = `
  <section class="textarea-story" data-testid="textarea-root">
    <header class="textarea-story__header">
      <h1>${t('theme.textarea.story.title')}</h1>
      <p>${t('theme.textarea.story.subtitle')}</p>
    </header>

    <section class="textarea-story__section" aria-labelledby="textarea-section-default">
      <h2 id="textarea-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.textarea.story.section.default')}</h2>
      <div class="textarea-story__stack">
        ${row(renderTextarea({ htmlId: 'demo-default-msg',  placeholder: PH.message, autosize: true }), 'autosize 2-8')}
        ${row(renderTextarea({ htmlId: 'demo-default-desc', placeholder: PH.description, rows: 3 }),     'rows=3 fixed')}
      </div>
    </section>

    <section class="textarea-story__section" aria-labelledby="textarea-section-states">
      <h2 id="textarea-section-states" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.textarea.story.section.states')}</h2>
      <div class="textarea-story__stack">
        ${row(renderTextarea({ htmlId: 'demo-state-default',  placeholder: PH.message }),                                                  'default')}
        ${row(renderTextarea({ htmlId: 'demo-state-value',    value: SAMPLES.short }),                                                     'with value')}
        ${row(renderTextarea({ htmlId: 'demo-state-disabled', placeholder: PH.message, disabled: true }),                                  'disabled')}
        ${row(renderTextarea({ htmlId: 'demo-state-readonly', value: SAMPLES.medium, readonly: true, autosize: true, maxRows: 6 }),        'readonly')}
        ${row(renderTextarea({ htmlId: 'demo-state-required', placeholder: PH.message, required: true }),                                  'required')}
        ${row(renderTextarea({ htmlId: 'demo-state-invalid',  value: 'a', invalid: true, describedBy: 'demo-state-invalid-error' }),       'invalid')}
      </div>
      <p class="textarea-story__explainer cremona-typography" data-variant="caption" data-color="tertiary" id="demo-state-invalid-error">${t('theme.textarea.story.explainer.invalid')}</p>
    </section>

    <section class="textarea-story__section" aria-labelledby="textarea-section-sizes">
      <h2 id="textarea-section-sizes" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.textarea.story.section.sizes')}</h2>
      <div class="textarea-story__stack">
        ${row(renderTextarea({ htmlId: 'demo-size-sm', size: 'sm', placeholder: PH.message, rows: 2 }), 'sm')}
        ${row(renderTextarea({ htmlId: 'demo-size-md', size: 'md', placeholder: PH.message, rows: 3 }), 'md')}
        ${row(renderTextarea({ htmlId: 'demo-size-lg', size: 'lg', placeholder: PH.message, rows: 3 }), 'lg')}
      </div>
    </section>

    <section class="textarea-story__section" aria-labelledby="textarea-section-autosize">
      <h2 id="textarea-section-autosize" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.textarea.story.section.autosize')}</h2>
      <p class="textarea-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.textarea.story.explainer.autosize')}</p>
      <div class="textarea-story__stack">
        ${row(renderTextarea({ htmlId: 'demo-autosize-empty',  placeholder: PH.message, autosize: true, minRows: 2, maxRows: 6, rows: 2 }),  'empty')}
        ${row(renderTextarea({ htmlId: 'demo-autosize-medium', value: SAMPLES.medium, autosize: true, minRows: 2, maxRows: 6, rows: 2 }),    'medium content')}
      </div>
    </section>

    <section class="textarea-story__section" aria-labelledby="textarea-section-fixed">
      <h2 id="textarea-section-fixed" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.textarea.story.section.fixed')}</h2>
      <p class="textarea-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.textarea.story.explainer.fixed')}</p>
      <div class="textarea-story__stack">
        ${row(renderTextarea({ htmlId: 'demo-fixed-2', placeholder: PH.notes, rows: 2 }), 'rows=2')}
        ${row(renderTextarea({ htmlId: 'demo-fixed-5', placeholder: PH.notes, rows: 5 }), 'rows=5')}
      </div>
    </section>

    <section class="textarea-story__section" aria-labelledby="textarea-section-long-value">
      <h2 id="textarea-section-long-value" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.textarea.story.section.long-value')}</h2>
      <div class="textarea-story__stack">
        ${row(renderTextarea({ htmlId: 'demo-long', value: SAMPLES.long, autosize: true, minRows: 2, maxRows: 6 }), 'autosize → clamp 6 + scroll')}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Textarea" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="textarea-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="textarea-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.textarea-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.textarea-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.textarea-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.textarea-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.textarea-story__stack { display: grid; gap: var(--spacing-3); }
.textarea-story__row { display: grid; grid-template-columns: minmax(140px, 180px) 1fr; gap: var(--spacing-3); align-items: start; }
.textarea-story__rowlabel { font: var(--typography-code); color: var(--color-text-tertiary); padding-block-start: var(--spacing-2); }
.textarea-story__rowcontent { min-inline-size: 0; }
.textarea-story__explainer { max-inline-size: 70ch; }
.textarea-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
