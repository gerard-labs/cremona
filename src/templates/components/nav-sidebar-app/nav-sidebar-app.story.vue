<!--
  Nav-SidebarApp story — 4 viewport variants.
  Sections : default-expanded · collapsed · long-list (overflow) · with-tree.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderIcon(name) {
  return `<svg class="theme-icon" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-${name}"/></svg>`;
}

function renderAvatar({ url, alt = '' }) {
  return `<img src="${url}" alt="${alt}" class="theme-avatar" data-size="md">`;
}

function renderItem({ href, label, icon, current = false }) {
  return `
    <li>
      <a href="${href}" class="theme-nav-sidebar-app__item"${current ? ' aria-current="page"' : ''}>
        ${icon ? renderIcon(icon) : ''}
        <span class="theme-nav-sidebar-app__item-label">${label}</span>
      </a>
    </li>
  `;
}

function renderSection({ heading, items }) {
  return `
    <section class="theme-nav-sidebar-app__section">
      <h3 class="theme-typography theme-nav-sidebar-app__section-heading" data-variant="overline">${heading}</h3>
      <ul class="theme-nav-sidebar-app__section-items">${items.map(renderItem).join('')}</ul>
    </section>
  `;
}

function renderSidebarApp({ id = 'story-sidebar-app', collapsed = false, sections, workspace, user }) {
  const classes = ['theme-nav-sidebar-app', collapsed ? 'theme-nav-sidebar-app--collapsed' : ''].filter(Boolean).join(' ');
  return `
    <aside class="${classes}" id="${id}" aria-label="${t('theme.nav.sidebar-app.aria.label')}"${collapsed ? ' data-collapsed="true"' : ''}>
      <header class="theme-nav-sidebar-app__workspace">
        <a href="#switch" class="theme-nav-sidebar-app__workspace-link" aria-haspopup="true" aria-expanded="false">
          ${renderAvatar({ url: workspace.avatarUrl })}
          <span class="theme-nav-sidebar-app__workspace-name">${workspace.name}</span>
          ${renderIcon('chevron-down')}
        </a>
      </header>
      <nav class="theme-nav-sidebar-app__sections" aria-label="${t('theme.nav.sidebar-app.aria.label')}">
        ${sections.map(renderSection).join('')}
      </nav>
      <footer class="theme-nav-sidebar-app__user">
        <button type="button" class="theme-nav-sidebar-app__user-trigger" aria-haspopup="true" aria-expanded="false" aria-label="${t('theme.nav.sidebar-app.user.menu')}">
          ${renderAvatar({ url: user.avatarUrl })}
          <div class="theme-nav-sidebar-app__user-meta">
            <strong class="theme-nav-sidebar-app__user-name">${user.name}</strong>
            <span class="theme-nav-sidebar-app__user-role">${user.role}</span>
          </div>
          ${renderIcon('more-horizontal')}
        </button>
      </footer>
    </aside>
  `;
}

const workspace = { name: 'Acme Inc.', avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="8" fill="%236366f1"/><text x="20" y="26" font-family="sans-serif" font-size="18" fill="white" text-anchor="middle">A</text></svg>' };
const user = { name: 'Marie Dupont', role: t('theme.nav.sidebar-app.story.user.role'), avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="%2310b981"/><text x="20" y="26" font-family="sans-serif" font-size="18" fill="white" text-anchor="middle">M</text></svg>' };
const sections = [
  { heading: t('theme.nav.sidebar-app.section.workspace'), items: [
    { href: '/', label: t('theme.nav.sidebar-app.item.dashboard'), icon: 'star', current: true },
    { href: '/projects', label: t('theme.nav.sidebar-app.item.projects'), icon: 'option' },
    { href: '/team', label: t('theme.nav.sidebar-app.item.team'), icon: 'user' },
  ]},
  { heading: t('theme.nav.sidebar-app.section.account'), items: [
    { href: '/settings', label: t('theme.nav.sidebar-app.item.settings'), icon: 'settings' },
    { href: '/help', label: t('theme.nav.sidebar-app.item.help'), icon: 'info' },
  ]},
];

const bodyHtml = `
  <section class="nav-sidebar-app-story" aria-labelledby="nav-sidebar-app-story-title">
    <header class="nav-sidebar-app-story__header">
      <h1 id="nav-sidebar-app-story-title">${t('theme.nav.sidebar-app.story.title')}</h1>
      <p>${t('theme.nav.sidebar-app.story.subtitle')}</p>
    </header>

    <section class="nav-sidebar-app-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.sidebar-app.story.section.default')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.nav.sidebar-app.story.explainer.default')}</p>
      <div class="nav-sidebar-app-story__frame">${renderSidebarApp({ id: 'story-default', sections, workspace, user })}</div>
    </section>

    <section class="nav-sidebar-app-story__section">
      <h2 class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.sidebar-app.story.section.collapsed')}</h2>
      <p class="theme-typography" data-variant="caption" data-color="tertiary">${t('theme.nav.sidebar-app.story.explainer.collapsed')}</p>
      <div class="nav-sidebar-app-story__frame">${renderSidebarApp({ id: 'story-collapsed', collapsed: true, sections, workspace, user })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Nav-SidebarApp" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="nav-sidebar-app-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="nav-sidebar-app-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.nav-sidebar-app-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.nav-sidebar-app-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.nav-sidebar-app-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.nav-sidebar-app-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.nav-sidebar-app-story__frame { display: flex; gap: var(--spacing-4); border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); overflow: hidden; min-block-size: 400px; }
.nav-sidebar-app-story__frame .theme-nav-sidebar-app { block-size: 400px; }
.nav-sidebar-app-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
