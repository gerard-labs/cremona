<!--
  Menubar story — 4 viewport variants (Light/Dark × LTR/RTL).

  Sections (5):
    1. Default (4 menus File / Edit / View / Help) — desktop-app idiom.
    2. With icons + kbd shortcuts in submenu items.
    3. Cascading-open demo (open File then ArrowRight → Edit opens cleanly).
    4. With group labels + separators inside submenus.
    5. With disabled menubar trigger.

  Stimulus controllers `popover` + `dropdown-menu` co-mounted on each
  submenu wrap (data-controller="popover dropdown-menu"); `menubar` mounted
  on the outer wrap. Per OQ-30: per-submenu DropdownMenus + thin
  orchestrator. WAI-ARIA APG "Menubar".

  Helpers (per S2.3a story doctrine — nested template literal avoidance):
    - icon(name, size)
    - renderMenuItem({ label, iconLeading, kbdShortcut, disabled })
    - renderSubmenu({ triggerLabel, items, groups, htmlId })
    - renderMenubar({ menus, label, ... })
-->
<script setup>
import frDict from '../../../js/i18n/fr.json';
import { setTranslations, setLocale, t } from '../../../js/utils/i18n.js';
import { boot } from '../../../js/index.js';
import { onMounted } from 'vue';

import plusSvg from '../../../assets/icons/plus.svg?raw';
import copySvg from '../../../assets/icons/copy.svg?raw';
import edit3Svg from '../../../assets/icons/edit-3.svg?raw';
import trash2Svg from '../../../assets/icons/trash-2.svg?raw';
import settingsSvg from '../../../assets/icons/settings.svg?raw';
import sunSvg from '../../../assets/icons/sun.svg?raw';
import moonSvg from '../../../assets/icons/moon.svg?raw';
import helpCircleSvg from '../../../assets/icons/help-circle.svg?raw';
import searchSvg from '../../../assets/icons/search.svg?raw';

const ICONS = {
  plus: plusSvg, copy: copySvg, 'edit-3': edit3Svg, 'trash-2': trash2Svg,
  settings: settingsSvg, sun: sunSvg, moon: moonSvg, 'help-circle': helpCircleSvg,
  search: searchSvg,
};

setTranslations('fr', frDict);
setLocale('fr');

onMounted(() => boot(document.documentElement));

let _mbCounter = 0;
function nextId(prefix = 'mb') { return `${prefix}-${++_mbCounter}`; }

function icon(name, size = 'sm') {
  return `<span class="theme-icon" data-icon="${name}" data-size="${size}" aria-hidden="true" role="presentation">${ICONS[name] || ''}</span>`;
}

function kbd(keys) {
  if (!keys || keys.length === 0) return '';
  const cells = keys.map((k) => `<kbd class="theme-kbd" data-size="sm">${k}</kbd>`).join('<span class="theme-kbd-sep" aria-hidden="true">+</span>');
  return `<kbd class="theme-kbd-group" data-size="sm">${cells}</kbd>`;
}

function renderMenuItem({ label, iconLeading = null, kbdShortcut = null, disabled = false }) {
  const dis = disabled ? ' aria-disabled="true" data-state="disabled"' : '';
  const leadingHtml = iconLeading ? `<span class="theme-item__icon theme-item__icon--leading" aria-hidden="true">${icon(iconLeading)}</span>` : '';
  const trailingHtml = kbdShortcut ? `<span class="theme-item__trailing">${kbd(kbdShortcut)}</span>` : '';
  return `<div class="theme-item" role="menuitem" tabindex="-1"${dis}>
    ${leadingHtml}
    <span class="theme-item__text"><span class="theme-item__label">${label}</span></span>
    ${trailingHtml}
  </div>`;
}

function renderSeparator() { return '<hr class="theme-dropdown-menu__separator">'; }
function renderGroupLabel(label) { return `<div class="theme-dropdown-menu__group-label" role="presentation">${label}</div>`; }

function renderSubmenu({ triggerLabel, content, triggerDisabled = false }) {
  const id = nextId('sm');
  const dis = triggerDisabled ? 'disabled' : '';
  return `
    <div class="theme-popover theme-dropdown-menu"
      data-controller="popover dropdown-menu"
      data-action="click->popover#toggle keydown.esc@window->popover#close keydown->dropdown-menu#keydown click->dropdown-menu#onItemClick"
      data-popover-placement-value="bottom-start"
      data-popover-offset-value="2"
      data-popover-open-value="false">
      <button type="button" class="theme-menubar__trigger"
        data-popover-target="trigger"
        data-menubar-target="trigger"
        ${dis}
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

function renderMenubar({ menus, label = null, labelledBy = null }) {
  const id = nextId('menubar');
  const labelAttr = label ? `aria-label="${label}"` : '';
  const labelledByAttr = labelledBy ? `aria-labelledby="${labelledBy}"` : '';
  return `
    <div id="${id}" class="theme-menubar"
      data-controller="menubar"
      data-action="keydown->menubar#keydown"
      ${labelAttr} ${labelledByAttr}>
      ${menus.map((m) => renderSubmenu(m)).join('')}
    </div>
  `;
}

function M(key) { return t('theme.menubar.story.' + key); }

const bodyHtml = `
  <section class="mb-story" data-testid="menubar-root">
    <header class="mb-story__header">
      <h1>${t('theme.menubar.story.title')}</h1>
      <p>${t('theme.menubar.story.subtitle')}</p>
    </header>

    <section class="mb-story__section" aria-labelledby="mb-section-default">
      <h2 id="mb-section-default" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.menubar.story.section.default')}</h2>
      <p class="mb-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.menubar.story.explainer.default')}</p>
      <div class="mb-story__row">
        ${renderMenubar({
          label: M('aria.label-default'),
          menus: [
            {
              triggerLabel: M('trigger.file'),
              content: [
                renderMenuItem({ label: M('item.new'), iconLeading: 'plus' }),
                renderMenuItem({ label: M('item.open'), iconLeading: 'edit-3' }),
                renderSeparator(),
                renderMenuItem({ label: M('item.save'), iconLeading: 'copy' }),
                renderMenuItem({ label: M('item.delete'), iconLeading: 'trash-2' }),
              ].join(''),
            },
            {
              triggerLabel: M('trigger.edit'),
              content: [
                renderMenuItem({ label: M('item.cut') }),
                renderMenuItem({ label: M('item.copy') }),
                renderMenuItem({ label: M('item.paste') }),
              ].join(''),
            },
            {
              triggerLabel: M('trigger.view'),
              content: [
                renderMenuItem({ label: M('item.zoom-in') }),
                renderMenuItem({ label: M('item.zoom-out') }),
                renderMenuItem({ label: M('item.reset-zoom') }),
              ].join(''),
            },
            {
              triggerLabel: M('trigger.help'),
              content: [
                renderMenuItem({ label: M('item.docs'), iconLeading: 'help-circle' }),
                renderMenuItem({ label: M('item.about'), iconLeading: 'settings' }),
              ].join(''),
            },
          ],
        })}
      </div>
    </section>

    <section class="mb-story__section" aria-labelledby="mb-section-shortcuts">
      <h2 id="mb-section-shortcuts" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.menubar.story.section.shortcuts')}</h2>
      <p class="mb-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.menubar.story.explainer.shortcuts')}</p>
      <div class="mb-story__row">
        ${renderMenubar({
          label: M('aria.label-shortcuts'),
          menus: [
            {
              triggerLabel: M('trigger.file'),
              content: [
                renderMenuItem({ label: M('item.new'), iconLeading: 'plus', kbdShortcut: ['⌘', 'N'] }),
                renderMenuItem({ label: M('item.open'), iconLeading: 'edit-3', kbdShortcut: ['⌘', 'O'] }),
                renderMenuItem({ label: M('item.save'), iconLeading: 'copy', kbdShortcut: ['⌘', 'S'] }),
                renderSeparator(),
                renderMenuItem({ label: M('item.find'), iconLeading: 'search', kbdShortcut: ['⌘', 'K'] }),
              ].join(''),
            },
            {
              triggerLabel: M('trigger.edit'),
              content: [
                renderMenuItem({ label: M('item.cut'), kbdShortcut: ['⌘', 'X'] }),
                renderMenuItem({ label: M('item.copy'), kbdShortcut: ['⌘', 'C'] }),
                renderMenuItem({ label: M('item.paste'), kbdShortcut: ['⌘', 'V'] }),
              ].join(''),
            },
          ],
        })}
      </div>
    </section>

    <section class="mb-story__section" aria-labelledby="mb-section-cascade">
      <h2 id="mb-section-cascade" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.menubar.story.section.cascade')}</h2>
      <p class="mb-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.menubar.story.explainer.cascade')}</p>
      <div class="mb-story__row">
        ${renderMenubar({
          label: M('aria.label-cascade'),
          menus: [
            { triggerLabel: M('trigger.file'), content: renderMenuItem({ label: M('item.new') }) + renderMenuItem({ label: M('item.open') }) },
            { triggerLabel: M('trigger.edit'), content: renderMenuItem({ label: M('item.cut') }) + renderMenuItem({ label: M('item.copy') }) },
            { triggerLabel: M('trigger.view'), content: renderMenuItem({ label: M('item.zoom-in') }) + renderMenuItem({ label: M('item.zoom-out') }) },
          ],
        })}
      </div>
    </section>

    <section class="mb-story__section" aria-labelledby="mb-section-groups">
      <h2 id="mb-section-groups" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.menubar.story.section.groups')}</h2>
      <p class="mb-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.menubar.story.explainer.groups')}</p>
      <div class="mb-story__row">
        ${renderMenubar({
          label: M('aria.label-groups'),
          menus: [
            {
              triggerLabel: M('trigger.view'),
              content: [
                renderGroupLabel(M('group.theme')),
                renderMenuItem({ label: M('item.theme-light'), iconLeading: 'sun' }),
                renderMenuItem({ label: M('item.theme-dark'), iconLeading: 'moon' }),
                renderSeparator(),
                renderGroupLabel(M('group.density')),
                renderMenuItem({ label: M('item.density-comfortable') }),
                renderMenuItem({ label: M('item.density-cozy') }),
                renderMenuItem({ label: M('item.density-compact') }),
              ].join(''),
            },
          ],
        })}
      </div>
    </section>

    <section class="mb-story__section" aria-labelledby="mb-section-disabled">
      <h2 id="mb-section-disabled" class="theme-typography" data-variant="overline" data-color="tertiary">${t('theme.menubar.story.section.disabled')}</h2>
      <p class="mb-story__explainer theme-typography" data-variant="caption" data-color="tertiary">${t('theme.menubar.story.explainer.disabled')}</p>
      <div class="mb-story__row">
        ${renderMenubar({
          label: M('aria.label-disabled'),
          menus: [
            { triggerLabel: M('trigger.file'), content: renderMenuItem({ label: M('item.new') }) },
            { triggerLabel: M('trigger.edit'), content: renderMenuItem({ label: M('item.cut') }), triggerDisabled: true },
            { triggerLabel: M('trigger.view'), content: renderMenuItem({ label: M('item.zoom-in') }) },
          ],
        })}
      </div>
    </section>
  </section>
`;
</script>

<template>
  <Story title="Compounds/Menubar" group="Ring 2" :layout="{ type: 'single' }">
    <Variant title="Light · LTR"><div dir="ltr" v-html="bodyHtml"></div></Variant>
    <Variant title="Light · RTL"><div dir="rtl" v-html="bodyHtml"></div></Variant>
    <Variant title="Dark · LTR"><div data-theme="dark" class="mb-dark-wrap"><div dir="ltr" v-html="bodyHtml"></div></div></Variant>
    <Variant title="Dark · RTL"><div data-theme="dark" class="mb-dark-wrap"><div dir="rtl" v-html="bodyHtml"></div></div></Variant>
  </Story>
</template>

<style>
.mb-story { display: grid; gap: var(--spacing-8); padding: var(--spacing-6); color: var(--color-text-primary); background: var(--color-bg-base); min-block-size: 100vh; }
.mb-story__header h1 { font: var(--typography-h1); margin-block-end: var(--spacing-2); }
.mb-story__header p { font: var(--typography-body); color: var(--color-text-secondary); max-inline-size: 70ch; }
.mb-story__section { display: grid; gap: var(--spacing-3); padding: var(--spacing-4); background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); }
.mb-story__row { display: flex; padding-block: var(--spacing-2); align-items: flex-start; }
.mb-story__explainer { max-inline-size: 70ch; }
.mb-dark-wrap { background: var(--color-bg-base); min-block-size: 100vh; }
</style>
