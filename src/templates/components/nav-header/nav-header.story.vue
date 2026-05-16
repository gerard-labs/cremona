<!--
  Nav-Header story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5): default · sticky-with-scroll · with-mega-menu-trigger
                · mobile-collapsed (375 px) · with-notifications-unread

  Zero Stimulus controller — pure server-rendered + cross-controller compose
  for the mobile hamburger trigger (data-controller="drawer" + matching
  data-drawer-target-value on the consumer-instantiated Nav-MobileDrawer).
  The story manually renders the Twig output via renderNavHeader().

  See `docs/specs/ring3/Nav-Header.md` for the full state matrix.
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderIcon(name) {
  return `<svg class="cremona-icon" data-size="md" aria-hidden="true" focusable="false"><use href="#icon-${name}"/></svg>`;
}

function renderBadge(count) {
  return `<span class="cremona-badge" data-variant="danger" data-size="sm">${count}</span>`;
}

function renderUtilityButton({ icon, label, badge = null }) {
  return `
    <button type="button" class="cremona-button cremona-button--ghost cremona-nav-header__utility-button" aria-label="${label}">
      ${renderIcon(icon)}${badge ? renderBadge(badge) : ''}
    </button>
  `;
}

function renderNavItem({ href, label, current = false }) {
  return `<a href="${href}" class="cremona-nav-header__nav-link"${current ? ' aria-current="page"' : ''}>${label}</a>`;
}

function renderNavHeader({
  htmlId = 'story-nav-header',
  sticky = false,
  mobileTriggerControls = 'story-mobile-drawer',
  navItems = [],
  utility = '',
  brand = `<a href="/" class="cremona-nav-header__brand-link"><strong>Gerard</strong></a>`,
}) {
  const classes = ['cremona-nav-header', sticky ? 'cremona-nav-header--sticky' : ''].filter(Boolean).join(' ');
  const navMarkup = navItems.length
    ? `<nav class="cremona-nav-header__nav" aria-label="${t('theme.nav.header.aria.label')}">${navItems.map(renderNavItem).join('')}</nav>`
    : '';
  const utilityMarkup = utility ? `<div class="cremona-nav-header__utility">${utility}</div>` : '';
  return `
    <header class="${classes}" id="${htmlId}"${sticky ? ' data-sticky="true"' : ''}>
      <div class="cremona-nav-header__inner">
        <div class="cremona-nav-header__brand">${brand}</div>
        ${navMarkup}
        ${utilityMarkup}
        <button type="button" class="cremona-button cremona-button--ghost cremona-nav-header__mobile-trigger"
                aria-label="${t('theme.nav.header.mobile-trigger.open')}"
                aria-controls="${mobileTriggerControls}"
                aria-expanded="false">
          ${renderIcon('menu')}
        </button>
      </div>
    </header>
  `;
}

const navItems = [
  { href: '/', label: t('theme.nav.header.story.nav-item.dashboard'), current: true },
  { href: '/projects', label: t('theme.nav.header.story.nav-item.projects') },
  { href: '/team', label: t('theme.nav.header.story.nav-item.team') },
  { href: '/settings', label: t('theme.nav.header.story.nav-item.settings') },
];

const utility = `
  ${renderUtilityButton({ icon: 'search', label: t('theme.nav.header.utility.search') })}
  ${renderUtilityButton({ icon: 'bell', label: t('theme.nav.header.utility.notifications'), badge: 3 })}
  ${renderUtilityButton({ icon: 'user', label: t('theme.nav.header.utility.user-menu') })}
`;

const bodyHtml = `
  <section class="nav-header-story" aria-labelledby="nav-header-story-title">
    <header class="nav-header-story__header">
      <h1 id="nav-header-story-title">${t('theme.nav.header.story.title')}</h1>
      <p>${t('theme.nav.header.story.subtitle')}</p>
    </header>

    <section class="nav-header-story__section" aria-labelledby="nav-header-section-default">
      <h2 id="nav-header-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.header.story.section.default')}</h2>
      <p class="nav-header-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.nav.header.story.explainer.default')}</p>
      <div class="nav-header-story__frame">${renderNavHeader({ navItems, utility })}</div>
    </section>

    <section class="nav-header-story__section" aria-labelledby="nav-header-section-sticky">
      <h2 id="nav-header-section-sticky" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.header.story.section.sticky')}</h2>
      <p class="nav-header-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.nav.header.story.explainer.sticky')}</p>
      <div class="nav-header-story__frame nav-header-story__frame--tall">
        ${renderNavHeader({ htmlId: 'story-nav-header-sticky', sticky: true, navItems, utility })}
        <div class="nav-header-story__scroll-content">
          <p>${t('theme.nav.header.story.scroll-content')}</p>
        </div>
      </div>
    </section>

    <section class="nav-header-story__section" aria-labelledby="nav-header-section-mega-menu">
      <h2 id="nav-header-section-mega-menu" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.header.story.section.mega-menu')}</h2>
      <p class="nav-header-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.nav.header.story.explainer.mega-menu')}</p>
      <div class="nav-header-story__frame">${renderNavHeader({
        htmlId: 'story-nav-header-mega',
        navItems: [
          { href: '/', label: t('theme.nav.header.story.nav-item.dashboard'), current: true },
          { href: '/products', label: `${t('theme.nav.header.story.nav-item.products')} ▾` },
          { href: '/team', label: t('theme.nav.header.story.nav-item.team') },
        ],
        utility,
      })}</div>
    </section>

    <section class="nav-header-story__section" aria-labelledby="nav-header-section-mobile">
      <h2 id="nav-header-section-mobile" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.header.story.section.mobile')}</h2>
      <p class="nav-header-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.nav.header.story.explainer.mobile')}</p>
      <div class="nav-header-story__frame nav-header-story__frame--mobile">${renderNavHeader({
        htmlId: 'story-nav-header-mobile',
        navItems,
        utility: renderUtilityButton({ icon: 'bell', label: t('theme.nav.header.utility.notifications'), badge: 3 }),
      })}</div>
    </section>

    <section class="nav-header-story__section" aria-labelledby="nav-header-section-notifications">
      <h2 id="nav-header-section-notifications" class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.header.story.section.notifications')}</h2>
      <p class="nav-header-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.nav.header.story.explainer.notifications')}</p>
      <div class="nav-header-story__frame">${renderNavHeader({
        htmlId: 'story-nav-header-notifs',
        navItems,
        utility: `
          ${renderUtilityButton({ icon: 'search', label: t('theme.nav.header.utility.search') })}
          ${renderUtilityButton({ icon: 'bell', label: t('theme.nav.header.utility.notifications'), badge: 12 })}
          ${renderUtilityButton({ icon: 'user', label: t('theme.nav.header.utility.user-menu') })}
        `,
      })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Navigation/Header" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="nav-header-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="nav-header-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.nav-header-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.nav-header-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.nav-header-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.nav-header-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.nav-header-story__explainer { max-inline-size: 70ch; }
.nav-header-story__frame { border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); overflow: hidden; }
.nav-header-story__frame--tall { block-size: 280px; overflow: auto; }
.nav-header-story__frame--mobile { max-inline-size: 375px; }
.nav-header-story__scroll-content { padding: var(--spacing-6); min-block-size: 600px; }
.nav-header-story .cremona-nav-header__nav-link { text-decoration: none; padding-inline: var(--spacing-3); padding-block: var(--spacing-2); color: var(--color-text-primary); border-radius: var(--radius-button); }
.nav-header-story .cremona-nav-header__nav-link[aria-current="page"] { background-color: var(--color-selected-bg); color: var(--color-selected-foreground); }
.nav-header-story .cremona-nav-header__nav-link:hover { background-color: var(--color-hover-overlay); }
.nav-header-story .cremona-nav-header__utility-button { position: relative; }
.nav-header-story .cremona-nav-header__utility-button .cremona-badge { position: absolute; inset-block-start: 4px; inset-inline-end: 4px; }
.nav-header-dark-wrap { background: var(--color-bg-base); }
</style>
