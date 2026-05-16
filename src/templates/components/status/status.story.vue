<!--
  Status story — 4 viewport variants (Light/Dark × LTR/RTL).
  Pure-CSS labelled status indicator ; 0 controller. Variant drives the
  live-region role auto-derivation (danger=alert, others=status).

  Sections:
   1. Variants (success / info / warning / danger) — soft pill + dot
   2. With pulse (opt-in animated dot for live monitoring contexts)
   3. Sizes (sm / md)
   4. Inline composition (status alongside text in a sentence)
   5. Reduced-motion behavior (pulse stops, dot stays solid) — explainer
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderStatus({ variant = 'success', label, pulse = false, size = 'md', className }) {
  const classes = ['theme-status'];
  if (className) classes.push(className);
  const tag = variant === 'danger' ? 'div' : 'output';
  const roleAttr = variant === 'danger' ? ' role="alert"' : '';
  const pulseAttr = pulse ? ' data-pulse="true"' : '';
  return `<${tag} class="${classes.join(' ')}" data-variant="${variant}" data-size="${size}"${pulseAttr}${roleAttr}><span class="theme-status__dot" aria-hidden="true"></span><span class="theme-status__label">${label}</span></${tag}>`;
}

const VARIANTS = [
  { id: 'success', label: t('theme.status.story.label.operational') },
  { id: 'info',    label: t('theme.status.story.label.deploying') },
  { id: 'warning', label: t('theme.status.story.label.degraded') },
  { id: 'danger',  label: t('theme.status.story.label.outage') },
];

const bodyHtml = `
  <section class="status-story" data-testid="status-root">
    <header class="status-story__header">
      <h1>${t('theme.status.story.title')}</h1>
      <p>${t('theme.status.story.subtitle')}</p>
    </header>

    <section class="status-story__section" aria-labelledby="status-section-variants">
      <h2 id="status-section-variants" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.status.story.section.variants')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.status.story.section.variants-explainer')}</p>
      <div class="status-story__row">
        ${VARIANTS.map((v) => renderStatus({ variant: v.id, label: v.label })).join('')}
      </div>
    </section>

    <section class="status-story__section" aria-labelledby="status-section-pulse">
      <h2 id="status-section-pulse" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.status.story.section.pulse')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.status.story.section.pulse-explainer')}</p>
      <div class="status-story__row">
        ${VARIANTS.map((v) => renderStatus({ variant: v.id, label: v.label, pulse: true })).join('')}
      </div>
    </section>

    <section class="status-story__section" aria-labelledby="status-section-sizes">
      <h2 id="status-section-sizes" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.status.story.section.sizes')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.status.story.section.sizes-explainer')}</p>
      <div class="status-story__row">
        ${renderStatus({ variant: 'success', size: 'sm', label: t('theme.status.story.label.operational') })}
        ${renderStatus({ variant: 'success', size: 'md', label: t('theme.status.story.label.operational') })}
        ${renderStatus({ variant: 'warning', size: 'sm', label: t('theme.status.story.label.degraded') })}
        ${renderStatus({ variant: 'warning', size: 'md', label: t('theme.status.story.label.degraded'), pulse: true })}
      </div>
    </section>

    <section class="status-story__section" aria-labelledby="status-section-inline">
      <h2 id="status-section-inline" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.status.story.section.inline')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.status.story.section.inline-explainer')}</p>
      <p class="theme-typography" data-variant="body">
        <span>${t('theme.status.story.inline.api')}</span>
        ${renderStatus({ variant: 'success', size: 'sm', label: t('theme.status.story.label.operational') })}
        <span>${t('theme.status.story.inline.api-tail')}</span>
      </p>
      <p class="theme-typography" data-variant="body">
        <span>${t('theme.status.story.inline.db')}</span>
        ${renderStatus({ variant: 'warning', size: 'sm', label: t('theme.status.story.label.degraded'), pulse: true })}
        <span>${t('theme.status.story.inline.db-tail')}</span>
      </p>
    </section>

    <section class="status-story__section" aria-labelledby="status-section-reduced">
      <h2 id="status-section-reduced" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.status.story.section.reduced')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.status.story.section.reduced-explainer')}</p>
      <p class="theme-typography" data-variant="caption" data-color="secondary">${t('theme.status.story.section.reduced-os-tip')}</p>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/Status" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="status-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="status-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.status-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.status-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.status-story__header p { font: var(--typography-body); color: var(--color-text-secondary); }
.status-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.status-story__row { display: flex; flex-wrap: wrap; gap: var(--spacing-3); align-items: center; }
.status-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
