<!--
  Nav-BottomMobile story — 4 viewport variants.
  Sections : default (4 tabs+labels) · icon-only · with-badge · 5-tabs.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderIcon(name) {
  return `<svg class="cremona-icon" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-${name}"/></svg>`;
}

function renderTab({ href, label, icon, current = false, badge = null, showLabel = true }) {
  return `
    <li class="cremona-nav-bottom-mobile__item">
      <a href="${href}" class="cremona-nav-bottom-mobile__link"${current ? ' aria-current="page"' : ''}${!showLabel ? ` aria-label="${label}"` : ''}>
        <span class="cremona-nav-bottom-mobile__icon-wrap">
          ${renderIcon(icon)}
          ${badge ? `<span class="cremona-badge cremona-nav-bottom-mobile__badge" data-variant="danger" data-size="sm">${badge}</span>` : ''}
        </span>
        ${showLabel ? `<span class="cremona-nav-bottom-mobile__label">${label}</span>` : ''}
      </a>
    </li>
  `;
}

function renderBottomNav({ id = 'story-bottom-nav', items, showLabels = true }) {
  const classes = ['cremona-nav-bottom-mobile', !showLabels ? 'cremona-nav-bottom-mobile--icon-only' : ''].filter(Boolean).join(' ');
  return `
    <nav class="${classes}" id="${id}" aria-label="${t('theme.nav.bottom-mobile.aria.label')}">
      <ul class="cremona-nav-bottom-mobile__list">${items.map(it => renderTab({ ...it, showLabel: showLabels })).join('')}</ul>
    </nav>
  `;
}

const items4 = [
  { href: '/', label: t('theme.nav.bottom-mobile.item.home'), icon: 'star', current: true },
  { href: '/search', label: t('theme.nav.bottom-mobile.item.search'), icon: 'search' },
  { href: '/notifications', label: t('theme.nav.bottom-mobile.item.notifications'), icon: 'bell', badge: 3 },
  { href: '/account', label: t('theme.nav.bottom-mobile.item.account'), icon: 'user' },
];

const items5 = [
  ...items4.slice(0, 3),
  { href: '/projects', label: t('theme.nav.bottom-mobile.item.projects'), icon: 'option' },
  { href: '/account', label: t('theme.nav.bottom-mobile.item.account'), icon: 'user' },
];

const bodyHtml = `
  <section class="nav-bottom-mobile-story" aria-labelledby="nav-bottom-mobile-story-title">
    <header class="nav-bottom-mobile-story__header">
      <h1 id="nav-bottom-mobile-story-title">${t('theme.nav.bottom-mobile.story.title')}</h1>
      <p>${t('theme.nav.bottom-mobile.story.subtitle')}</p>
    </header>

    <section class="nav-bottom-mobile-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.bottom-mobile.story.section.default')}</h2>
      <div class="nav-bottom-mobile-story__frame">${renderBottomNav({ id: 'story-default', items: items4 })}</div>
    </section>

    <section class="nav-bottom-mobile-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.bottom-mobile.story.section.icon-only')}</h2>
      <div class="nav-bottom-mobile-story__frame">${renderBottomNav({ id: 'story-icon-only', items: items4, showLabels: false })}</div>
    </section>

    <section class="nav-bottom-mobile-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.bottom-mobile.story.section.5-tabs')}</h2>
      <div class="nav-bottom-mobile-story__frame">${renderBottomNav({ id: 'story-5tabs', items: items5 })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Navigation/Bottom Mobile" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="nav-bottom-mobile-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="nav-bottom-mobile-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.nav-bottom-mobile-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.nav-bottom-mobile-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.nav-bottom-mobile-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.nav-bottom-mobile-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.nav-bottom-mobile-story__frame { display: flex; justify-content: center; align-items: flex-end; min-block-size: 100px; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); max-inline-size: 375px; margin-inline: auto; }
.nav-bottom-mobile-story__frame .cremona-nav-bottom-mobile { position: static; display: block !important; inline-size: 100%; }
.nav-bottom-mobile-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
