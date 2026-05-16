<!--
  NavigationMenu story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5):
    1. Default (3 nav menus Solutions / Tarifs / Ressources) — web SaaS idiom.
    2. With aria-current="page" on active item.
    3. With icons leading + descriptions (richer nav items).
    4. Cascading-open demo (same as Menubar — inherited mechanics).
    5. Brand + nav + actions (composition example with NavigationMenu at center).

  Per OQ-30: per-submenu DropdownMenus + thin orchestrator (inherited from
  MenubarController). Per OQ-33: submenu items use Item with `as: 'a' href`.

  Stimulus controllers `popover` + `dropdown-menu` co-mounted on each submenu
  wrap; `navigation-menu` mounted on the inner .theme-menubar (the <nav> shell
  carries no controller — it's a landmark).
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import zapSvg from '../../../assets/icons/zap.svg?raw';
import usersSvg from '../../../assets/icons/users.svg?raw';
import bookOpenSvg from '../../../assets/icons/book-open.svg?raw';
import helpCircleSvg from '../../../assets/icons/help-circle.svg?raw';
import lifeBuoySvg from '../../../assets/icons/life-buoy.svg?raw';
import rocketSvg from '../../../assets/icons/rocket.svg?raw';

const ICONS = {
  zap: zapSvg, users: usersSvg, 'book-open': bookOpenSvg,
  'help-circle': helpCircleSvg, 'life-buoy': lifeBuoySvg, rocket: rocketSvg,
};

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

let _nmCounter = 0;
function nextId(prefix = 'nm') { return `${prefix}-${++_nmCounter}`; }

function icon(name, size = 'sm') {
  return `<span class="theme-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function renderLinkItem({ label, href, iconLeading = null, description = null, current = false }) {
  const leadingHtml = iconLeading ? `<span class="theme-item__icon theme-item__icon--leading" aria-hidden="true">${icon(iconLeading)}</span>` : '';
  const descHtml = description ? `<span class="theme-item__description">${description}</span>` : '';
  const currentAttr = current ? ' aria-current="page" data-selected="true"' : '';
  return `<a class="theme-item" role="menuitem" tabindex="-1" href="${href}"${currentAttr}>
    ${leadingHtml}
    <span class="theme-item__text">
      <span class="theme-item__label">${label}</span>
      ${descHtml}
    </span>
  </a>`;
}

function renderSubmenu({ triggerLabel, content }) {
  const id = nextId('sm');
  return `
    <div class="theme-popover theme-dropdown-menu"
      data-controller="popover dropdown-menu"
      data-action="click->popover#toggle keydown.esc@window->popover#close keydown->dropdown-menu#keydown click->dropdown-menu#onItemClick"
      data-popover-placement-value="bottom-start"
      data-popover-offset-value="2"
      data-popover-open-value="false">
      <button type="button" class="theme-menubar__trigger"
        data-popover-target="trigger"
        data-navigation-menu-target="trigger"
        aria-haspopup="menu" aria-expanded="false" aria-controls="${id}-content">
        ${triggerLabel}
      </button>
      <div id="${id}-content" class="theme-popover__content theme-dropdown-menu__content"
        data-popover-target="content"
        data-state="closed"
        hidden>
        ${content}
      </div>
    </div>
  `;
}

function renderNavMenu({ menus, label = null }) {
  const id = nextId('navmenu');
  const labelAttr = label ? `aria-label="${label}"` : '';
  return `
    <nav id="${id}" class="theme-navigation-menu" ${labelAttr}>
      <div id="${id}-menubar" class="theme-menubar"
        data-controller="navigation-menu"
        data-action="keydown->navigation-menu#keydown"
        ${labelAttr}>
        ${menus.map((m) => renderSubmenu(m)).join('')}
      </div>
    </nav>
  `;
}

function N(key) { return t('theme.navigation-menu.story.' + key); }

const bodyHtml = `
  <section class="nm-story" data-testid="nav-menu-root">
    <header class="nm-story__header">
      <h1>${t('theme.navigation-menu.story.title')}</h1>
      <p>${t('theme.navigation-menu.story.subtitle')}</p>
    </header>

    <section class="nm-story__section" aria-labelledby="nm-section-default">
      <h2 id="nm-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.navigation-menu.story.section.default')}</h2>
      <p class="nm-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.navigation-menu.story.explainer.default')}</p>
      <div class="nm-story__row">
        ${renderNavMenu({
          label: N('aria.label-default'),
          menus: [
            {
              triggerLabel: N('trigger.solutions'),
              content: [
                renderLinkItem({ label: N('item.solutions-startups'), href: '/solutions/startups' }),
                renderLinkItem({ label: N('item.solutions-enterprise'), href: '/solutions/enterprise' }),
                renderLinkItem({ label: N('item.solutions-agencies'), href: '/solutions/agencies' }),
              ].join(''),
            },
            {
              triggerLabel: N('trigger.pricing'),
              content: [
                renderLinkItem({ label: N('item.pricing-plans'), href: '/pricing/plans' }),
                renderLinkItem({ label: N('item.pricing-compare'), href: '/pricing/compare' }),
              ].join(''),
            },
            {
              triggerLabel: N('trigger.resources'),
              content: [
                renderLinkItem({ label: N('item.resources-docs'), href: '/docs' }),
                renderLinkItem({ label: N('item.resources-blog'), href: '/blog' }),
                renderLinkItem({ label: N('item.resources-support'), href: '/support' }),
              ].join(''),
            },
          ],
        })}
      </div>
    </section>

    <section class="nm-story__section" aria-labelledby="nm-section-current">
      <h2 id="nm-section-current" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.navigation-menu.story.section.current')}</h2>
      <p class="nm-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.navigation-menu.story.explainer.current')}</p>
      <div class="nm-story__row">
        ${renderNavMenu({
          label: N('aria.label-current'),
          menus: [
            {
              triggerLabel: N('trigger.solutions'),
              content: [
                renderLinkItem({ label: N('item.solutions-startups'), href: '/solutions/startups', current: true }),
                renderLinkItem({ label: N('item.solutions-enterprise'), href: '/solutions/enterprise' }),
              ].join(''),
            },
          ],
        })}
      </div>
    </section>

    <section class="nm-story__section" aria-labelledby="nm-section-rich">
      <h2 id="nm-section-rich" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.navigation-menu.story.section.rich')}</h2>
      <p class="nm-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.navigation-menu.story.explainer.rich')}</p>
      <div class="nm-story__row">
        ${renderNavMenu({
          label: N('aria.label-rich'),
          menus: [
            {
              triggerLabel: N('trigger.solutions'),
              content: [
                renderLinkItem({ label: N('item.rich-startups'), href: '/s/startups', iconLeading: 'rocket', description: N('desc.rich-startups') }),
                renderLinkItem({ label: N('item.rich-teams'), href: '/s/teams', iconLeading: 'users', description: N('desc.rich-teams') }),
                renderLinkItem({ label: N('item.rich-enterprise'), href: '/s/enterprise', iconLeading: 'zap', description: N('desc.rich-enterprise') }),
              ].join(''),
            },
            {
              triggerLabel: N('trigger.resources'),
              content: [
                renderLinkItem({ label: N('item.rich-docs'), href: '/docs', iconLeading: 'book-open', description: N('desc.rich-docs') }),
                renderLinkItem({ label: N('item.rich-support'), href: '/support', iconLeading: 'life-buoy', description: N('desc.rich-support') }),
                renderLinkItem({ label: N('item.rich-help'), href: '/help', iconLeading: 'help-circle', description: N('desc.rich-help') }),
              ].join(''),
            },
          ],
        })}
      </div>
    </section>

    <section class="nm-story__section" aria-labelledby="nm-section-cascade">
      <h2 id="nm-section-cascade" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.navigation-menu.story.section.cascade')}</h2>
      <p class="nm-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.navigation-menu.story.explainer.cascade')}</p>
      <div class="nm-story__row">
        ${renderNavMenu({
          label: N('aria.label-cascade'),
          menus: [
            { triggerLabel: N('trigger.solutions'), content: renderLinkItem({ label: N('item.solutions-startups'), href: '/s/1' }) + renderLinkItem({ label: N('item.solutions-enterprise'), href: '/s/2' }) },
            { triggerLabel: N('trigger.pricing'), content: renderLinkItem({ label: N('item.pricing-plans'), href: '/p/1' }) + renderLinkItem({ label: N('item.pricing-compare'), href: '/p/2' }) },
            { triggerLabel: N('trigger.resources'), content: renderLinkItem({ label: N('item.resources-docs'), href: '/r/1' }) + renderLinkItem({ label: N('item.resources-blog'), href: '/r/2' }) },
          ],
        })}
      </div>
    </section>

    <section class="nm-story__section" aria-labelledby="nm-section-header">
      <h2 id="nm-section-header" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.navigation-menu.story.section.header')}</h2>
      <p class="nm-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.navigation-menu.story.explainer.header')}</p>
      <div class="nm-story__header-demo">
        <a class="nm-story__brand" href="/">${N('header.brand')}</a>
        ${renderNavMenu({
          label: N('aria.label-header'),
          menus: [
            { triggerLabel: N('trigger.solutions'), content: renderLinkItem({ label: N('item.solutions-startups'), href: '/s/1' }) },
            { triggerLabel: N('trigger.pricing'), content: renderLinkItem({ label: N('item.pricing-plans'), href: '/p/1' }) },
          ],
        })}
        <div class="nm-story__actions">
          <a class="theme-button" data-variant="ghost" href="/login">${N('header.signin')}</a>
          <a class="theme-button" data-variant="primary" href="/signup">${N('header.signup')}</a>
        </div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/NavigationMenu" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="nm-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="nm-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.nm-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.nm-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.nm-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.nm-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.nm-story__row { display: flex; padding-block: var(--spacing-2); align-items: flex-start; }
.nm-story__explainer { max-inline-size: 70ch; }
.nm-story__header-demo { display: flex; align-items: center; gap: var(--spacing-4); padding-block: var(--spacing-2); padding-inline: var(--spacing-3); }
.nm-story__brand { font: var(--typography-h3); color: var(--color-text-primary); text-decoration: none; }
.nm-story__actions { margin-inline-start: auto; display: flex; gap: var(--spacing-2); }
.nm-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
