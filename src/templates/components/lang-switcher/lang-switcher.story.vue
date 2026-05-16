<!--
  LangSwitcher story — 4 viewport variants.
  Sections : default-3-locales · with-flags · 5-locales-en-current.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderItem(locale, currentLocale) {
  const flag = locale.flag ? `<span class="cremona-lang-switcher__flag" aria-hidden="true">${locale.flag}</span>` : '';
  const current = locale.code === currentLocale ? ' aria-current="true"' : '';
  return `
    <div class="cremona-item cremona-lang-switcher__item"
         role="menuitem" tabindex="-1"
         data-action="click->lang-switcher#select"
         data-locale="${locale.code}"${current}>
      ${flag}
      <span class="cremona-lang-switcher__label">${locale.label}</span>
    </div>`;
}

function renderLangSwitcher({ id, locales, currentLocale = 'fr' }) {
  const items = locales.map((l) => renderItem(l, currentLocale)).join('');
  return `
    <div class="cremona-popover cremona-dropdown-menu cremona-lang-switcher"
         data-popover-placement-value="bottom"
         data-popover-offset-value="8"
         data-popover-open-value="false"
         data-lang-switcher-current-locale-value="${currentLocale}"
         data-lang-switcher-storage-key-value="theme.locale">
      <button type="button"
              class="cremona-button cremona-lang-switcher__trigger"
              data-variant="ghost" data-size="sm"
              aria-haspopup="menu" aria-expanded="false"
              aria-controls="${id}-content"
              aria-label="${t('theme.lang-switcher.aria.trigger')}">
        <span class="cremona-button__label" data-lang-switcher-target="current">${currentLocale.toUpperCase()}</span>
        <svg class="cremona-icon" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-chevron-down"/></svg>
      </button>
      <div id="${id}-content"
           class="cremona-popover__content cremona-dropdown-menu__content cremona-lang-switcher__content"
           data-popover-target="content"
           role="menu"
           style="position: relative; display: block;">
        ${items}
      </div>
    </div>`;
}

const locales3 = [
  { code: 'fr', label: t('theme.lang-switcher.label.fr') },
  { code: 'en', label: t('theme.lang-switcher.label.en') },
  { code: 'de', label: t('theme.lang-switcher.label.de') },
];

const localesWithFlags = [
  { code: 'fr', label: t('theme.lang-switcher.label.fr'), flag: '🇫🇷' },
  { code: 'en', label: t('theme.lang-switcher.label.en'), flag: '🇬🇧' },
  { code: 'de', label: t('theme.lang-switcher.label.de'), flag: '🇩🇪' },
];

const locales5 = [
  { code: 'fr', label: t('theme.lang-switcher.label.fr'), flag: '🇫🇷' },
  { code: 'en', label: t('theme.lang-switcher.label.en'), flag: '🇬🇧' },
  { code: 'de', label: t('theme.lang-switcher.label.de'), flag: '🇩🇪' },
  { code: 'es', label: t('theme.lang-switcher.label.es'), flag: '🇪🇸' },
  { code: 'ar', label: t('theme.lang-switcher.label.ar'), flag: '🇸🇦' },
];

const bodyHtml = `
  <section class="lang-switcher-story" aria-labelledby="lang-switcher-story-title">
    <header class="lang-switcher-story__header">
      <h1 id="lang-switcher-story-title">${t('theme.lang-switcher.story.title')}</h1>
      <p>${t('theme.lang-switcher.story.subtitle')}</p>
    </header>

    <section class="lang-switcher-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.lang-switcher.story.section.default')}</h2>
      <p class="lang-switcher-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.lang-switcher.story.explainer.default')}</p>
      <div class="lang-switcher-story__frame">${renderLangSwitcher({ id: 'story-default', locales: locales3, currentLocale: 'fr' })}</div>
    </section>

    <section class="lang-switcher-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.lang-switcher.story.section.with-flags')}</h2>
      <p class="lang-switcher-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.lang-switcher.story.explainer.with-flags')}</p>
      <div class="lang-switcher-story__frame">${renderLangSwitcher({ id: 'story-flags', locales: localesWithFlags, currentLocale: 'fr' })}</div>
    </section>

    <section class="lang-switcher-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.lang-switcher.story.section.five')}</h2>
      <p class="lang-switcher-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.lang-switcher.story.explainer.five')}</p>
      <div class="lang-switcher-story__frame">${renderLangSwitcher({ id: 'story-five', locales: locales5, currentLocale: 'en' })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/LangSwitcher" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="lang-switcher-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="lang-switcher-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.lang-switcher-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.lang-switcher-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.lang-switcher-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.lang-switcher-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.lang-switcher-story__explainer { max-inline-size: 70ch; }
.lang-switcher-story__frame { display: flex; gap: var(--spacing-4); padding: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); align-items: flex-start; }
.lang-switcher-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
