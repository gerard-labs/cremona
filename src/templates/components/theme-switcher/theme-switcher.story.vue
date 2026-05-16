<!--
  ThemeSwitcher story — 4 viewport variants.
  Sections : system-active · light-active · dark-active.
-->
<script setup>
import { onMounted } from 'vue';
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

function renderThemeSwitcher({ id, currentMode = 'system', target = 'self' }) {
  const opts = [
    { mode: 'light',  label: t('theme.theme-switcher.label.light') },
    { mode: 'dark',   label: t('theme.theme-switcher.label.dark') },
    { mode: 'system', label: t('theme.theme-switcher.label.system') },
  ];
  const toggles = opts.map((o) => `
    <button type="button"
            class="cremona-toggle cremona-toggle-group__item cremona-theme-switcher__item"
            data-size="md" data-variant="default"
            data-controller="toggle"
            data-action="click->toggle#toggle"
            data-theme-mode="${o.mode}"
            aria-pressed="${o.mode === currentMode ? 'true' : 'false'}"
            aria-label="${o.label}">
      <span class="cremona-toggle__label">${o.label}</span>
    </button>`).join('');
  return `
    <div class="cremona-toggle-group-wrap cremona-theme-switcher" data-orientation="horizontal">
      <span id="${id}-label" class="cremona-toggle-group__label">${t('theme.theme-switcher.label.group')}</span>
      <div class="cremona-toggle-group cremona-theme-switcher__group"
           role="group" aria-labelledby="${id}-label"
           data-controller="toggle-group theme-switcher"
           data-action="keydown->toggle-group#keydown toggle->toggle-group#onToggle toggle->theme-switcher#onToggle"
           data-toggle-group-mode-value="single"
           data-toggle-group-orientation-value="horizontal"
           data-theme-switcher-current-mode-value="${currentMode}"
           data-theme-switcher-storage-key-value="theme.mode"
           data-theme-switcher-target-value="${target}"
           data-orientation="horizontal" data-size="md" data-variant="default">
        ${toggles}
      </div>
    </div>`;
}

const bodyHtml = `
  <section class="theme-switcher-story" aria-labelledby="theme-switcher-story-title">
    <header class="theme-switcher-story__header">
      <h1 id="theme-switcher-story-title">${t('theme.theme-switcher.story.title')}</h1>
      <p>${t('theme.theme-switcher.story.subtitle')}</p>
    </header>

    <section class="theme-switcher-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.theme-switcher.story.section.system')}</h2>
      <p class="theme-switcher-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.theme-switcher.story.explainer.system')}</p>
      <div class="theme-switcher-story__frame">${renderThemeSwitcher({ id: 'story-system', currentMode: 'system' })}</div>
    </section>

    <section class="theme-switcher-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.theme-switcher.story.section.light')}</h2>
      <p class="theme-switcher-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.theme-switcher.story.explainer.light')}</p>
      <div class="theme-switcher-story__frame">${renderThemeSwitcher({ id: 'story-light', currentMode: 'light' })}</div>
    </section>

    <section class="theme-switcher-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.theme-switcher.story.section.dark')}</h2>
      <p class="theme-switcher-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.theme-switcher.story.explainer.dark')}</p>
      <div class="theme-switcher-story__frame">${renderThemeSwitcher({ id: 'story-dark', currentMode: 'dark' })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Theme Switcher" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="theme-switcher-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="theme-switcher-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.theme-switcher-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.theme-switcher-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.theme-switcher-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.theme-switcher-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.theme-switcher-story__explainer { max-inline-size: 70ch; }
.theme-switcher-story__frame { display: flex; gap: var(--spacing-4); padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); align-items: flex-start; }
.theme-switcher-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
