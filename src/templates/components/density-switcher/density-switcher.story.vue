<!--
  DensitySwitcher story — 4 viewport variants.
  Sections : default-comfortable · cozy-active · compact-active · live-preview-affects-form.
-->
<script setup>
import { onMounted } from 'vue';
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

function renderDensitySwitcher({ id, currentDensity = 'comfortable', target = 'self' }) {
  const opts = [
    { density: 'comfortable', label: t('theme.density-switcher.label.comfortable') },
    { density: 'cozy',        label: t('theme.density-switcher.label.cozy') },
    { density: 'compact',     label: t('theme.density-switcher.label.compact') },
  ];
  const toggles = opts.map((o) => `
    <button type="button"
            class="cremona-toggle cremona-toggle-group__item cremona-density-switcher__item"
            data-size="md" data-variant="default"
            data-controller="toggle"
            data-action="click->toggle#toggle"
            data-density="${o.density}"
            aria-pressed="${o.density === currentDensity ? 'true' : 'false'}"
            aria-label="${o.label}">
      <span class="cremona-toggle__label">${o.label}</span>
    </button>`).join('');
  return `
    <div class="cremona-toggle-group-wrap cremona-density-switcher" data-orientation="horizontal">
      <span id="${id}-label" class="cremona-toggle-group__label">${t('theme.density-switcher.label.group')}</span>
      <div class="cremona-toggle-group cremona-density-switcher__group"
           role="group" aria-labelledby="${id}-label"
           data-controller="toggle-group density-switcher"
           data-action="keydown->toggle-group#keydown toggle->toggle-group#onToggle toggle->density-switcher#onToggle"
           data-toggle-group-mode-value="single"
           data-toggle-group-orientation-value="horizontal"
           data-density-switcher-current-density-value="${currentDensity}"
           data-density-switcher-storage-key-value="theme.density"
           data-density-switcher-target-value="${target}"
           data-orientation="horizontal" data-size="md" data-variant="default">
        ${toggles}
      </div>
    </div>`;
}

const bodyHtml = `
  <section class="density-switcher-story" aria-labelledby="density-switcher-story-title">
    <header class="density-switcher-story__header">
      <h1 id="density-switcher-story-title">${t('theme.density-switcher.story.title')}</h1>
      <p>${t('theme.density-switcher.story.subtitle')}</p>
    </header>

    <section class="density-switcher-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.density-switcher.story.section.default')}</h2>
      <p class="density-switcher-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.density-switcher.story.explainer.default')}</p>
      <div class="density-switcher-story__frame">${renderDensitySwitcher({ id: 'story-default', currentDensity: 'comfortable' })}</div>
    </section>

    <section class="density-switcher-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.density-switcher.story.section.cozy')}</h2>
      <p class="density-switcher-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.density-switcher.story.explainer.cozy')}</p>
      <div class="density-switcher-story__frame">${renderDensitySwitcher({ id: 'story-cozy', currentDensity: 'cozy' })}</div>
    </section>

    <section class="density-switcher-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.density-switcher.story.section.compact')}</h2>
      <p class="density-switcher-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.density-switcher.story.explainer.compact')}</p>
      <div class="density-switcher-story__frame">${renderDensitySwitcher({ id: 'story-compact', currentDensity: 'compact' })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Density Switcher" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="density-switcher-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="density-switcher-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.density-switcher-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.density-switcher-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.density-switcher-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.density-switcher-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.density-switcher-story__explainer { max-inline-size: 70ch; }
.density-switcher-story__frame { display: flex; gap: var(--spacing-4); padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); align-items: flex-start; }
.density-switcher-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
