<!--
  RGPD-PreferencesCenter story — 4 viewport variants.
  Sections : default-4-categories · dirty-state-demo · events-log.
-->
<script setup>
import { onMounted } from 'vue';
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot();
  document.addEventListener('preferences-center:save',   (e) => addLog(`save → ${JSON.stringify(e.detail.consent)}`));
  document.addEventListener('preferences-center:cancel', () => addLog('cancel (reset to initial)'));
  document.addEventListener('preferences-center:dirty',  (e) => addLog(`dirty → ${e.detail.dirty}`));
});

function addLog(line) {
  const log = document.querySelector('#preferences-center-events-log');
  if (!log) return;
  const div = document.createElement('div');
  div.textContent = line;
  log.prepend(div);
}

function renderSwitch({ id, name, checked, disabled, ariaLabel }) {
  return `
    <span class="theme-switch-wrap${disabled ? ' theme-switch-row--disabled' : ''}" data-size="sm" ${disabled ? 'data-state="disabled"' : ''}>
      <span class="theme-switch" data-size="sm">
        <input type="checkbox" role="switch" class="theme-switch__input"
               id="${id}" name="${name}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} aria-label="${ariaLabel}">
        <span class="theme-switch__track" aria-hidden="true"><span class="theme-switch__thumb"></span></span>
      </span>
    </span>
  `;
}

function renderCategory({ wrapId, key, name, description, statusLabel, initialChecked, required }) {
  return `
    <div class="theme-rgpd-preferences-center__category${required ? ' theme-rgpd-preferences-center__category--required' : ''}" role="listitem">
      <div class="theme-rgpd-preferences-center__category-content">
        <span class="theme-rgpd-preferences-center__category-name">${name}</span>
        <span class="theme-rgpd-preferences-center__category-description">${description}</span>
        ${required ? `<span class="theme-rgpd-preferences-center__category-status">${statusLabel}</span>` : ''}
      </div>
      <div class="theme-rgpd-preferences-center__category-control">
        ${renderSwitch({ id: wrapId + '-' + key, name: key, checked: initialChecked, disabled: required, ariaLabel: name })}
      </div>
    </div>
  `;
}

function renderPreferencesCenter({ id }) {
  const categories = [
    { key: 'essential',  required: true,  initialChecked: true,
      name: t('theme.rgpd-preferences-center.category.essential.name'),
      description: t('theme.rgpd-preferences-center.category.essential.description'),
      statusLabel: t('theme.rgpd-preferences-center.category.essential.status') },
    { key: 'analytics',  required: false, initialChecked: false,
      name: t('theme.rgpd-preferences-center.category.analytics.name'),
      description: t('theme.rgpd-preferences-center.category.analytics.description') },
    { key: 'marketing',  required: false, initialChecked: false,
      name: t('theme.rgpd-preferences-center.category.marketing.name'),
      description: t('theme.rgpd-preferences-center.category.marketing.description') },
    { key: 'functional', required: false, initialChecked: true,
      name: t('theme.rgpd-preferences-center.category.functional.name'),
      description: t('theme.rgpd-preferences-center.category.functional.description') },
  ];

  const categoriesHtml = categories.map((c) => renderCategory({ wrapId: id, ...c })).join('');

  return `
    <div class="theme-dialog-wrap theme-rgpd-preferences-center"
         id="${id}"
         data-controller="dialog preferences-center"
         data-dialog-open-value="true">
      <dialog class="theme-dialog" data-dialog-target="dialog" data-size="lg" open aria-labelledby="${id}-title">
        <header class="theme-dialog__header">
          <h2 id="${id}-title" class="theme-dialog__title">${t('theme.rgpd-preferences-center.title')}</h2>
        </header>
        <div class="theme-dialog__body">
          <p class="theme-rgpd-preferences-center__intro">${t('theme.rgpd-preferences-center.description')}</p>
          <div class="theme-rgpd-preferences-center__categories" role="list">${categoriesHtml}</div>
          <p class="theme-rgpd-preferences-center__footer-info">${t('theme.rgpd-preferences-center.footer-info')}</p>
        </div>
        <footer class="theme-dialog__footer">
          <button type="button" class="theme-button" data-variant="secondary" data-action="click->preferences-center#cancel">${t('theme.rgpd-preferences-center.button.cancel')}</button>
          <button type="button" class="theme-button" data-variant="primary" data-preferences-center-target="saveButton" data-action="click->preferences-center#save">${t('theme.rgpd-preferences-center.button.save')}</button>
        </footer>
      </dialog>
    </div>
  `;
}

const bodyHtml = `
  <section class="rgpd-preferences-center-story" aria-labelledby="rgpd-preferences-center-story-title">
    <header class="rgpd-preferences-center-story__header">
      <h1 id="rgpd-preferences-center-story-title">${t('theme.rgpd-preferences-center.story.title')}</h1>
      <p>${t('theme.rgpd-preferences-center.story.subtitle')}</p>
    </header>

    <section class="rgpd-preferences-center-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.rgpd-preferences-center.story.section.default')}</h2>
      <p class="rgpd-preferences-center-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.rgpd-preferences-center.story.explainer.default')}</p>
      <div class="rgpd-preferences-center-story__frame">${renderPreferencesCenter({ id: 'prefs-default' })}</div>
    </section>

    <section class="rgpd-preferences-center-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.rgpd-preferences-center.story.section.events-log')}</h2>
      <p class="rgpd-preferences-center-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.rgpd-preferences-center.story.explainer.events-log')}</p>
      <div class="rgpd-preferences-center-story__frame">${renderPreferencesCenter({ id: 'prefs-events' })}</div>
      <div id="preferences-center-events-log" class="rgpd-preferences-center-story__events-log" aria-live="polite"></div>
    </section>

  </section>
`;
</script>

<template>
  <Story title="Patterns/RGPD-PreferencesCenter" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="rgpd-preferences-center-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="rgpd-preferences-center-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.rgpd-preferences-center-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.rgpd-preferences-center-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.rgpd-preferences-center-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.rgpd-preferences-center-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.rgpd-preferences-center-story__explainer { max-inline-size: 70ch; }
.rgpd-preferences-center-story__frame { padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); background: var(--color-bg-base); }
.rgpd-preferences-center-story__events-log { display: flex; flex-direction: column-reverse; gap: var(--spacing-1); padding: var(--spacing-3); margin-block-start: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--color-text-secondary); max-block-size: 200px; overflow: auto; }
.rgpd-preferences-center-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
