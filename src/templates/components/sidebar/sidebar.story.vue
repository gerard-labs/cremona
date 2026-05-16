<!--
  Sidebar story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5):
    1. Expanded default — 2 sections, active item via aria-current="page".
    2. Collapsed mode — icon-only, labels sr-only.
    3. With nested Collapsible — settings section opens / closes.
    4. With footer (user-menu trigger placeholder).
    5. Events log — wired to sidebar:collapse-change demonstration.

  Mobile mode (< 768 px) : the desktop sidebar is hidden via CSS. Consumer
  composes Sheet for the mobile entry point (documented in Sidebar.md §9).

  Helpers (per S2.3a story doctrine — nested template literal avoidance):
    - sidebar({ id, collapsed, brand, sections, footer })
    - item({ label, href, icon, current })
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

// Sidebar items in the story use icons from the curated Lucide 30-set
// (no amend of the curated set per S1.1 doctrine). `home`/`folder`/`users`/
// `bar-chart`/`log-out` are NOT in the curated set ; story uses close
// substitutes :
//   - menu      → "Tableau de bord" (generic stand-in for a layout-dashboard)
//   - option    → "Projets" (stand-in for folder)
//   - user      → "Équipe" (stand-in for users plural)
//   - info      → "Analytics" (stand-in for bar-chart)
//   - settings  → "Paramètres" (canonical)
//   - arrow-left → "Se déconnecter" (back / exit metaphor)
// Real consumer apps amend the curated set via an ADR when they need
// layout-dashboard / users / log-out / bar-chart.
import menuSvg from '../../../assets/icons/menu.svg?raw';
import optionSvg from '../../../assets/icons/option.svg?raw';
import userSvg from '../../../assets/icons/user.svg?raw';
import infoSvg from '../../../assets/icons/info.svg?raw';
import settingsSvg from '../../../assets/icons/settings.svg?raw';
import arrowLeftSvg from '../../../assets/icons/arrow-left.svg?raw';

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => {
  boot(document.documentElement);
  // Wire the events log demo.
  for (const log of document.querySelectorAll('[data-events-log]')) {
    const id = log.getAttribute('data-events-log');
    const wrap = document.getElementById(id);
    if (!wrap) continue;
    const out = log.querySelector('[data-events-out]');
    wrap.addEventListener('sidebar:collapse-change', (e) => {
      const d = e.detail;
      const line = document.createElement('div');
      line.textContent = `sidebar:collapse-change → collapsed=${d.collapsed}`;
      if (out) out.appendChild(line);
    });
  }
});

let _sbCounter = 0;
function nextId(prefix = 'sb') { return `${prefix}-${++_sbCounter}`; }

function S(key) { return t('theme.sidebar.story.' + key); }

const ICONS = {
  menu: menuSvg,
  option: optionSvg,
  user: userSvg,
  info: infoSvg,
  settings: settingsSvg,
  'arrow-left': arrowLeftSvg,
};

function item({ label, href, icon = null, current = false }) {
  const iconHtml = icon && ICONS[icon]
    ? `<span class="cremona-icon cremona-item__icon cremona-item__icon--leading" data-icon="${icon}" data-size="sm" aria-hidden="true" role="presentation">${ICONS[icon]}</span>`
    : '';
  const cur = current ? ' aria-current="page"' : '';
  return `<li>
    <a class="cremona-item" href="${href}"${cur}>
      ${iconHtml}
      <div class="cremona-item__text">
        <span class="cremona-item__label">${label}</span>
      </div>
    </a>
  </li>`;
}

function sidebar({
  id,
  collapsed = false,
  showCollapseToggle = true,
  brand = null,
  sections = [],
  footer = null,
}) {
  const wrapId = id || nextId('sb');
  const headerHtml = (brand || showCollapseToggle) ? `<div class="cremona-sidebar__header">
    ${brand ? `<a href="#" class="cremona-sidebar__brand"><span class="cremona-sidebar__brand-label">${brand}</span></a>` : ''}
    ${showCollapseToggle ? `<button type="button"
      class="cremona-sidebar__collapse-toggle"
      data-sidebar-target="collapseToggle"
      data-action="click->sidebar#toggleCollapse"
      aria-controls="${wrapId}"
      aria-expanded="${collapsed ? 'false' : 'true'}"
      aria-label="${S('aria.toggle')}">
      <span class="cremona-sidebar__collapse-icon" aria-hidden="true"></span>
    </button>` : ''}
  </div>` : '';
  const navHtml = sections.map((sec) => {
    const titleHtml = sec.title
      ? `<h3 class="cremona-sidebar__section-title">${sec.title}</h3>`
      : '';
    const itemsHtml = (sec.items || []).map(item).join('');
    return `${titleHtml}<ul class="cremona-sidebar__section">${itemsHtml}</ul>`;
  }).join('');
  const footerHtml = footer ? `<div class="cremona-sidebar__footer">${footer}</div>` : '';
  return `<aside id="${wrapId}" class="cremona-sidebar"
    data-controller="sidebar"
    data-sidebar-collapsed-value="${collapsed}"
    data-collapsed="${collapsed}"
    aria-label="${S('aria.main')}">
    ${headerHtml}
    <nav class="cremona-sidebar__nav" aria-label="${S('aria.sections')}">
      ${navHtml}
    </nav>
    ${footerHtml}
  </aside>`;
}

const defaultSections = [
  {
    items: [
      { label: S('item.dashboard'), href: '#/dashboard', icon: 'menu',   current: true },
      { label: S('item.projects'),  href: '#/projects',  icon: 'option' },
      { label: S('item.analytics'), href: '#/analytics', icon: 'info' },
    ],
  },
  {
    title: S('section.admin'),
    items: [
      { label: S('item.team'),     href: '#/team',     icon: 'user' },
      { label: S('item.settings'), href: '#/settings', icon: 'settings' },
    ],
  },
];

const footerUserMenu = `<button type="button" class="cremona-button" data-variant="ghost" data-size="sm" style="inline-size: 100%; justify-content: flex-start;">
  <span class="cremona-icon cremona-item__icon" data-icon="arrow-left" data-size="sm" aria-hidden="true" role="presentation">${arrowLeftSvg}</span>
  <span>${S('item.logout')}</span>
</button>`;

const bodyHtml = `
  <section class="sb-story" data-testid="sidebar-root">
    <header class="sb-story__header">
      <h1>${t('theme.sidebar.story.title')}</h1>
      <p>${t('theme.sidebar.story.subtitle')}</p>
    </header>

    <section class="sb-story__section" aria-labelledby="sb-section-default">
      <h2 id="sb-section-default" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.default')}</h2>
      <p class="sb-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.default')}</p>
      <div class="sb-story__shell">
        ${sidebar({ brand: 'Samurai', sections: defaultSections })}
        <div class="sb-story__shell-main">
          <h3 class="cremona-typography" data-variant="h3">${S('shell.placeholder-title')}</h3>
          <p class="cremona-typography" data-variant="body">${S('shell.placeholder-body')}</p>
        </div>
      </div>
    </section>

    <section class="sb-story__section" aria-labelledby="sb-section-collapsed">
      <h2 id="sb-section-collapsed" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.collapsed')}</h2>
      <p class="sb-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.collapsed')}</p>
      <div class="sb-story__shell">
        ${sidebar({ id: 'sb-collapsed', brand: 'Samurai', collapsed: true, sections: defaultSections })}
        <div class="sb-story__shell-main">
          <h3 class="cremona-typography" data-variant="h3">${S('shell.collapsed-title')}</h3>
          <p class="cremona-typography" data-variant="body">${S('shell.collapsed-body')}</p>
        </div>
      </div>
    </section>

    <section class="sb-story__section" aria-labelledby="sb-section-footer">
      <h2 id="sb-section-footer" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.footer')}</h2>
      <p class="sb-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.footer')}</p>
      <div class="sb-story__shell">
        ${sidebar({ brand: 'Samurai', sections: defaultSections, footer: footerUserMenu })}
        <div class="sb-story__shell-main">
          <h3 class="cremona-typography" data-variant="h3">${S('shell.footer-title')}</h3>
          <p class="cremona-typography" data-variant="body">${S('shell.footer-body')}</p>
        </div>
      </div>
    </section>

    <section class="sb-story__section" aria-labelledby="sb-section-events">
      <h2 id="sb-section-events" class="cremona-typography" data-variant="overline" data-color="tertiary">${S('section.events')}</h2>
      <p class="sb-story__explainer cremona-typography" data-variant="caption" data-color="tertiary">${S('explainer.events')}</p>
      <div class="sb-story__shell">
        ${sidebar({ id: 'sb-events-demo', brand: 'Samurai', sections: defaultSections.slice(0, 1) })}
        <div class="sb-story__shell-main">
          <div class="sb-story__log" data-events-log="sb-events-demo">
            <div class="cremona-typography" data-variant="overline" data-color="tertiary">${S('events.log')}</div>
            <div data-events-out class="sb-story__log-out"></div>
          </div>
        </div>
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Sidebar" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="sb-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="sb-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.sb-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.sb-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.sb-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.sb-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.sb-story__explainer { max-inline-size: 70ch; }
.sb-story__shell { display: flex; align-items: stretch; min-block-size: 320px; max-block-size: 480px; overflow: hidden; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.sb-story__shell .cremona-sidebar { min-block-size: 0; }
.sb-story__shell-main { flex: 1 1 auto; padding: var(--spacing-6); background: var(--color-bg-base); display: flex; flex-direction: column; gap: var(--spacing-3); }
.sb-story__log { display: grid; gap: var(--spacing-2); padding: var(--spacing-3); background: var(--color-bg-sunken); border-radius: var(--radius-sm); font: var(--typography-code); font-size: var(--font-size-xs); }
.sb-story__log-out { display: grid; gap: var(--spacing-1); color: var(--color-text-secondary); min-block-size: var(--spacing-8); }
.sb-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
