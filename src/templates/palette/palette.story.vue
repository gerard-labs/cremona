<!--
  palette.story.vue — Ring 0 token visualizer.

  NOT a component. A proof that the infra (Vite + Tailwind v4 + tokens +
  Histoire) renders coherently, and a visual ground truth for every token
  the kit exposes. Used by Playwright to baseline the kit's vocabulary
  before Ring 1 introduces the first component.

  Q3 option B materialized: this SFC merely WIRES the story metadata
  (`<Story>` / `<Variant>` globals from plugin-vue) and injects a pure-HTML
  body via `v-html`. There is no real Vue componentry — Vue is dev-only
  Histoire infrastructure. The kit's runtime (theme.js) carries Stimulus.
  See ADR-0006 §Amends (clarifies ADR-0005 .story.html → .story.vue with
  innerHTML-equivalent body).
-->
<script setup>
import frDict from '../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

const BRAND_TOKENS = [
  '--color-primary',
  '--color-primary-hover',
  '--color-primary-active',
  '--color-primary-soft',
  '--color-accent',
];
const STATUS_TOKENS = [
  '--color-success',
  '--color-success-soft',
  '--color-warning',
  '--color-warning-soft',
  '--color-danger',
  '--color-danger-hover',
  '--color-danger-soft',
  '--color-info',
  '--color-info-soft',
];
const NEUTRAL_TOKENS = [
  '--color-bg-base',
  '--color-bg-elevated',
  '--color-bg-sunken',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-tertiary',
  '--color-border-subtle',
  '--color-border-default',
  '--color-border-strong',
];
const KPI_TOKENS = [
  '--color-kpi-1',
  '--color-kpi-2',
  '--color-kpi-3',
  '--color-kpi-4',
  '--color-kpi-5',
  '--color-kpi-6',
];
const SPACING_TOKENS = [
  '--spacing-1',
  '--spacing-2',
  '--spacing-3',
  '--spacing-4',
  '--spacing-6',
  '--spacing-8',
  '--spacing-12',
  '--spacing-16',
];
const RADIUS_TOKENS = [
  '--radius-xs',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-2xl',
  '--radius-pill',
];
const SHADOW_TOKENS = [
  '--shadow-1',
  '--shadow-2',
  '--shadow-3',
  '--shadow-4',
  '--shadow-inner',
];
const TYPO_ROLES = [
  ['--typography-display', 'Display'],
  ['--typography-h1', 'H1'],
  ['--typography-h2', 'H2'],
  ['--typography-h3', 'H3'],
  ['--typography-body-lg', 'Body large'],
  ['--typography-body', 'Body'],
  ['--typography-label', 'Label'],
  ['--typography-caption', 'Caption'],
  ['--typography-overline', 'Overline'],
  ['--typography-code', 'Code'],
];

const swatch = (token) =>
  `<li class="palette-swatch">
     <span class="palette-swatch__chip" style="background: var(${token});"></span>
     <code class="palette-swatch__name">${token}</code>
   </li>`;
const spacingRow = (token) =>
  `<li class="palette-row">
     <span class="palette-row__bar" style="inline-size: var(${token}); block-size: var(--spacing-2);"></span>
     <code class="palette-row__name">${token}</code>
   </li>`;
const radiusBox = (token) =>
  `<li class="palette-radius">
     <span class="palette-radius__box" style="border-radius: var(${token});"></span>
     <code>${token}</code>
   </li>`;
const shadowBox = (token) =>
  `<li class="palette-shadow">
     <span class="palette-shadow__box" style="box-shadow: var(${token});"></span>
     <code>${token}</code>
   </li>`;
const typoRow = ([token, label]) =>
  `<li class="palette-typo">
     <span class="palette-typo__sample" style="font: var(${token});">${label} — Aa Bb 0123</span>
     <code class="palette-typo__name">${token}</code>
   </li>`;

const bodyHtml = `
  <section class="palette" data-testid="palette-root">
    <header class="palette__header">
      <h1>${t('theme.palette.title')}</h1>
      <p>${t('theme.palette.subtitle')}</p>
    </header>
    <section aria-labelledby="palette-brand">
      <h2 id="palette-brand">${t('theme.palette.section.brand')}</h2>
      <ul class="palette__grid">${BRAND_TOKENS.map(swatch).join('')}</ul>
    </section>
    <section aria-labelledby="palette-status">
      <h2 id="palette-status">${t('theme.palette.section.status')}</h2>
      <ul class="palette__grid">${STATUS_TOKENS.map(swatch).join('')}</ul>
    </section>
    <section aria-labelledby="palette-neutrals">
      <h2 id="palette-neutrals">${t('theme.palette.section.neutrals')}</h2>
      <ul class="palette__grid">${NEUTRAL_TOKENS.map(swatch).join('')}</ul>
    </section>
    <section aria-labelledby="palette-kpi">
      <h2 id="palette-kpi">${t('theme.palette.section.kpi')}</h2>
      <ul class="palette__grid">${KPI_TOKENS.map(swatch).join('')}</ul>
    </section>
    <section aria-labelledby="palette-spacing">
      <h2 id="palette-spacing">${t('theme.palette.section.spacing')}</h2>
      <ul class="palette__rows">${SPACING_TOKENS.map(spacingRow).join('')}</ul>
    </section>
    <section aria-labelledby="palette-radius">
      <h2 id="palette-radius">${t('theme.palette.section.radius')}</h2>
      <ul class="palette__grid">${RADIUS_TOKENS.map(radiusBox).join('')}</ul>
    </section>
    <section aria-labelledby="palette-shadow">
      <h2 id="palette-shadow">${t('theme.palette.section.shadow')}</h2>
      <ul class="palette__grid">${SHADOW_TOKENS.map(shadowBox).join('')}</ul>
    </section>
    <section aria-labelledby="palette-font">
      <h2 id="palette-font">${t('theme.palette.section.font')}</h2>
      <ul class="palette__typo">${TYPO_ROLES.map(typoRow).join('')}</ul>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Foundations/Palette" group="Ring 0" :layout="{ type: 'single' }">
    <Variant title="Light · LTR">
      <div dir="ltr" v-html="bodyHtml"></div>
    </Variant>
    <Variant title="Light · RTL">
      <div dir="rtl" v-html="bodyHtml"></div>
    </Variant>
    <Variant title="Dark · LTR">
      <div data-theme="dark" class="palette-dark-wrap">
        <div dir="ltr" v-html="bodyHtml"></div>
      </div>
    </Variant>
    <Variant title="Dark · RTL">
      <div data-theme="dark" class="palette-dark-wrap">
        <div dir="rtl" v-html="bodyHtml"></div>
      </div>
    </Variant>
  </Story>
</template>

<style>
.palette { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.palette__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.palette__header p { font: var(--typography-body); color: var(--color-text-secondary); }
.palette__grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--spacing-3); }
.palette__rows { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--spacing-2); }
.palette__typo { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--spacing-3); }
.palette-swatch { display: grid; gap: var(--spacing-2); padding: var(--spacing-3); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.palette-swatch__chip { display: block; block-size: 56px; border-radius: var(--radius-sm); border: 1px solid var(--color-border-subtle); }
.palette-swatch__name { font: var(--typography-code); color: var(--color-text-secondary); word-break: break-all; }
.palette-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: var(--spacing-3); padding: var(--spacing-1) var(--spacing-2); }
.palette-row__bar { background: var(--color-primary); border-radius: var(--radius-pill); display: inline-block; }
.palette-row__name { font: var(--typography-code); color: var(--color-text-secondary); }
.palette-radius { display: grid; gap: var(--spacing-2); justify-items: center; padding: var(--spacing-3); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.palette-radius__box { display: block; inline-size: 72px; block-size: 72px; background: var(--color-primary-soft); border: 1px solid var(--color-primary-soft-foreground); }
.palette-shadow { display: grid; gap: var(--spacing-2); justify-items: center; padding: var(--spacing-3); background: var(--color-bg-elevated); border-radius: var(--radius-md); }
.palette-shadow__box { display: block; inline-size: 72px; block-size: 72px; background: var(--color-bg-elevated); border-radius: var(--radius-md); }
.palette-typo { display: grid; gap: var(--spacing-1); padding: var(--spacing-3); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.palette-typo__name { font: var(--typography-code); color: var(--color-text-tertiary); }
.palette-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
