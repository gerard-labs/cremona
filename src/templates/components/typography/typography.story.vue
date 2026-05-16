<!--
  Typography story — 4 viewport variants (Light/Dark × LTR/RTL).

  Each Variant renders the same content stack: all 10 variants, the 4
  semantic colors, the 4 explicit weight overrides, the 3 alignment
  options, a tabular-nums demo, a long-text wrapping demo, an empty
  state, and a rich-inline-markup demo. Total: ~24 visible states.

  HTML body is produced via the helper functions below, mirroring what
  the Twig template (`typography.html.twig`) outputs at server-side. We
  do NOT import twig-js — per ADR-0006 §Amends + OQ-2 S1.1 resolution,
  stories carry pure HTML via v-html; the Twig file is a structurally
  parallel artifact, hand-reviewed for parity.

  Every user-facing string is keyed via `t()` (FR/EN parity enforced by
  `tools/check-i18n.js`).
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

const VARIANT_TO_TAG = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  'body-lg': 'p',
  body: 'p',
  label: 'span',
  caption: 'small',
  overline: 'small',
  code: 'code',
};

const VARIANTS = ['display', 'h1', 'h2', 'h3', 'body-lg', 'body', 'label', 'caption', 'overline', 'code'];
const COLORS = ['primary', 'secondary', 'tertiary', 'disabled'];
const WEIGHTS = ['regular', 'medium', 'semibold', 'bold'];
const ALIGNS = ['start', 'center', 'end'];

const SAMPLES = {
  display:  t('theme.typography.sample.display'),
  h1:       t('theme.typography.sample.h1'),
  h2:       t('theme.typography.sample.h2'),
  h3:       t('theme.typography.sample.h3'),
  'body-lg':t('theme.typography.sample.body-lg'),
  body:     t('theme.typography.sample.body'),
  label:    t('theme.typography.sample.label'),
  caption:  t('theme.typography.sample.caption'),
  overline: t('theme.typography.sample.overline'),
  code:     t('theme.typography.sample.code'),
};

function renderTypo({ variant, content, color, weight, align, tabularNums, htmlId, className, as }) {
  const tag = as ?? VARIANT_TO_TAG[variant] ?? 'span';
  const classes = ['cremona-typography'];
  if (tabularNums) classes.push('cremona-tabular-nums');
  if (className) classes.push(className);
  const attrs = [
    `class="${classes.join(' ')}"`,
    `data-variant="${variant}"`,
    color ? `data-color="${color}"` : '',
    weight ? `data-weight="${weight}"` : '',
    align ? `data-align="${align}"` : '',
    htmlId ? `id="${htmlId}"` : '',
  ].filter(Boolean).join(' ');
  return `<${tag} ${attrs}>${content}</${tag}>`;
}

function renderRow(label, htmlRow) {
  return `
    <div class="typography-story__row">
      <code class="typography-story__rowlabel">${label}</code>
      <div class="typography-story__rowcontent">${htmlRow}</div>
    </div>
  `;
}

const bodyHtml = `
  <section class="typography-story" data-testid="typography-root">
    <header class="typography-story__header">
      <h1>${t('theme.typography.story.title')}</h1>
      <p>${t('theme.typography.story.subtitle')}</p>
    </header>

    <section class="typography-story__section" aria-labelledby="typography-section-variants">
      <h2 id="typography-section-variants" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.typography.story.section.variants')}</h2>
      <div class="typography-story__stack">
        ${VARIANTS.map((v) => renderRow(v, renderTypo({ variant: v, content: SAMPLES[v] }))).join('')}
      </div>
    </section>

    <section class="typography-story__section" aria-labelledby="typography-section-colors">
      <h2 id="typography-section-colors" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.typography.story.section.colors')}</h2>
      <div class="typography-story__stack">
        ${COLORS.map((c) => renderRow(c, renderTypo({ variant: 'body', content: SAMPLES.body, color: c }))).join('')}
      </div>
    </section>

    <section class="typography-story__section" aria-labelledby="typography-section-weights">
      <h2 id="typography-section-weights" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.typography.story.section.weights')}</h2>
      <div class="typography-story__stack">
        ${WEIGHTS.map((w) => renderRow(w, renderTypo({ variant: 'body', content: SAMPLES.body, weight: w }))).join('')}
      </div>
    </section>

    <section class="typography-story__section" aria-labelledby="typography-section-align">
      <h2 id="typography-section-align" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.typography.story.section.align')}</h2>
      <div class="typography-story__stack">
        ${ALIGNS.map((a) => renderRow(a, renderTypo({ variant: 'body', content: SAMPLES.body, align: a }))).join('')}
      </div>
    </section>

    <section class="typography-story__section" aria-labelledby="typography-section-tabular">
      <h2 id="typography-section-tabular" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.typography.story.section.tabular')}</h2>
      <div class="typography-story__stack">
        ${renderRow('tabular', renderTypo({ variant: 'body', content: '1 234,56 €', tabularNums: true }))}
        ${renderRow('tabular', renderTypo({ variant: 'body', content: '999,99 €', tabularNums: true }))}
        ${renderRow('missing', renderTypo({ variant: 'body', content: t('theme.typography.story.empty-placeholder'), color: 'disabled', tabularNums: true }))}
      </div>
    </section>

    <section class="typography-story__section" aria-labelledby="typography-section-wrap">
      <h2 id="typography-section-wrap" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.typography.story.section.wrap')}</h2>
      <div class="typography-story__wrap">
        ${renderTypo({ variant: 'body', content: t('theme.typography.story.sample-long') })}
      </div>
    </section>

    <section class="typography-story__section" aria-labelledby="typography-section-empty">
      <h2 id="typography-section-empty" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.typography.story.section.empty')}</h2>
      <div class="typography-story__stack">
        ${renderRow('empty', renderTypo({ variant: 'body', content: t('theme.typography.story.empty-placeholder'), color: 'disabled' }))}
      </div>
    </section>

    <section class="typography-story__section" aria-labelledby="typography-section-rich">
      <h2 id="typography-section-rich" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.typography.story.section.rich')}</h2>
      <div class="typography-story__stack">
        ${renderRow('rich', renderTypo({ variant: 'body', content: t('theme.typography.story.sample-rich') }))}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Primitives/Typography" group="Ring 1" :layout="{ type: 'single' }">
    <Variant title="Light · LTR">
      <div dir="ltr" v-html="bodyHtml"></div>
    </Variant>
    <Variant title="Light · RTL">
      <div dir="rtl" v-html="bodyHtml"></div>
    </Variant>
    <Variant title="Dark · LTR">
      <div data-theme="dark" class="typography-dark-wrap">
        <div dir="ltr" v-html="bodyHtml"></div>
      </div>
    </Variant>
    <Variant title="Dark · RTL">
      <div data-theme="dark" class="typography-dark-wrap">
        <div dir="rtl" v-html="bodyHtml"></div>
      </div>
    </Variant>
  </Story>
</template>

<style>
.typography-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.typography-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.typography-story__header p { font: var(--typography-body); color: var(--color-text-secondary); }
.typography-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.typography-story__stack { display: grid; gap: var(--spacing-2); }
.typography-story__row { display: grid; grid-template-columns: minmax(80px, 110px) 1fr; gap: var(--spacing-3); align-items: baseline; padding: var(--spacing-1) 0; }
.typography-story__rowlabel { font: var(--typography-code); color: var(--color-text-tertiary); }
.typography-story__rowcontent { min-inline-size: 0; }
.typography-story__wrap { max-inline-size: 60ch; }
.typography-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
