<!--
  RGPD-CookieBanner story — 4 viewport variants.
  Sections : default-banner · with-categories-summary · events-log.
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
  document.addEventListener('cookie-banner:accept',       (e) => addLog(`accept → ${JSON.stringify(e.detail.consent)}`));
  document.addEventListener('cookie-banner:reject',       (e) => addLog(`reject → ${JSON.stringify(e.detail.consent)}`));
  document.addEventListener('cookie-banner:customize',    () => addLog('customize (consumer opens PreferencesCenter)'));
  document.addEventListener('cookie-banner:save-custom',  (e) => addLog(`save-custom → ${JSON.stringify(e.detail.consent)}`));
});

function addLog(line) {
  const log = document.querySelector('#cookie-banner-events-log');
  if (!log) return;
  const div = document.createElement('div');
  div.textContent = line;
  log.prepend(div);
}

function renderCookieBanner({ id, cookieName = 'theme.consent.story', autoShow = false, withCategories = false }) {
  const categoriesHtml = withCategories ? `
    <div class="cremona-rgpd-cookie-banner__categories-summary">
      <div class="cremona-rgpd-cookie-banner__category">
        <span class="cremona-rgpd-cookie-banner__category-name">${t('theme.rgpd-cookie-banner.category.essential.name')}</span>
        <span class="cremona-rgpd-cookie-banner__category-status">${t('theme.rgpd-cookie-banner.category.essential.status')}</span>
      </div>
      <div class="cremona-rgpd-cookie-banner__category">
        <span class="cremona-rgpd-cookie-banner__category-name">${t('theme.rgpd-cookie-banner.category.analytics.name')}</span>
        <span class="cremona-rgpd-cookie-banner__category-status">${t('theme.rgpd-cookie-banner.category.optional.status')}</span>
      </div>
      <div class="cremona-rgpd-cookie-banner__category">
        <span class="cremona-rgpd-cookie-banner__category-name">${t('theme.rgpd-cookie-banner.category.marketing.name')}</span>
        <span class="cremona-rgpd-cookie-banner__category-status">${t('theme.rgpd-cookie-banner.category.optional.status')}</span>
      </div>
    </div>
  ` : '';

  return `
    <div class="cremona-dialog-wrap cremona-rgpd-cookie-banner"
         id="${id}"
         data-controller="dialog cookie-banner"
         data-dialog-open-value="true"
         data-dialog-close-on-escape-value="false"
         data-dialog-close-on-backdrop-click-value="false"
         data-cookie-banner-cookie-name-value="${cookieName}"
         data-cookie-banner-storage-key-value="${cookieName}"
         data-cookie-banner-auto-show-value="${autoShow}">
      <dialog class="cremona-dialog" data-dialog-target="dialog" data-size="md" open aria-labelledby="${id}-title">
        <header class="cremona-dialog__header">
          <h2 id="${id}-title" class="cremona-dialog__title">${t('theme.rgpd-cookie-banner.title')}</h2>
        </header>
        <div class="cremona-dialog__body">
          <p class="cremona-rgpd-cookie-banner__legal-summary">${t('theme.rgpd-cookie-banner.legal-summary')}</p>
          <p class="cremona-rgpd-cookie-banner__legal-detail">${t('theme.rgpd-cookie-banner.legal-detail')}</p>
          ${categoriesHtml}
        </div>
        <footer class="cremona-dialog__footer">
          <div class="cremona-rgpd-cookie-banner__actions">
            <button type="button" class="cremona-button" data-variant="secondary" data-action="click->cookie-banner#reject">${t('theme.rgpd-cookie-banner.button.reject-all')}</button>
            <button type="button" class="cremona-button" data-variant="ghost" data-action="click->cookie-banner#customize">${t('theme.rgpd-cookie-banner.button.customize')}</button>
            <button type="button" class="cremona-button" data-variant="primary" data-action="click->cookie-banner#accept">${t('theme.rgpd-cookie-banner.button.accept-all')}</button>
          </div>
        </footer>
      </dialog>
    </div>
  `;
}

const bodyHtml = `
  <section class="rgpd-cookie-banner-story" aria-labelledby="rgpd-cookie-banner-story-title">
    <header class="rgpd-cookie-banner-story__header">
      <h1 id="rgpd-cookie-banner-story-title">${t('theme.rgpd-cookie-banner.story.title')}</h1>
      <p>${t('theme.rgpd-cookie-banner.story.subtitle')}</p>
    </header>

    <section class="rgpd-cookie-banner-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.rgpd-cookie-banner.story.section.default')}</h2>
      <p class="rgpd-cookie-banner-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.rgpd-cookie-banner.story.explainer.default')}</p>
      <div class="rgpd-cookie-banner-story__frame">${renderCookieBanner({ id: 'cookie-default', cookieName: 'theme.consent.story-default' })}</div>
    </section>

    <section class="rgpd-cookie-banner-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.rgpd-cookie-banner.story.section.with-categories')}</h2>
      <p class="rgpd-cookie-banner-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.rgpd-cookie-banner.story.explainer.with-categories')}</p>
      <div class="rgpd-cookie-banner-story__frame">${renderCookieBanner({ id: 'cookie-categories', cookieName: 'theme.consent.story-categories', withCategories: true })}</div>
    </section>

    <section class="rgpd-cookie-banner-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.rgpd-cookie-banner.story.section.events-log')}</h2>
      <p class="rgpd-cookie-banner-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.rgpd-cookie-banner.story.explainer.events-log')}</p>
      <div class="rgpd-cookie-banner-story__frame">${renderCookieBanner({ id: 'cookie-events', cookieName: 'theme.consent.story-events' })}</div>
      <div id="cookie-banner-events-log" class="rgpd-cookie-banner-story__events-log" aria-live="polite"></div>
    </section>

  </section>
`;
</script>

<template>
  <Story title="Patterns/RGPD-CookieBanner" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="rgpd-cookie-banner-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="rgpd-cookie-banner-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.rgpd-cookie-banner-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.rgpd-cookie-banner-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.rgpd-cookie-banner-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.rgpd-cookie-banner-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.rgpd-cookie-banner-story__explainer { max-inline-size: 70ch; }
.rgpd-cookie-banner-story__frame { padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); background: var(--color-bg-base); }
.rgpd-cookie-banner-story__events-log { display: flex; flex-direction: column-reverse; gap: var(--spacing-1); padding: var(--spacing-3); margin-block-start: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--color-text-secondary); max-block-size: 200px; overflow: auto; }
.rgpd-cookie-banner-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
