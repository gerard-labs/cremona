<!--
  Nav-MobileDrawer story — 4 viewport variants.
  Sections : default-open · with-user-header · edge=end · long-list-scroll.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderIcon(name) {
  return `<svg class="cremona-icon" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-${name}"/></svg>`;
}

function renderItem({ href, label, icon, current = false }) {
  return `
    <li>
      <a href="${href}" class="cremona-nav-mobile-drawer__item"${current ? ' aria-current="page"' : ''}>
        ${icon ? renderIcon(icon) : ''}
        <span>${label}</span>
      </a>
    </li>
  `;
}

function renderSection({ heading, items }) {
  return `
    <section class="cremona-nav-mobile-drawer__section">
      <h3 class="cremona-typography cremona-nav-mobile-drawer__section-heading" data-variant="overline">${heading}</h3>
      <ul class="cremona-nav-mobile-drawer__section-items">${items.map(renderItem).join('')}</ul>
    </section>
  `;
}

function renderDrawer({ id = 'story-mobile-drawer', open = true, user = null, sections, edge = 'start' }) {
  return `
    <dialog class="cremona-drawer cremona-nav-mobile-drawer" id="${id}"
            data-drawer-edge-value="${edge}"
            aria-label="${t('theme.nav.mobile-drawer.aria.label')}"
            ${open ? 'open' : ''}>
      <header class="cremona-nav-mobile-drawer__header">
        ${user ? `
          <div class="cremona-nav-mobile-drawer__user">
            <img src="${user.avatarUrl}" alt="" class="cremona-avatar" data-size="md">
            <div class="cremona-nav-mobile-drawer__user-meta">
              <strong>${user.name}</strong>
              <span>${user.role}</span>
            </div>
          </div>
        ` : '<div></div>'}
        <button type="button" class="cremona-button cremona-button--ghost cremona-nav-mobile-drawer__close" aria-label="${t('theme.nav.mobile-drawer.close')}">${renderIcon('x')}</button>
      </header>
      <nav class="cremona-nav-mobile-drawer__sections" aria-label="${t('theme.nav.mobile-drawer.aria.label')}">
        ${sections.map(renderSection).join('')}
      </nav>
    </dialog>
  `;
}

const sections = [
  { heading: t('theme.nav.mobile-drawer.section.app'), items: [
    { href: '/', label: t('theme.nav.mobile-drawer.item.dashboard'), icon: 'star', current: true },
    { href: '/projects', label: t('theme.nav.mobile-drawer.item.projects'), icon: 'option' },
    { href: '/team', label: t('theme.nav.mobile-drawer.item.team'), icon: 'user' },
  ]},
  { heading: t('theme.nav.mobile-drawer.section.account'), items: [
    { href: '/settings', label: t('theme.nav.mobile-drawer.item.settings'), icon: 'settings' },
    { href: '/signout', label: t('theme.nav.mobile-drawer.item.signout'), icon: 'x' },
  ]},
];

const user = { name: 'Marie Dupont', role: t('theme.nav.mobile-drawer.story.user.role'), avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="%2310b981"/><text x="20" y="26" font-family="sans-serif" font-size="18" fill="white" text-anchor="middle">M</text></svg>' };

const bodyHtml = `
  <section class="nav-mobile-drawer-story" aria-labelledby="nav-mobile-drawer-story-title">
    <header class="nav-mobile-drawer-story__header">
      <h1 id="nav-mobile-drawer-story-title">${t('theme.nav.mobile-drawer.story.title')}</h1>
      <p>${t('theme.nav.mobile-drawer.story.subtitle')}</p>
    </header>

    <section class="nav-mobile-drawer-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.mobile-drawer.story.section.default')}</h2>
      <div class="nav-mobile-drawer-story__frame">${renderDrawer({ id: 'story-default', user, sections })}</div>
    </section>

    <section class="nav-mobile-drawer-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.mobile-drawer.story.section.no-user')}</h2>
      <div class="nav-mobile-drawer-story__frame">${renderDrawer({ id: 'story-no-user', sections })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Nav-MobileDrawer" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="nav-mobile-drawer-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="nav-mobile-drawer-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.nav-mobile-drawer-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.nav-mobile-drawer-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.nav-mobile-drawer-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.nav-mobile-drawer-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.nav-mobile-drawer-story__frame { display: flex; justify-content: flex-start; border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); min-block-size: 480px; overflow: hidden; }
.nav-mobile-drawer-story__frame .cremona-nav-mobile-drawer { position: static; transform: none; box-shadow: var(--shadow-3); }
.nav-mobile-drawer-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
