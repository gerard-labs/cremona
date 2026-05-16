<!--
  Nav-MegaMenu story — 4 viewport variants.
  Sections : default-3col · with-featured · full-viewport · long-content
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';

setTranslations('fr', frDict);
setLocale('fr');

function renderIcon(name) {
  return `<svg class="cremona-icon" data-size="sm" aria-hidden="true" focusable="false"><use href="#icon-${name}"/></svg>`;
}

function renderItem({ href, label, icon = null }) {
  return `<li role="none"><a href="${href}" role="menuitem" class="cremona-nav-mega-menu__item">${icon ? renderIcon(icon) : ''}<span>${label}</span></a></li>`;
}

function renderColumn({ heading, items }) {
  return `
    <section class="cremona-nav-mega-menu__column">
      <h3 class="cremona-typography cremona-nav-mega-menu__column-heading" data-variant="overline">${heading}</h3>
      <ul class="cremona-nav-mega-menu__column-items" role="none">${items.map(renderItem).join('')}</ul>
    </section>
  `;
}

function renderMegaMenu({ id = 'story-mega-menu', width = 'contained', columns = [], featured = null, open = true }) {
  const wrapClasses = ['cremona-nav-mega-menu', width === 'full' ? 'cremona-nav-mega-menu--full' : ''].filter(Boolean).join(' ');
  return `
    <div class="${wrapClasses}" id="${id}">
      <button type="button" class="cremona-button cremona-button--ghost cremona-nav-mega-menu__trigger" aria-haspopup="true" aria-expanded="${open}" aria-controls="${id}-panel">
        ${t('theme.nav.mega-menu.story.trigger.products')}
        ${renderIcon('chevron-down')}
      </button>
      <div class="cremona-nav-mega-menu__panel" id="${id}-panel" role="menu" data-state="${open ? 'open' : 'closed'}"${!open ? ' hidden' : ''}>
        <div class="cremona-nav-mega-menu__columns">${columns.map(renderColumn).join('')}</div>
        ${featured ? `
          <aside class="cremona-nav-mega-menu__featured">
            <h3 class="cremona-typography cremona-nav-mega-menu__featured-heading" data-variant="h3">${featured.heading}</h3>
            <p class="cremona-nav-mega-menu__featured-body">${featured.body}</p>
            <a href="${featured.href}" class="cremona-button cremona-button--primary cremona-nav-mega-menu__featured-cta" role="menuitem">${featured.cta}</a>
          </aside>
        ` : ''}
      </div>
    </div>
  `;
}

const defaultColumns = [
  { heading: t('theme.nav.mega-menu.column.heading.industry'), items: [
    { href: '/p/saas', label: t('theme.nav.mega-menu.item.saas'), icon: 'star' },
    { href: '/p/ecom', label: t('theme.nav.mega-menu.item.ecom'), icon: 'heart' },
    { href: '/p/edu', label: t('theme.nav.mega-menu.item.edu'), icon: 'option' },
  ]},
  { heading: t('theme.nav.mega-menu.column.heading.role'), items: [
    { href: '/r/dev', label: t('theme.nav.mega-menu.item.dev') },
    { href: '/r/pm', label: t('theme.nav.mega-menu.item.pm') },
    { href: '/r/design', label: t('theme.nav.mega-menu.item.design') },
  ]},
  { heading: t('theme.nav.mega-menu.column.heading.resource'), items: [
    { href: '/docs', label: t('theme.nav.mega-menu.item.docs') },
    { href: '/help', label: t('theme.nav.mega-menu.item.help') },
    { href: '/blog', label: t('theme.nav.mega-menu.item.blog') },
  ]},
];

const bodyHtml = `
  <section class="nav-mega-menu-story" aria-labelledby="nav-mega-menu-story-title">
    <header class="nav-mega-menu-story__header">
      <h1 id="nav-mega-menu-story-title">${t('theme.nav.mega-menu.story.title')}</h1>
      <p>${t('theme.nav.mega-menu.story.subtitle')}</p>
    </header>

    <section class="nav-mega-menu-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.mega-menu.story.section.default')}</h2>
      <p class="nav-mega-menu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.nav.mega-menu.story.explainer.default')}</p>
      <div class="nav-mega-menu-story__frame">${renderMegaMenu({ id: 'story-default', columns: defaultColumns })}</div>
    </section>

    <section class="nav-mega-menu-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.mega-menu.story.section.with-featured')}</h2>
      <p class="nav-mega-menu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.nav.mega-menu.story.explainer.with-featured')}</p>
      <div class="nav-mega-menu-story__frame">${renderMegaMenu({
        id: 'story-featured',
        columns: defaultColumns,
        featured: {
          heading: t('theme.nav.mega-menu.featured.heading'),
          body: t('theme.nav.mega-menu.featured.body'),
          href: '/p/new',
          cta: t('theme.nav.mega-menu.featured.cta'),
        },
      })}</div>
    </section>

    <section class="nav-mega-menu-story__section">
      <h2 class="cremona-typography" data-variant="overline" data-color="tertiary">${t('theme.nav.mega-menu.story.section.full-viewport')}</h2>
      <p class="nav-mega-menu-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${t('theme.nav.mega-menu.story.explainer.full-viewport')}</p>
      <div class="nav-mega-menu-story__frame">${renderMegaMenu({ id: 'story-full', width: 'full', columns: defaultColumns })}</div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Patterns/Nav-MegaMenu" group="Ring 3" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="nav-mega-menu-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="nav-mega-menu-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.nav-mega-menu-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); }
.nav-mega-menu-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.nav-mega-menu-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.nav-mega-menu-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.nav-mega-menu-story__explainer { max-inline-size: 70ch; }
.nav-mega-menu-story__frame { border: 1px dashed var(--color-border-subtle); border-radius: var(--radius-md); padding: var(--spacing-4); }
.nav-mega-menu-dark-wrap { background: var(--color-bg-base); padding: var(--spacing-4); }
</style>
