<!--
  Label story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (9): default · required · optional · with-hint · disabled · sizes
  · combinations · long-label · associated-input-demo.

  Pattern: SFC + v-html (ADR-0006 §Amends). The Twig template
  `label.html.twig` is the parallel server-render artifact, hand-reviewed
  for parity. Stories pre-translate all visible strings via `t()`; the
  Label component itself never owns translation — it ships defaults to a
  FR fallback inside Twig `default()` filters only.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderLabel({ content, htmlFor, required, optionalText, hint, size, disabled, className }) {
  const classes = ['cremona-label'];
  if (className) classes.push(className);
  const attrs = [
    `class="${classes.join(' ')}"`,
    `data-size="${size ?? 'sm'}"`,
    htmlFor ? `for="${htmlFor}"` : '',
    disabled ? `data-state="disabled"` : '',
  ].filter(Boolean).join(' ');

  let suffix = '';
  if (required) {
    suffix = `<span class="cremona-label__required" aria-hidden="true">*</span><span class="cremona-sr-only">${t('theme.label.required-aria')}</span>`;
  } else if (optionalText) {
    suffix = `<span class="cremona-label__optional">${optionalText}</span>`;
  }
  const hintHtml = hint ? `<span class="cremona-label__hint">${hint}</span>` : '';

  return `
    <label ${attrs}>
      <span class="cremona-label__text">${content}</span>
      ${suffix}
      ${hintHtml}
    </label>
  `;
}

const OPTIONAL_SUFFIX = t('theme.label.optional-suffix');
const HINT_50 = t('theme.label.hint.max-50-chars');
const HINT_EMAIL = t('theme.label.hint.format-email');

const SAMPLES = [
  ['theme.label.sample.email',     'demo-email'],
  ['theme.label.sample.password',  'demo-password'],
  ['theme.label.sample.full-name', 'demo-name'],
  ['theme.label.sample.phone',     'demo-phone'],
  ['theme.label.sample.message',   'demo-message'],
];

function row(html) {
  return `<div class="label-story__row">${html}</div>`;
}

const bodyHtml = `
  <section class="label-story" data-testid="label-root">
    <header class="label-story__header">
      <h1>${t('theme.label.story.title')}</h1>
      <p>${t('theme.label.story.subtitle')}</p>
    </header>

    <section class="label-story__section" aria-labelledby="label-section-default">
      <h2 id="label-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.label.story.section.default')}</h2>
      <div class="label-story__stack">
        ${SAMPLES.map(([key, id]) => row(renderLabel({ content: t(key), htmlFor: id }))).join('')}
      </div>
    </section>

    <section class="label-story__section" aria-labelledby="label-section-required">
      <h2 id="label-section-required" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.label.story.section.required')}</h2>
      <div class="label-story__stack">
        ${SAMPLES.slice(0, 3).map(([key, id]) =>
          row(renderLabel({ content: t(key), htmlFor: id + '-req', required: true })),
        ).join('')}
      </div>
    </section>

    <section class="label-story__section" aria-labelledby="label-section-optional">
      <h2 id="label-section-optional" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.label.story.section.optional')}</h2>
      <div class="label-story__stack">
        ${SAMPLES.slice(2, 5).map(([key, id]) =>
          row(renderLabel({ content: t(key), htmlFor: id + '-opt', optionalText: OPTIONAL_SUFFIX })),
        ).join('')}
      </div>
    </section>

    <section class="label-story__section" aria-labelledby="label-section-with-hint">
      <h2 id="label-section-with-hint" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.label.story.section.with-hint')}</h2>
      <div class="label-story__stack">
        ${row(renderLabel({ content: t('theme.label.sample.email'),    htmlFor: 'demo-email-hint',   hint: HINT_EMAIL }))}
        ${row(renderLabel({ content: t('theme.label.sample.message'),  htmlFor: 'demo-message-hint', hint: HINT_50 }))}
      </div>
    </section>

    <section class="label-story__section" aria-labelledby="label-section-disabled">
      <h2 id="label-section-disabled" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.label.story.section.disabled')}</h2>
      <div class="label-story__stack">
        ${row(renderLabel({ content: t('theme.label.sample.email'),    htmlFor: 'demo-email-dis',    disabled: true }))}
        ${row(renderLabel({ content: t('theme.label.sample.password'), htmlFor: 'demo-password-dis', disabled: true, required: true }))}
      </div>
    </section>

    <section class="label-story__section" aria-labelledby="label-section-sizes">
      <h2 id="label-section-sizes" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.label.story.section.sizes')}</h2>
      <div class="label-story__stack">
        ${row(renderLabel({ content: t('theme.label.sample.email'), htmlFor: 'demo-email-sm', size: 'sm' }))}
        ${row(renderLabel({ content: t('theme.label.sample.email'), htmlFor: 'demo-email-md', size: 'md' }))}
      </div>
    </section>

    <section class="label-story__section" aria-labelledby="label-section-combinations">
      <h2 id="label-section-combinations" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.label.story.section.combinations')}</h2>
      <div class="label-story__stack">
        ${row(renderLabel({ content: t('theme.label.sample.email'),    htmlFor: 'demo-email-combo',    required: true, hint: HINT_EMAIL }))}
        ${row(renderLabel({ content: t('theme.label.sample.password'), htmlFor: 'demo-password-combo', required: true, hint: HINT_50 }))}
      </div>
    </section>

    <section class="label-story__section" aria-labelledby="label-section-long">
      <h2 id="label-section-long" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.label.story.section.long-label')}</h2>
      <div class="label-story__stack">
        ${row(renderLabel({ content: t('theme.label.sample.long'), htmlFor: 'demo-long', required: true, hint: HINT_50 }))}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Label" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="label-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="label-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.label-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.label-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.label-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.label-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.label-story__stack { display: grid; gap: var(--spacing-2); }
.label-story__row { padding-block: var(--spacing-1); }
.label-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
